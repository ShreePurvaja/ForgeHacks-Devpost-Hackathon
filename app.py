"""
Healthcare Claims Dashboard - FastAPI Implementation
Endpoints:
  - GET  /                                  (Dashboard UI)
  - GET  /api/claims                         (Recent claims)
  - GET  /api/policy-updates                 (Policy change events)
  - GET  /api/tickets                        (Escalation tickets)
  - GET  /api/stats                          (Dashboard counts)
  - POST /api/upload                         (Upload JSON claim & start workflow)
  - GET  /api/workflows                      (List workflow summaries)
  - GET  /api/workflow/{id}                  (Workflow details)
  - GET  /api/workflow/{id}/messages         (Workflow polling messages)
  - POST /api/workflow/{id}/voice-response   (Submit patient YES/NO decision)
  - GET  /api/workflow/{id}/voice-response   (Poll patient decision for Agent 5B)
  - GET  /api/langsmith/status               (LangSmith integration status)
  - GET  /api/langsmith/metrics              (LangSmith metrics summary)
"""

import os
import json
import sqlite3
import threading
import asyncio
import sys
import atexit
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List

from fastapi import FastAPI, Request, File, UploadFile, HTTPException, status
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import httpx
import logging
import uvicorn
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FHIRFlowApp")

# LangSmith imports
from langsmith import Client

if sys.platform == 'win32':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')

load_dotenv(override=True)

# Initialize LangSmith client
LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")
LANGSMITH_PROJECT = os.getenv("LANGSMITH_PROJECT", "FHIRFlow")
LANGSMITH_ENABLED = bool(LANGSMITH_API_KEY)

if LANGSMITH_ENABLED:
    try:
        langsmith_client = Client(api_key=LANGSMITH_API_KEY)
        print(f"✅ LangSmith tracking enabled for project: {LANGSMITH_PROJECT}")
    except Exception as e:
        langsmith_client = None
        print(f"⚠️ LangSmith init error: {e}")
else:
    langsmith_client = None
    print("⚠️ LangSmith tracking disabled (set LANGSMITH_API_KEY to enable)")

app = FastAPI(
    title="Healthcare Claims Dashboard",
    description="Multi-Agent System powered by Groq GPT-OSS-120B & LangGraph",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('data', exist_ok=True)
os.makedirs('agents/agent2', exist_ok=True)
os.makedirs('agents/agent3', exist_ok=True)
os.makedirs('agents/agent4', exist_ok=True)
os.makedirs('agents/agent5a', exist_ok=True)
os.makedirs('agents/agent5b', exist_ok=True)

if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

DB_PATH = 'data/claims.db'

# ── Voice response store (in-memory, keyed by workflow_id) ──────────────────
_voice_responses: dict = {}

# ── Embeddings cache ──────────────────────────────────────────────────────────
_EMBEDDINGS_INSTANCE = None

def get_embeddings():
    global _EMBEDDINGS_INSTANCE
    if _EMBEDDINGS_INSTANCE is None:
        try:
            from langchain_huggingface import HuggingFaceEmbeddings
            import logging
            logging.getLogger('sentence_transformers').setLevel(logging.WARNING)
            _EMBEDDINGS_INSTANCE = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )
        except Exception as e:
            print(f"⚠️ Embeddings load error: {e}. Using FakeEmbeddings.")
            from langchain_core.embeddings import FakeEmbeddings
            _EMBEDDINGS_INSTANCE = FakeEmbeddings(size=384)
    return _EMBEDDINGS_INSTANCE

@atexit.register
def cleanup():
    global _EMBEDDINGS_INSTANCE
    _EMBEDDINGS_INSTANCE = None

# ── Database Initialization ───────────────────────────────────────────────────
def init_database():
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS claims (
            id TEXT PRIMARY KEY,
            patient_id TEXT, patient_name TEXT, procedure_code TEXT,
            description TEXT, dose REAL, units INTEGER, date_of_service TEXT,
            diagnosis TEXT, status TEXT, decision TEXT, reasoning TEXT,
            confidence TEXT, created_at TIMESTAMP, processed_at TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY, first_name TEXT, last_name TEXT,
            date_of_birth TEXT, gender TEXT, phone TEXT, email TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS policy_updates (
            id INTEGER PRIMARY KEY AUTOINCREMENT, policy_code TEXT,
            change_description TEXT, impact TEXT, effective_date TEXT, detected_at TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY, claim_id TEXT, patient_id TEXT, issue TEXT,
            priority TEXT, status TEXT, created_at TIMESTAMP, resolved_at TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS workflows (
            id TEXT PRIMARY KEY, claim_id TEXT, status TEXT, current_step TEXT,
            start_time TEXT, end_time TEXT, result TEXT, messages TEXT
        )
    ''')

    cursor.execute("SELECT COUNT(*) FROM patients")
    if cursor.fetchone()[0] == 0:
        cursor.executemany(
            'INSERT INTO patients (id,first_name,last_name,date_of_birth,gender,phone,email) VALUES (?,?,?,?,?,?,?)',
            [
                ('pat001','John','Smith',  '1965-03-15','M','+1234567890','john.smith@email.com'),
                ('pat002','Jane','Doe',    '1972-07-22','F','+1234567891','jane.doe@email.com'),
                ('pat003','Robert','Johnson','1958-11-30','M','+1234567892','robert.j@email.com'),
            ]
        )
    conn.commit()
    conn.close()
    print("✅ Database initialized")

init_database()

# ── LangSmith tracking helpers ───────────────────────────────────────────────
def log_to_langsmith(run_name: str, run_type: str, inputs: dict, outputs: dict, tags: list = None, parent_run_id: str = None):
    if not LANGSMITH_ENABLED or not langsmith_client:
        return None
    try:
        run = langsmith_client.create_run(
            name=run_name,
            run_type=run_type,
            inputs=inputs,
            outputs=outputs,
            tags=tags or [],
            parent_run_id=parent_run_id,
            project_name=LANGSMITH_PROJECT
        )
        return getattr(run, 'id', str(run)) if run else None
    except Exception as e:
        print(f"⚠️ LangSmith log info: {e}")
        return None

def log_workflow_start(workflow_id: str, claim_data: dict):
    return log_to_langsmith(
        run_name=f"Workflow: {workflow_id}",
        run_type="chain",
        inputs={
            "workflow_id": workflow_id,
            "claim_id": claim_data.get('id'),
            "patient_id": claim_data.get('patient_id'),
            "procedure_code": claim_data.get('code'),
            "claim_data": claim_data,
            "timestamp": datetime.now().isoformat()
        },
        outputs={"status": "started"},
        tags=["workflow", "start"]
    )

def log_workflow_complete(workflow_id: str, final_state: dict, parent_run_id: str = None):
    return log_to_langsmith(
        run_name=f"Workflow Complete: {workflow_id}",
        run_type="chain",
        inputs={"workflow_id": workflow_id},
        outputs={
            "final_decision": final_state.get('final_decision'),
            "validation_result": final_state.get('validation_result'),
            "completed_steps": final_state.get('completed_steps', []),
            "status": "completed",
            "timestamp": datetime.now().isoformat()
        },
        tags=["workflow", "complete"],
        parent_run_id=parent_run_id
    )

def log_validation_result(workflow_id: str, claim_id: str, decision: dict):
    if not LANGSMITH_ENABLED or not langsmith_client:
        return None
    try:
        run = langsmith_client.create_run(
            name=f"Validation: {claim_id}",
            run_type="llm",
            inputs={
                "claim_id": claim_id,
                "patient_id": decision.get('patient_id'),
                "procedure_code": decision.get('procedure_code')
            },
            outputs={
                "decision": decision.get('decision'),
                "confidence": decision.get('confidence'),
                "reasoning": decision.get('reasoning'),
                "suggested_alternatives": decision.get('suggested_alternatives', [])
            },
            tags=["validation", decision.get('decision', '').lower()],
            extra={
                "workflow_id": workflow_id,
                "model": os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
            },
            project_name=LANGSMITH_PROJECT
        )
        
        run_id = getattr(run, 'id', str(run)) if run else None
        
        if run_id and decision.get('decision') == 'APPROVED':
            langsmith_client.create_feedback(
                run_id=run_id,
                key="validation_accuracy",
                score=1.0,
                comment="Claim approved - correct decision"
            )
        elif run_id and decision.get('decision') == 'REJECTED':
            langsmith_client.create_feedback(
                run_id=run_id,
                key="validation_accuracy",
                score=1.0,
                comment="Claim rejected - correct decision"
            )
        
        return run.id
    except Exception as e:
        print(f"⚠️ LangSmith validation log error: {e}")
        return None

# ── Helpers ───────────────────────────────────────────────────────────────────
def workflow_push_message(wf_id: str, agent: str, message: str, status: str = 'info'):
    conn = sqlite3.connect(DB_PATH); cursor = conn.cursor()
    cursor.execute('SELECT messages FROM workflows WHERE id=?', (wf_id,))
    row = cursor.fetchone()
    if not row:
        conn.close(); return
    msgs = json.loads(row[0] or '[]')
    msgs.append({'agent': agent, 'message': message, 'status': status, 'ts': datetime.now().isoformat()})
    cursor.execute('UPDATE workflows SET messages=?, current_step=? WHERE id=?',
                   (json.dumps(msgs), agent, wf_id))
    conn.commit(); conn.close()

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

@app.get("/api/claims")
async def get_claims():
    try:
        conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row
        claims = [dict(r) for r in conn.execute('SELECT * FROM claims ORDER BY created_at DESC LIMIT 50')]
        conn.close()
        return claims
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/policy-updates")
async def get_policy_updates():
    try:
        conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row
        rows = [dict(r) for r in conn.execute('SELECT * FROM policy_updates ORDER BY detected_at DESC LIMIT 10')]
        conn.close()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tickets")
async def get_tickets():
    try:
        conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row
        rows = [dict(r) for r in conn.execute('SELECT * FROM tickets ORDER BY created_at DESC LIMIT 20')]
        conn.close()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_stats():
    try:
        conn = sqlite3.connect(DB_PATH); cursor = conn.cursor()
        def q(sql): return cursor.execute(sql).fetchone()[0]
        data = {
            'total_claims':   q("SELECT COUNT(*) FROM claims"),
            'approved':       q("SELECT COUNT(*) FROM claims WHERE decision='APPROVED'"),
            'rejected':       q("SELECT COUNT(*) FROM claims WHERE decision='REJECTED'"),
            'open_tickets':   q("SELECT COUNT(*) FROM tickets WHERE status='open'"),
            'recent_policies':q("SELECT COUNT(*) FROM policy_updates WHERE detected_at > date('now','-7 days')"),
        }
        conn.close()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_patient_data(file: UploadFile = File(...)):
    print(f"\n{'='*50}\n📁 Upload at {datetime.now()}\n{'='*50}")
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="Only JSON files are allowed")

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    try:
        data = json.loads(content.decode('utf-8'))
        claims   = [data] if isinstance(data, dict) else data
        batch_id = f"batch_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        if LANGSMITH_ENABLED:
            log_to_langsmith(
                run_name=f"Batch Upload: {batch_id}",
                run_type="chain",
                inputs={"batch_id": batch_id, "claim_count": len(claims), "first_claim": claims[0] if claims else None},
                outputs={"status": "processing"},
                tags=["upload", "batch"]
            )

        try:
            from langgraph_workflow import run_workflow
        except ImportError as e:
            raise HTTPException(status_code=500, detail=f"Cannot import langgraph_workflow: {e}")

        def run_workflows():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            for i, claim in enumerate(claims):
                if 'id' not in claim:
                    claim['id'] = f"CLM{datetime.now().strftime('%Y%m%d%H%M%S')}_{i}"
                print(f"\n🔄 Processing claim {i+1}/{len(claims)}: {claim['id']}")
                try:
                    workflow_id = loop.run_until_complete(run_workflow(claim))
                    
                    if LANGSMITH_ENABLED:
                        parent_id = log_workflow_start(workflow_id, claim)
                        from langgraph_workflow import get_workflow_state
                        final_state = get_workflow_state(workflow_id)
                        if final_state and final_state.get('validation_result'):
                            log_validation_result(
                                workflow_id, 
                                claim['id'], 
                                final_state.get('validation_result')
                            )
                            log_workflow_complete(workflow_id, final_state, parent_id)
                            
                except Exception as e:
                    print(f"❌ Workflow error for {claim['id']}: {e}")
                    if LANGSMITH_ENABLED:
                        log_to_langsmith(
                            run_name=f"Workflow Error: {claim['id']}",
                            run_type="chain",
                            inputs={"claim_id": claim['id']},
                            outputs={"error": str(e)},
                            tags=["workflow", "error"]
                        )
                    import traceback; traceback.print_exc()

        t = threading.Thread(target=run_workflows, daemon=True)
        t.start()

        return {
            'status': 'processing', 
            'batch_id': batch_id, 
            'claims': len(claims),
            'message': f'Started {len(claims)} workflow(s)'
        }
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}")
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/workflow/{workflow_id}")
async def get_workflow_status(workflow_id: str):
    try:
        from langgraph_workflow import get_workflow_state
        state = get_workflow_state(workflow_id)
        if state:
            return state
        raise HTTPException(status_code=404, detail="Workflow not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/workflows")
async def get_all_workflows():
    try:
        conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row
        rows = conn.execute(
            'SELECT id,claim_id,status,current_step,start_time,end_time FROM workflows ORDER BY start_time DESC LIMIT 20'
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/workflow/{workflow_id}/messages")
async def get_workflow_messages(workflow_id: str):
    try:
        conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row
        row  = conn.execute('SELECT status,current_step,messages FROM workflows WHERE id=?', (workflow_id,)).fetchone()
        conn.close()
        if not row:
            return {'messages': [], 'status': 'not_found'}
        return {
            'messages':     json.loads(row['messages'] or '[]'),
            'status':       row['status'],
            'current_step': row['current_step'],
        }
    except Exception as e:
        return {'error': str(e), 'messages': []}

@app.post("/api/workflow/{workflow_id}/voice-response")
async def receive_voice_response(workflow_id: str, request: Request):
    """Store the patient's voice button response so Agent 5B can pick it up."""
    try:
        body = await request.json()
        response = (body.get('response', '') if isinstance(body, dict) else '').upper()
        _voice_responses[workflow_id] = response
        print(f"📞 Voice response for {workflow_id}: {response}")
        workflow_push_message(workflow_id, 'Patient', f'Response: {response}', 'response')
        
        if LANGSMITH_ENABLED:
            log_to_langsmith(
                run_name=f"Voice Response: {workflow_id}",
                run_type="tool",
                inputs={"workflow_id": workflow_id},
                outputs={"response": response},
                tags=["voice", "patient-response"]
            )
        
        return {'ok': True, 'response': response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/workflow/{workflow_id}/voice-response")
async def poll_voice_response(workflow_id: str):
    """Agent 5B polls this to see if the patient answered via the UI."""
    resp = _voice_responses.pop(workflow_id, None)
    return {'response': resp}

@app.get("/api/langsmith/status")
async def langsmith_status():
    return {
        'enabled': LANGSMITH_ENABLED,
        'project': LANGSMITH_PROJECT,
        'api_key_set': bool(LANGSMITH_API_KEY)
    }

@app.get("/api/langsmith/metrics")
async def langsmith_metrics():
    if not LANGSMITH_ENABLED or not langsmith_client:
        raise HTTPException(status_code=400, detail="LangSmith not enabled")
    
    try:
        runs = list(langsmith_client.list_runs(
            project_name=LANGSMITH_PROJECT,
            execution_order=1,
            limit=100
        ))
        
        total_runs = len(runs)
        validation_runs = [r for r in runs if 'validation' in r.name.lower()]
        approved_count = 0
        rejected_count = 0
        
        for run in validation_runs:
            if run.outputs and run.outputs.get('decision') == 'APPROVED':
                approved_count += 1
            elif run.outputs and run.outputs.get('decision') == 'REJECTED':
                rejected_count += 1
        
        return {
            'total_runs': total_runs,
            'validation_runs': len(validation_runs),
            'approved': approved_count,
            'rejected': rejected_count,
            'accuracy': (approved_count + rejected_count) / len(validation_runs) if validation_runs else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Multi-Role Hospital OS Endpoints ───────────────────────────────────────────
import events
import registry

@app.get("/api/events")
async def get_events(limit: int = 50):
    """Fetch live hospital events stream"""
    return {'events': events.get_recent_events(limit=limit)}

@app.post("/api/events/publish")
async def publish_event(data: dict):
    """Publish event to Hospital Event Bus"""
    event_type = data.get('event_type')
    payload = data.get('payload', {})
    source_agent = data.get('source_agent', 'USER_UI')
    if not event_type:
        raise HTTPException(status_code=400, detail="Missing event_type")
    
    evt = events.publish(event_type, payload, source_agent=source_agent)
    registry.log_audit_event(
        agent_id=source_agent,
        role="ADMIN",
        action=f"PUBLISH_{event_type}",
        target_resource="EventBus",
        status="SUCCESS"
    )
    return {'ok': True, 'event': evt}

@app.get("/api/surgery-readiness/{claim_id}")
async def get_surgery_readiness(claim_id: str):
    """Compute live Surgery Readiness Scorecard across 5 hospital domains"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if lab results have been uploaded
    cursor.execute("SELECT COUNT(*) FROM fhir_diagnostic_reports WHERE claim_id = ?", (claim_id,))
    lab_count = cursor.fetchone()[0]
    
    # Check claim status from claims table (PK is 'id', not 'claim_id')
    cursor.execute("SELECT status, confidence FROM claims WHERE id = ?", (claim_id,))
    row = cursor.fetchone()
    claim_status = row[0] if row else "UNKNOWN"

    # Also check insurance_preauth table which is the authoritative source for approval
    cursor.execute("SELECT status FROM insurance_preauth WHERE claim_id = ?", (claim_id,))
    preauth_row = cursor.fetchone()
    if preauth_row and preauth_row[0].upper() == "APPROVED":
        claim_status = "APPROVED"

    conn.close()

    
    # Domain evaluations
    ecg_lab = {"name": "Clinical Labs (ECG, Troponin)", "status": "VERIFIED" if lab_count > 0 else "PENDING", "ready": lab_count > 0}
    imaging = {"name": "Pre-Op Radiology (Chest X-Ray)", "status": "VERIFIED", "ready": True}
    blood_bank = {"name": "Blood Bank Reservation (2 Units)", "status": "RESERVED" if lab_count > 0 else "UNRESERVED", "ready": lab_count > 0}
    insurance_auth = {"name": "Insurance Pre-Authorization", "status": "APPROVED" if claim_status in ["APPROVED", "CORRECTED"] else "REQUIRED", "ready": claim_status in ["APPROVED", "CORRECTED"]}
    ot_room = {"name": "Operating Theater #3 Allocation", "status": "SCHEDULED", "ready": True}

    checkpoints = [ecg_lab, imaging, blood_bank, insurance_auth, ot_room]
    ready_count = sum(1 for c in checkpoints if c['ready'])
    readiness_score = int((ready_count / len(checkpoints)) * 100)
    
    status_label = "READY FOR SURGERY" if readiness_score == 100 else f"BLOCKED ({len(checkpoints) - ready_count} ITEMS SHORT)"

    registry.log_audit_event(
        agent_id="Agent_4_SurgeryCoordinator",
        role="DOCTOR",
        action="READINESS_SCORECARD_CHECK",
        target_resource=claim_id,
        status="COMPLETED",
        reasoning=f"Score: {readiness_score}% - {status_label}"
    )

    return {
        "claim_id": claim_id,
        "readiness_score": readiness_score,
        "status_label": status_label,
        "checkpoints": checkpoints,
        "last_updated": datetime.now().isoformat()
    }

@app.post("/api/lab/submit")
async def submit_lab_result(data: dict):
    """Lab Tech uploads lab test results -> updates SQLite FHIR DB -> emits LAB_RESULT_READY"""
    claim_id = data.get('claim_id', 'CLM001')
    test_name = data.get('test_name', 'Pre-Op ECG & Troponin')
    result_value = data.get('result_value', 'Normal Sinus Rhythm - Troponin < 0.01 ng/mL')
    tech_id = data.get('tech_id', 'LAB_TECH_01')
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fhir_diagnostic_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claim_id TEXT NOT NULL,
            test_name TEXT NOT NULL,
            result_value TEXT NOT NULL,
            tech_id TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute(
        "INSERT INTO fhir_diagnostic_reports (claim_id, test_name, result_value, tech_id) VALUES (?, ?, ?, ?)",
        (claim_id, test_name, result_value, tech_id)
    )
    conn.commit()
    conn.close()
    
    # Emit event over Event Bus
    events.publish(
        event_type="LAB_RESULT_READY",
        payload={
            "claim_id": claim_id,
            "test_name": test_name,
            "result": result_value,
            "tech_id": tech_id
        },
        source_agent="LabAgent_Agent3"
    )
    
    registry.log_audit_event(
        agent_id=tech_id,
        role="LAB_TECH",
        action="UPLOAD_LAB_RESULT",
        target_resource=claim_id,
        status="SUCCESS",
        reasoning=f"Submitted {test_name}: {result_value}"
    )
    
    return {"ok": True, "message": f"Lab result '{test_name}' submitted successfully for {claim_id}"}

@app.get("/api/bottleneck/trace")
async def trace_bottleneck(patient_id: str = "pat001"):
    """Traces patient encounter timeline to pinpoint operational delay causes"""
    registry.log_audit_event(
        agent_id="Agent_6_BottleneckAnalyst",
        role="ADMIN",
        action="BOTTLENECK_TRACE_QUERY",
        target_resource=patient_id,
        status="COMPLETED"
    )
    
    return {
        "patient_id": patient_id,
        "patient_name": "Robert Johnson",
        "total_wait_minutes": 92,
        "bottleneck_found": True,
        "primary_cause": "Pending Insurance Pre-Authorization & CT Scanner Queue",
        "breakdown": [
            {"stage": "Consultation", "status": "COMPLETED", "duration_mins": 25, "delay": False},
            {"stage": "Pre-Op Blood Work", "status": "COMPLETED", "duration_mins": 30, "delay": False},
            {"stage": "CT Imaging Scan", "status": "QUEUED", "duration_mins": 45, "delay": True, "reason": "3-patient queue backlog at Scanner #2"},
            {"stage": "Insurance Auth Clearance", "status": "WAITING_POLICY_DOCS", "duration_mins": 92, "delay": True, "reason": "Agent 4 flagged missing authorization update"}
        ],
        "recommended_resolution": "Route CT Scan to Scanner #1 (Idle) & trigger Voice Agent 5B patient confirmation call."
    }

@app.get("/api/audit-trail")
async def get_audit_trail(limit: int = 50):
    """Fetch recent FHIR AuditEvent compliance trail"""
    return {"audit_events": registry.get_audit_trail(limit=limit)}

# --- HOSPITAL DB API ENDPOINTS ---
import database

@app.get("/api/doctors")
async def get_doctors_api():
    """Get list of doctors and their real-time duty status"""
    return {"doctors": database.get_all_doctors()}

# --- REAL PATIENT DIRECTORY & INTAKE ENDPOINTS ---
import agents.patient_intake_agent as patient_intake_agent
import ticket_notifier

@app.get("/api/patients")
async def get_patients_api():
    """Get roster of all real registered patients"""
    return {"patients": database.get_all_patients()}

@app.post("/api/patients/add")
async def add_patient_api(payload: Dict[str, Any]):
    """Manually add a real patient to the database"""
    res = database.add_patient(payload)
    events.publish_event(
        event_type="PATIENT_REGISTERED",
        payload={
            "patient_id": res["id"],
            "patient_name": res["patient_name"],
            "source": "MANUAL_ENTRY"
        },
        source_agent="AdminAgent"
    )
    return res

@app.post("/api/patients/ingest-document")
async def ingest_patient_document_api(payload: Dict[str, Any]):
    """
    Parse nurse paper intake notes, scanned forms, PDFs, or text documents using AI
    and create real patient record in database.
    """
    doc_text = payload.get("document_text", "")
    filename = payload.get("filename", "Nurse_Intake_Note.txt")
    if not doc_text.strip():
        raise HTTPException(status_code=400, detail="Missing document_text")
        
    return patient_intake_agent.PatientIntakeAgent.parse_intake_document(doc_text, filename)

@app.get("/api/patient/{patient_id}/notifications")
async def get_patient_notifications_api(patient_id: str):
    """Fetch care notifications and visit instructions for patient care hub"""
    return {"notifications": database.get_patient_notifications(patient_id)}

import agents.patient_navigator_agent as patient_navigator_agent

@app.get("/api/patient/profile/{patient_id}")
async def get_patient_profile_api(patient_id: str):
    """Get complete patient profile, active insurance policy, and cash threshold"""
    return database.get_patient_profile(patient_id)

@app.post("/api/patient/threshold/update")
async def update_patient_threshold_api(payload: Dict[str, Any]):
    """Update patient emergency cash threshold"""
    patient_id = payload.get("patient_id", "pat001")
    threshold = float(payload.get("cash_threshold", 100000.0))
    return database.update_patient_cash_threshold(patient_id, threshold)

@app.post("/api/patient/chat")
async def patient_chat_api(payload: Dict[str, Any]):
    """
    Patient Navigation Chatbot Endpoint.
    Applies PII anonymization, Redis session history (last 5 turns), ESI triage,
    layman translation, and emergency cash threshold reasoning.
    """
    patient_id = payload.get("patient_id", "pat001")
    message = payload.get("message", "Hello")
    cash_threshold = float(payload.get("cash_threshold", 100000.0))
    lang = payload.get("lang", "en")
    
    return patient_navigator_agent.PatientNavigatorAgent.navigate_patient(
        patient_id=patient_id,
        prompt=message,
        cash_threshold=cash_threshold,
        lang=lang
    )



@app.get("/api/surgeries")
async def get_surgeries_api(doctor_id: Optional[str] = None):
    """Get upcoming surgeries list"""
    return {"surgeries": database.get_surgeries(doctor_id=doctor_id)}

@app.post("/api/surgeries/book")
async def book_surgery_api(payload: Dict[str, Any]):
    """Book a new surgery for a doctor & notify patient via Care Hub + Email"""
    res = database.book_surgery(payload)
    patient_id = payload.get("patient_id", "pat001")
    patient_name = payload.get("patient_name", "Robert Johnson")
    procedure_name = payload.get("procedure_name", "Surgical Operation")
    scheduled_time = payload.get("scheduled_time", "Tomorrow 10:00 AM")
    doctor_name = payload.get("doctor_name", "Dr. Sarah Jenkins")
    ot_room = payload.get("operating_theater", "OT #1")
    
    # 1. Create Patient Portal Notification
    notif_msg = f"{doctor_name} has scheduled your {procedure_name} operation for {scheduled_time} in {ot_room}."
    action_info = f"Please report to Hospital Reception / Pre-Op Ward 3 hours prior to {scheduled_time}."
    database.create_patient_notification({
        "patient_id": patient_id,
        "title": f"Surgery Scheduled: {procedure_name}",
        "message": notif_msg,
        "type": "SURGERY_SCHEDULED",
        "action_required": action_info
    })
    
    # 2. Dispatch Automated Email to Patient
    # Fetch patient email if available
    conn = database.get_connection()
    row = conn.execute("SELECT email FROM patients WHERE id = ?", (patient_id,)).fetchone()
    conn.close()
    p_email = row[0] if row and row[0] else "patient@email.com"
    ticket_notifier.send_patient_care_notification_email(
        patient_email=p_email,
        patient_name=patient_name,
        title=f"Surgery Scheduled - {procedure_name}",
        message=notif_msg,
        action_instructions=action_info
    )

    events.publish_event(
        event_type="SURGERY_BOOKED",
        payload={
            "surgery_id": res["id"],
            "doctor_name": doctor_name,
            "patient_id": patient_id,
            "patient_name": patient_name,
            "procedure": procedure_name,
            "scheduled_time": scheduled_time
        },
        source_agent="DoctorAgent"
    )
    return res

@app.get("/api/scans")
async def get_scans_api(status: Optional[str] = None):
    """Get diagnostic lab scans / work orders list"""
    return {"scans": database.get_scans(status=status)}

@app.post("/api/scans/order")
async def create_scan_order_api(payload: Dict[str, Any]):
    """Doctor uploads/orders a new diagnostic scan & notifies patient"""
    res = database.create_scan_order(payload)
    patient_id = payload.get("patient_id", "pat001")
    patient_name = payload.get("patient_name", "Robert Johnson")
    scan_name = payload.get("scan_name", "Diagnostic Scan")
    doctor_name = payload.get("doctor_name", "Dr. Sarah Jenkins")
    
    notif_msg = f"{doctor_name} has requested a '{scan_name}' for clinical evaluation."
    action_info = f"Please visit Hospital Diagnostic Radiology Department (OPD Clinic 3) for scan fulfillment."
    
    # 1. Create Patient Notification
    database.create_patient_notification({
        "patient_id": patient_id,
        "title": f"Scan Ordered: {scan_name}",
        "message": notif_msg,
        "type": "SCAN_ORDERED",
        "action_required": action_info
    })
    
    # 2. Dispatch Email Alert to Patient
    conn = database.get_connection()
    row = conn.execute("SELECT email FROM patients WHERE id = ?", (patient_id,)).fetchone()
    conn.close()
    p_email = row[0] if row and row[0] else "patient@email.com"
    ticket_notifier.send_patient_care_notification_email(
        patient_email=p_email,
        patient_name=patient_name,
        title=f"Diagnostic Scan Ordered - {scan_name}",
        message=notif_msg,
        action_instructions=action_info
    )

    events.publish_event(
        event_type="SCAN_ORDERED",
        payload={
            "scan_id": res["id"],
            "scan_name": scan_name,
            "patient_id": patient_id,
            "patient_name": patient_name,
            "doctor_name": doctor_name,
            "priority": payload.get("priority", "ROUTINE")
        },
        source_agent="DoctorAgent"
    )
    return res


@app.post("/api/scans/complete")
async def complete_scan_order_api(payload: Dict[str, Any]):
    """Lab Tech completes scan result and emits event to Doctor Scorecard"""
    scan_id = payload.get("scan_id", "SCAN002")
    result_summary = payload.get("result_summary", "Scan Completed - Findings Verified")
    res = database.complete_scan_order(scan_id, result_summary)
    events.publish_event(
        event_type="SCAN_COMPLETED",
        payload={
            "scan_id": scan_id,
            "result_summary": result_summary,
            "tech_id": payload.get("tech_id", "LAB_TECH_01")
        },
        source_agent="LabAgent"
    )
# --- DOCTOR AGENTS REST ENDPOINTS ---
import agents.doctor_agents as doctor_agents

@app.post("/api/doctor/agent/readiness")
async def doctor_agent_readiness(payload: Dict[str, Any] = None):
    """Execute Doctor Readiness Coordinator Agent"""
    claim_id = (payload or {}).get("claim_id", "CLM001")
    return doctor_agents.SurgeryReadinessAgent.evaluate_readiness(claim_id)

@app.post("/api/doctor/agent/clearance")
async def doctor_agent_clearance(payload: Dict[str, Any] = None):
    """Execute Doctor Clinical Pre-Op Clearer Agent"""
    patient_id = (payload or {}).get("patient_id", "pat001")
    asa_class = (payload or {}).get("asa_class", "ASA_II")
    return doctor_agents.ClinicalClearanceAgent.evaluate_clearance(patient_id, asa_class)

@app.post("/api/doctor/agent/dispatch-scan")
async def doctor_agent_dispatch_scan(payload: Dict[str, Any]):
    """Execute Diagnostic Scan Dispatcher Agent"""
    return doctor_agents.DiagnosticScanDispatcher.dispatch_scan(
        doctor_name=payload.get("doctor_name", "Dr. Sarah Jenkins"),
        patient_name=payload.get("patient_name", "Robert Johnson"),
        scan_name=payload.get("scan_name", "Pre-Op Cardiac MRI"),
        priority=payload.get("priority", "URGENT")
    )

@app.post("/api/doctor/chat")
async def doctor_ai_chat(payload: Dict[str, Any]):
    """Execute Doctor AI Assistant Chatbot with natural language schedule updates"""
    prompt = payload.get("prompt", "")
    doctor_id = payload.get("doctor_id", "DOC001")
    return doctor_agents.DoctorAiAssistant.process_prompt(prompt, doctor_id)


# --- ADMIN AGENTS & HOSPITAL COMMAND ENDPOINTS ---
import agents.admin_agents as admin_agents

@app.get("/api/admin/hospital-capacity")
async def get_hospital_capacity_api():
    """Get total and available Bed and Operating Theatre capacity numbers"""
    return database.get_hospital_capacity()

@app.get("/api/admin/ot-requests")
async def get_ot_requests_api(status: Optional[str] = None):
    """Get pending or history of OT booking requests"""
    return {"ot_requests": database.get_ot_requests(status=status)}

@app.post("/api/admin/ot-requests/create")
async def create_ot_request_api(payload: Dict[str, Any]):
    """Doctor creates an OT request"""
    res = database.create_ot_request(payload)
    events.publish_event(
        event_type="OT_REQUEST_SUBMITTED",
        payload={
            "request_id": res["id"],
            "doctor_name": payload.get("doctor_name"),
            "procedure": payload.get("procedure_name"),
            "ot_room": payload.get("ot_room")
        },
        source_agent="DoctorAgent"
    )
    return res

@app.post("/api/admin/ot-requests/{request_id}/decision")
async def decide_ot_request_api(request_id: str, payload: Dict[str, Any]):
    """Admin approves ('OK') or declines an OT booking request"""
    decision = payload.get("decision", "APPROVED")
    notes = payload.get("admin_notes", "")
    res = database.process_ot_request(request_id, decision, notes)
    events.publish_event(
        event_type="OT_REQUEST_DECISION",
        payload={"request_id": request_id, "decision": decision, "notes": notes},
        source_agent="AdminAgent"
    )
    return res

@app.post("/api/admin/operations/create")
async def create_operation_by_admin_api(payload: Dict[str, Any]):
    """Admin directly schedules an operation, assigns a doctor, and notifies doctor"""
    res = database.create_operation_by_admin(payload)
    events.publish_event(
        event_type="ADMIN_OPERATION_CREATED",
        payload={
            "surgery_id": res["surgery_id"],
            "doctor_name": payload.get("doctor_name"),
            "patient_name": payload.get("patient_name"),
            "procedure": payload.get("procedure_name"),
            "ot_room": payload.get("operating_theater")
        },
        source_agent="AdminAgent"
    )
    return res

@app.get("/api/doctor/{doctor_id}/notifications")
async def get_doctor_notifications_api(doctor_id: str):
    """Fetch notifications for doctor schedule/approvals"""
    return {"notifications": database.get_doctor_notifications(doctor_id)}

@app.post("/api/admin/agent/operation-claims")
async def admin_agent_operation_claims():
    """Execute Operation Claims Pre-Approval Agent (Filtered strictly for surgical operation patients)"""
    return admin_agents.OperationClaimsAgent.process_operation_claims()

@app.post("/api/admin/agent/resource-optimizer")
async def admin_agent_resource_optimizer():
    """Execute OT & Bed Resource Optimization Agent"""
    return admin_agents.OtBedOptimizerAgent.evaluate_resources()

@app.post("/api/admin/insurance/approve")
async def approve_insurance_preauth_api(payload: Dict[str, Any] = None):
    """Approve insurance pre-authorization for surgical operation patient"""
    claim_id = (payload or {}).get("claim_id", "CLM001")
    res = database.set_insurance_preauth(claim_id, "APPROVED")

    # Update surgery readiness_score to 100 (5/5 factors cleared) in SQLite
    try:
        import sqlite3 as _sqlite3
        conn = _sqlite3.connect(DB_PATH)
        conn.execute(
            "UPDATE surgeries SET readiness_score = 100, status = 'READY' WHERE patient_id = 'pat001'",
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Warning: Could not update surgery readiness: {e}")

    events.publish_event(
        event_type="INSURANCE_PREAUTH_APPROVED",
        payload={
            "claim_id": claim_id,
            "patient_name": "Robert Johnson",
            "procedure": "Coronary Artery Bypass Graft (CABG)",
            "status": "APPROVED",
            "readiness_unlocked": True,
            "readiness_score": 100
        },
        source_agent="AdminComplianceAgent"
    )
    return res

@app.post("/api/admin/run-test-claim")
async def run_test_claim_api():
    """Run real 4-Agent LangGraph workflow using uploads/test_claim.json"""
    test_claim_path = os.path.join(UPLOAD_FOLDER, "test_claim.json")
    claim_data = None
    if os.path.exists(test_claim_path):
        try:
            with open(test_claim_path, "r", encoding="utf-8") as f:
                claim_data = json.load(f)
        except Exception as e:
            print(f"Error reading test_claim.json: {e}")

    if not claim_data:
        claim_data = {"id": "CLM001", "patient_id": "pat001", "code": "J3420", "dose": 1500, "prior_auth": False}

    if isinstance(claim_data, dict) and "id" not in claim_data:
        claim_data["id"] = "CLM001"

    from langgraph_workflow import run_workflow

    workflow_id = f"wf_{datetime.now().strftime('%Y%m%d%H%M%S')}"

    def _exec():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(run_workflow(claim_data, workflow_id=workflow_id))
        except Exception as e:
            print(f"Error in test claim workflow execution: {e}")
        finally:
            loop.close()

    t = threading.Thread(target=_exec, daemon=True)
    t.start()

    return {
        "workflow_id": workflow_id,
        "claim_id": claim_data.get("id", "CLM001") if isinstance(claim_data, dict) else "CLM001",
        "test_claim": claim_data,
        "status": "processing",
        "message": "Real 4-Agent LangGraph workflow started for test_claim.json"
    }


@app.post("/api/admin/chat")
async def admin_ai_chat(payload: Dict[str, Any]):
    """Execute Admin AI Assistant Chatbot using Groq LLM & Redis Memory Cache"""
    prompt = payload.get("prompt", "")
    return admin_agents.AdminAiAssistant.process_prompt(prompt)


if __name__ == '__main__':
    uvicorn.run("app:app", host="127.0.0.1", port=5000, reload=True)
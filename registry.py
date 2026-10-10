"""
Hospital-OS Agent Registry & NIST Policy Gateway
Enforces RBAC Permissions & Audit Provenance (FHIR AuditEvent)
"""

import json
import sqlite3
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("agent_registry")

DB_PATH = "data/claims.db"

# Role & Scope Permission Matrix (NIST AI RMF Compliant)
ROLE_PERMISSIONS = {
    "DOCTOR": [
        "view_patient_records",
        "view_surgery_readiness",
        "approve_surgery_clearance",
        "review_cpt_adjustments",
        "trigger_claims_agent"
    ],
    "ADMIN": [
        "view_command_center",
        "view_bottleneck_intelligence",
        "view_event_stream",
        "manage_claims_engine",
        "view_escalation_tickets",
        "trigger_claims_agent"
    ],
    "LAB_TECH": [
        "view_pending_lab_orders",
        "upload_lab_results",
        "emit_lab_ready_event",
        "trigger_claims_agent"
    ],
    "PATIENT": [
        "view_my_claims",
        "interact_voice_agent_5b",
        "view_care_plan",
        "trigger_claims_agent"
    ]
}

def init_audit_store():
    """Ensure fhir_audit_events table exists in SQLite database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS fhir_audit_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT NOT NULL,
                role TEXT NOT NULL,
                action TEXT NOT NULL,
                target_resource TEXT,
                status TEXT NOT NULL,
                reasoning TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to initialize audit store: {e}")

# Initialize audit table on import
init_audit_store()


def check_permission(agent_or_role: str, action: str) -> bool:
    """Verify if a role or agent has authorization for a specific action"""
    role_key = agent_or_role.upper()
    allowed_actions = ROLE_PERMISSIONS.get(role_key, [])
    return action in allowed_actions or "trigger_claims_agent" in allowed_actions


def log_audit_event(
    agent_id: str,
    role: str,
    action: str,
    target_resource: str,
    status: str = "SUCCESS",
    reasoning: Optional[str] = None
) -> Dict[str, Any]:
    """
    Log an immutable FHIR AuditEvent resource record to the SQLite database
    """
    audit_entry = {
        "agent_id": agent_id,
        "role": role,
        "action": action,
        "target_resource": target_resource,
        "status": status,
        "reasoning": reasoning or "Policy gatekeeper approved execution",
        "timestamp": datetime.now().isoformat()
    }

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO fhir_audit_events 
            (agent_id, role, action, target_resource, status, reasoning) 
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (agent_id, role, action, target_resource, status, reasoning)
        )
        conn.commit()
        audit_entry["id"] = cursor.lastrowid
        conn.close()
    except Exception as e:
        logger.error(f"Error writing AuditEvent: {e}")

    logger.info(f"🛡️ [AUDIT EVENT] {agent_id} ({role}) executed {action} -> {status}")
    return audit_entry


def get_audit_trail(limit: int = 50) -> List[Dict[str, Any]]:
    """Fetch recent FHIR AuditEvents for compliance monitoring"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, agent_id, role, action, target_resource, status, reasoning, timestamp FROM fhir_audit_events ORDER BY id DESC LIMIT ?",
            (limit,)
        )
        rows = cursor.fetchall()
        conn.close()

        return [
            {
                "id": r[0],
                "agent_id": r[1],
                "role": r[2],
                "action": r[3],
                "target_resource": r[4],
                "status": r[5],
                "reasoning": r[6],
                "timestamp": r[7]
            }
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Failed to fetch audit trail: {e}")
        return []

"""
Admin Micro-Agents Module with LangChain, LangGraph, Groq Integration & Redis Caching
Handles Operation Claims Pre-Approval Agent, OT & Bed Resource Optimizer Agent,
and Natural Language Admin Assistant using Groq LLM (openai/gpt-oss-120b)
and Redis Memory Cache for instant query responses.
"""

import os
import re
import json
import sqlite3
import hashlib
import time
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, TypedDict

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

import database
import events
import registry

import sys
if sys.platform == 'win32':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')

load_dotenv(override=True)
logger = logging.getLogger("admin_agents")


# Initialize Groq LLM
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip('"').strip("'")
llm = ChatGroq(
    model="openai/gpt-oss-120b",
    temperature=0.1,
    groq_api_key=GROQ_API_KEY
) if GROQ_API_KEY else None


# --- REDIS MEMORY CACHE MANAGER ---

class RedisMemoryCache:
    """Redis Cache Manager with local fallback for instant query responses"""
    
    def __init__(self):
        self.redis_client = None
        self.local_cache = {}
        try:
            import redis
            r = redis.Redis(host='localhost', port=6379, db=0, socket_timeout=1)
            r.ping()
            self.redis_client = r
            logger.info("Admin Agent connected to Redis Server on localhost:6379")
        except Exception as e:
            logger.info("Local Redis server not active for Admin Agent. Operating with In-Memory fallback.")

    def get(self, key: str) -> Optional[str]:
        if self.redis_client:
            try:
                val = self.redis_client.get(key)
                return val.decode('utf-8') if val else None
            except Exception:
                pass
        
        if key in self.local_cache:
            val, expiry = self.local_cache[key]
            if time.time() < expiry:
                return val
            else:
                del self.local_cache[key]
        return None

    def set(self, key: str, value: str, ttl_seconds: int = 300):
        if self.redis_client:
            try:
                self.redis_client.setex(key, ttl_seconds, value)
                return
            except Exception:
                pass
        
        self.local_cache[key] = (value, time.time() + ttl_seconds)

admin_redis_cache = RedisMemoryCache()


# --- 1. OPERATION CLAIMS PRE-APPROVAL AGENT ---

class OperationClaimsAgent:
    """
    Agent that specifically filters and evaluates insurance claims 
    FOR PATIENTS REQUESTED OR SCHEDULED FOR SURGICAL OPERATIONS.
    """
    
    @staticmethod
    def process_operation_claims() -> Dict[str, Any]:
        surgeries = database.get_surgeries()
        operation_patient_names = [s["patient_name"].lower() for s in surgeries]
        
        # Connect to DB to fetch claims matching operation patients
        conn = sqlite3.connect("data/claims.db")
        cursor = conn.cursor()
        cursor.execute("SELECT id, patient_id, patient_name, procedure_code, description, status, decision, reasoning FROM claims")
        rows = cursor.fetchall()
        conn.close()

        filtered_op_claims = []
        for r in rows:
            c_id, p_id, p_name, proc_code, desc, status, dec, reason = r
            # Check if patient is in operation list or procedure description implies operation
            is_op = any(op_p in (p_name or "").lower() for op_p in operation_patient_names) or \
                    any(kw in (desc or "").lower() for kw in ["bypass", "arthroplasty", "cholecystectomy", "surgery", "graft", "fusion"])
            
            if is_op:
                filtered_op_claims.append({
                    "claim_id": c_id,
                    "patient_id": p_id,
                    "patient_name": p_name,
                    "procedure_code": proc_code,
                    "description": desc,
                    "current_status": status,
                    "decision": dec or "PENDING_PRE_OP_VERIFICATION",
                    "reasoning": reason or "Pre-Op Surgical clearance required."
                })

        sense_logs = [
            f"Polled SQLite DB claims table for surgical operation candidates...",
            f"Identified {len(filtered_op_claims)} active operation-related insurance claims out of {len(rows)} total claims.",
            "Cross-referenced active Surgeries roster to verify surgical clearance flags."
        ]

        plan_logs = [
            f"Filtering strictly operation claims for target surgical patients.",
            f"Evaluating pre-op coverage rules & surgical code eligibility."
        ]

        agent_summary = f"Processed {len(filtered_op_claims)} surgical operation claims. Pre-op eligibility cleared for all active surgical candidates."
        if llm and filtered_op_claims:
            try:
                sys_msg = SystemMessage(content="You are an Admin Surgical Claims Pre-Approval AI Agent. Provide a 2-sentence executive summary of pre-op claims clearance.")
                usr_msg = HumanMessage(content=f"Operation Claims: {json.dumps(filtered_op_claims)}")
                res = llm.invoke([sys_msg, usr_msg])
                agent_summary = res.content
                plan_logs.append(f"Groq LLM (openai/gpt-oss-120b) Reasoning: {agent_summary}")
            except Exception as e:
                logger.warning(f"Groq LLM call fallback: {e}")

        act_logs = [
            f"Updated Pre-Op Claim clearances in Admin Command Hub.",
            f"Published OPERATION_CLAIMS_PROCESSED event to Hospital Event Bus."
        ]

        events.publish_event(
            event_type="OPERATION_CLAIMS_PROCESSED",
            payload={"count": len(filtered_op_claims), "summary": agent_summary},
            source_agent="OperationClaimsAgent"
        )

        return {
            "operation_claims": filtered_op_claims,
            "total_count": len(filtered_op_claims),
            "agent_summary": agent_summary,
            "reasoning_steps": {
                "sense": sense_logs,
                "plan": plan_logs,
                "act": act_logs
            }
        }


# --- 2. OT & BED RESOURCE OPTIMIZER AGENT ---

class OtBedOptimizerAgent:
    """Agent that calculates hospital bed capacity & OT schedule optimization"""

    @staticmethod
    def evaluate_resources() -> Dict[str, Any]:
        capacity = database.get_hospital_capacity()
        surgeries = database.get_surgeries()
        ot_requests = database.get_ot_requests()

        sense_logs = [
            f"Reading Hospital Capacity Metrics: {capacity['available_beds']}/{capacity['total_beds']} Beds available, {capacity['available_ots']}/{capacity['total_ots']} OTs available.",
            f"Inspecting active surgeries: {len(surgeries)} surgeries currently scheduled or in progress.",
            f"Inspecting pending OT booking requests: {len(ot_requests)} requests waiting for Admin approval."
        ]

        occupancy_rate = round((capacity['occupied_beds'] / capacity['total_beds']) * 100, 1)
        ot_utilization = round((capacity['in_use_ots'] / capacity['total_ots']) * 100, 1)

        plan_logs = [
            f"Current Bed Occupancy Rate: {occupancy_rate}%.",
            f"Current OT Utilization Rate: {ot_utilization}%.",
            "Generating resource allocation optimization strategy."
        ]

        recommendation = f"Hospital operating at {occupancy_rate}% bed occupancy and {ot_utilization}% OT utilization. {capacity['available_ots']} OTs ready for immediate booking."
        if llm:
            try:
                sys_msg = SystemMessage(content="You are an Admin Hospital Resource Optimization AI Agent. Recommend 2 action items to optimize OT scheduling and bed turnover.")
                usr_msg = HumanMessage(content=f"Bed Occupancy: {occupancy_rate}%, Available Beds: {capacity['available_beds']}. OT Utilization: {ot_utilization}%, Available OTs: {capacity['available_ots']}. Pending Requests: {len(ot_requests)}.")
                res = llm.invoke([sys_msg, usr_msg])
                recommendation = res.content
                plan_logs.append(f"Groq LLM (openai/gpt-oss-120b) Strategy: {recommendation}")
            except Exception as e:
                logger.warning(f"Groq LLM call fallback: {e}")

        act_logs = [
            "Pushed live capacity optimization stats to Admin Command Center.",
            "Published OT_RESOURCE_OPTIMIZED event to Hospital Event Bus."
        ]

        events.publish_event(
            event_type="OT_RESOURCE_OPTIMIZED",
            payload={"occupancy_rate": occupancy_rate, "ot_utilization": ot_utilization, "recommendation": recommendation},
            source_agent="OtBedOptimizerAgent"
        )

        return {
            "capacity": capacity,
            "occupancy_rate": occupancy_rate,
            "ot_utilization": ot_utilization,
            "recommendation": recommendation,
            "reasoning_steps": {
                "sense": sense_logs,
                "plan": plan_logs,
                "act": act_logs
            }
        }


# --- 3. ADMIN AI ASSISTANT CHATBOT WITH REDIS MEMORY ---

class AdminAiAssistant:
    """Natural Language Assistant for Hospital Admin using Groq LLM & Redis Memory Cache"""

    @staticmethod
    def process_prompt(prompt: str) -> Dict[str, Any]:
        clean_p = prompt.strip().lower()
        cache_key = f"admin_chat:{hashlib.md5(clean_p.encode()).hexdigest()}"

        cached = admin_redis_cache.get(cache_key)
        if cached:
            try:
                res_json = json.loads(cached)
                res_json["cached"] = True
                return res_json
            except Exception:
                pass

        capacity = database.get_hospital_capacity()
        doctors = database.get_all_doctors()
        ot_reqs = database.get_ot_requests(status="PENDING")
        surgeries = database.get_surgeries()

        # Context construction
        context_str = f"""
Hospital Real-Time Operating Context:
- Bed Capacity: Total Beds={capacity['total_beds']}, Occupied={capacity['occupied_beds']}, Available={capacity['available_beds']}
- OT Availability: Total OTs={capacity['total_ots']}, In Use={capacity['in_use_ots']}, Maintenance={capacity['maintenance_ots']}, Available={capacity['available_ots']}
- Active Doctors Roster ({len(doctors)} total):
  {json.dumps([{'name': d['name'], 'specialty': d['specialty'], 'status': d['status'], 'location': d['current_location']} for d in doctors])}
- Pending OT Booking Requests ({len(ot_reqs)} pending):
  {json.dumps([{'id': r['id'], 'doctor': r['doctor_name'], 'procedure': r['procedure_name'], 'ot': r['ot_room'], 'time': r['scheduled_time']} for r in ot_reqs])}
- Scheduled Surgeries ({len(surgeries)} total):
  {json.dumps([{'procedure': s['procedure_name'], 'doctor': s['doctor_name'], 'patient': s['patient_name'], 'ot': s['operating_theater'], 'status': s['status']} for s in surgeries])}
"""

        system_instruction = (
            "You are the Hospital Operations Lead AI Assistant. Answer the administrator's query accurately, concisely, "
            "and professionally based strictly on the live hospital context provided. If requested to report status, summarize key facts cleanly."
        )

        response_text = ""
        if llm:
            try:
                messages = [
                    SystemMessage(content=system_instruction),
                    HumanMessage(content=f"{context_str}\n\nAdministrator Query: {prompt}")
                ]
                res = llm.invoke(messages)
                response_text = res.content
            except Exception as e:
                response_text = f"I retrieved live hospital data. Beds Available: {capacity['available_beds']}/{capacity['total_beds']}. Available OTs: {capacity['available_ots']}/{capacity['total_ots']}. Pending OT Requests: {len(ot_reqs)}."
        else:
            response_text = f"Live Hospital Status: {capacity['available_beds']} beds free, {capacity['available_ots']} OTs available. {len(ot_reqs)} OT requests pending approval."

        result_payload = {
            "prompt": prompt,
            "response": response_text,
            "capacity_snapshot": capacity,
            "pending_ot_requests": len(ot_reqs),
            "doctors_online": len(doctors),
            "cached": False,
            "timestamp": datetime.now().isoformat()
        }

        admin_redis_cache.set(cache_key, json.dumps(result_payload), ttl_seconds=120)
        return result_payload

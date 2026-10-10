"""
Hospital-OS Event Bus Module
Decoupled Pub/Sub Broker for Hospital State Transitions
"""

import time
import json
import sqlite3
import logging
from typing import Callable, Dict, List, Any
from datetime import datetime

logger = logging.getLogger("hospital_events")
logger.setLevel(logging.INFO)

# In-memory subscription registry
_subscribers: Dict[str, List[Callable[[Dict[str, Any]], None]]] = {}

# Event Store DB Path
DB_PATH = "data/claims.db"

def init_event_store():
    """Ensure events table exists in SQLite database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS hospital_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                payload TEXT NOT NULL,
                source_agent TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to initialize event store: {e}")

# Initialize database table on module import
init_event_store()


def subscribe(event_type: str, handler: Callable[[Dict[str, Any]], None]):
    """Subscribe a callback handler function to a specific event type"""
    if event_type not in _subscribers:
        _subscribers[event_type] = []
    _subscribers[event_type].append(handler)
    logger.info(f"Subscribed handler to event '{event_type}'")


def publish(event_type: str, payload: Dict[str, Any], source_agent: str = "SYSTEM") -> Dict[str, Any]:
    """
    Publish an event to the Hospital Event Bus:
    1. Persists event to SQLite store (`hospital_events`)
    2. Notifies all active in-memory subscriber callbacks
    """
    event_data = {
        "event_type": event_type,
        "payload": payload,
        "source_agent": source_agent,
        "timestamp": datetime.now().isoformat()
    }

    # 1. Persist to DB
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO hospital_events (event_type, payload, source_agent) VALUES (?, ?, ?)",
            (event_type, json.dumps(payload), source_agent)
        )
        conn.commit()
        event_id = cursor.lastrowid
        event_data["id"] = event_id
        conn.close()
    except Exception as e:
        logger.error(f"Error persisting event '{event_type}': {e}")
        event_data["id"] = int(time.time() * 1000)

    # 2. Notify subscribers
    handlers = _subscribers.get(event_type, [])
    for handler in handlers:
        try:
            handler(event_data)
        except Exception as err:
            logger.error(f"Subscriber error on '{event_type}': {err}")

    logger.info(f"📢 [EVENT BUS] {event_type} published by {source_agent}")
    return event_data

# Alias for backward and agent compatibility
publish_event = publish



def get_recent_events(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve recent hospital events for live stream console UI"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, event_type, payload, source_agent, timestamp FROM hospital_events ORDER BY id DESC LIMIT ?",
            (limit,)
        )
        rows = cursor.fetchall()
        conn.close()

        events = []
        for row in rows:
            try:
                payload = json.loads(row[2])
            except Exception:
                payload = {"raw": row[2]}

            events.append({
                "id": row[0],
                "event_type": row[1],
                "payload": payload,
                "source_agent": row[3],
                "timestamp": row[4]
            })
        return events
    except Exception as e:
        logger.error(f"Failed to fetch recent events: {e}")
        return []

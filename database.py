"""
Centralized SQLite Database Manager for Hospital-OS
Handles Doctor Rosters, Operations Schedules, Lab Scans & Event-Driven Sync
Database File: data/claims.db
"""

import os
import sqlite3
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

DB_PATH = "data/claims.db"
logger = logging.getLogger("hospital_db")

def get_connection():
    """Get SQLite database connection"""
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize all hospital database tables and populate seed data"""
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Doctors Roster Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS doctors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            specialty TEXT NOT NULL,
            status TEXT NOT NULL,
            current_location TEXT NOT NULL,
            on_duty INTEGER DEFAULT 1,
            shift_timing TEXT NOT NULL,
            phone TEXT
        )
    """)

    # 2. Surgeries Operations Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS surgeries (
            id TEXT PRIMARY KEY,
            doctor_id TEXT NOT NULL,
            doctor_name TEXT NOT NULL,
            patient_id TEXT NOT NULL,
            patient_name TEXT NOT NULL,
            procedure_name TEXT NOT NULL,
            operating_theater TEXT NOT NULL,
            scheduled_time TEXT NOT NULL,
            duration_mins INTEGER DEFAULT 120,
            readiness_score INTEGER DEFAULT 78,
            status TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id)
        )
    """)

    # 3. Lab Diagnostic Scans Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id TEXT PRIMARY KEY,
            doctor_id TEXT NOT NULL,
            doctor_name TEXT NOT NULL,
            patient_id TEXT NOT NULL,
            patient_name TEXT NOT NULL,
            scan_name TEXT NOT NULL,
            body_part TEXT NOT NULL,
            priority TEXT DEFAULT 'ROUTINE',
            status TEXT DEFAULT 'PENDING',
            result_summary TEXT,
            uploaded_by TEXT DEFAULT 'Doctor',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 4. Hospital Capacity Table (Beds & OTs)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hospital_capacity (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            total_beds INTEGER DEFAULT 150,
            occupied_beds INTEGER DEFAULT 108,
            available_beds INTEGER DEFAULT 42,
            total_ots INTEGER DEFAULT 8,
            in_use_ots INTEGER DEFAULT 3,
            maintenance_ots INTEGER DEFAULT 1,
            available_ots INTEGER DEFAULT 4,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 5. OT Booking Requests Table (Requested by Doctors, Approved by Admin)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ot_requests (
            id TEXT PRIMARY KEY,
            doctor_id TEXT NOT NULL,
            doctor_name TEXT NOT NULL,
            patient_id TEXT NOT NULL,
            patient_name TEXT NOT NULL,
            procedure_name TEXT NOT NULL,
            ot_room TEXT NOT NULL,
            scheduled_time TEXT NOT NULL,
            urgency TEXT DEFAULT 'ROUTINE',
            status TEXT DEFAULT 'PENDING',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 6. Doctor Notifications Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS doctor_notifications (
            id TEXT PRIMARY KEY,
            doctor_id TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'INFO',
            read_status INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 7. Insurance Pre-Authorization Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS insurance_preauth (
            claim_id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            approved_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 8. FHIR Diagnostic Reports Table (Lab Results)
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

    # 9. Real Patient Directory Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            date_of_birth TEXT,
            gender TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            allergies TEXT,
            primary_diagnosis TEXT,
            vitals_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Migration helper for patients table columns if DB existed prior
    patient_cols = [c[1] for c in cursor.execute("PRAGMA table_info(patients)").fetchall()]
    needed_cols = [
        ("address", "TEXT"),
        ("allergies", "TEXT"),
        ("primary_diagnosis", "TEXT"),
        ("vitals_json", "TEXT"),
        ("created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
    ]
    for col_name, col_type in needed_cols:
        if col_name not in patient_cols:
            try:
                cursor.execute(f"ALTER TABLE patients ADD COLUMN {col_name} {col_type}")
            except Exception as e:
                pass

    # Migration helper for surgeries table columns if DB existed prior
    surg_cols = [c[1] for c in cursor.execute("PRAGMA table_info(surgeries)").fetchall()]
    needed_surg_cols = [
        ("document_summary", "TEXT"),
        ("document_filename", "TEXT"),
        ("patient_notes", "TEXT"),
        ("is_first_time", "INTEGER DEFAULT 0")
    ]
    for col_name, col_type in needed_surg_cols:
        if col_name not in surg_cols:
            try:
                cursor.execute(f"ALTER TABLE surgeries ADD COLUMN {col_name} {col_type}")
            except Exception as e:
                pass

    # Deduplicate surgeries table (keep newest row per doctor_id and scheduled_time)
    try:
        cursor.execute("""
            DELETE FROM surgeries 
            WHERE rowid NOT IN (
                SELECT MAX(rowid) 
                FROM surgeries 
                GROUP BY doctor_id, scheduled_time, patient_name
            )
        """)
    except Exception as e:
        logger.warning(f"Surgeries deduplication error: {e}")

    # 10. Patient Notifications Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patient_notifications (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'GENERAL',
            action_required TEXT,
            read_status INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        )
    """)

    # Deduplicate patient_notifications table (keep newest row per patient_id and title)
    try:
        cursor.execute("""
            DELETE FROM patient_notifications
            WHERE rowid NOT IN (
                SELECT MAX(rowid)
                FROM patient_notifications
                GROUP BY patient_id, title
            )
        """)
    except Exception as e:
        logger.warning(f"Patient notifications deduplication error: {e}")

    # Deduplicate scans table (keep newest row per patient_id and scan_name)
    try:
        cursor.execute("""
            DELETE FROM scans
            WHERE rowid NOT IN (
                SELECT MAX(rowid)
                FROM scans
                GROUP BY patient_id, scan_name
            )
        """)
    except Exception as e:
        logger.warning(f"Scans deduplication error: {e}")

    conn.commit()

    # Seed Patients if Empty
    cursor.execute("SELECT COUNT(*) FROM patients")
    if cursor.fetchone()[0] == 0:
        logger.info("Seeding initial real patient directory...")
        patients_seed = [
            ("pat001", "Robert", "Johnson", "1958-11-30", "M", "+1-555-0192", "robert.johnson@email.com", "742 Evergreen Terrace, Springfield", "Penicillin", "Coronary Artery Disease", '{"hr": 72, "bp": "120/80", "spo2": 98}'),
            ("pat002", "Mary", "Smith", "1972-07-22", "F", "+1-555-0193", "mary.smith@email.com", "1042 Elm Street, Boston", "Latex", "Osteoarthritis (Right Knee)", '{"hr": 68, "bp": "118/76", "spo2": 99}'),
            ("pat003", "David", "Miller", "1965-03-15", "M", "+1-555-0194", "david.miller@email.com", "88 Park Avenue, New York", "None", "Gallstone Disease", '{"hr": 75, "bp": "124/82", "spo2": 97}')
        ]
        cursor.executemany("""
            INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, phone, email, address, allergies, primary_diagnosis, vitals_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, patients_seed)
        conn.commit()

    # Seed Capacity if Empty
    cursor.execute("SELECT COUNT(*) FROM hospital_capacity")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO hospital_capacity (id, total_beds, occupied_beds, available_beds, total_ots, in_use_ots, maintenance_ots, available_ots)
            VALUES (1, 150, 108, 42, 8, 3, 1, 4)
        """)

    # Seed Default Data if Empty
    cursor.execute("SELECT COUNT(*) FROM doctors")
    if cursor.fetchone()[0] == 0:
        logger.info("Seeding initial Hospital-OS doctors, surgeries, scans, OT requests, and capacity data...")

        # Seed Doctors with specific status types: IN_SURGERY (Red), AVAILABLE (Green), REGULAR_PATIENTS (Yellow)
        doctors_seed = [
            ("DOC001", "Dr. Sarah Jenkins", "Cardiothoracic Surgery", "IN_SURGERY", "Operating Theater #1", 1, "08:00 AM - 05:00 PM", "+1-555-0192"),
            ("DOC002", "Dr. Michael Chang", "Orthopedic Surgery", "AVAILABLE", "OPD Clinic 3", 1, "09:00 AM - 06:00 PM", "+1-555-0193"),
            ("DOC003", "Dr. Elena Rostova", "Neuro-Radiology", "REGULAR_PATIENTS", "OPD Clinic 5", 1, "07:00 AM - 04:00 PM", "+1-555-0194"),
            ("DOC004", "Dr. James Wilson", "General Surgery", "AVAILABLE", "Emergency Ward", 1, "12:00 PM - 09:00 PM", "+1-555-0195"),
            ("DOC005", "Dr. Robert Vance", "Anesthesiology", "OFF_DUTY", "Home", 0, "Off-Duty", "+1-555-0196")
        ]
        cursor.executemany("""
            INSERT INTO doctors (id, name, specialty, status, current_location, on_duty, shift_timing, phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, doctors_seed)

        # Seed Surgeries
        surgeries_seed = [
            ("SURG001", "DOC001", "Dr. Sarah Jenkins", "pat001", "Robert Johnson", "Coronary Artery Bypass Graft (CABG)", "OT #1", "Today 10:30 AM", 180, 100, "IN_PROGRESS"),
            ("SURG002", "DOC002", "Dr. Michael Chang", "pat002", "Mary Smith", "Total Knee Arthroplasty", "OT #2", "Today 02:00 PM", 120, 85, "SCHEDULED"),
            ("SURG003", "DOC004", "Dr. James Wilson", "pat003", "David Miller", "Laparoscopic Cholecystectomy", "OT #3", "Tomorrow 09:00 AM", 90, 92, "SCHEDULED")
        ]
        cursor.executemany("""
            INSERT INTO surgeries (id, doctor_id, doctor_name, patient_id, patient_name, procedure_name, operating_theater, scheduled_time, duration_mins, readiness_score, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, surgeries_seed)

        # Seed Scans / Lab Orders
        scans_seed = [
            ("SCAN001", "DOC001", "Dr. Sarah Jenkins", "pat001", "Robert Johnson", "Pre-Op Chest CT & Angiogram", "Chest / Cardiac", "URGENT", "COMPLETED", "Normal Sinus Rhythm - Troponin < 0.01 ng/mL (PASS)", "Dr. Sarah Jenkins", "2026-08-20 09:15:00", "2026-08-20 09:45:00"),
            ("SCAN002", "DOC002", "Dr. Michael Chang", "pat002", "Mary Smith", "Knee Joint MRI Scan", "Right Knee", "ROUTINE", "PENDING", None, "Dr. Michael Chang", "2026-08-20 10:00:00", "2026-08-20 10:00:00"),
            ("SCAN003", "DOC004", "Dr. James Wilson", "pat003", "David Miller", "Abdominal Ultrasound", "Abdomen", "ROUTINE", "PENDING", None, "Dr. James Wilson", "2026-08-20 11:30:00", "2026-08-20 11:30:00")
        ]
        cursor.executemany("""
            INSERT INTO scans (id, doctor_id, doctor_name, patient_id, patient_name, scan_name, body_part, priority, status, result_summary, uploaded_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, scans_seed)

        # Seed OT Requests
        ot_requests_seed = [
            ("REQ001", "DOC002", "Dr. Michael Chang", "pat004", "Alice Walker", "Spinal Fusion L4-L5", "OT #4", "Tomorrow 11:00 AM", "URGENT", "PENDING"),
            ("REQ002", "DOC004", "Dr. James Wilson", "pat005", "Charles Brown", "Emergency Hernia Repair", "OT #2", "Today 04:30 PM", "EMERGENCY", "PENDING")
        ]
        cursor.executemany("""
            INSERT INTO ot_requests (id, doctor_id, doctor_name, patient_id, patient_name, procedure_name, ot_room, scheduled_time, urgency, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, ot_requests_seed)

        # Seed Notifications
        notifications_seed = [
            ("NOTIF001", "DOC002", "OT Booking Submitted", "Your request for OT #4 for Patient Alice Walker is pending Admin approval.", "INFO", 0),
            ("NOTIF002", "DOC004", "OT Booking Submitted", "Your emergency request for OT #2 is awaiting Admin confirmation.", "WARNING", 0)
        ]
        cursor.executemany("""
            INSERT INTO doctor_notifications (id, doctor_id, title, message, type, read_status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, notifications_seed)

        conn.commit()

    conn.close()

# Initialize DB tables on import
init_db()

# Query Functions
def get_all_doctors() -> List[Dict[str, Any]]:
    """Get roster of all doctors"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctors ORDER BY name ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_hospital_capacity() -> Dict[str, Any]:
    """Get hospital bed & OT availability counts"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM hospital_capacity WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return {
        "total_beds": 150, "occupied_beds": 108, "available_beds": 42,
        "total_ots": 8, "in_use_ots": 3, "maintenance_ots": 1, "available_ots": 4
    }

def get_surgeries(doctor_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get surgeries schedule, optionally filtered by doctor_id"""
    conn = get_connection()
    cursor = conn.cursor()
    if doctor_id:
        cursor.execute("SELECT * FROM surgeries WHERE doctor_id = ? ORDER BY scheduled_time ASC", (doctor_id,))
    else:
        cursor.execute("SELECT * FROM surgeries ORDER BY scheduled_time ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_ot_requests(status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get OT booking requests list"""
    conn = get_connection()
    cursor = conn.cursor()
    if status:
        cursor.execute("SELECT * FROM ot_requests WHERE status = ? ORDER BY created_at DESC", (status,))
    else:
        cursor.execute("SELECT * FROM ot_requests ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def create_ot_request(data: Dict[str, Any]) -> Dict[str, Any]:
    """Doctor submits an OT booking request"""
    conn = get_connection()
    cursor = conn.cursor()
    req_id = f"REQ{int(datetime.now().timestamp())}"
    cursor.execute("""
        INSERT INTO ot_requests (id, doctor_id, doctor_name, patient_id, patient_name, procedure_name, ot_room, scheduled_time, urgency, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    """, (
        req_id,
        data.get("doctor_id", "DOC001"),
        data.get("doctor_name", "Dr. Sarah Jenkins"),
        data.get("patient_id", "pat001"),
        data.get("patient_name", "Patient"),
        data.get("procedure_name", "Surgical Procedure"),
        data.get("ot_room", "OT #1"),
        data.get("scheduled_time", "Today 03:00 PM"),
        data.get("urgency", "ROUTINE")
    ))
    conn.commit()
    conn.close()
    return {"id": req_id, "message": "OT Booking Request submitted to Admin!"}

def process_ot_request(request_id: str, decision: str, admin_notes: Optional[str] = None) -> Dict[str, Any]:
    """Admin approves or rejects an OT booking request"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ot_requests WHERE id = ?", (request_id,))
    req = cursor.fetchone()
    if not req:
        conn.close()
        return {"error": "OT Request not found"}

    req_dict = dict(req)
    new_status = "APPROVED" if decision.upper() == "APPROVED" else "REJECTED"

    cursor.execute("UPDATE ot_requests SET status = ? WHERE id = ?", (new_status, request_id))

    if new_status == "APPROVED":
        # Book surgery in surgeries table
        s_id = f"SURG{int(datetime.now().timestamp())}"
        cursor.execute("""
            INSERT INTO surgeries (id, doctor_id, doctor_name, patient_id, patient_name, procedure_name, operating_theater, scheduled_time, duration_mins, readiness_score, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 120, 88, 'SCHEDULED')
        """, (
            s_id, req_dict['doctor_id'], req_dict['doctor_name'], req_dict['patient_id'],
            req_dict['patient_name'], req_dict['procedure_name'], req_dict['ot_room'],
            req_dict['scheduled_time']
        ))

        # Decrement available OTs in hospital capacity
        cursor.execute("""
            UPDATE hospital_capacity
            SET in_use_ots = in_use_ots + 1, available_ots = MAX(0, available_ots - 1),
                occupied_beds = occupied_beds + 1, available_beds = MAX(0, available_beds - 1)
            WHERE id = 1
        """)

        # Add doctor notification
        notif_id = f"NOTIF{int(datetime.now().timestamp())}"
        cursor.execute("""
            INSERT INTO doctor_notifications (id, doctor_id, title, message, type, read_status)
            VALUES (?, ?, 'OT Booking Approved', ?, 'SUCCESS', 0)
        """, (
            notif_id, req_dict['doctor_id'],
            f"Admin APPROVED your OT Request for {req_dict['procedure_name']} in {req_dict['ot_room']} at {req_dict['scheduled_time']}."
        ))
    else:
        # Add doctor rejection notification
        notif_id = f"NOTIF{int(datetime.now().timestamp())}"
        cursor.execute("""
            INSERT INTO doctor_notifications (id, doctor_id, title, message, type, read_status)
            VALUES (?, ?, 'OT Booking Declined', ?, 'WARNING', 0)
        """, (
            notif_id, req_dict['doctor_id'],
            f"Admin declined your OT Request for {req_dict['procedure_name']} ({admin_notes or 'Resource constraint'})."
        ))

    conn.commit()
    conn.close()
    return {"request_id": request_id, "status": new_status, "message": f"OT Request {new_status}"}

def create_operation_by_admin(op_data: Dict[str, Any]) -> Dict[str, Any]:
    """Admin directly creates an operation, assigns a doctor, and reserves OT"""
    conn = get_connection()
    cursor = conn.cursor()
    s_id = f"SURG{int(datetime.now().timestamp())}"
    
    cursor.execute("""
        INSERT INTO surgeries (id, doctor_id, doctor_name, patient_id, patient_name, procedure_name, operating_theater, scheduled_time, duration_mins, readiness_score, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 90, 'SCHEDULED')
    """, (
        s_id,
        op_data['doctor_id'],
        op_data['doctor_name'],
        op_data.get('patient_id', 'pat999'),
        op_data['patient_name'],
        op_data['procedure_name'],
        op_data.get('operating_theater', 'OT #1'),
        op_data['scheduled_time'],
        op_data.get('duration_mins', 120)
    ))

    # Update doctor status to IN_SURGERY or update capacity
    cursor.execute("""
        UPDATE hospital_capacity
        SET in_use_ots = in_use_ots + 1, available_ots = MAX(0, available_ots - 1)
        WHERE id = 1
    """)

    # Send notification to assigned doctor
    notif_id = f"NOTIF{int(datetime.now().timestamp())}"
    cursor.execute("""
        INSERT INTO doctor_notifications (id, doctor_id, title, message, type, read_status)
        VALUES (?, ?, 'New Surgery Assigned by Admin', ?, 'URGENT', 0)
    """, (
        notif_id,
        op_data['doctor_id'],
        f"Admin assigned you for {op_data['procedure_name']} (Patient: {op_data['patient_name']}) in {op_data.get('operating_theater', 'OT #1')} at {op_data['scheduled_time']}."
    ))

    conn.commit()
    conn.close()
    return {"surgery_id": s_id, "message": "Operation scheduled and doctor notified successfully!"}

def get_doctor_notifications(doctor_id: str) -> List[Dict[str, Any]]:
    """Get notification stream for a specific doctor"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctor_notifications WHERE doctor_id = ? ORDER BY created_at DESC", (doctor_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def book_surgery(surgery_data: Dict[str, Any]) -> Dict[str, Any]:
    """Book or update a surgery/appointment for a doctor without duplicates"""
    conn = get_connection()
    cursor = conn.cursor()

    doctor_id = surgery_data.get('doctor_id', 'DOC001')
    patient_id = surgery_data.get('patient_id', 'pat001')
    scheduled_time = surgery_data.get('scheduled_time', 'Tomorrow 10:00 AM')
    patient_name = surgery_data.get('patient_name', 'Robert Johnson')
    procedure_name = surgery_data.get('procedure_name', 'Surgical Operation')
    ot_room = surgery_data.get('operating_theater', 'OT #1')
    duration_mins = surgery_data.get('duration_mins', 120)
    readiness_score = surgery_data.get('readiness_score', 80)
    doc_summary = surgery_data.get('document_summary')
    doc_filename = surgery_data.get('document_filename')
    patient_notes = surgery_data.get('patient_notes')
    is_first_time = surgery_data.get('is_first_time', 0)

    # Check if duplicate appointment exists for same doctor & scheduled_time (or same patient & scheduled_time)
    cursor.execute("""
        SELECT id FROM surgeries
        WHERE (doctor_id = ? AND scheduled_time = ?)
           OR (patient_id = ? AND scheduled_time = ?)
    """, (doctor_id, scheduled_time, patient_id, scheduled_time))
    existing = cursor.fetchone()

    if existing:
        s_id = dict(existing)['id'] if isinstance(existing, sqlite3.Row) else existing[0]
        cursor.execute("""
            UPDATE surgeries
            SET doctor_id = ?, doctor_name = ?, patient_id = ?, patient_name = ?,
                procedure_name = ?, operating_theater = ?, duration_mins = ?,
                readiness_score = ?, status = 'SCHEDULED',
                document_summary = COALESCE(?, document_summary),
                document_filename = COALESCE(?, document_filename),
                patient_notes = COALESCE(?, patient_notes),
                is_first_time = COALESCE(?, is_first_time)
            WHERE id = ?
        """, (
            doctor_id, surgery_data.get('doctor_name', 'Dr. Sarah Jenkins'),
            patient_id, patient_name, procedure_name, ot_room, duration_mins,
            readiness_score, doc_summary, doc_filename, patient_notes, is_first_time, s_id
        ))
        msg = f"Updated existing appointment {s_id} for {scheduled_time}"
    else:
        s_id = f"SURG{int(datetime.now().timestamp())}"
        cursor.execute("""
            INSERT INTO surgeries (
                id, doctor_id, doctor_name, patient_id, patient_name, procedure_name,
                operating_theater, scheduled_time, duration_mins, readiness_score, status,
                document_summary, document_filename, patient_notes, is_first_time
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', ?, ?, ?, ?)
        """, (
            s_id, doctor_id, surgery_data.get('doctor_name', 'Dr. Sarah Jenkins'),
            patient_id, patient_name, procedure_name, ot_room, scheduled_time,
            duration_mins, readiness_score, doc_summary, doc_filename, patient_notes, is_first_time
        ))
        msg = f"Surgery/Appointment {s_id} booked successfully!"

    conn.commit()
    conn.close()
    return {"id": s_id, "message": msg}

def get_scans(status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get lab diagnostic scans, optionally filtered by status"""
    conn = get_connection()
    cursor = conn.cursor()
    if status:
        cursor.execute("SELECT * FROM scans WHERE status = ? ORDER BY created_at DESC", (status,))
    else:
        cursor.execute("SELECT * FROM scans ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def create_scan_order(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    """Doctor creates a new diagnostic scan request (Deduplicated by patient_id & scan_name)"""
    conn = get_connection()
    cursor = conn.cursor()
    scan_id = f"SCAN{int(datetime.now().timestamp())}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    patient_id = scan_data.get('patient_id', 'pat001')
    scan_name = scan_data['scan_name']
    
    # Check if existing scan order for same patient and scan_name exists
    cursor.execute("SELECT id FROM scans WHERE patient_id = ? AND scan_name = ?", (patient_id, scan_name))
    existing = cursor.fetchone()
    if existing:
        cursor.execute("""
            UPDATE scans
            SET doctor_id = ?, doctor_name = ?, patient_name = ?, body_part = ?, priority = ?, updated_at = ?
            WHERE id = ?
        """, (
            scan_data.get('doctor_id', 'DOC001'),
            scan_data.get('doctor_name', 'Dr. Sarah Jenkins'),
            scan_data.get('patient_name', 'Robert Johnson'),
            scan_data.get('body_part', 'Chest / General'),
            scan_data.get('priority', 'ROUTINE'),
            now_str,
            existing["id"]
        ))
        scan_id = existing["id"]
    else:
        cursor.execute("""
            INSERT INTO scans (id, doctor_id, doctor_name, patient_id, patient_name, scan_name, body_part, priority, status, uploaded_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)
        """, (
            scan_id,
            scan_data.get('doctor_id', 'DOC001'),
            scan_data.get('doctor_name', 'Dr. Sarah Jenkins'),
            patient_id,
            scan_data.get('patient_name', 'Robert Johnson'),
            scan_name,
            scan_data.get('body_part', 'Chest / General'),
            scan_data.get('priority', 'ROUTINE'),
            scan_data.get('uploaded_by', 'Doctor'),
            now_str,
            now_str
        ))
    conn.commit()
    conn.close()
    return {"id": scan_id, "message": "Diagnostic scan order created & dispatched to Lab Portal!"}

def complete_scan_order(scan_id: str, result_summary: str, tech_id: str = "LAB_TECH_01") -> Dict[str, Any]:
    """Lab Tech completes scan result"""
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        UPDATE scans
        SET status = 'COMPLETED', result_summary = ?, updated_at = ?
        WHERE id = ?
    """, (result_summary, now_str, scan_id))
    conn.commit()
    conn.close()
    return {"id": scan_id, "message": "Scan result completed & synced to Doctor Scorecard!"}

def set_insurance_preauth(claim_id: str = "CLM001", status: str = "APPROVED") -> Dict[str, Any]:
    """Approve or update insurance pre-authorization for a claim"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO insurance_preauth (claim_id, status)
        VALUES (?, ?)
        ON CONFLICT(claim_id) DO UPDATE SET status = excluded.status, approved_at = CURRENT_TIMESTAMP
    """, (claim_id, status))
    
    # Also update decision in claims table
    cursor.execute("""
        UPDATE claims
        SET decision = 'APPROVED', status = 'APPROVED', reasoning = 'Insurance pre-authorization cleared via 4-agent voice compliance loop.'
        WHERE id = ?
    """, (claim_id,))
    
    conn.commit()
    conn.close()
    return {"claim_id": claim_id, "status": status, "message": f"Insurance Pre-Authorization {status} for Claim {claim_id}"}

def is_insurance_preauth_approved(claim_id: str = "CLM001") -> bool:
    """Check if insurance pre-authorization has been cleared for claim"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM insurance_preauth WHERE claim_id = ?", (claim_id,))
    row = cursor.fetchone()
    conn.close()
    if row and row["status"].upper() == "APPROVED":
        return True
    return False

# --- PATIENT DIRECTORY & NOTIFICATION FUNCTIONS ---

def get_all_patients() -> List[Dict[str, Any]]:
    """Fetch list of all real registered patients"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM patients ORDER BY rowid DESC")
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"get_all_patients error: {e}")
        return []
    finally:
        conn.close()

def add_patient(patient_data: Dict[str, Any]) -> Dict[str, Any]:
    """Add a new patient to SQLite database"""
    conn = get_connection()
    cursor = conn.cursor()
    
    patient_id = patient_data.get('id') or f"pat_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    first_name = patient_data.get('first_name', 'Unknown')
    last_name = patient_data.get('last_name', 'Patient')
    dob = patient_data.get('date_of_birth', '1985-01-01')
    gender = patient_data.get('gender', 'U')
    phone = patient_data.get('phone', '+1-555-0000')
    email = patient_data.get('email', f"{first_name.lower()}.{last_name.lower()}@email.com")
    address = patient_data.get('address', '123 Hospital St')
    allergies = patient_data.get('allergies', 'None documented')
    primary_diag = patient_data.get('primary_diagnosis', 'Routine Evaluation')
    vitals = patient_data.get('vitals_json') or '{"hr": 72, "bp": "120/80", "spo2": 98}'
    
    cursor.execute("""
        INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, phone, email, address, allergies, primary_diagnosis, vitals_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            first_name = excluded.first_name,
            last_name = excluded.last_name,
            phone = excluded.phone,
            email = excluded.email,
            primary_diagnosis = excluded.primary_diagnosis,
            vitals_json = excluded.vitals_json
    """, (patient_id, first_name, last_name, dob, gender, phone, email, address, allergies, primary_diag, vitals))
    
    conn.commit()
    conn.close()
    return {
        "id": patient_id,
        "patient_name": f"{first_name} {last_name}",
        "message": f"Patient {first_name} {last_name} registered successfully!"
    }

def create_patient_notification(notif_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a patient care hub notification"""
    conn = get_connection()
    cursor = conn.cursor()
    
    notif_id = notif_data.get('id') or f"notif_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    patient_id = notif_data.get('patient_id', 'pat001')
    title = notif_data.get('title', 'Hospital Update')
    message = notif_data.get('message', 'Please check your care plan.')
    notif_type = notif_data.get('type', 'GENERAL')
    action_required = notif_data.get('action_required', 'Visit OPD Clinic')
    
    cursor.execute("""
        INSERT INTO patient_notifications (id, patient_id, title, message, type, action_required)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (notif_id, patient_id, title, message, notif_type, action_required))
    
    conn.commit()
    conn.close()
    return {"id": notif_id, "patient_id": patient_id, "status": "created"}

def get_patient_notifications(patient_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get patient care notifications"""
    conn = get_connection()
    cursor = conn.cursor()
    if patient_id:
        cursor.execute("SELECT * FROM patient_notifications WHERE patient_id = ? ORDER BY created_at DESC", (patient_id,))
    else:
        cursor.execute("SELECT * FROM patient_notifications ORDER BY created_at DESC LIMIT 50")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_patient_profile(patient_id: str = "pat001") -> Dict[str, Any]:
    """Fetch complete patient profile including active policy, cash threshold, and visits."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return {
            "id": patient_id,
            "first_name": "Robert",
            "last_name": "Johnson",
            "date_of_birth": "1958-11-30",
            "gender": "M",
            "phone": "+1-555-0192",
            "email": "robert.j@email.com",
            "cash_threshold": 100000.0,
            "active_policy": "Star Health Comprehensive Gold PPO",
            "policy_limit": 500000.0,
            "deductible_used": 15000.0,
            "primary_diagnosis": "Coronary Artery Disease",
            "vitals_json": '{"hr": 72, "bp": "120/80", "spo2": 98}'
        }
        
    p_dict = dict(row)
    p_dict["cash_threshold"] = float(p_dict.get("cash_threshold") or 100000.0)
    p_dict["active_policy"] = "Star Health Comprehensive Gold PPO"
    p_dict["policy_limit"] = 500000.0
    p_dict["deductible_used"] = 15000.0
    return p_dict


def update_patient_cash_threshold(patient_id: str, new_threshold: float) -> Dict[str, Any]:
    """Update patient emergency cash threshold"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE patients ADD COLUMN cash_threshold REAL DEFAULT 100000.0")
        conn.commit()
    except Exception:
        pass # Column already exists
        
    cursor.execute("UPDATE patients SET cash_threshold = ? WHERE id = ?", (new_threshold, patient_id))
    conn.commit()
    conn.close()
    return {"patient_id": patient_id, "cash_threshold": new_threshold, "status": "updated"}




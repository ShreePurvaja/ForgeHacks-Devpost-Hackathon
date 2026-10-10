import sqlite3
import os

db_path = 'data/claims.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Deduplicate patient_notifications table (keep highest rowid per patient_id and title)
    try:
        cursor.execute("""
            DELETE FROM patient_notifications
            WHERE rowid NOT IN (
                SELECT MAX(rowid)
                FROM patient_notifications
                GROUP BY patient_id, title
            );
        """)
        deleted_notifs = cursor.rowcount
        print(f"Cleaned {deleted_notifs} duplicate patient notifications.")
    except Exception as e:
        print("Notifs clean error:", e)

    # 2. Deduplicate scans table (keep highest rowid per patient_id and scan_name)
    try:
        cursor.execute("""
            DELETE FROM scans
            WHERE rowid NOT IN (
                SELECT MAX(rowid)
                FROM scans
                GROUP BY patient_id, scan_name
            );
        """)
        deleted_scans = cursor.rowcount
        print(f"Cleaned {deleted_scans} duplicate scans.")
    except Exception as e:
        print("Scans clean error:", e)

    # 3. Deduplicate surgeries table (keep highest rowid per doctor_id, scheduled_time, and patient_name)
    try:
        cursor.execute("""
            DELETE FROM surgeries
            WHERE rowid NOT IN (
                SELECT MAX(rowid)
                FROM surgeries
                GROUP BY doctor_id, scheduled_time, patient_name
            );
        """)
        deleted_surg = cursor.rowcount
        print(f"Cleaned {deleted_surg} duplicate surgeries.")
    except Exception as e:
        print("Surgeries clean error:", e)

    conn.commit()
    conn.close()
    print("Database deduplication successfully executed!")
else:
    print("Database claims.db not found.")

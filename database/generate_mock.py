#!/usr/bin/env python3
"""
Generate mock data for Hospital Coordination System.
Run this AFTER starting the PostgreSQL container.
Usage: python database/generate_mock.py
"""

import psycopg2
from datetime import datetime, timedelta
import random

DB_CONFIG = {
    "dbname": "hospital_ai",
    "user": "admin",
    "password": "123456",
    "host": "localhost",
    "port": 5432,
}

DEPARTMENTS = [
    ("Khoa Khám bệnh", 1, "Tầng 1 - Khu A"),
    ("Khoa Nội", 2, "Tầng 2 - Khu A"),
    ("Khoa Ngoại", 2, "Tầng 2 - Khu B"),
    ("Khoa Nhi", 3, "Tầng 3 - Khu A"),
    ("Khoa Sản", 3, "Tầng 3 - Khu B"),
    ("Khoa Tim mạch", 4, "Tầng 4 - Khu A"),
    ("Khoa Xét nghiệm", 1, "Tầng 1 - Khu B"),
    ("Khoa Chẩn đoán hình ảnh", 1, "Tầng 1 - Khu C"),
    ("Khoa Cấp cứu", 1, "Tầng 1 - Khu D"),
    ("Khoa Dược", 1, "Tầng 1 - Khu E"),
]

DOCTORS = [
    (1, "Nguyễn Văn An", "Nội tổng quát", 15, "Available", 4.5),
    (1, "Trần Thị Bình", "Nội tổng quát", 20, "Available", 4.2),
    (2, "Lê Văn Cường", "Tim mạch", 30, "Available", 4.8),
    (2, "Phạm Thị Dung", "Hô hấp", 25, "Busy", 4.0),
    (3, "Hoàng Văn Em", "Chấn thương chỉnh hình", 20, "Available", 4.6),
    (3, "Ngô Thị Phương", "Tiêu hóa", 15, "Leave", 4.3),
    (4, "Đặng Văn Giang", "Nhi khoa", 20, "Available", 4.7),
    (5, "Vũ Thị Hạnh", "Sản khoa", 30, "Available", 4.9),
    (6, "Bùi Văn Inh", "Tim mạch can thiệp", 45, "Busy", 4.1),
    (6, "Lý Thị Kiều", "Nội tim mạch", 30, "Available", 4.4),
    (7, "Mai Văn Long", "Huyết học", 15, "Available", 3.9),
    (8, "Hồ Thị Minh", "Chẩn đoán hình ảnh", 20, "Available", 4.5),
    (9, "Đỗ Văn Ngọc", "Cấp cứu", 10, "Available", 4.8),
    (10, "Dương Thị Oanh", "Dược lâm sàng", 5, "Available", 4.2),
]

def connect():
    return psycopg2.connect(**DB_CONFIG)


def create_tables(conn):
    with open("database/init_schema.sql", "r", encoding="utf-8") as f:
        sql = f.read()
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    print("✓ Tables created successfully")


def seed_departments(conn):
    sql = """
        INSERT INTO Department (department_name, floor, location)
        VALUES (%s, %s, %s)
        ON CONFLICT DO NOTHING
    """
    with conn.cursor() as cur:
        for name, floor, loc in DEPARTMENTS:
            cur.execute(sql, (name, floor, loc))
    conn.commit()
    print(f"✓ Inserted {len(DEPARTMENTS)} departments")


def seed_doctors(conn):
    sql = """
        INSERT INTO Doctor (department_id, full_name, specialty, consultation_duration, status, popularity_score)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT DO NOTHING
    """
    with conn.cursor() as cur:
        for d in DOCTORS:
            cur.execute(sql, d)
    conn.commit()
    print(f"✓ Inserted {len(DOCTORS)} doctors")


def seed_patients(conn, count=50):
    first_names_male = ["Nguyễn Văn", "Trần Văn", "Lê Văn", "Phạm Văn", "Hoàng Văn",
                        "Đặng Văn", "Vũ Văn", "Bùi Văn", "Đỗ Văn", "Ngô Văn",
                        "Mai Văn", "Hồ Văn", "Dương Văn", "Lý Văn", "Hà Văn"]
    first_names_female = ["Nguyễn Thị", "Trần Thị", "Lê Thị", "Phạm Thị", "Hoàng Thị",
                          "Đặng Thị", "Vũ Thị", "Bùi Thị", "Đỗ Thị", "Ngô Thị",
                          "Mai Thị", "Hồ Thị", "Dương Thị", "Lý Thị", "Hà Thị"]
    last_names = ["An", "Bình", "Cúc", "Dung", "Em", "Phúc", "Hoa", "Giàu",
                  "Hương", "Ích", "Kim", "Lợi", "Mai", "Nam", "Oanh", "Phú",
                  "Quý", "Sang", "Tâm", "Việt", "Xuân", "Ý", "Đức", "Hạnh"]
    symptoms = [
        "Đau đầu, chóng mặt", "Đau ngực trái", "Khó thở, mệt mỏi",
        "Sốt cao, ho", "Đau bụng", "Đau khớp gối", "Đau lưng",
        "Mất ngủ", "Chán ăn", "Đau họng", "Đau mắt", "Nổi mề đay",
        "Tê bì chân tay", "Khám sức khỏe định kỳ", "Đau thượng vị"
    ]
    diseases = [
        None, None, "Tăng huyết áp", "Đái tháo đường type 2", None,
        "Viêm khớp", "Viêm dạ dày", "Suy tim", None, "Hen suyễn",
        "Rối loạn mỡ máu", None, "Thoái hóa cột sống", "Viêm xoang", None
    ]
    allergies = [
        None, None, "Penicillin", None, "Hải sản", "Phấn hoa",
        None, "Ibuprofen", "Sulfa", None, None, "Aspirin", None, None, None
    ]

    sql_patient = """
        INSERT INTO Patient (full_name, gender, date_of_birth, phone, insurance_type, patient_category,
                             first_visit, preferred_doctor_id, doctor_preference_level, chronic_disease,
                             allergy, symptom, priority, arrival_time)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    base_time = datetime(2026, 7, 17, 7, 0, 0)

    with conn.cursor() as cur:
        for i in range(count):
            is_male = random.random() < 0.5
            if is_male:
                first = random.choice(first_names_male)
                gender = "Male"
            else:
                first = random.choice(first_names_female)
                gender = "Female"
            last = random.choice(last_names)
            name = f"{first} {last}"

            year = random.randint(1950, 2020)
            month = random.randint(1, 12)
            day = random.randint(1, 28)
            dob = f"{year:04d}-{month:02d}-{day:02d}"

            phone = f"09{random.randint(1,99):02d}{random.randint(100000,999999):06d}"

            insurance = "Insurance" if random.random() < 0.6 else "Service"

            age = 2026 - year
            if age >= 65:
                category = "Senior"
            elif age <= 12:
                category = "Child"
            elif random.random() < 0.05:
                category = "VIP"
            else:
                category = "Adult"

            first_visit = random.random() < 0.2

            doc_id = random.randint(1, 14) if random.random() < 0.5 else None
            pref_level = random.randint(1, 5) if doc_id else None

            disease = random.choice(diseases)
            allergy_val = random.choice(allergies)
            symptom = random.choice(symptoms)

            priority_roll = random.random()
            if priority_roll < 0.1:
                priority = "Emergency"
            elif priority_roll < 0.3:
                priority = "Urgent"
            else:
                priority = "Routine"

            minutes_offset = random.randint(0, 240)
            arrival = base_time + timedelta(minutes=minutes_offset)

            cur.execute(sql_patient, (
                name, gender, dob, phone, insurance, category,
                first_visit, doc_id, pref_level, disease,
                allergy_val, symptom, priority, arrival
            ))

    conn.commit()
    print(f"✓ Inserted {count} patients")


def seed_appointments(conn, count=30):
    sql = """
        INSERT INTO Appointment (patient_id, doctor_id, appointment_time, visit_type, estimated_wait, status)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    statuses = ["Scheduled", "Scheduled", "Waiting", "In Progress", "Completed", "Completed"]
    base_time = datetime(2026, 7, 17, 7, 0, 0)

    with conn.cursor() as cur:
        # first get existing patient and doctor ids
        cur.execute("SELECT patient_id FROM Patient ORDER BY patient_id")
        patients = [r[0] for r in cur.fetchall()]
        cur.execute("SELECT doctor_id FROM Doctor ORDER BY doctor_id")
        doctors = [r[0] for r in cur.fetchall()]

        for i in range(min(count, len(patients))):
            pid = patients[i]
            did = random.choice(doctors)
            minutes = random.randint(0, 330)
            apt_time = base_time + timedelta(minutes=minutes)
            vtype = "Insurance" if random.random() < 0.6 else "Service"
            wait = random.randint(0, 30)
            status = random.choice(statuses)

            cur.execute(sql, (pid, did, apt_time, vtype, wait, status))
    conn.commit()
    print(f"✓ Inserted {count} appointments")


def main():
    print("=" * 50)
    print("GENERATING MOCK DATA FOR HOSPITAL SYSTEM")
    print("=" * 50)

    try:
        conn = connect()
        print("✓ Connected to PostgreSQL")
    except Exception as e:
        print(f"✗ Failed to connect: {e}")
        print()
        print("Make sure Docker container is running:")
        print("  docker compose up -d")
        return

    try:
        seed_departments(conn)
        seed_doctors(conn)
        seed_patients(conn, 50)
        seed_appointments(conn, 30)
        print()
        print("=" * 50)
        print("DATA GENERATION COMPLETE")
        print("=" * 50)
        print()
        print("To verify data, run:")
        print('  docker exec hospital-db psql -U admin -d hospital_ai -c "SELECT COUNT(*) FROM Patient;"')
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()


if __name__ == "__main__":
    main()
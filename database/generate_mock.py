#!/usr/bin/env python3
"""
Generate mock data for Hospital Coordination System.
Run this AFTER starting the PostgreSQL container.

Usage:
  python database/generate_mock.py              # Full reset: drops & recreates tables, seeds everything
  python database/generate_mock.py --append      # Append mode: only adds more patients & appointments
"""

import psycopg2
from datetime import datetime, timedelta
import random
import sys
import argparse

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
    # Khoa Khám bệnh (dept 1) - 4 doctors
    (1, "Nguyễn Văn An", "Nội tổng quát", 15, "Available", 4.5),
    (1, "Trần Thị Bình", "Nội tổng quát", 20, "Available", 4.2),
    (1, "Lê Thị Cúc", "Nội tổng quát", 15, "Available", 4.0),
    (1, "Phạm Văn Đức", "Nội tổng quát", 20, "Busy", 3.8),
    # Khoa Nội (dept 2) - 4 doctors
    (2, "Lê Văn Cường", "Tim mạch", 30, "Available", 4.8),
    (2, "Phạm Thị Dung", "Hô hấp", 25, "Busy", 4.0),
    (2, "Hoàng Văn Em", "Tim mạch can thiệp", 35, "Available", 4.3),
    (2, "Ngô Thị Phương", "Tiêu hóa", 20, "Available", 4.1),
    # Khoa Ngoại (dept 3) - 4 doctors
    (3, "Đặng Văn Giang", "Chấn thương chỉnh hình", 20, "Available", 4.6),
    (3, "Vũ Thị Hạnh", "Ngoại tổng quát", 25, "Available", 4.4),
    (3, "Bùi Văn Inh", "Ngoại thần kinh", 30, "Busy", 4.2),
    (3, "Lý Thị Kiều Trang", "Ngoại tiết niệu", 25, "Available", 4.0),
    # Khoa Nhi (dept 4) - 4 doctors
    (4, "Mai Văn Long", "Nhi khoa", 20, "Available", 4.7),
    (4, "Hồ Thị Minh", "Nhi sơ sinh", 20, "Available", 4.5),
    (4, "Đỗ Văn Ngọc Sơn", "Nhi hô hấp", 15, "Busy", 4.3),
    (4, "Dương Thị Oanh Việt", "Nhi dinh dưỡng", 15, "Available", 4.1),
    # Khoa Sản (dept 5) - 4 doctors
    (5, "Ngô Thị Phượng", "Sản khoa", 30, "Available", 4.9),
    (5, "Trần Văn Quân", "Sản khoa", 25, "Available", 4.6),
    (5, "Lê Thị Sáu", "Sản phụ", 30, "Busy", 4.4),
    (5, "Phạm Văn Tâm", "Hiếm muộn", 25, "Available", 4.2),
    # Khoa Tim mạch (dept 6) - 4 doctors
    (6, "Hoàng Văn Út", "Tim mạch can thiệp", 45, "Busy", 4.1),
    (6, "Lý Thị Kiều", "Nội tim mạch", 30, "Available", 4.4),
    (6, "Mai Văn Việt", "Tim mạch tổng quát", 25, "Available", 4.3),
    (6, "Hồ Thị Xuân", "Điện sinh lý tim", 30, "Leave", 4.0),
    # Khoa Xét nghiệm (dept 7) - 4 doctors
    (7, "Mai Văn Lộc", "Huyết học", 15, "Available", 3.9),
    (7, "Hồ Thị Yến", "Vi sinh", 10, "Available", 4.0),
    (7, "Đỗ Văn Anh", "Sinh hóa", 10, "Available", 3.8),
    (7, "Dương Thị Bích", "Miễn dịch", 15, "Available", 4.2),
    # Khoa Chẩn đoán hình ảnh (dept 8) - 4 doctors
    (8, "Hồ Thị Minh Tuyết", "Chẩn đoán hình ảnh", 20, "Available", 4.5),
    (8, "Đỗ Văn Bảo", "X-Quang", 15, "Available", 4.3),
    (8, "Dương Thị Cẩm", "Siêu âm", 20, "Busy", 4.6),
    (8, "Nguyễn Văn Dũng", "CT-MRI", 25, "Available", 4.4),
    # Khoa Cấp cứu (dept 9) - 4 doctors
    (9, "Đỗ Văn Ngọc", "Cấp cứu", 10, "Available", 4.8),
    (9, "Trần Thị Hoa", "Hồi sức cấp cứu", 15, "Available", 4.5),
    (9, "Lê Văn Khánh", "Cấp cứu ngoại", 10, "Busy", 4.3),
    (9, "Phạm Thị Lan", "Cấp cứu nhi", 15, "Available", 4.6),
    # Khoa Dược (dept 10) - 4 doctors
    (10, "Dương Thị Oanh", "Dược lâm sàng", 5, "Available", 4.2),
    (10, "Hoàng Văn Phú", "Dược bệnh viện", 5, "Available", 4.0),
    (10, "Ngô Thị Quỳnh", "Dược lý", 5, "Available", 3.9),
    (10, "Đặng Văn Sơn", "Dược lâm sàng", 5, "Busy", 4.1),
]

# Step types mapped to typical department_id
STEP_TEMPLATES = [
    ("Registration", 1, 5),
    ("Clinical Examination", 1, 15),
    ("Blood Test", 7, 10),
    ("Urine Test", 7, 8),
    ("Ultrasound", 8, 15),
    ("ECG", 6, 10),
    ("X-Ray", 8, 10),
    ("CT Scan", 8, 20),
    ("MRI", 8, 25),
    ("Endoscopy", 3, 20),
    ("Return Doctor", 1, 10),
    ("Payment", 1, 5),
    ("Pharmacy", 10, 5),
    ("Discharge", 1, 3),
]

EQUIPMENT_NAMES = [
    (7, "Máy xét nghiệm huyết học"),
    (7, "Máy xét nghiệm sinh hóa"),
    (7, "Máy phân tích nước tiểu"),
    (7, "Máy đông máu"),
    (7, "Máy phân tích khí máu"),
    (7, "Máy ly tâm"),
    (8, "Máy X-Quang kỹ thuật số"),
    (8, "Máy CT Scanner"),
    (8, "Máy MRI"),
    (8, "Máy siêu âm"),
    (8, "Máy chụp nhũ ảnh"),
    (8, "Máy đo loãng xương"),
    (6, "Máy ECG"),
    (6, "Máy siêu âm tim"),
    (6, "Máy Holter ECG"),
    (9, "Máy thở"),
    (9, "Máy sốc tim"),
    (9, "Máy monitor"),
    (9, "Máy hút đờm"),
    (9, "Bơm tiêm điện"),
    (2, "Máy nội soi phế quản"),
    (3, "Máy nội soi tiêu hóa"),
    (3, "Máy nội soi đại tràng"),
    (4, "Máy siêu âm nhi"),
    (4, "Máy đo thính lực"),
    (4, "Máy đo loãng xương nhi"),
    (5, "Máy siêu âm sản"),
    (5, "Máy monitoring sản khoa"),
    (5, "Máy Doppler tim thai"),
    (10, "Máy đóng gói thuốc"),
]

EVENT_MESSAGES = {
    "EquipmentBroken": [
        "Máy {equipment} gặp sự cố kỹ thuật, cần bảo trì gấp",
        "Máy {equipment} báo lỗi hệ thống, đang kiểm tra",
        "Máy {equipment} không hoạt động, cần thay linh kiện",
    ],
    "DoctorLeave": [
        "Bác sĩ {doctor} xin nghỉ phép đột xuất",
        "Bác sĩ {doctor} bận họp đột xuất",
    ],
    "EmergencyPatient": [
        "Bệnh nhân {patient} nhập viện cấp cứu với triệu chứng {symptom}",
        "Bệnh nhân {patient} cần cấp cứu khẩn cấp",
    ],
    "QueueOverloaded": [
        "Khoa {department} đang quá tải với {count} bệnh nhân chờ",
        "Hàng đợi tại {department} đang dài, cần điều phối thêm nhân lực",
    ],
    "WorkflowUpdated": [
        "Bệnh nhân {patient} đã hoàn thành {step}, chuyển sang bước tiếp theo",
        "Quy trình của bệnh nhân {patient} đã được cập nhật",
    ],
}


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
        ON CONFLICT (department_name) DO NOTHING
    """
    with conn.cursor() as cur:
        data = [(name, floor, loc) for name, floor, loc in DEPARTMENTS]
        cur.executemany(sql, data)
    conn.commit()
    print(f"✓ Inserted {len(DEPARTMENTS)} departments")


def seed_doctors(conn):
    sql = """
        INSERT INTO Doctor (department_id, full_name, specialty, consultation_duration, status, popularity_score)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (full_name) DO NOTHING
    """
    with conn.cursor() as cur:
        cur.executemany(sql, DOCTORS)
    conn.commit()
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM Doctor")
        count = cur.fetchone()[0]
    print(f"✓ Inserted {count} doctors")


def seed_patients(conn, count=300):
    first_names_male = ["Nguyễn Văn", "Trần Văn", "Lê Văn", "Phạm Văn", "Hoàng Văn",
                        "Đặng Văn", "Vũ Văn", "Bùi Văn", "Đỗ Văn", "Ngô Văn",
                        "Mai Văn", "Hồ Văn", "Dương Văn", "Lý Văn", "Hà Văn",
                        "Tô Văn", "Thái Văn", "Quách Văn", "Lâm Văn", "Hứa Văn"]
    first_names_female = ["Nguyễn Thị", "Trần Thị", "Lê Thị", "Phạm Thị", "Hoàng Thị",
                          "Đặng Thị", "Vũ Thị", "Bùi Thị", "Đỗ Thị", "Ngô Thị",
                          "Mai Thị", "Hồ Thị", "Dương Thị", "Lý Thị", "Hà Thị",
                          "Tô Thị", "Thái Thị", "Quách Thị", "Lâm Thị", "Hứa Thị"]
    last_names = ["An", "Bình", "Cúc", "Dung", "Em", "Phúc", "Hoa", "Giàu",
                  "Hương", "Ích", "Kim", "Lợi", "Mai", "Nam", "Oanh", "Phú",
                  "Quý", "Sang", "Tâm", "Việt", "Xuân", "Ý", "Đức", "Hạnh",
                  "Phương", "Thảo", "Lan", "Hùng", "Dũng", "Sơn", "Linh", "Vinh"]
    symptoms = [
        "Đau đầu, chóng mặt", "Đau ngực trái", "Khó thở, mệt mỏi",
        "Sốt cao, ho", "Đau bụng", "Đau khớp gối", "Đau lưng",
        "Mất ngủ", "Chán ăn", "Đau họng", "Đau mắt", "Nổi mề đay",
        "Tê bì chân tay", "Khám sức khỏe định kỳ", "Đau thượng vị",
        "Đau tai, ù tai", "Táo bón kéo dài", "Tiểu buốt, tiểu rắt",
        "Phát ban da", "Khám thai định kỳ", "Mệt mỏi kéo dài",
        "Đau vai gáy", "Sụt cân không rõ nguyên nhân", "Rối loạn tiêu hóa",
        "Hoa mắt, ù tai", "Đau vùng hạ vị", "Ngứa da toàn thân",
        "Sưng đau khớp cổ chân", "Ho ra máu", "Khàn tiếng kéo dài"
    ]
    diseases = [
        None, None, "Tăng huyết áp", "Đái tháo đường type 2", None,
        "Viêm khớp", "Viêm dạ dày", "Suy tim", None, "Hen suyễn",
        "Rối loạn mỡ máu", None, "Thoái hóa cột sống", "Viêm xoang", None,
        "Viêm phổi", "Viêm phế quản mạn", "Suy thận", "Viêm gan B", None
    ]
    allergies = [
        None, None, "Penicillin", None, "Hải sản", "Phấn hoa",
        None, "Ibuprofen", "Sulfa", None, None, "Aspirin", None, None, None,
        "Paracetamol", None, "Dị ứng thời tiết", None, "Bụi nhà"
    ]

    sql_patient = """
        INSERT INTO Patient (full_name, gender, date_of_birth, phone, insurance_type, patient_category,
                             first_visit, preferred_doctor_id, doctor_preference_level, chronic_disease,
                             allergy, symptom, priority, arrival_time)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    with conn.cursor() as cur:
        cur.execute("SELECT doctor_id FROM Doctor ORDER BY doctor_id")
        doctor_ids = [r[0] for r in cur.fetchall()]

    base_time = datetime(2026, 7, 17, 7, 0, 0)
    batch_size = 50
    rows = []

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

        doc_id = random.choice(doctor_ids) if random.random() < 0.5 else None
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

        rows.append((
            name, gender, dob, phone, insurance, category,
            first_visit, doc_id, pref_level, disease,
            allergy_val, symptom, priority, arrival
        ))

        if len(rows) >= batch_size:
            with conn.cursor() as cur:
                cur.executemany(sql_patient, rows)
            conn.commit()
            rows = []

    if rows:
        with conn.cursor() as cur:
            cur.executemany(sql_patient, rows)
        conn.commit()

    print(f"✓ Inserted {count} patients")


def seed_appointments(conn, patient_count=None):
    sql = """
        INSERT INTO Appointment (patient_id, doctor_id, appointment_time, visit_type, estimated_wait, status)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    statuses = ["Scheduled", "Scheduled", "Waiting", "In Progress", "Completed", "Completed"]
    base_time = datetime(2026, 7, 17, 7, 0, 0)

    with conn.cursor() as cur:
        cur.execute("SELECT patient_id FROM Patient ORDER BY patient_id")
        patients = [r[0] for r in cur.fetchall()]
        cur.execute("SELECT doctor_id FROM Doctor ORDER BY doctor_id")
        doctors = [r[0] for r in cur.fetchall()]

    if patient_count is None:
        patient_count = len(patients)

    batch_size = 50
    rows = []

    for i in range(min(patient_count, len(patients))):
        pid = patients[i]
        did = random.choice(doctors)
        minutes = random.randint(0, 330)
        apt_time = base_time + timedelta(minutes=minutes)
        vtype = "Insurance" if random.random() < 0.6 else "Service"
        wait = random.randint(0, 30)
        status = random.choice(statuses)

        rows.append((pid, did, apt_time, vtype, wait, status))

        if len(rows) >= batch_size:
            with conn.cursor() as cur:
                cur.executemany(sql, rows)
            conn.commit()
            rows = []

    if rows:
        with conn.cursor() as cur:
            cur.executemany(sql, rows)
        conn.commit()

    print(f"✓ Inserted {patient_count} appointments")


def seed_workflows(conn):
    sql = """
        INSERT INTO PatientWorkflow (appointment_id, planned_order, actual_order, step_type, department_id, room_name, estimated_duration, estimated_wait, status, completed_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    with conn.cursor() as cur:
        cur.execute("""
            SELECT a.appointment_id, a.appointment_time, a.status
            FROM Appointment a
            ORDER BY a.appointment_id
        """)
        appointments = cur.fetchall()

    base_time = datetime(2026, 7, 17, 7, 0, 0)
    room_names = {
        1: ["Phòng khám số 1", "Phòng khám số 2", "Phòng khám số 3", "Phòng khám số 4", "Quầy số 1", "Quầy số 2", "Quầy thu ngân số 1", "Quầy thu ngân số 2"],
        2: ["Phòng nội A1", "Phòng nội A2", "Phòng nội B1"],
        3: ["Phòng ngoại A", "Phòng ngoại B", "Phòng thủ thuật"],
        4: ["Phòng khám nhi số 1", "Phòng khám nhi số 2"],
        5: ["Phòng khám sản A", "Phòng khám sản B", "Phòng siêu âm sản"],
        6: ["Phòng khám tim mạch số 1", "Phòng khám tim mạch số 2", "Phòng ECG"],
        7: ["Phòng xét nghiệm số 1", "Phòng xét nghiệm số 2"],
        8: ["Phòng X-Quang", "Phòng CT", "Phòng MRI", "Phòng siêu âm"],
        9: ["Phòng cấp cứu số 1", "Phòng cấp cứu số 2", "Quầy cấp cứu"],
        10: ["Quầy thuốc số 1", "Quầy thuốc số 2"],
    }

    batch_size = 50
    rows = []

    for apt_id, apt_time, status in appointments:
        num_steps = random.randint(3, 8)
        step_types = [STEP_TEMPLATES[0]]
        step_types.append(STEP_TEMPLATES[1])
        middle_steps = random.sample(STEP_TEMPLATES[2:-1], min(num_steps - 2, len(STEP_TEMPLATES[2:-1])))
        step_types.extend(middle_steps)
        if random.random() < 0.4:
            step_types.append(("Return Doctor", 1, 10))
        ending = random.sample([("Payment", 1, 5), ("Pharmacy", 10, 5), ("Discharge", 1, 3)],
                                random.randint(1, 3))
        step_types.extend(ending)

        for order, (step_name, dept_id, est_dur) in enumerate(step_types, 1):
            room_options = room_names.get(dept_id, ["Phòng khám"])
            room = random.choice(room_options)
            est_wait = random.randint(0, 20)

            if status == "Completed":
                step_status = "Completed"
                step_completed = apt_time + timedelta(
                    minutes=random.randint(5, 60) + order * est_dur
                )
            elif status == "In Progress":
                if order <= 2:
                    step_status = "Completed"
                    step_completed = apt_time + timedelta(minutes=order * est_dur + random.randint(0, 10))
                elif order == 3:
                    step_status = "In Progress"
                    step_completed = None
                else:
                    step_status = "Pending"
                    step_completed = None
            elif status == "Waiting":
                if order == 1:
                    step_status = "Completed"
                    step_completed = apt_time + timedelta(minutes=5)
                else:
                    step_status = "Pending"
                    step_completed = None
            else:
                step_status = "Pending"
                step_completed = None

            if random.random() < 0.05 and order > 2:
                step_status = "Skipped"
                step_completed = None

            actual_order = order if step_status != "Pending" else None

            rows.append((
                apt_id, order, actual_order, step_name, dept_id, room,
                est_dur, est_wait, step_status, step_completed
            ))

            if len(rows) >= batch_size:
                with conn.cursor() as cur:
                    cur.executemany(sql, rows)
                conn.commit()
                rows = []

    if rows:
        with conn.cursor() as cur:
            cur.executemany(sql, rows)
        conn.commit()

    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM PatientWorkflow")
        total = cur.fetchone()[0]
    print(f"✓ Inserted {total} workflow steps")


def seed_equipment(conn):
    sql = """
        INSERT INTO Equipment (department_id, equipment_name, status, utilization)
        VALUES (%s, %s, %s, %s)
    """
    statuses = ["Working", "Working", "Working", "Maintenance", "Broken"]

    with conn.cursor() as cur:
        data = [
            (dept_id, name, random.choice(statuses), round(random.uniform(0, 100), 2))
            for dept_id, name in EQUIPMENT_NAMES
        ]
        cur.executemany(sql, data)
    conn.commit()
    print(f"✓ Inserted {len(EQUIPMENT_NAMES)} equipment")


def seed_queuestatus(conn):
    sql = """
        INSERT INTO QueueStatus (department_id, doctor_id, waiting_patient, average_wait, updated_at)
        VALUES (%s, %s, %s, %s, %s)
    """
    base_time = datetime(2026, 7, 17, 11, 0, 0)

    with conn.cursor() as cur:
        cur.execute("SELECT doctor_id, department_id FROM Doctor ORDER BY doctor_id")
        doctors = cur.fetchall()

        data = [
            (dept_id, doc_id,
             random.randint(0, 8),
             random.randint(0, 40),
             base_time)
            for doc_id, dept_id in doctors
        ]
        cur.executemany(sql, data)
    conn.commit()
    print(f"✓ Inserted {len(doctors)} queue statuses")


def seed_events(conn):
    sql = """
        INSERT INTO Event (patient_id, department_id, equipment_id, event_type, message, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
    """

    with conn.cursor() as cur:
        cur.execute("SELECT patient_id, full_name, symptom FROM Patient ORDER BY patient_id")
        patients = cur.fetchall()
        cur.execute("SELECT equipment_id, equipment_name FROM Equipment ORDER BY equipment_id")
        equipments = cur.fetchall()
        cur.execute("SELECT doctor_id, full_name FROM Doctor ORDER BY doctor_id")
        doctors = cur.fetchall()
        cur.execute("SELECT department_id, department_name FROM Department ORDER BY department_id")
        departments = cur.fetchall()

    base_time = datetime(2026, 7, 17, 6, 0, 0)
    batch_size = 50
    rows = []

    for eq_id, eq_name in equipments:
        if random.random() < 0.15:
            msg_template = random.choice(EVENT_MESSAGES["EquipmentBroken"])
            msg = msg_template.format(equipment=eq_name)
            dept_id = random.choice([d[0] for d in departments])
            created = base_time + timedelta(hours=random.randint(0, 6))
            rows.append((None, dept_id, eq_id, "EquipmentBroken", msg, created))

    for pid, pname, symp in patients:
        if random.random() < 0.1:
            msg_template = random.choice(EVENT_MESSAGES["EmergencyPatient"])
            msg = msg_template.format(patient=pname, symptom=symp)
            created = base_time + timedelta(hours=random.randint(1, 5))
            rows.append((pid, 9, None, "EmergencyPatient", msg, created))

    for dept_id, dept_name in departments:
        if random.random() < 0.3:
            count = random.randint(5, 15)
            msg_template = random.choice(EVENT_MESSAGES["QueueOverloaded"])
            msg = msg_template.format(department=dept_name, count=count)
            created = base_time + timedelta(hours=random.randint(2, 5))
            rows.append((None, dept_id, None, "QueueOverloaded", msg, created))

    for doc_id, doc_name in doctors:
        if random.random() < 0.1:
            msg_template = random.choice(EVENT_MESSAGES["DoctorLeave"])
            msg = msg_template.format(doctor=doc_name)
            dept_id = random.choice([d[0] for d in departments])
            created = base_time + timedelta(hours=random.randint(0, 3))
            rows.append((None, dept_id, None, "DoctorLeave", msg, created))

    for pid, pname, _ in patients[:50]:
        if random.random() < 0.4:
            step = random.choice(["khám lâm sàng", "xét nghiệm máu", "siêu âm", "X-Quang", "thanh toán"])
            msg_template = random.choice(EVENT_MESSAGES["WorkflowUpdated"])
            msg = msg_template.format(patient=pname, step=step)
            dept_id = random.choice([d[0] for d in departments])
            created = base_time + timedelta(hours=random.randint(1, 4))
            rows.append((pid, dept_id, None, "WorkflowUpdated", msg, created))

    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        with conn.cursor() as cur:
            cur.executemany(sql, batch)
        conn.commit()

    print(f"✓ Inserted {len(rows)} events")


def main():
    parser = argparse.ArgumentParser(description="Generate mock data for Hospital System")
    parser.add_argument("--append", action="store_true",
                        help="Append mode: add more patients & appointments without resetting existing data")
    parser.add_argument("--patients", type=int, default=300,
                        help="Number of patients to generate (default: 300)")
    parser.add_argument("--appointments", type=int, default=None,
                        help="Number of appointments to generate (default: same as patients)")
    args = parser.parse_args()

    print("=" * 50)
    if args.append:
        print("APPENDING MOCK DATA TO EXISTING DATABASE")
    else:
        print("GENERATING FRESH MOCK DATA (WILL RESET DATABASE)")
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
        if args.append:
            print("\n--- Appending data (preserving existing data) ---")
            seed_patients(conn, args.patients)
            apt_count = args.appointments if args.appointments else args.patients
            seed_appointments(conn, apt_count)
            seed_workflows(conn)
            seed_events(conn)
        else:
            print("\n--- Resetting database ---")
            create_tables(conn)

            with conn.cursor() as cur:
                cur.execute("""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint
                            WHERE conname = 'department_name_unique'
                        ) THEN
                            ALTER TABLE Department ADD CONSTRAINT department_name_unique UNIQUE (department_name);
                        END IF;
                    END $$;
                """)
                cur.execute("""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint
                            WHERE conname = 'doctor_full_name_unique'
                        ) THEN
                            ALTER TABLE Doctor ADD CONSTRAINT doctor_full_name_unique UNIQUE (full_name);
                        END IF;
                    END $$;
                """)
            conn.commit()

            seed_departments(conn)
            seed_doctors(conn)
            seed_patients(conn, args.patients)
            apt_count = args.appointments if args.appointments else args.patients
            seed_appointments(conn, apt_count)
            seed_equipment(conn)
            seed_queuestatus(conn)
            seed_workflows(conn)
            seed_events(conn)

        print()
        print("=" * 50)
        print("DATA GENERATION COMPLETE")
        print("=" * 50)
        print()
        print("To verify data, run:")
        print('  docker exec hospital-db psql -U admin -d hospital_ai -c "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;"')
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()


if __name__ == "__main__":
    main()
import random
from datetime import datetime, timedelta

# Dữ liệu mẫu
ho_list = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ"]
ten_dem = ["Văn", "Thị", "Ngọc", "Hoàng", "Minh", "Hải", "Quang", "Thu", "Xuân", "Hữu"]
ten_list = ["Anh", "Bình", "Châu", "Dương", "Giang", "Hải", "Khánh", "Linh", "Minh", "Ngọc", "Phương", "Quân", "Sơn", "Trang", "Uyên", "Vinh", "Yến"]

symptoms = ["Đau đầu", "Sốt cao", "Khó thở", "Đau bụng", "Buồn nôn", "Tức ngực", "Chóng mặt", "Ho kéo dài", "Phát ban", "Đau khớp"]
allergies = ["Phấn hoa", "Hải sản", "Penicillin", "Đậu phộng", "Không có", "Không có", "Không có"] # Tỉ lệ không có cao hơn
diseases = ["Tiểu đường type 2", "Cao huyết áp", "Hen suyễn", "Viêm dạ dày", "Không có", "Không có", "Không có"]

def random_date(start_year, end_year):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    return start + timedelta(days=random.randint(0, int((end - start).days)))

def random_timestamp(days_ago):
    now = datetime.now()
    return now - timedelta(days=random.randint(0, days_ago), hours=random.randint(0, 23), minutes=random.randint(0, 59))

# Mở file SQL để ghi
with open('mock_data.sql', 'w', encoding='utf-8') as f:
    f.write("-- ==========================================\n")
    f.write("-- MOCK DATA FOR HOSPITAL COORDINATION SYSTEM\n")
    f.write("-- ==========================================\n\n")

    # 1. Tạo 5 Department
    f.write("-- 1. INSERT DEPARTMENTS\n")
    depts = ["Khoa Khám bệnh", "Khoa Cấp cứu", "Khoa Nội tổng hợp", "Khoa Ngoại", "Khoa Nhi"]
    for i, dept in enumerate(depts, 1):
        f.write(f"INSERT INTO Department (department_name, floor, location) VALUES ('{dept}', {random.randint(1, 5)}, 'Khu {random.choice(['A', 'B', 'C'])}');\n")
    f.write("\n")

    # 2. Tạo 10 Doctor
    f.write("-- 2. INSERT DOCTORS\n")
    specialties = ["Nội khoa", "Ngoại khoa", "Nhi khoa", "Tim mạch", "Thần kinh"]
    for i in range(1, 11):
        name = f"BS. {random.choice(ho_list)} {random.choice(ten_dem)} {random.choice(ten_list)}"
        dept_id = random.randint(1, 5)
        specialty = random.choice(specialties)
        duration = random.choice([10, 15, 20, 30])
        status = random.choice(['Available', 'Busy', 'Leave'])
        score = round(random.uniform(3.5, 5.0), 2)
        f.write(f"INSERT INTO Doctor (department_id, full_name, specialty, consultation_duration, status, popularity_score) VALUES ({dept_id}, '{name}', '{specialty}', {duration}, '{status}', {score});\n")
    f.write("\n")
    f.write("-- 2b. INSERT DOCTOR USER ACCOUNTS (password: 123456)\n")
    for i in range(1, 11):
        f.write(f"INSERT INTO UserAccount (username, password_hash, role, reference_id) VALUES ('doctor{i}', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', {i});\n")
    f.write("\n")

    # 3. Tạo 1000 Patient
    f.write("-- 3. INSERT 1000 PATIENTS\n")
    for i in range(1, 1001):
        full_name = f"{random.choice(ho_list)} {random.choice(ten_dem)} {random.choice(ten_list)}"
        gender = random.choice(['Male', 'Female', 'Other'])
        dob = random_date(1940, 2023).strftime('%Y-%m-%d')
        phone = f"09{random.randint(10000000, 99999999)}"
        insurance = random.choice(['Insurance', 'Service'])
        
        # Logic phân loại patient_category dựa trên năm sinh
        age = 2024 - int(dob[:4])
        if age < 16:
            category = 'Child'
        elif age > 60:
            category = 'Senior'
        else:
            category = random.choice(['Adult', 'Adult', 'Adult', 'VIP']) # VIP hiếm hơn

        first_visit = random.choice(['TRUE', 'FALSE'])
        pref_doc_id = random.randint(1, 10) if random.random() > 0.3 else "NULL" # 70% có chọn bác sĩ
        doc_pref_level = random.randint(1, 5) if pref_doc_id != "NULL" else "NULL"
        
        chronic = random.choice(diseases)
        allergy = random.choice(allergies)
        symptom = random.choice(symptoms)
        
        priority = random.choices(['Routine', 'Urgent', 'Emergency'], weights=[70, 20, 10])[0]
        arrival_time = random_timestamp(30).strftime('%Y-%m-%d %H:%M:%S') # Random trong 30 ngày qua

        # Tạo câu lệnh INSERT
        f.write(f"INSERT INTO Patient (full_name, gender, date_of_birth, phone, insurance_type, patient_category, first_visit, preferred_doctor_id, doctor_preference_level, chronic_disease, allergy, symptom, priority, arrival_time) "
                f"VALUES ('{full_name}', '{gender}', '{dob}', '{phone}', '{insurance}', '{category}', {first_visit}, {pref_doc_id}, {doc_pref_level}, '{chronic}', '{allergy}', '{symptom}', '{priority}', '{arrival_time}');\n")

    f.write("\n")
    f.write("-- 3b. INSERT PATIENT USER ACCOUNTS (password: 123456)\n")
    for i in range(1, 1001):
        f.write(f"INSERT INTO UserAccount (username, password_hash, role, reference_id) VALUES ('patient{i}', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient', {i});\n")

print("Đã tạo thành công file 'mock_data.sql' chứa 1000 bệnh nhân và các dữ liệu liên quan!")

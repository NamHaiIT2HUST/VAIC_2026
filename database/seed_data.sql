-- ==========================================
-- SEED DATA FOR HOSPITAL COORDINATION SYSTEM
-- ==========================================

-- 1. DEPARTMENT
INSERT INTO Department (department_name, floor, location) VALUES
('Khoa Khám bệnh', 1, 'Tầng 1 - Khu A'),
('Khoa Nội', 2, 'Tầng 2 - Khu A'),
('Khoa Ngoại', 2, 'Tầng 2 - Khu B'),
('Khoa Nhi', 3, 'Tầng 3 - Khu A'),
('Khoa Sản', 3, 'Tầng 3 - Khu B'),
('Khoa Tim mạch', 4, 'Tầng 4 - Khu A'),
('Khoa Xét nghiệm', 1, 'Tầng 1 - Khu B'),
('Khoa Chẩn đoán hình ảnh', 1, 'Tầng 1 - Khu C'),
('Khoa Cấp cứu', 1, 'Tầng 1 - Khu D'),
('Khoa Dược', 1, 'Tầng 1 - Khu E');

-- 2. DOCTOR
INSERT INTO Doctor (department_id, full_name, specialty, consultation_duration, status, popularity_score) VALUES
(1, 'Nguyễn Văn An', 'Nội tổng quát', 15, 'Available', 4.5),
(1, 'Trần Thị Bình', 'Nội tổng quát', 20, 'Available', 4.2),
(2, 'Lê Văn Cường', 'Tim mạch', 30, 'Available', 4.8),
(2, 'Phạm Thị Dung', 'Hô hấp', 25, 'Busy', 4.0),
(3, 'Hoàng Văn Em', 'Chấn thương chỉnh +hình', 20, 'Available', 4.6),
(3, 'Ngô Thị Phương', 'Tiêu hóa', 15, 'Leave', 4.3),
(4, 'Đặng Văn Giang', 'Nhi khoa', 20, 'Available', 4.7),
(5, 'Vũ Thị Hạnh', 'Sản khoa', 30, 'Available', 4.9),
(6, 'Bùi Văn Inh', 'Tim mạch can thiệp', 45, 'Busy', 4.1),
(6, 'Lý Thị Kiều', 'Nội tim mạch', 30, 'Available', 4.4),
(7, 'Mai Văn Long', 'Huyết học', 15, 'Available', 3.9),
(8, 'Hồ Thị Minh', 'Chẩn đoán hình ảnh', 20, 'Available', 4.5),
(9, 'Đỗ Văn Ngọc', 'Cấp cứu', 10, 'Available', 4.8),
(10, 'Dương Thị Oanh', 'Dược lâm sàng', 5, 'Available', 4.2);

-- 3. PATIENT
INSERT INTO Patient (full_name, gender, date_of_birth, phone, insurance_type, patient_category, first_visit, preferred_doctor_id, doctor_preference_level, chronic_disease, allergy, symptom, priority, arrival_time) VALUES
('Nguyễn Văn Bảo', 'Male', '1990-05-15', '0901234567', 'Insurance', 'Adult', FALSE, 1, 3, 'Tăng huyết áp', NULL, 'Đau đầu, chóng mặt', 'Routine', '2026-07-17 07:30:00'),
('Trần Thị Cúc', 'Female', '1985-08-22', '0912345678', 'Insurance', 'Adult', FALSE, 3, 5, NULL, 'Penicillin', 'Đau ngực trái', 'Urgent', '2026-07-17 08:00:00'),
('Lê Văn Đạt', 'Male', '1970-12-10', '0923456789', 'Service', 'Senior', TRUE, NULL, NULL, 'Đái tháo đường type 2', NULL, 'Khó thở, mệt mỏi', 'Emergency', '2026-07-17 08:15:00'),
('Phạm Thị Em', 'Female', '2020-03-25', '0934567890', 'Insurance', 'Child', TRUE, 7, NULL, NULL, 'Trứng, sữa', 'Sốt cao 39 độ, ho', 'Urgent', '2026-07-17 08:30:00'),
('Hoàng Văn Phúc', 'Male', '1955-07-18', '0945678901', 'Insurance', 'Senior', FALSE, 9, 4, 'Tăng huyết áp, suy tim', NULL, 'Đau ngực, khó thở', 'Emergency', '2026-07-17 08:45:00'),
('Ngô Thị Hoa', 'Female', '1995-11-30', '0956789012', 'Service', 'Adult', FALSE, 5, 2, NULL, NULL, 'Đau bụng hạ sườn phải', 'Routine', '2026-07-17 09:00:00'),
('Đặng Văn Giàu', 'Male', '2000-06-05', '0967890123', 'Insurance', 'Adult', TRUE, NULL, NULL, NULL, NULL, 'Khám sức khỏe tổng quát', 'Routine', '2026-07-17 09:15:00'),
('Vũ Thị Hương', 'Female', '1988-09-12', '0978901234', 'Insurance', 'Adult', FALSE, 8, 5, NULL, 'Ibuprofen', 'Đau bụng kinh', 'Routine', '2026-07-17 09:30:00'),
('Bùi Văn Ích', 'Male', '1965-01-20', '0989012345', 'Service', 'Senior', FALSE, 2, 3, 'Viêm khớp', NULL, 'Đau khớp gối', 'Routine', '2026-07-17 09:45:00'),
('Lý Thị Kim', 'Female', '2015-04-08', '0990123456', 'Insurance', 'Child', FALSE, 7, 4, NULL, 'Phấn hoa', 'Ho, sổ mũi', 'Routine', '2026-07-17 10:00:00'),
('Mai Văn Lợi', 'Male', '1975-08-16', '0901122334', 'Insurance', 'Adult', TRUE, NULL, NULL, 'Viêm dạ dày', NULL, 'Đau thượng vị, ợ chua', 'Routine', '2026-07-17 10:15:00'),
('Hồ Thị Mai', 'Female', '1992-02-28', '0911223344', 'Service', 'Adult', FALSE, 4, 2, NULL, 'Hải sản', 'Đau họng, sốt nhẹ', 'Routine', '2026-07-17 10:30:00'),
('Đỗ Văn Nam', 'Male', '1948-11-11', '0922334455', 'Insurance', 'Senior', FALSE, 6, 5, 'Tăng huyết áp, suy thận', NULL, 'Phù chân, khó thở', 'Urgent', '2026-07-17 10:45:00'),
('Dương Thị Oanh', 'Female', '1998-07-07', '0933445566', 'Service', 'Adult', TRUE, NULL, NULL, NULL, NULL, 'Đau đầu migraine', 'Routine', '2026-07-17 11:00:00'),
('Nguyễn Văn Phú', 'Male', '1982-12-25', '0944556677', 'Insurance', 'Adult', FALSE, 1, 3, NULL, 'Sulfa', 'Đau lưng, tê chân', 'Routine', '2026-07-17 11:15:00');

-- 4. APPOINTMENT
INSERT INTO Appointment (patient_id, doctor_id, appointment_time, visit_type, estimated_wait, status) VALUES
(1, 1, '2026-07-17 07:30:00', 'Insurance', 10, 'Completed'),
(2, 3, '2026-07-17 08:00:00', 'Insurance', 15, 'In Progress'),
(3, 13, '2026-07-17 08:15:00', 'Service', 5, 'In Progress'),
(4, 7, '2026-07-17 08:30:00', 'Insurance', 20, 'Waiting'),
(5, 9, '2026-07-17 08:45:00', 'Insurance', 0, 'In Progress'),
(6, 5, '2026-07-17 09:00:00', 'Service', 25, 'Waiting'),
(7, 1, '2026-07-17 09:15:00', 'Insurance', 30, 'Waiting'),
(8, 8, '2026-07-17 09:30:00', 'Insurance', 15, 'Scheduled'),
(9, 2, '2026-07-17 09:45:00', 'Service', 20, 'Scheduled'),
(10, 7, '2026-07-17 10:00:00', 'Insurance', 10, 'Scheduled'),
(11, 6, '2026-07-17 10:15:00', 'Insurance', 15, 'Scheduled'),
(12, 4, '2026-07-17 10:30:00', 'Service', 20, 'Scheduled'),
(13, 6, '2026-07-17 10:45:00', 'Insurance', 5, 'Scheduled'),
(14, 1, '2026-07-17 11:00:00', 'Service', 15, 'Scheduled'),
(15, 1, '2026-07-17 11:15:00', 'Insurance', 20, 'Scheduled');

-- 5. PATIENT WORKFLOW
INSERT INTO PatientWorkflow (appointment_id, planned_order, actual_order, step_type, department_id, room_name, estimated_duration, estimated_wait, status, completed_at) VALUES
(1, 1, 1, 'Registration', 1, 'Quầy số 1', 5, 0, 'Completed', '2026-07-17 07:35:00'),
(1, 2, 2, 'Clinical Examination', 1, 'Phòng khám số 3', 15, 10, 'Completed', '2026-07-17 07:55:00'),
(1, 3, 3, 'Blood Test', 7, 'Phòng xét nghiệm số 1', 10, 15, 'Completed', '2026-07-17 08:20:00'),
(1, 4, 4, 'Return Doctor', 1, 'Phòng khám số 3', 10, 5, 'Completed', '2026-07-17 08:35:00'),
(1, 5, 5, 'Payment', 1, 'Quầy thu ngân số 2', 5, 5, 'Completed', '2026-07-17 08:45:00'),
(1, 6, 6, 'Pharmacy', 10, 'Quầy thuốc số 1', 5, 10, 'Completed', '2026-07-17 09:00:00'),
(2, 1, 1, 'Registration', 1, 'Quầy số 2', 5, 0, 'Completed', '2026-07-17 08:05:00'),
(2, 2, 2, 'Clinical Examination', 6, 'Phòng khám số 5', 30, 15, 'In Progress', NULL),
(3, 1, 1, 'Registration', 9, 'Quầy cấp cứu', 3, 0, 'Completed', '2026-07-17 08:18:00'),
(3, 2, 2, 'Clinical Examination', 9, 'Phòng cấp cứu số 1', 10, 0, 'In Progress', NULL),
(4, 1, 1, 'Registration', 1, 'Quầy số 3', 5, 0, 'Completed', '2026-07-17 08:35:00'),
(4, 2, NULL, 'Clinical Examination', 4, 'Phòng khám nhi số 2', 20, 20, 'Pending', NULL),
(5, 1, 1, 'Registration', 9, 'Quầy cấp cứu', 3, 0, 'Completed', '2026-07-17 08:48:00'),
(5, 2, 2, 'Clinical Examination', 9, 'Phòng cấp cứu số 2', 15, 0, 'In Progress', NULL);

-- 9. USER ACCOUNTS (for authentication)
-- Password hash for "123456" using bcrypt
-- All accounts use password: 123456
-- Doctor accounts: doctor1..doctor14 (references doctor_id=1..14)
-- Patient accounts: patient1..patient15 (references patient_id=1..15)
INSERT INTO UserAccount (username, password_hash, role, reference_id) VALUES
-- Doctors
('doctor1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', 1),
('doctor2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', 2),
('doctor3', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', 3),
('doctor4', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', 4),
('doctor5', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', 5),
('doctor6', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', 6),
('doctor7', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', 7),
('doctor8', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', 8),
('doctor9', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', 9),
('doctor10', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', 10),
('doctor11', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', 11),
('doctor12', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', 12),
('doctor13', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', 13),
('doctor14', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', 14),
-- Patients
('patient1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient', 1),
('patient2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient', 2),
('patient3', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient', 3),
('patient4', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient', 4),
('patient5', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient', 5),
('patient6', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient', 6),
('patient7', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient', 7),
('patient8', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient', 8),
('patient9', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient', 9),
('patient10', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient', 10),
('patient11', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient', 11),
('patient12', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient', 12),
('patient13', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient', 13),
('patient14', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient', 14),
('patient15', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient', 15);

-- 6. QUEUE STATUS
INSERT INTO QueueStatus (department_id, doctor_id, waiting_patient, average_wait, updated_at) VALUES
(1, 1, 3, 20, '2026-07-17 11:00:00'),
(1, 2, 1, 15, '2026-07-17 11:00:00'),
(2, 3, 0, 0, '2026-07-17 11:00:00'),
(2, 4, 1, 25, '2026-07-17 11:00:00'),
(3, 5, 1, 20, '2026-07-17 11:00:00'),
(3, 6, 2, 30, '2026-07-17 11:00:00'),
(4, 7, 2, 15, '2026-07-17 11:00:00'),
(5, 8, 0, 0, '2026-07-17 11:00:00'),
(6, 9, 0, 0, '2026-07-17 11:00:00'),
(6, 10, 0, 0, '2026-07-17 11:00:00'),
(7, 11, 0, 0, '2026-07-17 11:00:00'),
(8, 12, 0, 0, '2026-07-17 11:00:00'),
(9, 13, 0, 0, '2026-07-17 11:00:00'),
(10, 14, 0, 0, '2026-07-17 11:00:00');

-- 7. EQUIPMENT
INSERT INTO Equipment (department_id, equipment_name, status, utilization) VALUES
(7, 'Máy xét nghiệm huyết học', 'Working', 75.50),
(7, 'Máy xét nghiệm sinh hóa', 'Working', 82.30),
(7, 'Máy phân tích nước tiểu', 'Working', 60.00),
(8, 'Máy X-Quang kỹ thuật số', 'Working', 70.20),
(8, 'Máy CT Scanner', 'Working', 85.00),
(8, 'Máy MRI', 'Maintenance', 0.00),
(8, 'Máy siêu âm', 'Working', 90.10),
(6, 'Máy ECG', 'Working', 65.40),
(6, 'Máy siêu âm tim', 'Working', 55.00),
(9, 'Máy thở', 'Working', 45.00),
(9, 'Máy sốc tim', 'Working', 10.00),
(9, 'Máy monitor', 'Working', 80.00),
(3, 'Máy nội soi', 'Broken', 0.00),
(4, 'Máy siêu âm nhi', 'Working', 50.00);

-- 8. EVENT
INSERT INTO Event (patient_id, department_id, equipment_id, event_type, message, created_at) VALUES
(NULL, 8, 6, 'EquipmentBroken', 'Máy MRI gặp sự cố kỹ thuật, cần bảo trì', '2026-07-17 06:00:00'),
(3, 9, NULL, 'EmergencyPatient', 'Bệnh nhân Lê Văn Đạt nhập viện cấp cứu với triệu chứng khó thở, mệt mỏi', '2026-07-17 08:15:00'),
(5, 9, NULL, 'EmergencyPatient', 'Bệnh nhân Hoàng Văn Phúc nhập viện cấp cứu với triệu chứng đau ngực, khó thở', '2026-07-17 08:45:00'),
(NULL, 1, NULL, 'QueueOverloaded', 'Khoa Khám bệnh đang quá tải với 5 bệnh nhân chờ', '2026-07-17 09:00:00'),
(NULL, 3, 13, 'EquipmentBroken', 'Máy nội soi hỏng, cần sửa chữa gấp', '2026-07-17 09:30:00'),
(2, 2, NULL, 'WorkflowUpdated', 'Bệnh nhân Trần Thị Cúc đã hoàn thành khám lâm sàng, chuyển sang xét nghiệm', '2026-07-17 08:35:00');
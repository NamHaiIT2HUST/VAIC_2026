# Hướng dẫn Cơ sở dữ liệu — Hospital Coordination System (VAIC 2026)

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Yêu cầu hệ thống](#2-yêu-cầu-hệ-thống)
3. [Khởi động Database](#3-khởi-động-database)
4. [Cấu trúc bảng](#4-cấu-trúc-bảng)
5. [Seed Data & Tài khoản mẫu](#5-seed-data--tài-khoản-mẫu)
6. [Kết nối từ Backend (Go)](#6-kết-nối-từ-backend-go)
7. [Kết nối từ Frontend (React)](#7-kết-nối-từ-frontend-react)
8. [Các lệnh hữu ích](#8-các-lệnh-hữu-ích)
9. [Sơ đồ quan hệ](#9-sơ-đồ-quan-hệ)

---

## 1. Tổng quan

Dự án sử dụng **PostgreSQL 16** làm cơ sở dữ liệu chính cho hệ thống điều phối bệnh viện thông minh (Hospital Coordination System). Database quản lý:

- **Bác sĩ** (Doctor) — chuyên khoa, phòng ban, trạng thái
- **Bệnh nhân** (Patient) — thông tin cá nhân, bệnh sử, mức ưu tiên
- **Cuộc hẹn** (Appointment) — lịch khám, loại khám, trạng thái
- **Luồng công việc** (PatientWorkflow) — các bước trong quy trình khám chữa bệnh
- **Hàng đợi** (QueueStatus) — số lượng chờ, thời gian chờ theo từng bác sĩ/phòng
- **Thiết bị** (Equipment) — trạng thái hoạt động của máy móc
- **Sự kiện** (Event) — các sự kiện bất thường (hỏng máy, cấp cứu, quá tải...)
- **Tài khoản người dùng** (UserAccount) — xác thực đăng nhập

---

## 2. Yêu cầu hệ thống

- **Docker** & **Docker Compose** (khuyên dùng)  
  hoặc  
- **PostgreSQL 16** cài đặt native trên máy

---

## 3. Khởi động Database

### 3.1. Dùng Docker Compose (khuyên dùng)

```bash
# Từ thư mục gốc VAIC_2026/
docker compose up -d postgres
```

Docker Compose sẽ tự động:

1. Tạo container `hospital-db` với PostgreSQL 16
2. Tạo database `hospital_ai`
3. Chạy `init_schema.sql` → tạo bảng, enum, index
4. Chạy `seed_data.sql` → chèn dữ liệu mẫu (phòng ban, bác sĩ, bệnh nhân, v.v.)

### 3.2. Dùng PostgreSQL native

Nếu bạn đã cài PostgreSQL trên máy:

```bash
# Tạo database
createdb -U postgres hospital_ai

# Chạy schema
psql -U postgres -d hospital_ai -f database/init_schema.sql

# Chạy seed data
psql -U postgres -d hospital_ai -f database/seed_data.sql
```

### 3.3. Thông số kết nối mặc định

| Tham số      | Giá trị       |
|-------------|---------------|
| Host        | `localhost`   |
| Port        | `5432`        |
| Database    | `hospital_ai` |
| User        | `postgres`    |
| Password    | `123456`      |

---

## 4. Cấu trúc bảng

### 4.1. Department (Phòng ban / Khoa)

| Cột             | Kiểu            | Mô tả                         |
|----------------|-----------------|-------------------------------|
| department_id  | SERIAL (PK)     | ID tự tăng                    |
| department_name| VARCHAR(100)    | Tên khoa (VD: Khoa Khám bệnh)|
| floor          | INT             | Tầng                          |
| location       | VARCHAR(100)    | Vị trí (VD: Tầng 1 - Khu A)  |

### 4.2. Doctor (Bác sĩ)

| Cột                  | Kiểu            | Mô tả                            |
|----------------------|-----------------|----------------------------------|
| doctor_id            | SERIAL (PK)     | ID tự tăng                       |
| department_id        | INT (FK → Department) | Khoa trực thuộc            |
| full_name            | VARCHAR(100)    | Họ tên bác sĩ                    |
| specialty            | VARCHAR(100)    | Chuyên khoa                      |
| consultation_duration| INT             | Thời gian khám (phút)            |
| status               | doctor_status   | Available / Busy / Leave         |
| popularity_score     | DECIMAL(3,2)    | Điểm phổ biến (0.00 - 9.99)     |

### 4.3. Patient (Bệnh nhân)

| Cột                   | Kiểu             | Mô tả                             |
|-----------------------|------------------|-----------------------------------|
| patient_id            | SERIAL (PK)      | ID tự tăng                        |
| full_name             | VARCHAR(100)     | Họ tên bệnh nhân                  |
| gender                | patient_gender   | Male / Female / Other             |
| date_of_birth         | DATE             | Ngày sinh                         |
| phone                 | VARCHAR(20)      | Số điện thoại                     |
| insurance_type        | insurance_type   | Insurance / Service               |
| patient_category      | patient_category | Adult / Child / Senior / VIP      |
| first_visit           | BOOLEAN          | Lần đầu khám?                     |
| preferred_doctor_id   | INT (FK → Doctor)| Bác sĩ ưa thích                   |
| doctor_preference_level| INT             | Mức độ ưa thích (1-5)             |
| chronic_disease       | TEXT             | Bệnh mãn tính                     |
| allergy               | TEXT             | Dị ứng                            |
| symptom               | TEXT             | Triệu chứng                       |
| priority              | priority_level   | Routine / Urgent / Emergency      |
| arrival_time          | TIMESTAMP        | Thời gian đến                     |

### 4.4. Appointment (Cuộc hẹn)

| Cột              | Kiểu               | Mô tả                             |
|------------------|--------------------|-----------------------------------|
| appointment_id   | SERIAL (PK)        | ID tự tăng                        |
| patient_id       | INT (FK → Patient) | Bệnh nhân                         |
| doctor_id        | INT (FK → Doctor)  | Bác sĩ khám                       |
| appointment_time | TIMESTAMP          | Thời gian hẹn                     |
| visit_type       | visit_type         | Insurance / Service               |
| estimated_wait   | INT                | Thời gian chờ dự kiến (phút)      |
| status           | appointment_status | Scheduled / Waiting / In Progress / Completed / Cancelled |

### 4.5. PatientWorkflow (Luồng công việc của bệnh nhân)

| Cột               | Kiểu                  | Mô tả                                 |
|-------------------|-----------------------|---------------------------------------|
| workflow_id       | SERIAL (PK)           | ID tự tăng                            |
| appointment_id    | INT (FK → Appointment)| Cuộc hẹn                              |
| planned_order     | INT                   | Thứ tự dự kiến                        |
| actual_order      | INT                   | Thứ tự thực tế                        |
| step_type         | step_type             | Registration / Clinical Examination / Blood Test / ... |
| department_id     | INT (FK → Department) | Khoa thực hiện                        |
| room_name         | VARCHAR(100)          | Tên phòng                             |
| estimated_duration| INT                   | Thời gian dự kiến (phút)              |
| estimated_wait    | INT                   | Thời gian chờ dự kiến (phút)          |
| status            | step_status           | Pending / In Progress / Completed / Skipped |
| completed_at      | TIMESTAMP             | Thời gian hoàn thành                  |

### 4.6. QueueStatus (Trạng thái hàng đợi)

| Cột            | Kiểu               | Mô tả                    |
|----------------|--------------------|--------------------------|
| queue_id       | SERIAL (PK)        | ID tự tăng               |
| department_id  | INT (FK → Department) | Khoa                 |
| doctor_id      | INT (FK → Doctor)  | Bác sĩ                   |
| waiting_patient| INT                | Số bệnh nhân đang chờ    |
| average_wait   | INT                | Thời gian chờ TB (phút)  |
| updated_at     | TIMESTAMP          | Thời gian cập nhật       |

### 4.7. Equipment (Thiết bị)

| Cột            | Kiểu                | Mô tả                |
|---------------|---------------------|----------------------|
| equipment_id  | SERIAL (PK)         | ID tự tăng           |
| department_id | INT (FK → Department)| Khoa quản lý         |
| equipment_name| VARCHAR(100)        | Tên thiết bị         |
| status        | equipment_status    | Working / Maintenance / Broken |
| utilization   | DECIMAL(5,2)        | Tỉ lệ sử dụng (%)    |

### 4.8. Event (Sự kiện)

| Cột            | Kiểu               | Mô tả                     |
|---------------|--------------------|---------------------------|
| event_id      | SERIAL (PK)        | ID tự tăng                |
| patient_id    | INT (FK → Patient) | Bệnh nhân liên quan       |
| department_id | INT (FK → Department)| Khoa liên quan           |
| equipment_id  | INT (FK → Equipment)| Thiết bị liên quan        |
| event_type    | event_type         | EquipmentBroken / DoctorLeave / EmergencyPatient / QueueOverloaded / WorkflowUpdated |
| message       | TEXT               | Nội dung sự kiện          |
| created_at    | TIMESTAMP          | Thời gian tạo             |

### 4.9. UserAccount (Tài khoản người dùng)

| Cột           | Kiểu            | Mô tả                              |
|--------------|-----------------|------------------------------------|
| user_id      | SERIAL (PK)     | ID tự tăng                         |
| username     | VARCHAR(50)     | Tên đăng nhập (UNIQUE)             |
| password_hash| VARCHAR(255)    | Mật khẩu đã hash (bcrypt)          |
| role         | VARCHAR(20)     | 'doctor' / 'patient' / 'admin'     |
| reference_id | INT             | ID tham chiếu (doctor_id / patient_id) |
| created_at   | TIMESTAMP       | Thời gian tạo                      |

> **Lưu ý:** `reference_id` tương ứng với `doctor_id` nếu role là 'doctor', hoặc `patient_id` nếu role là 'patient'. Ràng buộc khóa ngoại được kiểm tra ở tầng ứng dụng.

---

## 5. Seed Data & Tài khoản mẫu

Dữ liệu mẫu được nhập qua `seed_data.sql` bao gồm:

### 5.1. Danh sách tài khoản đăng nhập

Tất cả tài khoản dùng chung mật khẩu: **`123456`**

#### Bác sĩ

| Username    | Họ tên              | Khoa           |
|------------|---------------------|----------------|
| doctor1    | Nguyễn Văn An       | Khoa Khám bệnh |
| doctor2    | Trần Thị Bình       | Khoa Khám bệnh |
| doctor3    | Lê Văn Cường        | Khoa Nội       |
| doctor4    | Phạm Thị Dung       | Khoa Nội       |
| doctor5    | Hoàng Văn Em        | Khoa Ngoại     |
| doctor6    | Ngô Thị Phương      | Khoa Ngoại     |
| doctor7    | Đặng Văn Giang      | Khoa Nhi       |
| doctor8    | Vũ Thị Hạnh         | Khoa Sản       |
| doctor9    | Bùi Văn Inh         | Khoa Tim mạch  |
| doctor10   | Lý Thị Kiều         | Khoa Tim mạch  |
| doctor11   | Mai Văn Long        | Khoa Xét nghiệm|
| doctor12   | Hồ Thị Minh         | Khoa CĐHA      |
| doctor13   | Đỗ Văn Ngọc         | Khoa Cấp cứu   |
| doctor14   | Dương Thị Oanh      | Khoa Dược      |

#### Bệnh nhân

| Username   | Họ tên           |
|-----------|------------------|
| patient1  | Nguyễn Văn Bảo   |
| patient2  | Trần Thị Cúc     |
| patient3  | Lê Văn Đạt       |
| patient4  | Phạm Thị Em      |
| patient5  | Hoàng Văn Phúc   |
| ...       | patient6 → patient15 |

### 5.2. Dữ liệu mẫu khác

- **10 phòng ban/khoa** — từ Khoa Khám bệnh đến Khoa Dược
- **14 bác sĩ** — phân bố theo các khoa
- **15 bệnh nhân** — với các triệu chứng, mức ưu tiên khác nhau
- **15 cuộc hẹn** — với trạng thái khác nhau (Completed, In Progress, Waiting, Scheduled)
- **14 bước workflow** — cho các cuộc hẹn đã và đang xử lý
- **14 thiết bị y tế** — bao gồm máy MRI đang bảo trì, máy nội soi hỏng
- **6 sự kiện** — hỏng thiết bị, bệnh nhân cấp cứu, quá tải, cập nhật workflow

---

## 6. Kết nối từ Backend (Go)

### 6.1. Cấu hình kết nối

Backend sử dụng thư viện [`lib/pq`](https://github.com/lib/pq) để kết nối PostgreSQL.  
Các tham số được đọc từ biến môi trường (file `.env` trong thư mục `backend/`):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=123456
DB_NAME=hospital_ai
```

> File `.env` nằm tại `VAIC_2026/backend/.env`

### 6.2. Kết nối trong code (main.go)

```go
connStr := "host=" + dbHost + " port=" + dbPort + " user=" + dbUser + 
           " password=" + dbPassword + " dbname=" + dbName + " sslmode=disable"
db, err := sql.Open("postgres", connStr)
```

### 6.3. Các API sử dụng database

| API Endpoint          | Method | Mô tả                              |
|-----------------------|--------|-------------------------------------|
| `/api/login`          | POST   | Xác thực UserAccount, trả về thông tin người dùng |
| `/api/health`         | GET    | Kiểm tra server (không dùng DB)     |
| `/api/events/trigger` | POST   | Ghi nhận & broadcast sự kiện (WebSocket) |

#### Ví dụ Login (POST /api/login)

```json
// Request
{
  "username": "doctor1",
  "password": "123456"
}

// Response
{
  "user_id": 1,
  "username": "doctor1",
  "role": "doctor",
  "reference_id": 1,
  "full_name": "Nguyễn Văn An"
}
```

---

## 7. Kết nối từ Frontend (React)

### 7.1. WebSocket realtime

Frontend kết nối tới backend qua WebSocket để nhận sự kiện realtime:

```javascript
// Frontend src/App.jsx
const socket = new WebSocket('ws://localhost:8080/ws');
```

Khi backend nhận được sự kiện (qua API `/api/events/trigger`), nó sẽ broadcast tới tất cả WebSocket clients.

### 7.2. REST API từ Frontend

Frontend gọi backend để kích hoạt sự kiện:

```javascript
await fetch('http://localhost:8080/api/events/trigger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'ALERT', message: 'Nội dung cảnh báo' }),
});
```

### 7.3. Luồng dữ liệu tổng thể

```
[Frontend React]  ←── WebSocket ──→  [Backend Go (Fiber)]
       │                                    │
       └──── REST API (POST /api/login,     │
                POST /api/events/trigger)    │
                                             ↓
                                     [PostgreSQL]
                                      (hospital_ai)
```

---

## 8. Các lệnh hữu ích

### 8.1. Docker

```bash
# Khởi động database
docker compose up -d postgres

# Xem log
docker compose logs -f postgres

# Dừng database
docker compose stop postgres

# Xóa database & dữ liệu
docker compose down -v
```

### 8.2. Kết nối trực tiếp vào PostgreSQL

```bash
# Qua Docker
docker exec -it hospital-db psql -U postgres -d hospital_ai

# Native (không Docker)
psql -h localhost -p 5432 -U postgres -d hospital_ai
```

### 8.3. Các truy vấn hữu ích

```sql
-- Xem danh sách bác sĩ đang Available
SELECT d.full_name, dep.department_name, d.specialty
FROM Doctor d
JOIN Department dep ON d.department_id = dep.department_id
WHERE d.status = 'Available';

-- Xem bệnh nhân đang chờ khám
SELECT p.full_name, p.priority, a.appointment_time, d.full_name AS doctor_name
FROM Appointment a
JOIN Patient p ON a.patient_id = p.patient_id
JOIN Doctor d ON a.doctor_id = d.doctor_id
WHERE a.status IN ('Waiting', 'Scheduled')
ORDER BY 
  CASE p.priority WHEN 'Emergency' THEN 1 WHEN 'Urgent' THEN 2 WHEN 'Routine' THEN 3 END,
  a.appointment_time;

-- Xem trạng thái hàng đợi các khoa
SELECT dep.department_name, d.full_name, q.waiting_patient, q.average_wait
FROM QueueStatus q
JOIN Department dep ON q.department_id = dep.department_id
JOIN Doctor d ON q.doctor_id = d.doctor_id
ORDER BY q.waiting_patient DESC;

-- Xem thiết bị đang gặp sự cố
SELECT equipment_name, department_name, status
FROM Equipment e
JOIN Department d ON e.department_id = d.department_id
WHERE status IN ('Maintenance', 'Broken');

-- Xem lịch sử sự kiện
SELECT event_type, message, created_at
FROM Event
ORDER BY created_at DESC;
```

---

## 9. Sơ đồ quan hệ

```
┌──────────────┐       ┌──────────────┐
│  Department  │←──────│    Doctor    │
└──────────────┘       └──────┬───────┘
        ↑                     │
        │               ┌─────▼───────┐        ┌───────────────┐
        │               │   Patient   │←───────│  Appointment  │
        │               └─────────────┘        └───────┬───────┘
        │                                              │
        │               ┌──────────────┐               │
        ├──────────────→│QueueStatus   │               │
        │               └──────────────┘               │
        │                                               │
        ├──────────────→┌──────────────┐     ┌─────────▼────────┐
        │               │  Equipment   │     │ PatientWorkflow  │
        │               └──────┬───────┘     └──────────────────┘
        │                      │
        └──────────────→┌──────▼───────┐
                        │    Event     │
                        └──────────────┘

┌──────────────────────────────────────────────────────────┐
│                   UserAccount                            │
│  (username, password_hash, role, reference_id)           │
│  role = 'doctor' → reference_id → Doctor.doctor_id      │
│  role = 'patient' → reference_id → Patient.patient_id    │
│  role = 'admin'  → reference_id = 0 (tự quản lý)         │
└──────────────────────────────────────────────────────────┘
```

### Quan hệ khóa ngoại chính

| Bảng gốc         | Khóa ngoại               | Bảng tham chiếu    |
|-----------------|--------------------------|--------------------|
| Doctor          | department_id            | Department         |
| Patient         | preferred_doctor_id      | Doctor             |
| Appointment     | patient_id               | Patient            |
| Appointment     | doctor_id                | Doctor             |
| PatientWorkflow | appointment_id           | Appointment        |
| PatientWorkflow | department_id            | Department         |
| QueueStatus     | department_id            | Department         |
| QueueStatus     | doctor_id                | Doctor             |
| Equipment       | department_id            | Department         |
| Event           | patient_id               | Patient            |
| Event           | department_id            | Department         |
| Event           | equipment_id             | Equipment          |

---

> **Tác giả:** VAIC 2026 Team  
> **Công nghệ:** PostgreSQL 16, Go (Fiber), React (Vite)
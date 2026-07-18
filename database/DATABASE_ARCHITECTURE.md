# Kiến trúc Cơ sở Dữ liệu — Hospital Coordination System (VAIC 2026)

> Tài liệu này hướng dẫn toàn bộ quy trình thiết kế, phát triển, đóng gói và triển khai database lên cloud cho hệ thống **Hospital Coordination System**.

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Phần mềm & Công cụ cần thiết](#2-phần-mềm--công-cụ-cần-thiết)
3. [Thiết kế Database](#3-thiết-kế-database)
4. [Quy tắc viết Code SQL](#4-quy-tắc-viết-code-sql)
5. [Đóng gói & Triển khai lên Cloud](#5-đóng-gói--triển-khai-lên-cloud)
6. [CI/CD cho Database](#6-cicd-cho-database)
7. [Checklist triển khai](#7-checklist-triển-khai)

---

## 1. Tổng quan kiến trúc

Hệ thống sử dụng **PostgreSQL 16** làm cơ sở dữ liệu chính, với kiến trúc tổng thể như sau:

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloud Provider                         │
│  (AWS / GCP / Azure / VPS)                                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Docker Container                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │   │
│  │  │  PostgreSQL   │  │  Backend Go  │  │  Frontend  │ │   │
│  │  │  (hospital_ai)│◄─┤  (Fiber)     │◄─┤  (React)   │ │   │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Persistent Volume (PostgreSQL data)                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Luồng dữ liệu

```
[Frontend React]  ←── WebSocket ──→  [Backend Go (Fiber)]
       │                                    │
       └──── REST API ──────────────────────│
                                            ↓
                                    [PostgreSQL 16]
                                     (hospital_ai)
```

---

## 2. Phần mềm & Công cụ cần thiết

### 2.1. Công cụ thiết kế Database

| Công cụ | Mục đích | Link |
|---------|----------|------|
| **drawDB** | Vẽ sơ đồ ERD online miễn phí | https://drawdb.vercel.app/ |
| **dbdiagram.io** | Vẽ ERD dạng code (DSL) | https://dbdiagram.io/ |
| **pgAdmin 4** | GUI quản trị PostgreSQL | https://www.pgadmin.org/ |
| **DBeaver** | GUI đa năng, hỗ trợ nhiều DB | https://dbeaver.io/ |
| **DataGrip** | IDE chuyên nghiệp cho DB (JetBrains) | https://www.jetbrains.com/datagrip/ |
| **TablePlus** | GUI nhẹ, đẹp cho PostgreSQL | https://tableplus.com/ |

### 2.2. Công cụ phát triển & quản lý phiên bản

| Công cụ | Mục đích |
|---------|----------|
| **Git + GitHub/GitLab** | Quản lý phiên bản cho file SQL |
| **Docker + Docker Compose** | Đóng gói database thành container |
| **VSCode** | Soạn thảo SQL (extension: PostgreSQL, SQLTools) |
| **Liquibase / Flyway** | Quản lý migration phiên bản (nâng cao) |

### 2.3. Công cụ triển khai Cloud

| Công cụ | Mục đích |
|---------|----------|
| **Docker Hub / GitHub Container Registry** | Lưu trữ image Docker |
| **AWS RDS / GCP Cloud SQL / Azure Database** | Database managed cloud |
| **AWS ECS / GCP Cloud Run / Azure Container Instances** | Chạy container trên cloud |
| **Terraform / Pulumi** | Infrastructure as Code (IaC) |
| **GitHub Actions / GitLab CI** | CI/CD pipeline |

---

## 3. Thiết kế Database

### 3.1. Quy trình thiết kế

```
Bước 1: Phân tích nghiệp vụ
  ↓
Bước 2: Vẽ ERD (Entity-Relationship Diagram)
  ↓
Bước 3: Xác định bảng, cột, kiểu dữ liệu
  ↓
Bước 4: Xác định khóa chính, khóa ngoại, ràng buộc
  ↓
Bước 5: Tối ưu Index, Partition (nếu cần)
  ↓
Bước 6: Viết script DDL (Data Definition Language)
  ↓
Bước 7: Viết script Seed Data
  ↓
Bước 8: Kiểm thử với Docker local
  ↓
Bước 9: Đóng gói & Triển khai lên Cloud
```

### 3.2. Sơ đồ thực thể - quan hệ (ERD)

Dưới đây là sơ đồ quan hệ giữa các bảng trong hệ thống:

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
        ├──────────────→│ QueueStatus  │               │
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
│                   UserAccount                             │
│  (username, password_hash, role, reference_id)            │
│  role = 'doctor' → reference_id → Doctor.doctor_id       │
│  role = 'patient' → reference_id → Patient.patient_id    │
│  role = 'admin'  → reference_id = 0                      │
└──────────────────────────────────────────────────────────┘
```

### 3.3. Danh sách bảng

| # | Bảng | Mô tả | Số cột |
|---|------|-------|--------|
| 1 | Department | Phòng ban / Khoa | 4 |
| 2 | Doctor | Bác sĩ | 7 |
| 3 | Patient | Bệnh nhân | 14 |
| 4 | Appointment | Cuộc hẹn | 8 |
| 5 | PatientWorkflow | Luồng công việc | 10 |
| 6 | QueueStatus | Trạng thái hàng đợi | 6 |
| 7 | Equipment | Thiết bị y tế | 5 |
| 8 | Event | Sự kiện | 6 |
| 9 | UserAccount | Tài khoản người dùng | 6 |

### 3.4. Chi tiết từng bảng

#### 3.4.1. Department (Phòng ban)

```sql
CREATE TABLE Department (
    department_id   SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    floor           INT,
    location        VARCHAR(100)
);
```

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| department_id | SERIAL | PRIMARY KEY | ID tự tăng |
| department_name | VARCHAR(100) | NOT NULL | Tên khoa |
| floor | INT | | Tầng |
| location | VARCHAR(100) | | Vị trí |

#### 3.4.2. Doctor (Bác sĩ)

```sql
CREATE TABLE Doctor (
    doctor_id            SERIAL PRIMARY KEY,
    department_id        INT NOT NULL REFERENCES Department(department_id),
    full_name            VARCHAR(100) NOT NULL,
    specialty            VARCHAR(100),
    consultation_duration INT,
    status               doctor_status DEFAULT 'Available',
    popularity_score     DECIMAL(3,2)
);
```

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| doctor_id | SERIAL | PRIMARY KEY | ID tự tăng |
| department_id | INT | FK → Department, NOT NULL | Khoa trực thuộc |
| full_name | VARCHAR(100) | NOT NULL | Họ tên |
| specialty | VARCHAR(100) | | Chuyên khoa |
| consultation_duration | INT | | Thời gian khám (phút) |
| status | doctor_status | DEFAULT 'Available' | Available / Busy / Leave |
| popularity_score | DECIMAL(3,2) | | Điểm phổ biến (0.00-9.99) |

#### 3.4.3. Patient (Bệnh nhân)

```sql
CREATE TABLE Patient (
    patient_id             SERIAL PRIMARY KEY,
    full_name              VARCHAR(100) NOT NULL,
    gender                 patient_gender,
    date_of_birth          DATE,
    phone                  VARCHAR(20),
    insurance_type         insurance_type DEFAULT 'Service',
    patient_category       patient_category DEFAULT 'Adult',
    first_visit            BOOLEAN DEFAULT TRUE,
    preferred_doctor_id    INT REFERENCES Doctor(doctor_id),
    doctor_preference_level INT,
    chronic_disease        TEXT,
    allergy                TEXT,
    symptom                TEXT,
    priority               priority_level DEFAULT 'Routine',
    arrival_time           TIMESTAMP
);
```

#### 3.4.4. Appointment (Cuộc hẹn)

```sql
CREATE TABLE Appointment (
    appointment_id   SERIAL PRIMARY KEY,
    patient_id       INT NOT NULL REFERENCES Patient(patient_id),
    doctor_id        INT NOT NULL REFERENCES Doctor(doctor_id),
    appointment_time TIMESTAMP,
    visit_type       visit_type DEFAULT 'Service',
    estimated_wait   INT,
    status           appointment_status DEFAULT 'Scheduled'
);
```

#### 3.4.5. PatientWorkflow (Luồng công việc)

```sql
CREATE TABLE PatientWorkflow (
    workflow_id       SERIAL PRIMARY KEY,
    appointment_id    INT NOT NULL REFERENCES Appointment(appointment_id),
    planned_order     INT,
    actual_order      INT,
    step_type         step_type,
    department_id     INT REFERENCES Department(department_id),
    room_name         VARCHAR(100),
    estimated_duration INT,
    estimated_wait    INT,
    status            step_status DEFAULT 'Pending',
    completed_at      TIMESTAMP
);
```

#### 3.4.6. QueueStatus (Hàng đợi)

```sql
CREATE TABLE QueueStatus (
    queue_id        SERIAL PRIMARY KEY,
    department_id   INT REFERENCES Department(department_id),
    doctor_id       INT REFERENCES Doctor(doctor_id),
    waiting_patient INT DEFAULT 0,
    average_wait    INT DEFAULT 0,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.4.7. Equipment (Thiết bị)

```sql
CREATE TABLE Equipment (
    equipment_id   SERIAL PRIMARY KEY,
    department_id  INT REFERENCES Department(department_id),
    equipment_name VARCHAR(100),
    status         equipment_status DEFAULT 'Working',
    utilization    DECIMAL(5,2) DEFAULT 0.00
);
```

#### 3.4.8. Event (Sự kiện)

```sql
CREATE TABLE Event (
    event_id      SERIAL PRIMARY KEY,
    patient_id    INT REFERENCES Patient(patient_id),
    department_id INT REFERENCES Department(department_id),
    equipment_id  INT REFERENCES Equipment(equipment_id),
    event_type    event_type,
    message       TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.4.9. UserAccount (Tài khoản)

```sql
CREATE TABLE UserAccount (
    user_id       SERIAL PRIMARY KEY,
    username      VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL CHECK (role IN ('doctor', 'patient', 'admin')),
    reference_id  INT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.5. Các kiểu ENUM

```sql
CREATE TYPE doctor_status      AS ENUM ('Available', 'Busy', 'Leave');
CREATE TYPE patient_gender     AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE insurance_type     AS ENUM ('Insurance', 'Service');
CREATE TYPE patient_category   AS ENUM ('Adult', 'Child', 'Senior', 'VIP');
CREATE TYPE priority_level     AS ENUM ('Routine', 'Urgent', 'Emergency');
CREATE TYPE visit_type         AS ENUM ('Insurance', 'Service');
CREATE TYPE appointment_status AS ENUM ('Scheduled', 'Waiting', 'In Progress', 'Completed', 'Cancelled');
CREATE TYPE step_type          AS ENUM ('Registration', 'Clinical Examination', 'Blood Test', ...);
CREATE TYPE step_status        AS ENUM ('Pending', 'In Progress', 'Completed', 'Skipped');
CREATE TYPE equipment_status   AS ENUM ('Working', 'Maintenance', 'Broken');
CREATE TYPE event_type         AS ENUM ('EquipmentBroken', 'DoctorLeave', 'EmergencyPatient', ...);
```

### 3.6. Index

```sql
-- Index cho khóa ngoại
CREATE INDEX idx_doctor_department       ON Doctor(department_id);
CREATE INDEX idx_appointment_patient     ON Appointment(patient_id);
CREATE INDEX idx_appointment_doctor      ON Appointment(doctor_id);
CREATE INDEX idx_workflow_appointment    ON PatientWorkflow(appointment_id);
CREATE INDEX idx_event_patient           ON Event(patient_id);

-- Index cho cột thường xuyên truy vấn
CREATE INDEX idx_appointment_status      ON Appointment(status);
CREATE INDEX idx_workflow_status         ON PatientWorkflow(status);
CREATE INDEX idx_useraccount_username    ON UserAccount(username);
```

---

## 4. Quy tắc viết Code SQL

### 4.1. Quy tắc đặt tên

| Đối tượng | Quy tắc | Ví dụ |
|-----------|---------|-------|
| Bảng | PascalCase, số ít | `Doctor`, `Patient`, `Appointment` |
| Cột | snake_case | `full_name`, `department_id` |
| Khóa chính | `<table>_id` | `doctor_id`, `patient_id` |
| Khóa ngoại | `<referenced_table>_id` | `department_id`, `doctor_id` |
| Index | `idx_<table>_<column>` | `idx_doctor_department` |
| ENUM | snake_case | `doctor_status`, `priority_level` |
| Giá trị ENUM | PascalCase | `'In Progress'`, `'EquipmentBroken'` |

### 4.2. Cấu trúc file SQL

Mỗi file SQL cần có:

```sql
-- ==========================================
-- HEADER: Tên file, mô tả, ngày tạo
-- ==========================================

-- ==========================================
-- 1. ENUM TYPES
-- ==========================================

-- ==========================================
-- 2. TABLES (theo thứ tự khóa ngoại)
-- ==========================================

-- ==========================================
-- 3. INDEXES
-- ==========================================

-- ==========================================
-- 4. SEED DATA
-- ==========================================
```

### 4.3. Comment code

```sql
-- Comment cho từng bảng
CREATE TABLE Doctor (
    doctor_id            SERIAL PRIMARY KEY,  -- Khóa chính tự tăng
    department_id        INT NOT NULL         -- FK → Department
                         REFERENCES Department(department_id),
    full_name            VARCHAR(100) NOT NULL, -- Họ tên bác sĩ
    status               doctor_status        -- Trạng thái: Available / Busy / Leave
                         DEFAULT 'Available'
);
```

### 4.4. Migration (Quản lý thay đổi)

Khi cần thay đổi cấu trúc database, **KHÔNG sửa trực tiếp file init_schema.sql** đã chạy. Thay vào đó:

1. Tạo file migration mới: `V002_add_column.sql`
2. Đánh số thứ tự: `V001_...`, `V002_...`, `V003_...`
3. Ghi rõ ngày tháng và người thực hiện

```sql
-- ==========================================
-- Migration: V002
-- Ngày: 2026-07-18
-- Người thực hiện: Nguyen Van A
-- Mô tả: Thêm cột email cho bảng Doctor
-- ==========================================

ALTER TABLE Doctor ADD COLUMN email VARCHAR(100);
```

### 4.5. Ví dụ truy vấn chuẩn

```sql
-- 1. Luôn dùng alias cho bảng
SELECT d.full_name, dep.department_name
FROM Doctor d
JOIN Department dep ON d.department_id = dep.department_id;

-- 2. Dùng tham số ($1, $2) thay vì nối chuỗi (tránh SQL injection)
-- (Áp dụng trong code Go)
db.QueryRow("SELECT * FROM Doctor WHERE doctor_id = $1", id)

-- 3. Sắp xếp logic: WHERE → GROUP BY → HAVING → ORDER BY → LIMIT
SELECT p.full_name, COUNT(a.appointment_id) AS total_appointments
FROM Patient p
JOIN Appointment a ON p.patient_id = a.patient_id
WHERE a.status = 'Completed'
GROUP BY p.patient_id
HAVING COUNT(a.appointment_id) > 5
ORDER BY total_appointments DESC;
```

---

## 5. Đóng gói & Triển khai lên Cloud

### 5.1. Đóng gói với Docker

#### Dockerfile cho PostgreSQL (tùy chỉnh)

```dockerfile
# Dockerfile.postgres
FROM postgres:16

# Copy script khởi tạo
COPY init_schema.sql /docker-entrypoint-initdb.d/01_init_schema.sql
COPY seed_data.sql /docker-entrypoint-initdb.d/02_seed_data.sql

# Copy script migration
COPY migrations/ /docker-entrypoint-initdb.d/migrations/
```

#### Docker Compose (đã có sẵn)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    container_name: hospital-db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 123456
      POSTGRES_DB: hospital_ai
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init_schema.sql:/docker-entrypoint-initdb.d/01_init_schema.sql
      - ./database/seed_data.sql:/docker-entrypoint-initdb.d/02_seed_data.sql

volumes:
  postgres_data:
```

### 5.2. Triển khai lên Cloud

#### Lựa chọn 1: Dùng Database Managed Service (Khuyên dùng)

| Cloud Provider | Dịch vụ | Chi phí (thấp nhất) |
|---------------|---------|-------------------|
| **AWS** | Amazon RDS for PostgreSQL | ~$15/tháng (db.t4g.micro) |
| **GCP** | Cloud SQL for PostgreSQL | ~$10/tháng (db-f1-micro) |
| **Azure** | Azure Database for PostgreSQL | ~$10/tháng (B1ms) |

**Các bước triển khai với AWS RDS:**

```bash
# Bước 1: Tạo RDS instance qua AWS CLI
aws rds create-db-instance \
    --db-instance-identifier hospital-db \
    --db-instance-class db.t4g.micro \
    --engine postgres \
    --engine-version 16 \
    --master-username postgres \
    --master-user-password 123456 \
    --allocated-storage 20 \
    --publicly-accessible

# Bước 2: Lấy endpoint
aws rds describe-db-instances \
    --db-instance-identifier hospital-db \
    --query 'DBInstances[0].Endpoint.Address'

# Bước 3: Kết nối và chạy schema
psql -h <endpoint> -U postgres -d hospital_ai -f database/init_schema.sql
psql -h <endpoint> -U postgres -d hospital_ai -f database/seed_data.sql
```

#### Lựa chọn 2: Dùng Docker trên VPS

```bash
# Bước 1: SSH vào VPS
ssh user@your-vps-ip

# Bước 2: Cài Docker
curl -fsSL https://get.docker.com | sh

# Bước 3: Clone project
git clone https://github.com/your-org/VAIC_2026.git
cd VAIC_2026

# Bước 4: Chạy database
docker compose up -d postgres

# Bước 5: Kiểm tra
docker ps
docker exec -it hospital-db psql -U postgres -d hospital_ai -c "\dt"
```

#### Lựa chọn 3: Dùng Docker Compose đầy đủ (cả backend + frontend)

```yaml
# docker-compose.prod.yml
services:
  postgres:
    image: postgres:16
    container_name: hospital-db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: hospital_ai
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init_schema.sql:/docker-entrypoint-initdb.d/01_init_schema.sql
      - ./database/seed_data.sql:/docker-entrypoint-initdb.d/02_seed_data.sql
    networks:
      - hospital-network

  backend:
    build: ./backend
    container_name: hospital-backend
    restart: always
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: hospital_ai
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    networks:
      - hospital-network

  frontend:
    build: ./frontend
    container_name: hospital-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - hospital-network

volumes:
  postgres_data:

networks:
  hospital-network:
    driver: bridge
```

### 5.3. Bảo mật khi triển khai

```bash
# 1. Không dùng mật khẩu mặc định
# Trong file .env.production:
DB_PASSWORD=YourStrongPasswordHere!@#123

# 2. Giới hạn IP truy cập (AWS Security Group)
# Chỉ cho phép IP của backend server
aws ec2 authorize-security-group-ingress \
    --group-name hospital-db-sg \
    --protocol tcp \
    --port 5432 \
    --cidr <backend-server-ip>/32

# 3. Bật SSL cho kết nối database
# Trong connection string:
connStr := "host=... port=5432 user=... password=... dbname=... sslmode=require"

# 4. Backup tự động
# AWS RDS: Tự động backup (mặc định giữ 7 ngày)
# VPS: Dùng cron job
0 2 * * * docker exec hospital-db pg_dump -U postgres hospital_ai > /backup/hospital_ai_$(date +\%Y\%m\%d).sql
```

### 5.4. Cập nhật cấu hình kết nối cho Backend

Khi triển khai lên cloud, cập nhật file `.env`:

```env
# .env.production
DB_HOST=<rds-endpoint-or-vps-ip>
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YourStrongPassword
DB_NAME=hospital_ai
FPT_AI_KEY=your_fpt_ai_key
```

---

## 6. CI/CD cho Database

### 6.1. GitHub Actions — Tự động chạy migration

```yaml
# .github/workflows/database-migration.yml
name: Database Migration

on:
  push:
    branches: [main]
    paths:
      - 'database/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run migrations
        env:
          DB_HOST: ${{ secrets.DB_HOST }}
          DB_PORT: ${{ secrets.DB_PORT }}
          DB_USER: ${{ secrets.DB_USER }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
          DB_NAME: ${{ secrets.DB_NAME }}
        run: |
          for file in database/migrations/*.sql; do
            echo "Running migration: $file"
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" \
              -U "$DB_USER" -d "$DB_NAME" -f "$file"
          done
```

### 6.2. GitHub Actions — Build & Push Docker image

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker images
        run: docker compose -f docker-compose.prod.yml build

      - name: Push to registry
        run: |
          docker tag hospital-backend:latest ghcr.io/your-org/hospital-backend:latest
          docker push ghcr.io/your-org/hospital-backend:latest

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/VAIC_2026
            git pull
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d
```

---

## 7. Checklist triển khai

### 7.1. Trước khi triển khai

- [ ] Đã kiểm tra tất cả file SQL chạy thành công trên local
- [ ] Đã thay đổi mật khẩu mặc định (không dùng `123456`)
- [ ] Đã cấu hình SSL cho kết nối database
- [ ] Đã kiểm tra index đầy đủ cho các truy vấn thường dùng
- [ ] Đã backup dữ liệu (nếu có dữ liệu thật)
- [ ] Đã kiểm tra dung lượng ổ đĩa (tối thiểu 20GB cho PostgreSQL)
- [ ] Đã cấu hình firewall / security group chỉ cho phép IP cần thiết

### 7.2. Sau khi triển khai

- [ ] Kiểm tra kết nối database từ backend
- [ ] Kiểm tra API login hoạt động
- [ ] Kiểm tra WebSocket realtime
- [ ] Kiểm tra backup tự động
- [ ] Monitor CPU/RAM của database instance
- [ ] Cấu hình alert khi database sắp đầy (>80% dung lượng)

### 7.3. Các lệnh kiểm tra nhanh

```bash
# Kiểm tra kết nối
psql -h <host> -U postgres -d hospital_ai -c "SELECT version();"

# Kiểm tra số lượng bảng
psql -h <host> -U postgres -d hospital_ai -c "\dt"

# Kiểm tra dung lượng
psql -h <host> -U postgres -d hospital_ai -c "
SELECT pg_size_pretty(pg_database_size('hospital_ai')) AS db_size;
"

# Kiểm tra kết nối đang active
psql -h <host> -U postgres -d hospital_ai -c "
SELECT count(*) FROM pg_stat_activity WHERE datname = 'hospital_ai';
"
```

---

## Phụ lục

### A. Cấu trúc thư mục database

```
VAIC_2026/database/
├── README.md                  # Hướng dẫn sử dụng (tiếng Việt)
├── DATABASE_ARCHITECTURE.md   # Tài liệu kiến trúc (file này)
├── init_schema.sql            # Script tạo bảng, enum, index
├── seed_data.sql              # Dữ liệu mẫu
├── generate_mock.py           # Script sinh dữ liệu giả
└── migrations/                # (Tạo sau) Các file migration
    ├── V001__initial_schema.sql
    └── V002__add_email_column.sql
```

### B. Tài liệu tham khảo

- [PostgreSQL 16 Documentation](https://www.postgresql.org/docs/16/)
- [Docker PostgreSQL Image](https://hub.docker.com/_/postgres)
- [AWS RDS PostgreSQL](https://aws.amazon.com/rds/postgresql/)
- [GCP Cloud SQL PostgreSQL](https://cloud.google.com/sql/docs/postgres)
- [Azure Database for PostgreSQL](https://azure.microsoft.com/en-us/services/postgresql/)

---

> **Tác giả:** VAIC 2026 Team  
> **Công nghệ:** PostgreSQL 16, Docker, Go (Fiber), React (Vite)  
> **Phiên bản tài liệu:** 1.0 — 18/07/2026
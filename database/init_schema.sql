-- ==========================================
-- HOSPITAL COORDINATION SYSTEM DATABASE
-- PostgreSQL Version
-- ==========================================

-- Drop database if exists (cannot drop while connected to it, so we use a different approach)
-- Instead, we connect to the default 'postgres' database first, then create
-- The docker-compose already sets POSTGRES_DB=hospital_ai, so the DB is created automatically.
-- We just need to ensure we start fresh by dropping public schema objects.

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA IF NOT EXISTS public;

-- ==========================================
-- ENUM TYPES (PostgreSQL uses CREATE TYPE for enums)
-- ==========================================

CREATE TYPE doctor_status AS ENUM ('Available', 'Busy', 'Leave');
CREATE TYPE patient_gender AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE insurance_type AS ENUM ('Insurance', 'Service');
CREATE TYPE patient_category AS ENUM ('Adult', 'Child', 'Senior', 'VIP');
CREATE TYPE priority_level AS ENUM ('Routine', 'Urgent', 'Emergency');
CREATE TYPE visit_type AS ENUM ('Insurance', 'Service');
CREATE TYPE appointment_status AS ENUM ('Scheduled', 'Waiting', 'In Progress', 'Completed', 'Cancelled');
CREATE TYPE step_type AS ENUM (
    'Registration',
    'Clinical Examination',
    'Blood Test',
    'Urine Test',
    'Ultrasound',
    'ECG',
    'X-Ray',
    'CT Scan',
    'MRI',
    'Endoscopy',
    'Return Doctor',
    'Payment',
    'Pharmacy',
    'Discharge'
);
CREATE TYPE step_status AS ENUM ('Pending', 'In Progress', 'Completed', 'Skipped');
CREATE TYPE equipment_status AS ENUM ('Working', 'Maintenance', 'Broken');
CREATE TYPE event_type AS ENUM (
    'EquipmentBroken',
    'DoctorLeave',
    'EmergencyPatient',
    'QueueOverloaded',
    'WorkflowUpdated'
);

-- ==========================================
-- 1. DEPARTMENT
-- ==========================================

CREATE TABLE Department (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    floor INT,
    location VARCHAR(100)
);

-- ==========================================
-- 2. DOCTOR
-- ==========================================

CREATE TABLE Doctor (
    doctor_id SERIAL PRIMARY KEY,
    department_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    consultation_duration INT,
    status doctor_status DEFAULT 'Available',
    popularity_score DECIMAL(3,2),
    FOREIGN KEY (department_id)
        REFERENCES Department(department_id)
);

-- ==========================================
-- 3. PATIENT
-- ==========================================

CREATE TABLE Patient (
    patient_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    gender patient_gender,
    date_of_birth DATE,
    phone VARCHAR(20),
    insurance_type insurance_type DEFAULT 'Service',
    patient_category patient_category DEFAULT 'Adult',
    first_visit BOOLEAN DEFAULT TRUE,
    preferred_doctor_id INT,
    doctor_preference_level INT,
    chronic_disease TEXT,
    allergy TEXT,
    symptom TEXT,
    priority priority_level DEFAULT 'Routine',
    arrival_time TIMESTAMP,
    FOREIGN KEY (preferred_doctor_id)
        REFERENCES Doctor(doctor_id)
);

-- ==========================================
-- 4. APPOINTMENT
-- ==========================================

CREATE TABLE Appointment (
    appointment_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_time TIMESTAMP,
    visit_type visit_type DEFAULT 'Service',
    estimated_wait INT,
    status appointment_status DEFAULT 'Scheduled',
    FOREIGN KEY (patient_id)
        REFERENCES Patient(patient_id),
    FOREIGN KEY (doctor_id)
        REFERENCES Doctor(doctor_id)
);

-- ==========================================
-- 5. PATIENT WORKFLOW
-- ==========================================

CREATE TABLE PatientWorkflow (
    workflow_id SERIAL PRIMARY KEY,
    appointment_id INT NOT NULL,
    planned_order INT,
    actual_order INT,
    step_type step_type,
    department_id INT,
    room_name VARCHAR(100),
    estimated_duration INT,
    estimated_wait INT,
    status step_status DEFAULT 'Pending',
    completed_at TIMESTAMP,
    FOREIGN KEY (appointment_id)
        REFERENCES Appointment(appointment_id),
    FOREIGN KEY (department_id)
        REFERENCES Department(department_id)
);

-- ==========================================
-- 6. QUEUE
-- ==========================================

CREATE TABLE QueueStatus (
    queue_id SERIAL PRIMARY KEY,
    department_id INT,
    doctor_id INT,
    waiting_patient INT DEFAULT 0,
    average_wait INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id)
        REFERENCES Department(department_id),
    FOREIGN KEY (doctor_id)
        REFERENCES Doctor(doctor_id)
);

-- ==========================================
-- 7. EQUIPMENT
-- ==========================================

CREATE TABLE Equipment (
    equipment_id SERIAL PRIMARY KEY,
    department_id INT,
    equipment_name VARCHAR(100),
    status equipment_status DEFAULT 'Working',
    utilization DECIMAL(5,2) DEFAULT 0.00,
    FOREIGN KEY (department_id)
        REFERENCES Department(department_id)
);

-- ==========================================
-- 8. EVENT
-- ==========================================

CREATE TABLE Event (
    event_id SERIAL PRIMARY KEY,
    patient_id INT,
    department_id INT,
    equipment_id INT,
    event_type event_type,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id)
        REFERENCES Patient(patient_id),
    FOREIGN KEY (department_id)
        REFERENCES Department(department_id),
    FOREIGN KEY (equipment_id)
        REFERENCES Equipment(equipment_id)
);

-- ==========================================
-- 9. USER ACCOUNT (for authentication)
-- ==========================================

CREATE TABLE UserAccount (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('doctor', 'patient', 'admin')),
    reference_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add check constraint to ensure reference_id references the correct table based on role
-- (PostgreSQL doesn't support dynamic foreign keys, so we enforce at application layer)

-- ==========================================
-- INDEXES for performance
-- ==========================================

CREATE INDEX idx_doctor_department ON Doctor(department_id);
CREATE INDEX idx_patient_preferred_doctor ON Patient(preferred_doctor_id);
CREATE INDEX idx_appointment_patient ON Appointment(patient_id);
CREATE INDEX idx_appointment_doctor ON Appointment(doctor_id);
CREATE INDEX idx_appointment_status ON Appointment(status);
CREATE INDEX idx_workflow_appointment ON PatientWorkflow(appointment_id);
CREATE INDEX idx_workflow_status ON PatientWorkflow(status);
CREATE INDEX idx_queue_department ON QueueStatus(department_id);
CREATE INDEX idx_queue_doctor ON QueueStatus(doctor_id);
CREATE INDEX idx_equipment_department ON Equipment(department_id);
CREATE INDEX idx_event_patient ON Event(patient_id);
CREATE INDEX idx_event_department ON Event(department_id);
CREATE INDEX idx_event_equipment ON Event(equipment_id);
CREATE INDEX idx_useraccount_username ON UserAccount(username);
CREATE INDEX idx_useraccount_role ON UserAccount(role);
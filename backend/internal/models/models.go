package models

import (
	"time"
)

type Patient struct {
	PatientID             int       `gorm:"primaryKey;column:patient_id" json:"patient_id"`
	FullName              string    `gorm:"column:full_name" json:"full_name"`
	Gender                string    `gorm:"column:gender" json:"gender"`
	DateOfBirth           time.Time `gorm:"column:date_of_birth" json:"date_of_birth"`
	Phone                 string    `gorm:"column:phone" json:"phone"`
	InsuranceType         string    `gorm:"column:insurance_type" json:"insurance_type"`
	PatientCategory       string    `gorm:"column:patient_category" json:"patient_category"`
	FirstVisit            bool      `gorm:"column:first_visit" json:"first_visit"`
	PreferredDoctorID     *int      `gorm:"column:preferred_doctor_id" json:"preferred_doctor_id"`
	DoctorPreferenceLevel *int      `gorm:"column:doctor_preference_level" json:"doctor_preference_level"`
	ChronicDisease        *string   `gorm:"column:chronic_disease" json:"chronic_disease"`
	Allergy               *string   `gorm:"column:allergy" json:"allergy"`
	Symptom               *string   `gorm:"column:symptom" json:"symptom"`
	Priority              string    `gorm:"column:priority" json:"priority"`
	ArrivalTime           time.Time `gorm:"column:arrival_time" json:"arrival_time"`
}

func (Patient) TableName() string {
	return "patient"
}

type PatientWorkflow struct {
	WorkflowID        int       `gorm:"primaryKey;column:workflow_id" json:"workflow_id"`
	AppointmentID     int       `gorm:"column:appointment_id" json:"appointment_id"`
	PlannedOrder      int       `gorm:"column:planned_order" json:"planned_order"`
	ActualOrder       *int      `gorm:"column:actual_order" json:"actual_order"`
	StepType          string    `gorm:"column:step_type" json:"step_type"`
	DepartmentID      *int      `gorm:"column:department_id" json:"department_id"`
	RoomName          *string   `gorm:"column:room_name" json:"room_name"`
	EstimatedDuration *int      `gorm:"column:estimated_duration" json:"estimated_duration"`
	EstimatedWait     *int      `gorm:"column:estimated_wait" json:"estimated_wait"`
	Status            string    `gorm:"column:status" json:"status"`
	CompletedAt       *time.Time `gorm:"column:completed_at" json:"completed_at"`
}

func (PatientWorkflow) TableName() string {
	return "patientworkflow"
}

type Appointment struct {
	AppointmentID   int       `gorm:"primaryKey;column:appointment_id" json:"appointment_id"`
	PatientID       int       `gorm:"column:patient_id" json:"patient_id"`
	DoctorID        int       `gorm:"column:doctor_id" json:"doctor_id"`
	AppointmentTime time.Time `gorm:"column:appointment_time" json:"appointment_time"`
	VisitType       string    `gorm:"column:visit_type" json:"visit_type"`
	EstimatedWait   *int      `gorm:"column:estimated_wait" json:"estimated_wait"`
	Status          string    `gorm:"column:status" json:"status"`
}

func (Appointment) TableName() string {
	return "appointment"
}

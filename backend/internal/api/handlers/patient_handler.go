package handlers

import (
	"fmt"
	"time"

	"careflow-backend/internal/config"
	"careflow-backend/internal/models"
	"github.com/gofiber/fiber/v2"
)

type PatientHandler struct{}

func NewPatientHandler() *PatientHandler {
	return &PatientHandler{}
}

// PatientDTO matches the JSON structure expected by the React Frontend
type PatientDTO struct {
	PatientCode string `json:"patient_code"`
	Name        string `json:"name"`
	Age         int    `json:"age"`
	Gender      string `json:"gender"`
	Status      string `json:"status"`
	Location    string `json:"location"`
	Time        string `json:"time"`
}

type TimelineStepDTO struct {
	Step      int    `json:"step"`
	Title     string `json:"title"`
	Status    string `json:"status"`
	Time      string `json:"time"`
	IsOptimal bool   `json:"is_optimal"`
}

func calculateAge(birthdate time.Time) int {
	now := time.Now()
	age := now.Year() - birthdate.Year()
	if now.YearDay() < birthdate.YearDay() {
		age--
	}
	return age
}

func mapToPatientDTO(p models.Patient) PatientDTO {
	// Calculate age
	age := calculateAge(p.DateOfBirth)

	// Translate Gender
	genderStr := "Khác"
	if p.Gender == "Male" {
		genderStr = "Nam"
	} else if p.Gender == "Female" {
		genderStr = "Nữ"
	}

	return PatientDTO{
		PatientCode: fmt.Sprintf("BN-%04d", p.PatientID),
		Name:        p.FullName,
		Age:         age,
		Gender:      genderStr,
		Status:      p.Priority, // Map priority to status for now, or could query current workflow
		Location:    "Đang phân luồng",
		Time:        p.ArrivalTime.Format("15:04"),
	}
}

func (h *PatientHandler) GetPatients(c *fiber.Ctx) error {
	var patients []models.Patient
	
	result := config.DB.Find(&patients)
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch patients",
		})
	}

	var dtos []PatientDTO
	for _, p := range patients {
		dtos = append(dtos, mapToPatientDTO(p))
	}

	return c.JSON(dtos)
}

func (h *PatientHandler) GetPatientPathway(c *fiber.Ctx) error {
	patientCode := c.Params("id")
	
	// patientCode is like "BN-0001"
	var patientID int
	fmt.Sscanf(patientCode, "BN-%04d", &patientID)

	var patient models.Patient
	if err := config.DB.Where("patient_id = ?", patientID).First(&patient).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Patient not found",
		})
	}

	// Get appointment
	var appointment models.Appointment
	config.DB.Where("patient_id = ?", patientID).Order("appointment_time desc").First(&appointment)

	var timeline []models.PatientWorkflow
	if appointment.AppointmentID > 0 {
		config.DB.Where("appointment_id = ?", appointment.AppointmentID).Order("planned_order asc").Find(&timeline)
	}

	var timelineDTOs []TimelineStepDTO
	for _, t := range timeline {
		room := ""
		if t.RoomName != nil {
			room = *t.RoomName
		}
		
		statusStr := "pending"
		if t.Status == "Completed" {
			statusStr = "completed"
		} else if t.Status == "In Progress" {
			statusStr = "current"
		}

		timeStr := ""
		if t.CompletedAt != nil {
			timeStr = "Hoàn thành lúc " + t.CompletedAt.Format("15:04")
		} else if t.EstimatedWait != nil && *t.EstimatedWait > 0 {
			timeStr = fmt.Sprintf("Đang đợi (Dự kiến: %d phút)", *t.EstimatedWait)
		} else {
			timeStr = "Chờ xếp lịch"
		}

		timelineDTOs = append(timelineDTOs, TimelineStepDTO{
			Step:      t.PlannedOrder,
			Title:     t.StepType + " - " + room,
			Status:    statusStr,
			Time:      timeStr,
			IsOptimal: true,
		})
	}

	return c.JSON(fiber.Map{
		"patient": mapToPatientDTO(patient),
		"timeline": timelineDTOs,
	})
}

func (h *PatientHandler) GetStats(c *fiber.Ctx) error {
	var totalPatients int64
	config.DB.Model(&models.Patient{}).Count(&totalPatients)

	// Mocking time-series and distribution data for charts
	hourlyData := []map[string]interface{}{
		{"time": "07:00", "patients": 45, "optimal": 40},
		{"time": "08:00", "patients": 82, "optimal": 70},
		{"time": "09:00", "patients": 120, "optimal": 105},
		{"time": "10:00", "patients": int(totalPatients) + 100, "optimal": int(totalPatients) + 90},
		{"time": "11:00", "patients": 90, "optimal": 85},
		{"time": "12:00", "patients": 40, "optimal": 38},
	}

	departmentData := []map[string]interface{}{
		{"name": "Lâm sàng", "value": 45},
		{"name": "X-Quang", "value": 25},
		{"name": "Siêu âm", "value": 15},
		{"name": "Huyết học", "value": 15},
	}

	return c.JSON(fiber.Map{
		"total_patients": totalPatients,
		"wait_time_avg":  24, // 24 minutes
		"utilization":    92, // 92% capacity
		"hourly_traffic": hourlyData,
		"dept_distribution": departmentData,
	})
}

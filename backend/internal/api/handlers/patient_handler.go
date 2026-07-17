package handlers

import (
	"careflow-backend/internal/config"
	"careflow-backend/internal/models"
	"github.com/gofiber/fiber/v2"
)

type PatientHandler struct{}

func NewPatientHandler() *PatientHandler {
	return &PatientHandler{}
}

func (h *PatientHandler) GetPatients(c *fiber.Ctx) error {
	var patients []models.Patient
	
	// Query SQLite through GORM
	result := config.DB.Find(&patients)
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch patients",
		})
	}

	return c.JSON(patients)
}

func (h *PatientHandler) GetPatientPathway(c *fiber.Ctx) error {
	patientCode := c.Params("id")
	
	var patient models.Patient
	if err := config.DB.Where("patient_code = ?", patientCode).First(&patient).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Patient not found",
		})
	}

	var timeline []models.TimelineStep
	if err := config.DB.Where("patient_id = ?", patient.ID).Order("step asc").Find(&timeline).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch pathway",
		})
	}

	return c.JSON(fiber.Map{
		"patient": patient,
		"timeline": timeline,
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

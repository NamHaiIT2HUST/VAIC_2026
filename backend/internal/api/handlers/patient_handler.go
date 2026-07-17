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

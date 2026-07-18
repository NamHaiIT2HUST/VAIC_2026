package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"careflow-backend/internal/config"
	"careflow-backend/internal/models"
	"careflow-backend/internal/websocket"
	"github.com/gofiber/fiber/v2"
)

type PatientHandler struct{
	hub *websocket.Hub
}

func NewPatientHandler(hub *websocket.Hub) *PatientHandler {
	return &PatientHandler{
		hub: hub,
	}
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
	age := calculateAge(p.DateOfBirth)

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
		Status:      string(p.Priority),
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
	
	var patientID int
	fmt.Sscanf(patientCode, "BN-%04d", &patientID)

	var patient models.Patient
	if err := config.DB.Where("patient_id = ?", patientID).First(&patient).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Patient not found",
		})
	}

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

		stepMap := map[string]string{
			"Clinical Examination": "Khám lâm sàng",
			"Ultrasound": "Siêu âm",
			"X-Ray": "X-Quang",
			"Blood Test": "Xét nghiệm Sinh hóa",
		}
		
		stepName := string(t.StepType)
		if val, ok := stepMap[stepName]; ok {
			stepName = val
		}

		timelineDTOs = append(timelineDTOs, TimelineStepDTO{
			Step:      t.PlannedOrder,
			Title:     stepName + " - " + room,
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
		"wait_time_avg":  24,
		"utilization":    92,
		"hourly_traffic": hourlyData,
		"dept_distribution": departmentData,
	})
}

type PrescribeRequest struct {
	Services []string `json:"services"`
}

type AIResponse struct {
	PatientID string `json:"patient_id"`
	Tasks     []struct {
		StationCode       string `json:"station_code"`
		StationName       string `json:"station_name"`
		EstimatedWait     int    `json:"estimated_wait"`
		EstimatedDuration int    `json:"estimated_duration"`
	} `json:"tasks"`
}

func (h *PatientHandler) PrescribeServices(c *fiber.Ctx) error {
	patientCode := c.Params("id")
	var req PrescribeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	payload := map[string]interface{}{
		"patient_id": patientCode,
		"required_services": req.Services,
	}
	payloadBytes, _ := json.Marshal(payload)
	
	resp, err := http.Post("http://localhost:8000/api/ai/schedule", "application/json", bytes.NewBuffer(payloadBytes))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "AI Engine unavailable"})
	}
	defer resp.Body.Close()
	
	var aiResp AIResponse
	if err := json.NewDecoder(resp.Body).Decode(&aiResp); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Invalid AI response"})
	}
	
	var patientID int
	fmt.Sscanf(patientCode, "BN-%04d", &patientID)
	
	var appointment models.Appointment
	config.DB.Where("patient_id = ?", patientID).Order("appointment_time desc").First(&appointment)
	
	if appointment.AppointmentID == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "No appointment found"})
	}
	
	// Execute SQL directly to delete pending statuses to avoid struct issues
	config.DB.Exec("DELETE FROM patientworkflow WHERE appointment_id = ? AND status = 'Pending'", appointment.AppointmentID)
	
	currentOrder := 5
	for _, task := range aiResp.Tasks {
		stepType := "Clinical Examination"
		room := "Phòng " + task.StationCode
		if task.StationCode == "ultrasound" { stepType = "Ultrasound"; room = "Phòng Siêu âm" }
		if task.StationCode == "xray" { stepType = "X-Ray"; room = "Phòng X-Quang" }
		if task.StationCode == "lab" { stepType = "Blood Test"; room = "Phòng xét nghiệm Sinh hóa" }
		
		// Use Exec for quick raw inserts
		config.DB.Exec(`INSERT INTO patientworkflow (appointment_id, planned_order, step_type, room_name, estimated_wait, status) VALUES (?, ?, ?, ?, ?, 'Pending')`, 
			appointment.AppointmentID, currentOrder, stepType, room, task.EstimatedWait)
		currentOrder++
	}
	
	if h.hub != nil {
		h.hub.Broadcast([]byte(fmt.Sprintf(`{"type": "WORKFLOW_UPDATED", "patient_code": "%s"}`, patientCode)))
	}
	
	return c.JSON(fiber.Map{"status": "success", "message": "AI Re-scheduled"})
}

func (h *PatientHandler) CallPatient(c *fiber.Ctx) error {
	patientCode := c.Params("id")
	message := fmt.Sprintf("Mời bệnh nhân %s vào phòng khám", patientCode)
	
	// Create audio
	audioURL := ""
	if h.hub != nil {
		h.hub.Broadcast([]byte(fmt.Sprintf(`{"type": "CALL_PATIENT", "patient_code": "%s", "message": "%s", "audio_url": "%s"}`, patientCode, message, audioURL)))
	}
	return c.JSON(fiber.Map{"status": "success", "message": "Called patient"})
}

func (h *PatientHandler) CompletePatientStep(c *fiber.Ctx) error {
	patientCode := c.Params("id")
	
	var patientID int
	fmt.Sscanf(patientCode, "BN-%04d", &patientID)
	
	var appointment models.Appointment
	config.DB.Where("patient_id = ?", patientID).Order("appointment_time desc").First(&appointment)
	
	if appointment.AppointmentID != 0 {
		// Complete the current 'Pending' or 'In Progress' step
		config.DB.Exec("UPDATE patientworkflow SET status = 'Completed', completed_at = CURRENT_TIMESTAMP WHERE appointment_id = ? AND status IN ('Pending', 'In Progress') AND planned_order = (SELECT MIN(planned_order) FROM patientworkflow WHERE appointment_id = ? AND status IN ('Pending', 'In Progress'))", appointment.AppointmentID, appointment.AppointmentID)
		
		if h.hub != nil {
			h.hub.Broadcast([]byte(fmt.Sprintf(`{"type": "WORKFLOW_UPDATED", "patient_code": "%s"}`, patientCode)))
		}
	}
	
	return c.JSON(fiber.Map{"status": "success", "message": "Step completed"})
}

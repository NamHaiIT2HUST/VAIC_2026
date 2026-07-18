package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"careflow-backend/internal/config"
	"careflow-backend/internal/models"
	"careflow-backend/internal/services"
	"careflow-backend/internal/websocket"

	"github.com/gofiber/fiber/v2"
)

type EventHandler struct {
	hub        *websocket.Hub
	fptService *services.FptService
}

func NewEventHandler(hub *websocket.Hub, fptService *services.FptService) *EventHandler {
	return &EventHandler{hub: hub, fptService: fptService}
}

type EventRequest struct {
	Type     string `json:"type"`
	Message  string `json:"message"`
	AudioURL string `json:"audio_url,omitempty"`
	// Tuỳ chọn: sự cố thời gian thực áp cho bệnh nhân/phòng nào.
	PatientCode string `json:"patient_code,omitempty"` // vd "BN-0005"; trống -> mặc định BN-0005 cho demo
	Station     string `json:"station,omitempty"`      // vd "xray" (phòng hỏng/quá tải)
	StationStatus string `json:"station_status,omitempty"` // "DOWN" | "BUSY" | "OVERLOADED"
}

func (h *EventHandler) TriggerEvent(c *fiber.Ctx) error {
	var event EventRequest
	if err := c.BodyParser(&event); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	if event.Type == "ALERT" || event.Type == "INFO" {
		if event.Type == "ALERT" {
			// Điều phối lại thời gian thực qua AI Engine (chạy nền, không chặn response).
			ev := event // copy cho goroutine
			go h.reoptimizeForEvent(ev)
		}

		// Phát thanh thông báo bằng FPT AI TTS.
		audioURL, err := h.fptService.TextToSpeech(event.Message)
		if err != nil {
			log.Println("FPT AI TTS Error:", err)
		} else {
			event.AudioURL = audioURL
		}
	}

	payload, _ := json.Marshal(event)
	h.hub.Broadcast(payload)

	return c.JSON(fiber.Map{
		"status":  "Event triggered and broadcasted",
		"details": event,
	})
}

// reoptimizeForEvent: đọc lộ trình hiện tại của BN từ DB -> gửi kèm trạng thái phòng
// bị sự cố sang AI Engine -> ghi lại lộ trình mới đã tối ưu.
func (h *EventHandler) reoptimizeForEvent(event EventRequest) {
	patientCode := event.PatientCode
	if patientCode == "" {
		patientCode = "BN-0005" // giữ demo hoạt động khi sự kiện không kèm mã BN
	}

	var patientID int
	fmt.Sscanf(patientCode, "BN-%d", &patientID)

	var appointment models.Appointment
	config.DB.Where("patient_id = ?", patientID).Order("appointment_time desc").First(&appointment)
	if appointment.AppointmentID == 0 {
		log.Println("reoptimize: không tìm thấy lịch hẹn cho", patientCode)
		return
	}

	// Lấy đúng các bước còn Pending (chính là tập sẽ ghi đè lại) làm kế hoạch hiện tại.
	var pending []models.PatientWorkflow
	config.DB.Where("appointment_id = ? AND status = 'Pending'", appointment.AppointmentID).
		Order("planned_order asc").Find(&pending)
	if len(pending) == 0 {
		return
	}

	type adjustTask struct {
		StationCode string `json:"station_code"`
	}
	tasks := make([]adjustTask, 0, len(pending))
	for _, w := range pending {
		tasks = append(tasks, adjustTask{StationCode: codeFromStepType(w.StepType)})
	}

	// Trạng thái phòng thời gian thực (equipment status).
	currentState := map[string]string{}
	if event.Station != "" {
		status := event.StationStatus
		if status == "" {
			status = "DOWN"
		}
		currentState[event.Station] = status
	}

	reqBody := map[string]interface{}{
		"patient_plan": map[string]interface{}{
			"patient_id": patientCode,
			"tasks":      tasks,
		},
		"current_state": currentState,
		"current_time":  0,
	}
	bodyBytes, _ := json.Marshal(reqBody)

	aiEngineURL := os.Getenv("AI_ENGINE_URL")
	if aiEngineURL == "" {
		aiEngineURL = "http://localhost:8000"
	}
	resp, err := http.Post(aiEngineURL+"/api/ai/adjust", "application/json", bytes.NewBuffer(bodyBytes))
	if err != nil {
		log.Println("Failed to call AI Engine:", err)
		return
	}
	defer resp.Body.Close()

	var adjustResp struct {
		Adjusted bool `json:"adjusted"`
		NewPlan  struct {
			Tasks []struct {
				StationCode       string `json:"station_code"`
				StationName       string `json:"station_name"`
				EstimatedWait     int    `json:"estimated_wait"`
				EstimatedDuration int    `json:"estimated_duration"`
			} `json:"tasks"`
		} `json:"new_plan"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&adjustResp); err != nil {
		log.Println("reoptimize: decode lỗi:", err)
		return
	}
	if !adjustResp.Adjusted || len(adjustResp.NewPlan.Tasks) == 0 {
		log.Println("reoptimize: không có thay đổi cho", patientCode)
		return
	}

	log.Println("AI Engine đã điều phối lại lộ trình cho", patientCode)

	// Ghi lại các bước Pending theo thứ tự & thời gian chờ mới.
	config.DB.Exec("DELETE FROM patientworkflow WHERE appointment_id = ? AND status = 'Pending'", appointment.AppointmentID)

	currentOrder := 5
	for _, task := range adjustResp.NewPlan.Tasks {
		stepType, room := stationInfo(task.StationCode)
		config.DB.Exec(
			`INSERT INTO patientworkflow (appointment_id, planned_order, step_type, room_name, estimated_wait, status)
			 VALUES (?, ?, ?, ?, ?, 'Pending')`,
			appointment.AppointmentID, currentOrder, stepType, room, task.EstimatedWait)
		currentOrder++
	}

	if h.hub != nil {
		h.hub.Broadcast([]byte(fmt.Sprintf(`{"type": "WORKFLOW_UPDATED", "patient_code": "%s"}`, patientCode)))
	}
}

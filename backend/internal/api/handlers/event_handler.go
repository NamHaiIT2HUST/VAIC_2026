package handlers

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"

	"careflow-backend/internal/config"
	"careflow-backend/internal/services"
	"careflow-backend/internal/websocket"

	"github.com/gofiber/fiber/v2"
)

type EventHandler struct {
	hub        *websocket.Hub
	fptService *services.FptService
}

func NewEventHandler(hub *websocket.Hub, fptService *services.FptService) *EventHandler {
	return &EventHandler{
		hub:        hub,
		fptService: fptService,
	}
}

type EventRequest struct {
	Type     string `json:"type"`
	Message  string `json:"message"`
	AudioURL string `json:"audio_url,omitempty"`
}

func (h *EventHandler) TriggerEvent(c *fiber.Ctx) error {
	var event EventRequest
	if err := c.BodyParser(&event); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	// Trigger FPT AI TTS for announcements
	if event.Type == "ALERT" || event.Type == "INFO" {
		// --- AI OPTIMIZATION CALL ---
		if event.Type == "ALERT" {
			go func() {
				log.Println("Received ALERT event. Will re-route via AI...")
				// Fake fetching current tasks
				payloadStr := `{
					"patient_plan": {
						"patient_id": "BN-0005",
						"tasks": [
							{"station_code": "lab", "estimated_wait": 0, "estimated_duration": 15},
							{"station_code": "xray", "estimated_wait": 15, "estimated_duration": 15},
							{"station_code": "ultrasound", "estimated_wait": 30, "estimated_duration": 15}
						]
					},
					"current_state": {}
				}`
				
				resp, err := http.Post("http://localhost:8000/api/ai/adjust", "application/json", bytes.NewBuffer([]byte(payloadStr)))
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
				
				if err := json.NewDecoder(resp.Body).Decode(&adjustResp); err == nil && adjustResp.Adjusted {
					log.Println("AI Engine swapped order. Updating DB...")
					
					// Update Database Workflow
					// We find appointment ID 5 (BN-0005)
					appointmentID := 5 
					// Delete all pending
					config.DB.Exec("DELETE FROM patientworkflow WHERE appointment_id = ? AND status = 'Pending'", appointmentID)
					
					currentOrder := 5
					for _, task := range adjustResp.NewPlan.Tasks {
						room := "Phòng " + task.StationCode // mock
						if task.StationCode == "ultrasound" { room = "Siêu âm" }
						if task.StationCode == "xray" { room = "X-Quang" }
						if task.StationCode == "lab" { room = "Xét nghiệm Sinh hóa" }
						
						config.DB.Exec(`INSERT INTO patientworkflow (appointment_id, planned_order, step_type, room_name, estimated_wait, status) VALUES (?, ?, ?, ?, ?, 'Pending')`, 
							appointmentID, currentOrder, room, room, task.EstimatedWait)
						currentOrder++
					}
					// Notify
					h.hub.Broadcast([]byte(`{"type": "WORKFLOW_UPDATED", "patient_code": "BN-0005"}`))
				}
			}()
		}
		// ----------------------------------------

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

package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"

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
				// We call the Python FastAPI server here
				log.Println("Received ALERT event. Will re-route via AI...")
				
				payloadStr := `{"patient_id":"BN-0005", "required_services":["lab", "xray", "ultrasound", "consultation"]}`
				resp, err := http.Post("http://localhost:8000/api/ai/schedule", "application/json", bytes.NewBuffer([]byte(payloadStr)))
				if err != nil {
					log.Println("Failed to call AI Engine:", err)
					return
				}
				defer resp.Body.Close()
				body, _ := io.ReadAll(resp.Body)
				log.Println("AI Engine responded with new optimal route:", string(body))
				
				// In a full implementation, we would parse this JSON and update the PatientWorkflow table in PostgreSQL here.
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

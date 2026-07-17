package handlers

import (
	"encoding/json"
	"log"

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
		// --- MOCK AI OPTIMIZATION IN DATABASE ---
		// Find patient BN-2405 and update their timeline and current location
		if event.Type == "ALERT" {
			go func() {
				// Simulate AI computation delay (since frontend waits 3s, we do it instantly here or delay 2s)
				// Actually we can just update it immediately. The next fetch will have new data.
				var p models.Patient
				if err := config.DB.Where("patient_code = ?", "BN-2405").First(&p).Error; err == nil {
					// Update Patient Location
					p.Location = "Phòng Siêu Âm 01"
					p.Time = "10:18 (Re-routed)"
					config.DB.Save(&p)
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

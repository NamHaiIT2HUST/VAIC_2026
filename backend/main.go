package main

import (
	"encoding/json"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
	"github.com/joho/godotenv"
)

// Hub maintains the set of active clients and broadcasts messages to the clients.
type Hub struct {
	// Registered clients.
	clients map[*websocket.Conn]bool

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *websocket.Conn

	// Unregister requests from clients.
	unregister chan *websocket.Conn
}

func newHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *websocket.Conn),
		unregister: make(chan *websocket.Conn),
		clients:    make(map[*websocket.Conn]bool),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				client.Close()
			}
		case message := <-h.broadcast:
			for client := range h.clients {
				if err := client.WriteMessage(websocket.TextMessage, message); err != nil {
					client.Close()
					delete(h.clients, client)
				}
			}
		}
	}
}

func main() {
	// Load .env file for FPT_AI_KEY
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found or error loading it")
	}

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept",
	}))

	hub := newHub()
	go hub.run()

	// Middleware to check if it's a websocket upgrade
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		// Register the client
		hub.register <- c
		defer func() {
			hub.unregister <- c
		}()

		for {
			mt, msg, err := c.ReadMessage()
			if err != nil {
				log.Println("read:", err)
				break
			}
			log.Printf("recv: %s (type %d)", msg, mt)
			// Broadcast the received message to all clients
			hub.broadcast <- msg
		}
	}))

	// API to trigger events from Dashboard
	app.Post("/api/events/trigger", func(c *fiber.Ctx) error {
		// Parse request body for event details
		var event struct {
			Type    string `json:"type"`
			Message string `json:"message"`
			AudioURL string `json:"audio_url,omitempty"`
		}

		if err := c.BodyParser(&event); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Cannot parse JSON",
			})
		}

		// Call FPT AI TTS API if it's an ALERT or INFO
		if event.Type == "ALERT" || event.Type == "INFO" {
			audioURL, err := CallFptTTS(event.Message)
			if err != nil {
				log.Println("FPT AI TTS Error:", err)
			} else {
				event.AudioURL = audioURL
			}
		}

		// Prepare updated payload
		payload, _ := json.Marshal(event)

		// Broadcast event to all connected websocket clients
		hub.broadcast <- payload

		return c.JSON(fiber.Map{
			"status":  "Event triggered",
			"details": event,
		})
	})

	log.Fatal(app.Listen(":8080"))
}

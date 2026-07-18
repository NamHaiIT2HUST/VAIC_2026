package main

import (
	"fmt"
	"log"

	"careflow-backend/internal/api/handlers"
	"careflow-backend/internal/config"
	"careflow-backend/internal/services"
	"careflow-backend/internal/websocket"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	fiberws "github.com/gofiber/websocket/v2"
)

func main() {
	cfg := config.LoadConfig()

	// Initialize SQLite Database with GORM
	config.InitDB()

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept",
	}))

	hub := websocket.NewHub()
	go hub.Run()

	fptService := services.NewFptService(cfg.FptApiKey)
	eventHandler := handlers.NewEventHandler(hub, fptService)

	// WebSocket Route
	app.Use("/ws", func(c *fiber.Ctx) error {
		if fiberws.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws", fiberws.New(func(c *fiberws.Conn) {
		hub.HandleConnection(c)
	}))

	patientHandler := handlers.NewPatientHandler(hub)

	// API Routes
	app.Get("/api/v1/patients", patientHandler.GetPatients)
	app.Get("/api/v1/patients/:id/pathway", patientHandler.GetPatientPathway)
	app.Post("/api/v1/patients/:id/prescribe", patientHandler.PrescribeServices)
	app.Get("/api/v1/stats", patientHandler.GetStats)
	app.Post("/api/v1/events/trigger", eventHandler.TriggerEvent)

	log.Printf("Server starting on port %s", cfg.Port)
	log.Fatal(app.Listen(fmt.Sprintf(":%s", cfg.Port)))
}

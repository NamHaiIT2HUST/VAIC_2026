package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
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

	// Database connection
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "123456")
	dbName := getEnv("DB_NAME", "hospital_ai")

	connStr := "host=" + dbHost + " port=" + dbPort + " user=" + dbUser + " password=" + dbPassword + " dbname=" + dbName + " sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Println("Warning: Could not ping database:", err)
	} else {
		log.Println("Connected to PostgreSQL database successfully")
	}

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
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

	// ==========================================
	// LOGIN API
	// ==========================================
	app.Post("/api/login", func(c *fiber.Ctx) error {
		var req struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}

		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid request body",
			})
		}

		if req.Username == "" || req.Password == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Username and password are required",
			})
		}

		// Query user account
		var user struct {
			UserID       int
			Username     string
			PasswordHash string
			Role         string
			ReferenceID  int
		}

		err := db.QueryRow(
			"SELECT user_id, username, password_hash, role, reference_id FROM UserAccount WHERE username = $1",
			req.Username,
		).Scan(&user.UserID, &user.Username, &user.PasswordHash, &user.Role, &user.ReferenceID)

		if err == sql.ErrNoRows {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid username or password",
			})
		}
		if err != nil {
			log.Println("Database error:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Internal server error",
			})
		}

		// Verify password
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid username or password",
			})
		}

		// Get full name based on role
		var fullName string
		if user.Role == "doctor" {
			db.QueryRow("SELECT full_name FROM Doctor WHERE doctor_id = $1", user.ReferenceID).Scan(&fullName)
		} else if user.Role == "patient" {
			db.QueryRow("SELECT full_name FROM Patient WHERE patient_id = $1", user.ReferenceID).Scan(&fullName)
		}

		return c.JSON(fiber.Map{
			"user_id":      user.UserID,
			"username":     user.Username,
			"role":         user.Role,
			"reference_id": user.ReferenceID,
			"full_name":    fullName,
		})
	})

	// ==========================================
	// HEALTH CHECK
	// ==========================================
	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
		})
	})

	// API to trigger events from Dashboard
	app.Post("/api/events/trigger", func(c *fiber.Ctx) error {
		// Parse request body for event details
		var event struct {
			Type     string `json:"type"`
			Message  string `json:"message"`
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

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
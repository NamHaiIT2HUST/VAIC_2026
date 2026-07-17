package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	FptApiKey string
	Port      string
}

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found or error loading it, using system environment variables")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return &Config{
		FptApiKey: os.Getenv("FPT_AI_KEY"),
		Port:      port,
	}
}

package config

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var err error
	dsn := "host=127.0.0.1 user=postgres password=123456 dbname=hospital_ai port=5433 sslmode=disable TimeZone=Asia/Ho_Chi_Minh"
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// We don't auto-migrate because the schema and seed data are already provided by init_schema.sql and seed_data.sql.
	log.Println("Connected to PostgreSQL successfully.")
}

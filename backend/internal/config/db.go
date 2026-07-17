package config

import (
	"log"

	"careflow-backend/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var err error
	DB, err = gorm.Open(sqlite.Open("careflow.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto Migrate
	DB.AutoMigrate(&models.Patient{}, &models.TimelineStep{})

	// Seed Data
	seedMockData()
}

func seedMockData() {
	var count int64
	DB.Model(&models.Patient{}).Count(&count)
	if count == 0 {
		log.Println("Seeding Mock Data...")
		patients := []models.Patient{
			{PatientCode: "BN-2401", Name: "Nguyễn Văn A", Age: 41, Gender: "Nam", Status: "Cận lâm sàng", Location: "P. X-Quang 02", Time: "10:15"},
			{PatientCode: "BN-2402", Name: "Trần Thị B", Age: 36, Gender: "Nữ", Status: "Cận lâm sàng", Location: "P. Lấy máu 01", Time: "10:20"},
			{PatientCode: "BN-2403", Name: "Lê Văn C", Age: 51, Gender: "Nam", Status: "Chờ khám", Location: "P. Nội 01", Time: "10:30"},
			{PatientCode: "BN-2404", Name: "Phạm Thị D", Age: 26, Gender: "Nữ", Status: "Tiếp nhận", Location: "Quầy số 3", Time: "10:45"},
			{PatientCode: "BN-2405", Name: "Hoàng Văn E", Age: 45, Gender: "Nam", Status: "Đang khám", Location: "Phòng Khám 01", Time: "10:00"},
			{PatientCode: "BN-2406", Name: "Ngô Thị F", Age: 32, Gender: "Nữ", Status: "Chờ khám", Location: "Phòng Khám 01", Time: "10:15"},
			{PatientCode: "BN-2407", Name: "Đinh Văn G", Age: 60, Gender: "Nam", Status: "Chờ KQ Cận lâm sàng", Location: "Phòng Khám 01", Time: "10:30"},
		}
		for _, p := range patients {
			DB.Create(&p)
		}

		// Mock Timeline for BN-2405 (The key demo patient)
		var p5 models.Patient
		DB.Where("patient_code = ?", "BN-2405").First(&p5)

		timelines := []models.TimelineStep{
			{PatientID: p5.ID, Step: 1, Title: "Lấy Máu (Huyết học)", Status: "completed", Time: "Đã xong (Đang phân tích 45p)", IsOptimal: true},
			{PatientID: p5.ID, Step: 2, Title: "Chụp X-Quang", Status: "current", Time: "Đang đợi (Dự kiến: 5 phút)", IsOptimal: true},
			{PatientID: p5.ID, Step: 3, Title: "Siêu âm Ổ bụng", Status: "pending", Time: "Tối ưu: Chờ sau X-Quang", IsOptimal: false},
			{PatientID: p5.ID, Step: 4, Title: "Gặp Bác sĩ chẩn đoán", Status: "pending", Time: "Quay lại khi đủ 3 kết quả", IsOptimal: false},
		}
		for _, t := range timelines {
			DB.Create(&t)
		}
		log.Println("Seeding complete.")
	}
}

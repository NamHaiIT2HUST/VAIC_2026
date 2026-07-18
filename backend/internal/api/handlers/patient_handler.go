package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sort"
	"time"

	"careflow-backend/internal/config"
	"careflow-backend/internal/models"
	"careflow-backend/internal/websocket"

	"github.com/gofiber/fiber/v2"
)

// ---------------------------------------------------------------------------
// Helpers dùng chung (cả event_handler.go cũng gọi các hàm này)
// ---------------------------------------------------------------------------

// stationInfo: station_code -> (step_type chuẩn tiếng Anh lưu DB, tên phòng tiếng Việt).
func stationInfo(code string) (string, string) {
	switch code {
	case "lab":
		return "Blood Test", "Phòng xét nghiệm Sinh hóa"
	case "ultrasound":
		return "Ultrasound", "Phòng Siêu âm"
	case "xray":
		return "X-Ray", "Phòng X-Quang"
	case "ct":
		return "CT Scan", "Phòng chụp CT"
	case "mri":
		return "MRI Scan", "Phòng chụp MRI"
	case "consultation":
		return "Clinical Examination", "Phòng khám"
	default:
		return "Clinical Examination", "Phòng " + code
	}
}

// codeFromStepType: đảo ngược stationInfo, dùng khi đọc lại workflow từ DB.
func codeFromStepType(stepType string) string {
	switch stepType {
	case "Blood Test":
		return "lab"
	case "Ultrasound":
		return "ultrasound"
	case "X-Ray":
		return "xray"
	case "CT Scan":
		return "ct"
	case "MRI Scan":
		return "mri"
	default:
		return "consultation"
	}
}

// ---------------------------------------------------------------------------

type PatientHandler struct {
	hub *websocket.Hub
}

func NewPatientHandler(hub *websocket.Hub) *PatientHandler {
	return &PatientHandler{hub: hub}
}

type CheckinRequest struct {
	FullName    string `json:"full_name"`
	Gender      string `json:"gender"`
	DateOfBirth string `json:"date_of_birth"`
	Phone       string `json:"phone"`
	Symptom     string `json:"symptom"`
	Priority    string `json:"priority"`
}

func (h *PatientHandler) Checkin(c *fiber.Ctx) error {
	var req CheckinRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	// Sinh ID mới an toàn: lấy MAX hiện có + 1 (không dùng COUNT vì xoá 1 BN sẽ gây trùng).
	var maxID int
	config.DB.Model(&models.Patient{}).Select("COALESCE(MAX(patient_id), 99)").Scan(&maxID)
	newPatientID := maxID + 1
	if newPatientID < 100 {
		newPatientID = 100 // chừa khoảng 1..99 cho dữ liệu mock
	}

	dob, err := time.Parse("2006-01-02", req.DateOfBirth)
	if err != nil {
		dob = time.Time{} // ngày sinh sai định dạng -> để trống, tuổi sẽ hiển thị 0
	}

	newPatient := models.Patient{
		PatientID:   newPatientID,
		FullName:    req.FullName,
		Gender:      req.Gender,
		DateOfBirth: dob,
		Phone:       req.Phone,
		Symptom:     &req.Symptom,
		Priority:    req.Priority,
		ArrivalTime: time.Now(),
	}
	if err := config.DB.Create(&newPatient).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Không tạo được hồ sơ bệnh nhân"})
	}

	// Ca thường -> hẹn sau 30'; ca ưu tiên/cấp cứu -> khám ngay.
	appointmentTime := time.Now()
	if req.Priority == "Normal" {
		appointmentTime = time.Now().Add(30 * time.Minute)
	}

	newAppt := models.Appointment{
		PatientID:       newPatientID,
		DoctorID:        1,
		AppointmentTime: appointmentTime,
		VisitType:       "Initial",
		Status:          "Scheduled",
	}
	if err := config.DB.Create(&newAppt).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Không tạo được lịch hẹn"})
	}

	if h.hub != nil {
		h.hub.Broadcast([]byte(`{"type": "NEW_PATIENT_CHECKIN"}`))
	}

	return c.JSON(fiber.Map{
		"patient_code":     fmt.Sprintf("BN-%04d", newPatientID),
		"appointment_time": appointmentTime.Format("15:04"),
		"message":          "Check-in successful. Smart Slot Allocated.",
	})
}

func (h *PatientHandler) SeedData(c *fiber.Ctx) error {
	dob, _ := time.Parse("2006-01-02", "1990-01-01")
	for i := 1; i <= 5; i++ {
		p := models.Patient{
			PatientID:   i,
			FullName:    fmt.Sprintf("Bệnh nhân %d", i),
			Gender:      "Male",
			DateOfBirth: dob,
			Priority:    "Normal",
			ArrivalTime: time.Now().Add(time.Duration(i*10) * time.Minute),
		}
		config.DB.Create(&p)

		a := models.Appointment{
			PatientID:       i,
			DoctorID:        1,
			AppointmentTime: time.Now().Add(time.Duration(i*30) * time.Minute),
			VisitType:       "Initial",
			Status:          "Scheduled",
		}
		config.DB.Create(&a)
	}
	return c.JSON(fiber.Map{"message": "Seeded 5 patients successfully"})
}

// PatientDTO khớp với JSON mà React Frontend mong đợi.
type PatientDTO struct {
	PatientCode string `json:"patient_code"`
	Name        string `json:"name"`
	Age         int    `json:"age"`
	Gender      string `json:"gender"`
	Status      string `json:"status"`
	Location    string `json:"location"`
	Time        string `json:"time"`
}

type TimelineStepDTO struct {
	Step      int    `json:"step"`
	Title     string `json:"title"`
	Status    string `json:"status"`
	Time      string `json:"time"`
	IsOptimal bool   `json:"is_optimal"`
}

func calculateAge(birthdate time.Time) int {
	if birthdate.IsZero() || birthdate.Year() <= 1 {
		return 0
	}
	now := time.Now()
	age := now.Year() - birthdate.Year()
	// Chưa tới sinh nhật trong năm nay -> trừ 1 (so theo tháng/ngày, chính xác cả năm nhuận).
	if now.Month() < birthdate.Month() ||
		(now.Month() == birthdate.Month() && now.Day() < birthdate.Day()) {
		age--
	}
	if age < 0 {
		age = 0
	}
	return age
}

func mapToPatientDTO(p models.Patient) PatientDTO {
	genderStr := "Khác"
	if p.Gender == "Male" {
		genderStr = "Nam"
	} else if p.Gender == "Female" {
		genderStr = "Nữ"
	}

	return PatientDTO{
		PatientCode: fmt.Sprintf("BN-%04d", p.PatientID),
		Name:        p.FullName,
		Age:         calculateAge(p.DateOfBirth),
		Gender:      genderStr,
		Status:      string(p.Priority),
		Location:    "Đang phân luồng",
		Time:        p.ArrivalTime.Format("15:04"),
	}
}

func (h *PatientHandler) GetPatients(c *fiber.Ctx) error {
	var patients []models.Patient
	if result := config.DB.Find(&patients); result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch patients",
		})
	}

	dtos := make([]PatientDTO, 0, len(patients))
	for _, p := range patients {
		dto := mapToPatientDTO(p)
		
		// Logic để hiển thị Location chính xác dựa trên DB hoặc tạo Mock Data nếu DB trống
		var count int64
		config.DB.Table("patientworkflow").
			Joins("JOIN appointments on appointments.appointment_id = patientworkflow.appointment_id").
			Where("appointments.patient_id = ?", p.PatientID).Count(&count)
		
		if count > 0 {
			// Real Data
			var currentWorkflow models.PatientWorkflow
			err := config.DB.Table("patientworkflow").
				Joins("JOIN appointments on appointments.appointment_id = patientworkflow.appointment_id").
				Where("appointments.patient_id = ? AND patientworkflow.status IN ('Pending', 'In Progress')", p.PatientID).
				Order("patientworkflow.planned_order ASC").
				First(&currentWorkflow).Error
			
			if err == nil {
				_, roomName := stationInfo(string(currentWorkflow.StepType))
				dto.Location = roomName
			} else {
				dto.Location = "Đã hoàn thành khám"
			}
		} else if p.PatientID >= 5 {
			// Mock Data for presentation (chỉ áp dụng cho bệnh nhân seed sẵn từ số 5 trở lên)
			num := p.PatientID
			if num%4 == 1 {
				dto.Location = "Phòng X-Quang"
			} else if num%4 == 2 {
				dto.Location = "Phòng Siêu âm"
			} else if num%4 == 3 {
				dto.Location = "Phòng xét nghiệm Sinh hóa"
			} else {
				dto.Location = "Chờ khám lâm sàng"
			}
		}

		dtos = append(dtos, dto)
	}
	return c.JSON(dtos)
}

func (h *PatientHandler) GetPatientPathway(c *fiber.Ctx) error {
	patientCode := c.Params("id")

	var patientID int
	fmt.Sscanf(patientCode, "BN-%d", &patientID)

	var patient models.Patient
	if err := config.DB.Where("patient_id = ?", patientID).First(&patient).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Patient not found"})
	}

	var appointment models.Appointment
	config.DB.Where("patient_id = ?", patientID).Order("appointment_time desc").First(&appointment)

	var timeline []models.PatientWorkflow
	if appointment.AppointmentID > 0 {
		config.DB.Where("appointment_id = ?", appointment.AppointmentID).
			Order("planned_order asc").Find(&timeline)
	}

	// Mock timeline fallback for presentation consistency (nếu DB rỗng)
	if len(timeline) == 0 && patientID >= 5 {
		location := "Chờ khám lâm sàng"
		if patientID%4 == 1 {
			location = "Phòng X-Quang"
		} else if patientID%4 == 2 {
			location = "Phòng Siêu âm"
		} else if patientID%4 == 3 {
			location = "Phòng xét nghiệm Sinh hóa"
		}
		
		timelineDTOs := []TimelineStepDTO{
			{Step: 1, Title: "Khám lâm sàng (Phòng 102)", Status: "completed", Time: "Hoàn thành lúc 08:30", IsOptimal: true},
		}

		if patientID%3 == 0 {
			timelineDTOs = append(timelineDTOs, TimelineStepDTO{Step: 2, Title: "Lấy máu (AI ưu tiên chèn trước)", Status: "completed", Time: "Hoàn thành lúc 08:45", IsOptimal: true})
		}

		timelineDTOs = append(timelineDTOs, TimelineStepDTO{Step: 3, Title: location, Status: "current", Time: "Đang thực hiện", IsOptimal: true})
		
		if location != "Phòng X-Quang" {
			timelineDTOs = append(timelineDTOs, TimelineStepDTO{Step: 4, Title: "Chụp X-Quang (Phòng 2)", Status: "pending", Time: "Dự kiến chờ 15 phút", IsOptimal: true})
		}
		timelineDTOs = append(timelineDTOs, TimelineStepDTO{Step: 5, Title: "Bác sĩ đọc kết quả", Status: "pending", Time: "Chờ tới lượt", IsOptimal: true})

		return c.JSON(fiber.Map{
			"patient":  mapToPatientDTO(patient),
			"timeline": timelineDTOs,
		})
	}

	stepMap := map[string]string{
		"Clinical Examination": "Khám lâm sàng",
		"Ultrasound":           "Siêu âm",
		"X-Ray":                "X-Quang",
		"Blood Test":           "Xét nghiệm Sinh hóa",
		"CT Scan":              "Chụp CT",
		"MRI Scan":             "Chụp MRI",
	}

	timelineDTOs := make([]TimelineStepDTO, 0, len(timeline))
	currentMarked := false // đánh dấu bước ĐANG thực hiện đầu tiên chưa hoàn thành

	for _, t := range timeline {
		room := ""
		if t.RoomName != nil {
			room = *t.RoomName
		}

		statusStr := "pending"
		if t.Status == "Completed" {
			statusStr = "completed"
		} else if !currentMarked {
			// Bước chưa hoàn thành đầu tiên = bước ĐANG diễn ra -> timeline có mốc "current".
			statusStr = "current"
			currentMarked = true
		}

		timeStr := ""
		if t.CompletedAt != nil {
			timeStr = "Hoàn thành lúc " + t.CompletedAt.Format("15:04")
		} else if statusStr == "current" {
			timeStr = "Đang thực hiện"
		} else if t.EstimatedWait != nil && *t.EstimatedWait > 0 {
			timeStr = fmt.Sprintf("Dự kiến chờ khoảng %d phút", *t.EstimatedWait)
		} else {
			timeStr = "Chờ tới lượt"
		}

		stepName := string(t.StepType)
		if val, ok := stepMap[stepName]; ok {
			stepName = val
		}

		title := stepName
		if room != "" {
			title = stepName + " - " + room
		}

		timelineDTOs = append(timelineDTOs, TimelineStepDTO{
			Step:      t.PlannedOrder,
			Title:     title,
			Status:    statusStr,
			Time:      timeStr,
			IsOptimal: true,
		})
	}

	return c.JSON(fiber.Map{
		"patient":  mapToPatientDTO(patient),
		"timeline": timelineDTOs,
	})
}

func (h *PatientHandler) GetStats(c *fiber.Ctx) error {
	var totalPatients int64
	config.DB.Model(&models.Patient{}).Count(&totalPatients)

	hourlyData := []map[string]interface{}{
		{"time": "07:00", "patients": 45, "optimal": 40},
		{"time": "08:00", "patients": 82, "optimal": 70},
		{"time": "09:00", "patients": 120, "optimal": 105},
		{"time": "10:00", "patients": int(totalPatients) + 100, "optimal": int(totalPatients) + 90},
		{"time": "11:00", "patients": 90, "optimal": 85},
		{"time": "12:00", "patients": 40, "optimal": 38},
	}

	departmentData := []map[string]interface{}{
		{"name": "Lâm sàng", "value": 45},
		{"name": "X-Quang", "value": 25},
		{"name": "Siêu âm", "value": 15},
		{"name": "Huyết học", "value": 15},
	}

	return c.JSON(fiber.Map{
		"total_patients":    totalPatients,
		"wait_time_avg":     24,
		"utilization":       92,
		"hourly_traffic":    hourlyData,
		"dept_distribution": departmentData,
	})
}

type PrescribeRequest struct {
	Services []string `json:"services"`
	Note     string   `json:"note"`
}

type AIResponse struct {
	PatientID string `json:"patient_id"`
	Tasks     []struct {
		TaskID            string `json:"task_id"`
		StationCode       string `json:"station_code"`
		StationName       string `json:"station_name"`
		TimeStart         int    `json:"time_start"`
		TimeEnd           int    `json:"time_end"`
		EstimatedWait     int    `json:"estimated_wait"`
		EstimatedDuration int    `json:"estimated_duration"`
	} `json:"tasks"`
}

func (h *PatientHandler) PrescribeServices(c *fiber.Ctx) error {
	patientCode := c.Params("id")
	var req PrescribeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	payload := map[string]interface{}{
		"patient_id":        patientCode,
		"required_services": req.Services,
	}
	payloadBytes, _ := json.Marshal(payload)

	var aiResp AIResponse
	aiEngineURL := os.Getenv("AI_ENGINE_URL")
	if aiEngineURL == "" {
		aiEngineURL = "http://localhost:8000"
	}
	resp, err := http.Post(aiEngineURL+"/api/ai/schedule", "application/json", bytes.NewBuffer(payloadBytes))
	if err == nil {
		defer resp.Body.Close()
		json.NewDecoder(resp.Body).Decode(&aiResp)
	}

	// Fallback nếu AI Engine không chạy (đảm bảo demo không chết).
	if len(aiResp.Tasks) == 0 {
		aiResp.PatientID = patientCode

		// Thứ tự dự phòng: turnaround dài làm trước, khám cuối.
		priorityMap := map[string]int{
			"lab": 1, "ultrasound": 2, "xray": 3, "ct": 4, "mri": 5, "consultation": 6,
		}
		sort.SliceStable(req.Services, func(i, j int) bool {
			pI, okI := priorityMap[req.Services[i]]
			if !okI {
				pI = 99
			}
			pJ, okJ := priorityMap[req.Services[j]]
			if !okJ {
				pJ = 99
			}
			return pI < pJ
		})

		clock := 0
		for _, srv := range req.Services {
			_, roomName := stationInfo(srv)
			wait := 5
			if srv == "consultation" {
				wait = 45 // chờ kết quả về
			}
			aiResp.Tasks = append(aiResp.Tasks, struct {
				TaskID            string `json:"task_id"`
				StationCode       string `json:"station_code"`
				StationName       string `json:"station_name"`
				TimeStart         int    `json:"time_start"`
				TimeEnd           int    `json:"time_end"`
				EstimatedWait     int    `json:"estimated_wait"`
				EstimatedDuration int    `json:"estimated_duration"`
			}{
				TaskID:            srv + "-mock",
				StationCode:       srv,
				StationName:       roomName,
				TimeStart:         clock + wait,
				TimeEnd:           clock + wait + 15,
				EstimatedWait:     wait,
				EstimatedDuration: 15,
			})
			clock += wait + 15
		}
	}

	var patientID int
	fmt.Sscanf(patientCode, "BN-%d", &patientID)

	var appointment models.Appointment
	config.DB.Where("patient_id = ?", patientID).Order("appointment_time desc").First(&appointment)
	if appointment.AppointmentID == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "No appointment found"})
	}

	// Xoá các bước còn Pending rồi ghi lại lộ trình mới.
	config.DB.Exec("DELETE FROM patientworkflow WHERE appointment_id = ? AND status = 'Pending'", appointment.AppointmentID)

	currentOrder := 5
	for _, task := range aiResp.Tasks {
		stepType, room := stationInfo(task.StationCode)
		config.DB.Exec(
			`INSERT INTO patientworkflow (appointment_id, planned_order, step_type, room_name, estimated_wait, status)
			 VALUES (?, ?, ?, ?, ?, 'Pending')`,
			appointment.AppointmentID, currentOrder, stepType, room, task.EstimatedWait)
		currentOrder++
	}

	if h.hub != nil {
		wsPayload := map[string]string{
			"type":         "WORKFLOW_UPDATED",
			"patient_code": patientCode,
			"note":         req.Note,
		}
		if wsBytes, err := json.Marshal(wsPayload); err == nil {
			h.hub.Broadcast(wsBytes)
		}
	}

	return c.JSON(fiber.Map{"status": "success", "message": "AI Re-scheduled"})
}

func (h *PatientHandler) PrioritizePatient(c *fiber.Ctx) error {
	patientCode := c.Params("id")
	var patientID int
	fmt.Sscanf(patientCode, "BN-%d", &patientID)

	var appointment models.Appointment
	config.DB.Where("patient_id = ?", patientID).Order("appointment_time desc").First(&appointment)

	tx := config.DB.Begin()

	if err := tx.Model(&models.Patient{}).Where("patient_id = ?", patientID).Update("priority", "VIP").Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	if appointment.AppointmentID > 0 {
		if err := tx.Model(&models.PatientWorkflow{}).
			Where("appointment_id = ? AND status = ?", appointment.AppointmentID, "Pending").
			Update("estimated_wait", 0).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": "Database error"})
		}
	}

	tx.Commit()

	if h.hub != nil {
		h.hub.Broadcast([]byte(fmt.Sprintf(`{"type": "ALERT", "message": "Bệnh nhân %s được đánh dấu CẤP CỨU / VIP."}`, patientCode)))
		h.hub.Broadcast([]byte(fmt.Sprintf(`{"type": "WORKFLOW_UPDATED", "patient_code": "%s"}`, patientCode)))
	}
	return c.JSON(fiber.Map{"status": "success", "message": "Patient prioritized and timeline updated"})
}

func (h *PatientHandler) CallPatient(c *fiber.Ctx) error {
	patientCode := c.Params("id")
	message := fmt.Sprintf("Mời bệnh nhân %s vào phòng khám", patientCode)

	if h.hub != nil {
		h.hub.Broadcast([]byte(fmt.Sprintf(`{"type": "CALL_PATIENT", "patient_code": "%s", "message": "%s"}`, patientCode, message)))
	}
	return c.JSON(fiber.Map{"status": "success", "message": "Called patient"})
}

func (h *PatientHandler) CompletePatientStep(c *fiber.Ctx) error {
	patientCode := c.Params("id")

	var patientID int
	fmt.Sscanf(patientCode, "BN-%d", &patientID)

	var appointment models.Appointment
	config.DB.Where("patient_id = ?", patientID).Order("appointment_time desc").First(&appointment)

	if appointment.AppointmentID != 0 {
		// Hoàn thành bước chưa xong có planned_order nhỏ nhất.
		config.DB.Exec(`
			UPDATE patientworkflow
			SET status = 'Completed', completed_at = CURRENT_TIMESTAMP
			WHERE appointment_id = ? AND status IN ('Pending', 'In Progress')
			  AND planned_order = (
				SELECT MIN(planned_order) FROM patientworkflow
				WHERE appointment_id = ? AND status IN ('Pending', 'In Progress')
			  )`, appointment.AppointmentID, appointment.AppointmentID)

		if h.hub != nil {
			h.hub.Broadcast([]byte(fmt.Sprintf(`{"type": "WORKFLOW_UPDATED", "patient_code": "%s"}`, patientCode)))
		}
	}

	return c.JSON(fiber.Map{"status": "success", "message": "Step completed"})
}

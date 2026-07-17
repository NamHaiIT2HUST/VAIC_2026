package models

import "gorm.io/gorm"

type Patient struct {
	gorm.Model
	PatientCode string `json:"patient_code" gorm:"uniqueIndex"`
	Name        string `json:"name"`
	Age         int    `json:"age"`
	Gender      string `json:"gender"`
	Status      string `json:"status"`
	Location    string `json:"location"`
	Time        string `json:"time"`
}

type TimelineStep struct {
	gorm.Model
	PatientID uint   `json:"patient_id"`
	Step      int    `json:"step"`
	Title     string `json:"title"`
	Status    string `json:"status"`
	Time      string `json:"time"`
	IsOptimal bool   `json:"is_optimal"`
}

package models

import (
	"time"
)

type Prompt struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Text      string    `json:"text" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Session struct {
	ID           string                 `json:"id" gorm:"primaryKey"`
	PromptID     string                 `json:"prompt_id" gorm:"not null"`
	UserID       *string                `json:"user_id,omitempty"`
	Transcription string                `json:"transcription" gorm:"not null"`
	Score        int                    `json:"score" gorm:"not null"`
	AnalysisData map[string]interface{} `json:"analysis_data" gorm:"type:jsonb"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
	
	// Associations
	Prompt *Prompt `json:"prompt,omitempty" gorm:"foreignKey:PromptID"`
}

type User struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Email     string    `json:"email" gorm:"unique;not null"`
	Name      string    `json:"name" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
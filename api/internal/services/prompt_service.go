package services

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"speaktrainer-api/internal/models"
)

type PromptService struct {
	db *gorm.DB
}

func NewPromptService(db *gorm.DB) *PromptService {
	return &PromptService{db: db}
}

func (s *PromptService) GetAllPrompts() ([]models.Prompt, error) {
	var prompts []models.Prompt
	if err := s.db.Find(&prompts).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch prompts: %w", err)
	}
	return prompts, nil
}

func (s *PromptService) GetPromptByID(id string) (*models.Prompt, error) {
	var prompt models.Prompt
	if err := s.db.First(&prompt, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch prompt: %w", err)
	}
	return &prompt, nil
}

func (s *PromptService) GetRandomPrompt() (*models.Prompt, error) {
	var prompts []models.Prompt
	if err := s.db.Find(&prompts).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch prompts: %w", err)
	}

	if len(prompts) == 0 {
		return nil, fmt.Errorf("no prompts available")
	}

	// Seed random generator
	rand.Seed(time.Now().UnixNano())
	randomIndex := rand.Intn(len(prompts))
	
	return &prompts[randomIndex], nil
}

func (s *PromptService) CreatePrompt(text string) (*models.Prompt, error) {
	prompt := &models.Prompt{
		ID:   uuid.New().String(),
		Text: text,
	}

	if err := s.db.Create(prompt).Error; err != nil {
		return nil, fmt.Errorf("failed to create prompt: %w", err)
	}

	return prompt, nil
}

func (s *PromptService) UpdatePrompt(id, text string) (*models.Prompt, error) {
	var prompt models.Prompt
	if err := s.db.First(&prompt, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch prompt: %w", err)
	}

	prompt.Text = text
	if err := s.db.Save(&prompt).Error; err != nil {
		return nil, fmt.Errorf("failed to update prompt: %w", err)
	}

	return &prompt, nil
}

func (s *PromptService) DeletePrompt(id string) error {
	result := s.db.Delete(&models.Prompt{}, "id = ?", id)
	if result.Error != nil {
		return fmt.Errorf("failed to delete prompt: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("prompt not found")
	}
	return nil
}

// Seed database with initial prompts
func (s *PromptService) SeedPrompts() error {
	// Check if prompts already exist
	var count int64
	if err := s.db.Model(&models.Prompt{}).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to count prompts: %w", err)
	}

	if count > 0 {
		return nil // Already seeded
	}

	prompts := []models.Prompt{
		{ID: uuid.New().String(), Text: "Hello world"},
		{ID: uuid.New().String(), Text: "How are you today?"},
		{ID: uuid.New().String(), Text: "The quick brown fox jumps over the lazy dog"},
		{ID: uuid.New().String(), Text: "She sells seashells by the seashore"},
		{ID: uuid.New().String(), Text: "Peter Piper picked a peck of pickled peppers"},
		{ID: uuid.New().String(), Text: "Red leather, yellow leather"},
		{ID: uuid.New().String(), Text: "I scream, you scream, we all scream for ice cream"},
		{ID: uuid.New().String(), Text: "How much wood would a woodchuck chuck"},
		{ID: uuid.New().String(), Text: "Sally sells seashells by the seashore"},
		{ID: uuid.New().String(), Text: "Round the rough and rugged rock the ragged rascal rudely ran"},
		{ID: uuid.New().String(), Text: "Where is the nearest grocery store?"},
	}

	for _, prompt := range prompts {
		if err := s.db.Create(&prompt).Error; err != nil {
			return fmt.Errorf("failed to create prompt '%s': %w", prompt.Text, err)
		}
	}

	return nil
}
package services

import (
	"fmt"

	"gorm.io/gorm"
	"speaktrainer-api/internal/models"
)

type SessionService struct {
	db       *gorm.DB
	mlClient *MLClient
}

func NewSessionService(db *gorm.DB, mlClient *MLClient) *SessionService {
	return &SessionService{
		db:       db,
		mlClient: mlClient,
	}
}

type CreateSessionRequest struct {
	PromptID  string
	UserID    *string
	AudioData []byte
	Filename  string
}

type SessionAnalysisResult struct {
	Session         *models.Session  `json:"session"`
	Prompt          *models.Prompt   `json:"prompt"`
	AnalysisDetails *AnalysisResponse `json:"analysis_details"`
}

func (s *SessionService) AnalyzePronunciation(req CreateSessionRequest) (*SessionAnalysisResult, error) {
	// 1. Get the prompt
	var prompt models.Prompt
	if err := s.db.First(&prompt, "id = ?", req.PromptID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("prompt not found")
		}
		return nil, fmt.Errorf("failed to fetch prompt: %w", err)
	}

	// 2. Call ML service for analysis
	analysisReq := AnalysisRequest{
		ExpectedText: prompt.Text,
		AudioData:    req.AudioData,
		Filename:     req.Filename,
	}

	analysisResp, err := s.mlClient.AnalyzePronunciation(analysisReq)
	if err != nil {
		return nil, fmt.Errorf("ML analysis failed: %w", err)
	}

	// 3. Create session record
	session := &models.Session{
		ID:            generateID(),
		PromptID:      req.PromptID,
		UserID:        req.UserID,
		Transcription: analysisResp.Transcription,
		Score:         analysisResp.Score,
		AnalysisData: map[string]interface{}{
			"expected_phonemes":  analysisResp.ExpectedPhonemes,
			"actual_phonemes":    analysisResp.ActualPhonemes,
			"diff":               analysisResp.Diff,
			"phoneme_comparison": analysisResp.PhonemeComparison,
		},
	}

	if err := s.db.Create(session).Error; err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	// 4. Return complete result
	return &SessionAnalysisResult{
		Session:         session,
		Prompt:          &prompt,
		AnalysisDetails: analysisResp,
	}, nil
}

func (s *SessionService) GetSessionByID(id string) (*models.Session, error) {
	var session models.Session
	if err := s.db.Preload("Prompt").First(&session, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch session: %w", err)
	}
	return &session, nil
}

func (s *SessionService) GetSessionsByUser(userID string, limit, offset int) ([]models.Session, error) {
	var sessions []models.Session
	query := s.db.Preload("Prompt").Order("created_at DESC")
	
	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}
	
	if limit > 0 {
		query = query.Limit(limit)
	}
	
	if offset > 0 {
		query = query.Offset(offset)
	}

	if err := query.Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch sessions: %w", err)
	}

	return sessions, nil
}

func (s *SessionService) GetAllSessions(limit, offset int) ([]models.Session, error) {
	return s.GetSessionsByUser("", limit, offset)
}
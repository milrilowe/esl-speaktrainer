package services

import (
	"fmt"

	"github.com/google/uuid"
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
	ExpectedText string
	UserID       *string
	AudioData    []byte
	Filename     string
}

type SessionAnalysisResult struct {
	Session         *models.Session   `json:"session"`
	AnalysisDetails *AnalysisResponse `json:"analysis_details"`
}

func (s *SessionService) AnalyzePronunciation(req CreateSessionRequest) (*SessionAnalysisResult, error) {
	// 1. Call ML service for analysis directly with expected text
	analysisReq := AnalysisRequest{
		ExpectedText: req.ExpectedText,
		AudioData:    req.AudioData,
		Filename:     req.Filename,
	}

	analysisResp, err := s.mlClient.AnalyzePronunciation(analysisReq)
	if err != nil {
		return nil, fmt.Errorf("ML analysis failed: %w", err)
	}

	// 2. Create session record - just store the expected text directly
	session := &models.Session{
		ID:            uuid.New().String(),
		ExpectedText:  req.ExpectedText, // Store text directly, no prompt reference
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

	// 3. Return complete result
	return &SessionAnalysisResult{
		Session:         session,
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
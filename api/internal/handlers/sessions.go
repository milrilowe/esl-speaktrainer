package handlers

import (
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"speaktrainer-api/internal/models"
	"speaktrainer-api/internal/services"
)

type SessionHandler struct {
	sessionService *services.SessionService
}

func NewSessionHandler(sessionService *services.SessionService) *SessionHandler {
	return &SessionHandler{sessionService: sessionService}
}

func (h *SessionHandler) AnalyzePronunciation(c *gin.Context) {
	// Get form data
	promptID := c.PostForm("prompt_id")
	if promptID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "prompt_id is required"})
		return
	}

	// Get uploaded file
	file, header, err := c.Request.FormFile("audio_file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "audio_file is required"})
		return
	}
	defer file.Close()

	// Read file data
	audioData, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read audio file"})
		return
	}

	// Optional: Get user ID from auth (for now, we'll skip auth)
	var userID *string
	if uid := c.PostForm("user_id"); uid != "" {
		userID = &uid
	}

	// Create session request
	req := services.CreateSessionRequest{
		PromptID:  promptID,
		UserID:    userID,
		AudioData: audioData,
		Filename:  header.Filename,
	}

	// Analyze pronunciation
	result, err := h.sessionService.AnalyzePronunciation(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return complete analysis result
	c.JSON(http.StatusOK, gin.H{
		"session_id":         result.Session.ID,
		"prompt":             result.Prompt,
		"transcription":      result.Session.Transcription,
		"score":              result.Session.Score,
		"expected_phonemes":  result.AnalysisDetails.ExpectedPhonemes,
		"actual_phonemes":    result.AnalysisDetails.ActualPhonemes,
		"phoneme_diff":       result.AnalysisDetails.Diff,
		"analysis_details":   result.AnalysisDetails,
		"created_at":         result.Session.CreatedAt,
	})
}

func (h *SessionHandler) GetSession(c *gin.Context) {
	id := c.Param("id")

	session, err := h.sessionService.GetSessionByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	c.JSON(http.StatusOK, session)
}

func (h *SessionHandler) GetSessions(c *gin.Context) {
	// Parse query parameters
	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")
	userID := c.Query("user_id")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
		return
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offset parameter"})
		return
	}

	var sessions []models.Session
	if userID != "" {
		sessions, err = h.sessionService.GetSessionsByUser(userID, limit, offset)
	} else {
		sessions, err = h.sessionService.GetAllSessions(limit, offset)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sessions": sessions,
		"limit":    limit,
		"offset":   offset,
	})
}
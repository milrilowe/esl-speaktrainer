package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

func (h *HealthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "speaktrainer-api",
		"version": "1.0.0",
	})
}

func (h *HealthHandler) Root(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "SpeakTrainer API",
		"version": "1.0.0",
		"docs":    "/docs",
	})
}
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"speaktrainer-api/internal/services"
)

type PromptHandler struct {
	promptService *services.PromptService
}

func NewPromptHandler(promptService *services.PromptService) *PromptHandler {
	return &PromptHandler{promptService: promptService}
}

func (h *PromptHandler) GetAllPrompts(c *gin.Context) {
	prompts, err := h.promptService.GetAllPrompts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"prompts": prompts})
}

func (h *PromptHandler) GetRandomPrompt(c *gin.Context) {
	prompt, err := h.promptService.GetRandomPrompt()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":   prompt.ID,
		"text": prompt.Text,
	})
}

func (h *PromptHandler) GetPrompt(c *gin.Context) {
	id := c.Param("id")
	
	prompt, err := h.promptService.GetPromptByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if prompt == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Prompt not found"})
		return
	}

	c.JSON(http.StatusOK, prompt)
}
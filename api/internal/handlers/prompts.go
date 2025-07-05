package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"speaktrainer-api/internal/services"
)

type PromptHandler struct {
	promptService *services.PromptService
}

type CreatePromptRequest struct {
	Text string `json:"text" binding:"required"`
}

type UpdatePromptRequest struct {
	Text string `json:"text" binding:"required"`
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

func (h *PromptHandler) CreatePrompt(c *gin.Context) {
	var req CreatePromptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	prompt, err := h.promptService.CreatePrompt(req.Text)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, prompt)
}

func (h *PromptHandler) UpdatePrompt(c *gin.Context) {
	id := c.Param("id")
	
	var req UpdatePromptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	prompt, err := h.promptService.UpdatePrompt(id, req.Text)
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

func (h *PromptHandler) DeletePrompt(c *gin.Context) {
	id := c.Param("id")

	err := h.promptService.DeletePrompt(id)
	if err != nil {
		if err.Error() == "prompt not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Prompt not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Prompt deleted successfully"})
}
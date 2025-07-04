package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"speaktrainer-api/internal/config"
	"speaktrainer-api/internal/database"
	"speaktrainer-api/internal/handlers"
	"speaktrainer-api/internal/services"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto-migrate database tables
	if err := database.Migrate(db); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Initialize services
	mlClient := services.NewMLClient(cfg.MLServiceURL)
	promptService := services.NewPromptService(db)
	sessionService := services.NewSessionService(db, mlClient)

	// Initialize handlers
	promptHandler := handlers.NewPromptHandler(promptService)
	sessionHandler := handlers.NewSessionHandler(sessionService)
	healthHandler := handlers.NewHealthHandler()

	// Setup router
	router := setupRouter(cfg, promptHandler, sessionHandler, healthHandler)

	// Start server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  time.Second * 15,
		WriteTimeout: time.Second * 15,
		IdleTimeout:  time.Second * 60,
	}

	log.Printf("Starting server on port %s", cfg.Port)
	log.Printf("Environment: %s", cfg.Environment)
	log.Printf("ML Service URL: %s", cfg.MLServiceURL)

	if err := srv.ListenAndServe(); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}

func setupRouter(
	cfg *config.Config,
	promptHandler *handlers.PromptHandler,
	sessionHandler *handlers.SessionHandler,
	healthHandler *handlers.HealthHandler,
) *gin.Engine {
	// Set Gin mode based on environment
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// CORS middleware with environment-based origins
	router.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		allowedOrigins := getCORSOrigins(cfg.Environment)
		
		// Check if origin is allowed
		if isOriginAllowed(origin, allowedOrigins) {
			c.Header("Access-Control-Allow-Origin", origin)
		}
		
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health check
	router.GET("/health", healthHandler.Health)
	router.GET("/", healthHandler.Root)

	// API routes
	api := router.Group("/api")
	{
		// Prompts
		api.GET("/prompts", promptHandler.GetAllPrompts)
		api.GET("/prompts/random", promptHandler.GetRandomPrompt)
		api.GET("/prompts/:id", promptHandler.GetPrompt)

		// Sessions
		api.POST("/sessions/analyze", sessionHandler.AnalyzePronunciation)
		api.GET("/sessions/:id", sessionHandler.GetSession)
		api.GET("/sessions", sessionHandler.GetSessions)
	}

	return router
}

func getCORSOrigins(environment string) []string {
	corsOrigins := os.Getenv("CORS_ORIGINS")
	
	if corsOrigins != "" {
		return strings.Split(corsOrigins, ",")
	}
	
	// Default origins based on environment
	if environment == "production" {
		return []string{} // Require explicit CORS_ORIGINS in production
	}
	
	// Development defaults
	return []string{
		"http://localhost:3000",    // React default
		"http://127.0.0.1:3000",
		"http://127.0.0.1:8080",
		"http://127.0.0.1:5173",
	}
}

func isOriginAllowed(origin string, allowedOrigins []string) bool {
	if origin == "" {
		return true // Allow requests with no origin (like Postman, curl)
	}
	
	for _, allowed := range allowedOrigins {
		if strings.TrimSpace(allowed) == origin {
			return true
		}
	}
	
	return false
}
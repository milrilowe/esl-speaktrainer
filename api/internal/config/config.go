package config

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Environment   string
	Port          string
	DatabaseURL   string
	MLServiceURL  string
	Debug         bool
}

func Load() *Config {
	cfg := &Config{
		Environment:  getEnv("ENVIRONMENT", "development"),
		Port:         getEnv("PORT", "8000"),
		DatabaseURL:  getEnv("DATABASE_URL", "postgresql://speak:speakpass@localhost:5432/speaktrainer"),
		MLServiceURL: getEnv("ML_SERVICE_URL", "http://localhost:8001"),
		Debug:        getEnv("DEBUG", "true") == "true",
	}

	// Ensure SSL mode is properly configured
	cfg.DatabaseURL = ensureSSLMode(cfg.DatabaseURL, cfg.Environment)
	
	return cfg
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func ensureSSLMode(databaseURL, environment string) string {
	// If sslmode is already specified, don't change it
	if strings.Contains(databaseURL, "sslmode=") {
		return databaseURL
	}

	// Add appropriate SSL mode based on environment
	separator := "?"
	if strings.Contains(databaseURL, "?") {
		separator = "&"
	}

	if environment == "production" {
		return fmt.Sprintf("%s%ssslmode=require", databaseURL, separator)
	} else {
		return fmt.Sprintf("%s%ssslmode=disable", databaseURL, separator)
	}
}
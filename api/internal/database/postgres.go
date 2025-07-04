package database

import (
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"speaktrainer-api/internal/models"
)

func Connect(databaseURL string) (*gorm.DB, error) {
	// Configure GORM logger
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	// Retry connection logic
	var db *gorm.DB
	var err error
	maxRetries := 30
	retryDelay := 2 * time.Second

	for i := 0; i < maxRetries; i++ {
		db, err = gorm.Open(postgres.Open(databaseURL), gormConfig)
		if err == nil {
			// Test the connection
			sqlDB, err := db.DB()
			if err == nil {
				err = sqlDB.Ping()
				if err == nil {
					log.Println("Connected to PostgreSQL database")
					return db, nil
				}
			}
		}

		log.Printf("Database connection attempt %d/%d failed: %v", i+1, maxRetries, err)
		if i < maxRetries-1 {
			log.Printf("Retrying in %v...", retryDelay)
			time.Sleep(retryDelay)
		}
	}

	return nil, err
}

func Migrate(db *gorm.DB) error {
	log.Println("Running database migrations...")
	
	return db.AutoMigrate(
		&models.Prompt{},
		&models.Session{},
		&models.User{},
	)
}
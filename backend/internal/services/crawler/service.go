package crawler

import (
	"time"
	"web-crawler/backend/models"

	"gorm.io/gorm"
)

type Service struct {
	DB *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{DB: db}
}

func (s *Service) ProcessURL(website *models.Website) error {
	// Simulate a scan process
	time.Sleep(5 * time.Second)

	// Simulate finding some data
	website.Title = "Example Title"
	website.HTMLVersion = "HTML5"
	website.ExternalLinks = 5
	website.HasLoginForm = true
	website.Status = "completed"
	now := time.Now()
	website.CrawlFinishedAt = &now

	return nil
}

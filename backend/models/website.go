package models

import (
	"web-crawler/backend/internal/types"

	"gorm.io/gorm"
)

type StatusType string

const (
	Queued    StatusType = "queued"
	Crawling  StatusType = "running"
	Completed StatusType = "completed"
	Failed    StatusType = "failed"
)

// Website represents a website to be crawled.
type Website struct {
	gorm.Model

	URL    string     `json:"url" gorm:"unique;not null"`
	Status StatusType `json:"status" gorm:"type:varchar(20);default:'queued';not null"`

	HTMLVersion   string        `json:"htmlVersion"`
	Title         string        `json:"title"`
	HeadingsCount types.JSONMap `json:"headingsCount" gorm:"type:json"`
	InternalLinks int           `json:"internalLinks"`
	ExternalLinks int           `json:"externalLinks"`
	BrokenLinks   int           `json:"brokenLinks"`
	HasLoginForm  bool          `json:"hasLoginForm"`
}

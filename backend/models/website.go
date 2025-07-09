package models

import "gorm.io/gorm"

// StatusType defines the enumeration for website crawl statuses.
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

	HTMLVersion       string         `json:"htmlVersion"`
	Title             string         `json:"title"`
	HeadingsCount     map[string]int `json:"headingsCount" gorm:"type:json"`
	InternalLinks     int            `json:"internalLinks"`
	ExternalLinks     int            `json:"externalLinks"`
	InaccessibleLinks int            `json:"inaccessibleLinks"`
	HasLoginForm      bool           `json:"hasLoginForm"`
}

package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"
	"web-crawler/backend/internal/services/crawler"
	"web-crawler/backend/internal/websocket"
	"web-crawler/backend/models"

	"gorm.io/gorm"
)

var (
	ErrURLAlreadyExists = errors.New("url already exists")
)

type URLService struct {
	DB             *gorm.DB
	Hub            *websocket.Hub
	Crawler        *crawler.Service
	cancelations   map[uint]chan struct{}
	cancelationsMu sync.Mutex
}

func NewURLService(db *gorm.DB, hub *websocket.Hub, crawler *crawler.Service) *URLService {
	return &URLService{
		DB:           db,
		Hub:          hub,
		Crawler:      crawler,
		cancelations: make(map[uint]chan struct{}),
	}
}

func (s *URLService) CreateURL(url string) (*models.Website, error) {
	var existingWebsite models.Website
	if err := s.DB.Where("url = ?", url).First(&existingWebsite).Error; err == nil {
		return nil, ErrURLAlreadyExists
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	website := models.Website{URL: url}
	if result := s.DB.Create(&website); result.Error != nil {
		return nil, result.Error
	}

	return &website, nil
}

type GetURLsParams struct {
	Page             int
	Limit            int
	Search           string
	Status           string
	HTMLVersion      string
	HasLogin         string
	InternalLinksMin string
	InternalLinksMax string
	ExternalLinksMin string
	ExternalLinksMax string
	BrokenLinksMin   string
	BrokenLinksMax   string
	DateCreatedFrom  string
	DateCreatedTo    string
	DateCrawledFrom  string
	DateCrawledTo    string
	SortBy           string
	SortOrder        string
}

func (s *URLService) GetURLs(params GetURLsParams) ([]models.Website, int64, error) {
	query := s.DB.Model(&models.Website{})
	query = s.buildFilterQuery(params, query)

	var totalItems int64
	if err := query.Count(&totalItems).Error; err != nil {
		return nil, 0, err
	}

	offset := (params.Page - 1) * params.Limit
	var websites []models.Website
	if result := query.Order(s.getOrderBy(params)).Offset(offset).Limit(params.Limit).Find(&websites); result.Error != nil {
		return nil, 0, result.Error
	}

	return websites, totalItems, nil
}

func (s *URLService) GetURLByID(id int) (*models.Website, error) {
	var website models.Website
	if err := s.DB.First(&website, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, err
	}
	return &website, nil
}

func (s *URLService) DeleteURLByID(id int) error {
	if result := s.DB.Delete(&models.Website{}, id); result.Error != nil {
		return result.Error
	} else if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (s *URLService) BulkDeleteURLs(ids []int) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	result := s.DB.Where("id IN ?", ids).Delete(&models.Website{})
	return result.RowsAffected, result.Error
}

func (s *URLService) buildFilterQuery(params GetURLsParams, query *gorm.DB) *gorm.DB {
	if params.Search != "" {
		likeQuery := "%" + params.Search + "%"
		query = query.Where("url LIKE ? OR title LIKE ?", likeQuery, likeQuery)
	}
	if params.Status != "" && params.Status != "all" {
		query = query.Where("status = ?", params.Status)
	}
	if params.HTMLVersion != "" && params.HTMLVersion != "all" {
		query = query.Where("html_version = ?", params.HTMLVersion)
	}
	if params.HasLogin != "" && params.HasLogin != "all" {
		hasLoginBool := params.HasLogin == "yes"
		query = query.Where("has_login_form = ?", hasLoginBool)
	}

	s.applyRangeFilter(query, "internal_links", params.InternalLinksMin, ">=")
	s.applyRangeFilter(query, "internal_links", params.InternalLinksMax, "<=")
	s.applyRangeFilter(query, "external_links", params.ExternalLinksMin, ">=")
	s.applyRangeFilter(query, "external_links", params.ExternalLinksMax, "<=")
	s.applyRangeFilter(query, "broken_links", params.BrokenLinksMin, ">=")
	s.applyRangeFilter(query, "broken_links", params.BrokenLinksMax, "<=")
	s.applyRangeFilter(query, "created_at", params.DateCreatedFrom, ">=")
	s.applyRangeFilter(query, "created_at", params.DateCreatedTo, "<=")
	s.applyRangeFilter(query, "crawled_finished_at", params.DateCrawledFrom, ">=")
	s.applyRangeFilter(query, "crawled_finished_at", params.DateCrawledTo, "<=")

	return query
}

func (s *URLService) applyRangeFilter(query *gorm.DB, dbField, value, operator string) {
	if value != "" {
		query.Where(dbField+" "+operator+" ?", value)
	}
}

func (s *URLService) getOrderBy(params GetURLsParams) string {
	if params.SortBy == "" {
		return "id desc"
	}

	sortOrder := params.SortOrder
	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "asc"
	}

	columnMap := map[string]string{
		"status":        "status",
		"title":         "title",
		"url":           "url",
		"htmlVersion":   "html_version",
		"internalLinks": "internal_links",
		"externalLinks": "external_links",
		"CreatedAt":     "created_at",
	}

	if dbColumn, ok := columnMap[params.SortBy]; ok {
		return dbColumn + " " + sortOrder
	}

	return "id desc"
}

func (s *URLService) StartScanURL(id int) error {
	var website models.Website
	if err := s.DB.First(&website, id).Error; err != nil {
		return err
	}

	s.cancelationsMu.Lock()
	if _, exists := s.cancelations[website.ID]; exists {
		s.cancelationsMu.Unlock()
		return errors.New("scan already in progress")
	}
	cancelChan := make(chan struct{})
	s.cancelations[website.ID] = cancelChan
	s.cancelationsMu.Unlock()

	go s.performScan(&website, cancelChan)

	return nil
}

func (s *URLService) performScan(website *models.Website, cancelChan chan struct{}) {
	defer func() {
		s.cancelationsMu.Lock()
		delete(s.cancelations, website.ID)
		s.cancelationsMu.Unlock()
	}()

	s.DB.Model(website).Update("crawl_started_at", time.Now())
	s.updateScanStatus(website.ID, models.Crawling)

	err := s.Crawler.ProcessURL(website, cancelChan)
	now := time.Now()
	website.CrawlFinishedAt = &now
	if err != nil {
		if errors.Is(err, crawler.ErrCrawlCancelled) {
			s.updateScanStatus(website.ID, models.Cancelled)
		} else {
			s.updateScanStatus(website.ID, models.Failed)
		}
		return
	}

	if err := s.DB.Save(website).Error; err != nil {
		s.updateScanStatus(website.ID, models.Failed)
		return
	}

	s.updateScanStatus(website.ID, models.Completed)
}

func (s *URLService) updateScanStatus(id uint, status models.StatusType) {
	if err := s.DB.Model(&models.Website{}).Where("id = ?", id).Update("status", status).Error; err != nil {
		fmt.Println("Error updating scan status:", err)
		return
	}

	updateData := map[string]any{"id": id, "status": status}
	message, err := json.Marshal(updateData)
	if err != nil {
		fmt.Println("Error marshalling scan status:", err)
		return
	}
	s.Hub.Broadcast(message)
}

func (s *URLService) CancelScanURL(id int) error {
	uintID := uint(id)
	s.cancelationsMu.Lock()
	defer s.cancelationsMu.Unlock()

	if cancelChan, exists := s.cancelations[uintID]; exists {
		close(cancelChan)
		delete(s.cancelations, uintID)
		return nil
	}

	return errors.New("no active scan found to cancel")
}

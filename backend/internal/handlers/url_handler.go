package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"web-crawler/backend/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type URLHandler struct {
	URLService *services.URLService
}

func NewURLHandler(service *services.URLService) *URLHandler {
	return &URLHandler{URLService: service}
}

func (h *URLHandler) CreateURL(c *gin.Context) {
	var newURL struct {
		URL string `json:"url" binding:"required,url"`
	}

	if err := c.ShouldBindJSON(&newURL); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   err.Error(),
			"message": "Invalid URL format or missing required field",
		})
		return
	}

	website, err := h.URLService.CreateURL(newURL.URL)
	if err != nil {
		if errors.Is(err, services.ErrURLAlreadyExists) {
			c.JSON(http.StatusConflict, gin.H{
				"error":   err.Error(),
				"message": "URL already exists",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   err.Error(),
			"message": "Failed to create URL",
		})
		return
	}

	c.JSON(http.StatusCreated, website)
}

func (h *URLHandler) GetURLs(c *gin.Context) {
	page, limit := getPagination(c)
	params := services.GetURLsParams{
		Page:             page,
		Limit:            limit,
		Search:           c.Query("search"),
		Status:           c.Query("status"),
		HTMLVersion:      c.Query("htmlVersion"),
		HasLogin:         c.Query("hasLogin"),
		InternalLinksMin: c.Query("internalLinksMin"),
		InternalLinksMax: c.Query("internalLinksMax"),
		ExternalLinksMin: c.Query("externalLinksMin"),
		ExternalLinksMax: c.Query("externalLinksMax"),
		BrokenLinksMin:   c.Query("brokenLinksMin"),
		BrokenLinksMax:   c.Query("brokenLinksMax"),
		DateCreatedFrom:  c.Query("dateCreatedFrom"),
		DateCreatedTo:    c.Query("dateCreatedTo"),
		DateCrawledFrom:  c.Query("dateCrawledFrom"),
		DateCrawledTo:    c.Query("dateCrawledTo"),
		SortBy:           c.Query("sortBy"),
		SortOrder:        c.Query("sortOrder"),
	}

	websites, totalItems, err := h.URLService.GetURLs(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   err.Error(),
			"message": "Failed to retrieve URLs",
		})
		return
	}

	totalPages := 0
	if limit > 0 {
		totalPages = int(totalItems) / limit
		if int(totalItems)%limit != 0 {
			totalPages++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data": websites,
		"pagination": gin.H{
			"totalItems":  totalItems,
			"totalPages":  totalPages,
			"currentPage": page,
			"pageSize":    limit,
		},
	})
}

func getPagination(c *gin.Context) (page, limit int) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err = strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 10
	}
	return page, limit
}

func (h *URLHandler) GetURLByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   err.Error(),
			"message": "Invalid URL ID",
		})
		return
	}

	website, err := h.URLService.GetURLByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"message": "URL not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   err.Error(),
			"message": "Failed to retrieve URL",
		})
		return
	}
	c.JSON(http.StatusOK, website)
}

func (h *URLHandler) DeleteURLById(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   err.Error(),
			"message": "Invalid URL ID",
		})
		return
	}

	err = h.URLService.DeleteURLByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"message": "URL not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   err.Error(),
			"message": "Failed to delete URL",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "URL deleted successfully"})
}

func (h *URLHandler) BulkDeleteURLs(c *gin.Context) {
	var ids struct {
		IDs []int `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&ids); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   err.Error(),
			"message": "Invalid request body",
		})
		return
	}

	rowsAffected, err := h.URLService.BulkDeleteURLs(ids.IDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   err.Error(),
			"message": "Failed to delete URLs",
		})
		return
	}

	if rowsAffected == 0 && len(ids.IDs) > 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "no_urls_found_for_deletion",
			"message": "None of the provided URLs were found to delete.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "URLs deleted successfully"})
}

func (h *URLHandler) ScanURL(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   err.Error(),
			"message": "Invalid URL ID",
		})
		return
	}

	err = h.URLService.StartScanURL(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"message": "URL not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   err.Error(),
			"message": "Failed to start scan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Scan started successfully"})
}

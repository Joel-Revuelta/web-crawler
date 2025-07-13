package handlers

import (
	"net/http"
	"strconv"
	"web-crawler/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type URLHandler struct {
	DB *gorm.DB
}

func (h *URLHandler) CreateURL(c *gin.Context) {
	var newURL struct {
		URL string `json:"url" binding:"required,url"`
	}

	if err := c.ShouldBindJSON(&newURL); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existingWebsite models.Website
	if err := h.DB.Where("url = ?", newURL.URL).First(&existingWebsite).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "URL already exists"})
		return
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	website := models.Website{URL: newURL.URL}

	if result := h.DB.Create(&website); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusCreated, website)
}

func (h *URLHandler) GetURLs(c *gin.Context) {
	page, limit, offset := getPagination(c)

	query := h.DB.Model(&models.Website{})
	query = buildFilterQuery(c, query)

	var totalItems int64
	if err := query.Count(&totalItems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve total count"})
		return
	}

	var websites []models.Website
	if result := query.Order("id desc").Offset(offset).Limit(limit).Find(&websites); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
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

func getPagination(c *gin.Context) (page, limit, offset int) {
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

	offset = (page - 1) * limit
	return page, limit, offset
}

func buildFilterQuery(c *gin.Context, query *gorm.DB) *gorm.DB {
	if search := c.Query("search"); search != "" {
		likeQuery := "%" + search + "%"
		query = query.Where("url LIKE ? OR title LIKE ?", likeQuery, likeQuery)
	}

	if status := c.Query("status"); status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	if htmlVersion := c.Query("htmlVersion"); htmlVersion != "" && htmlVersion != "all" {
		query = query.Where("html_version = ?", htmlVersion)
	}

	if hasLogin := c.Query("hasLogin"); hasLogin != "" && hasLogin != "all" {
		hasLoginBool := hasLogin == "yes"
		query = query.Where("has_login_form = ?", hasLoginBool)
	}

	applyRangeFilter(c, query, "internalLinksMin", "internal_links", ">=")
	applyRangeFilter(c, query, "internalLinksMax", "internal_links", "<=")
	applyRangeFilter(c, query, "externalLinksMin", "external_links", ">=")
	applyRangeFilter(c, query, "externalLinksMax", "external_links", "<=")
	applyRangeFilter(c, query, "brokenLinksMin", "broken_links", ">=")
	applyRangeFilter(c, query, "brokenLinksMax", "broken_links", "<=")

	applyRangeFilter(c, query, "dateCreatedFrom", "created_at", ">=")
	applyRangeFilter(c, query, "dateCreatedTo", "created_at", "<=")
	applyRangeFilter(c, query, "dateCrawledFrom", "crawled_finished_at", ">=")
	applyRangeFilter(c, query, "dateCrawledTo", "crawled_finished_at", "<=")

	if sortBy := c.Query("sortBy"); sortBy != "" {
		sortOrder := c.DefaultQuery("sortOrder", "asc")
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

		if dbColumn, ok := columnMap[sortBy]; ok {
			query = query.Order(dbColumn + " " + sortOrder)
		}
	}

	return query
}

func applyRangeFilter(c *gin.Context, query *gorm.DB, paramName, dbField, operator string) {
	if value := c.Query(paramName); value != "" {
		query.Where(dbField+" "+operator+" ?", value)
	}
}

func (h *URLHandler) DeleteURLById(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid URL ID"})
		return
	}

	var website models.Website
	if result := h.DB.First(&website, id); result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "URL not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if result := h.DB.Delete(&website); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete URL"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "URL deleted successfully"})
}

func (h *URLHandler) BulkDeleteURLs(c *gin.Context) {
	var ids struct {
		IDs []int `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&ids); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if len(ids.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No IDs provided"})
		return
	}

	if result := h.DB.Where("id IN ?", ids.IDs).Delete(&models.Website{}); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete URLs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "URLs deleted successfully"})
}

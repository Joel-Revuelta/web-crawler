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
	var websites []models.Website
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "10")

	pageInt, err := strconv.Atoi(page)
	if err != nil || pageInt < 1 {
		pageInt = 1
	}

	limitInt, err := strconv.Atoi(limit)
	if err != nil || limitInt < 1 {
		limitInt = 10
	}

	offset := (pageInt - 1) * limitInt

	var totalItems int64
	if err := h.DB.Model(&models.Website{}).Count(&totalItems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve total count"})
		return
	}

	if result := h.DB.Order("id desc").Offset(offset).Limit(limitInt).Find(&websites); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	totalPages := int(totalItems) / limitInt
	if int(totalItems)%limitInt != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, gin.H{
		"data": websites,
		"pagination": gin.H{
			"totalItems":  totalItems,
			"totalPages":  totalPages,
			"currentPage": pageInt,
			"pageSize":    limitInt,
		},
	})
}

package handlers

import (
	"net/http"
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

	if result := h.DB.Find(&websites); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, websites)
}

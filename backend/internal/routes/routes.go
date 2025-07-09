package routes

import (
	"web-crawler/backend/internal/handlers"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(router *gin.Engine, db *gorm.DB) {
	urlHandler := &handlers.URLHandler{DB: db}

	api := router.Group("/api/v1")
	{
		api.GET("/urls", urlHandler.GetURLs)
		api.POST("/urls", urlHandler.CreateURL)
	}
}

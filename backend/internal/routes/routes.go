package routes

import (
	"log"
	"web-crawler/backend/internal/config"
	"web-crawler/backend/internal/handlers"
	"web-crawler/backend/internal/middleware"
	"web-crawler/backend/internal/services"
	"web-crawler/backend/internal/services/crawler"
	"web-crawler/backend/internal/websocket"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(db *gorm.DB, cfg config.Config, hub *websocket.Hub) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	if err := r.SetTrustedProxies([]string{"127.0.0.1"}); err != nil {
		log.Fatalf("Failed to set trusted proxies: %v", err)
	}

	r.Use(middleware.CORSMiddleware())

	crawlerService := crawler.NewService(db)
	urlService := services.NewURLService(db, hub, crawlerService)
	urlHandler := handlers.NewURLHandler(urlService)

	api := r.Group("/api/v1")
	api.Use(middleware.AuthMiddleware(cfg))
	{
		api.POST("/urls", urlHandler.CreateURL)
		api.GET("/urls", urlHandler.GetURLs)
		api.GET("/urls/:id", urlHandler.GetURLByID)
		api.DELETE("/urls/:id", urlHandler.DeleteURLById)
		api.POST("/urls/bulk-delete", urlHandler.BulkDeleteURLs)
		api.POST("/urls/:id/scan", urlHandler.ScanURL)
		api.POST("/urls/:id/cancel-scan", urlHandler.CancelScanURL)
	}

	r.GET("/ws", func(c *gin.Context) {
		websocket.ServeWs(hub, c.Writer, c.Request)
	})

	return r
}

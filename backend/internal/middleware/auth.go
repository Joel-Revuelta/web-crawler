package middleware

import (
	"net/http"
	"web-crawler/backend/internal/config"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(cfg config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("X-API-Key")

		if cfg.APIKey == "" {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error":   "Internal Server Error: API_KEY not configured",
				"message": "Please set the API_KEY environment variable.",
			})
			return
		}

		if apiKey != cfg.APIKey {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized: Invalid API Key",
				"message": "Please provide a valid API Key in the request header.",
			})
			return
		}
		c.Next()
	}
}

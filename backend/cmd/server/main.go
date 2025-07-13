package main

import (
	"fmt"
	"log"
	"web-crawler/backend/internal/config"
	"web-crawler/backend/internal/routes"
	"web-crawler/backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()

	db, err := gorm.Open(mysql.Open(cfg.DBSource), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	db.AutoMigrate(&models.Website{})

	router := routes.SetupRoutes(db, cfg)

	fmt.Println("Starting server on port 8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("could not run server: %v", err)
	}
}

package config

import (
	"log"

	"github.com/caarlos0/env/v6"
)

type Config struct {
	DBSource string `env:"DB_SOURCE,required"`
	APIKey   string `env:"API_KEY,required"`
}

func Load() Config {
	var cfg Config
	if err := env.Parse(&cfg); err != nil {
		log.Fatalf("failed to parse environment variables: %+v", err)
	}
	return cfg
}

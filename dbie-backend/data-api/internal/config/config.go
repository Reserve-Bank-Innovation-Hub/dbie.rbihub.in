// Package config loads the service's settings from the environment (see .env.common.example): where the database
// is comes from a Secrets Manager secret in Pratirupa's shape {host, port, dbname, username, password}, named by
// DB_SECRET_NAME. DATABASE_URL, when set, wins (local runs against another database).
package config

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/rbih/dbie-data-api/internal/secrets"
	"github.com/rs/zerolog/log"
)

// Config holds the application configuration.
type Config struct {
	Environment    string
	Port           string
	DatabaseURL    string
	AllowedOrigins []string

	// How many rows a JSON page may return at most; CSV downloads are unbounded and streamed.
	MaxRows int
	// How often the table registry re-reads meta.* (loads change it, deployments do not).
	RegistryRefresh time.Duration
	// Cache-Control max-age for API responses, in seconds. Data changes only when a load or release happens.
	CacheSeconds int
}

// DBConfig is the secret's shape.
type DBConfig struct {
	Host     string `json:"host"`
	Port     string `json:"port"`
	User     string `json:"username"`
	Password string `json:"password"`
	DBName   string `json:"dbname"`
}

// ConnectionString returns a PostgreSQL connection string; TLS is required by the server anyway.
func (c *DBConfig) ConnectionString() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=require", c.Host, c.Port, c.User, c.Password, c.DBName)
}

// Load reads the configuration from the environment.
func Load() *Config {
	cfg := &Config{
		Environment:     env("ENVIRONMENT", "development"),
		Port:            env("PORT", "8000"),
		DatabaseURL:     os.Getenv("DATABASE_URL"),
		MaxRows:         envInt("MAX_ROWS", 5000),
		RegistryRefresh: time.Duration(envInt("REGISTRY_REFRESH_MINUTES", 10)) * time.Minute,
		CacheSeconds:    envInt("CACHE_SECONDS", 300),
	}
	for _, o := range strings.Split(env("ALLOWED_ORIGINS", ""), ",") {
		if o = strings.TrimSpace(o); o != "" {
			cfg.AllowedOrigins = append(cfg.AllowedOrigins, o)
		}
	}

	if cfg.DatabaseURL == "" {
		name := os.Getenv("DB_SECRET_NAME")
		if name == "" {
			log.Fatal().Msg("Set DB_SECRET_NAME (the database secret) or DATABASE_URL")
		}
		raw := secrets.GetSecret(name)
		if raw == "" {
			log.Fatal().Str("secret", name).Msg("Database secret could not be loaded")
		}
		var db DBConfig
		if err := json.Unmarshal([]byte(raw), &db); err != nil {
			log.Fatal().Err(err).Str("secret", name).Msg("Database secret is not the expected JSON")
		}
		if db.Port == "" {
			db.Port = "5432"
		}
		cfg.DatabaseURL = db.ConnectionString()
		log.Info().Str("secret", name).Str("host", db.Host).Str("user", db.User).Msg("Database credentials loaded")
	}
	return cfg
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}

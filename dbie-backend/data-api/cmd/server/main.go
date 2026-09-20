// dbie-data-api: a read-only HTTP API over the DBIE Postgres database (every DBIE table, its catalogue and code
// lists). Same shape as the Pratirupa services: Gin, pgx, zerolog, all routes registered here.
package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/rbih/dbie-data-api/internal/config"
	"github.com/rbih/dbie-data-api/internal/db"
	"github.com/rbih/dbie-data-api/internal/handlers"
	"github.com/rbih/dbie-data-api/internal/logger"
	"github.com/rbih/dbie-data-api/internal/middleware"
	"github.com/rbih/dbie-data-api/internal/registry"
	"github.com/rs/zerolog/log"
)

// loadEnvFiles loads this service's .env.common, falling back to the repo root's (the data tooling's file, which
// points at the loader role; the service's own file points at the reader role). Variables already set win.
func loadEnvFiles() {
	for _, p := range []string{".env.common", "../../.env.common"} {
		if err := godotenv.Load(p); err == nil {
			log.Info().Str("file", p).Msg("Environment loaded")
			return
		}
	}
	log.Info().Msg("No .env.common found; using the process environment")
}

func main() {
	logger.Init()
	log.Info().Msg("Starting dbie-data-api")
	loadEnvFiles()
	cfg := config.Load()

	database, err := db.NewDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}
	defer database.Close()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	reg, err := registry.New(ctx, database.Pool)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load the table registry")
	}
	go reg.Run(ctx, cfg.RegistryRefresh)

	if cfg.Environment != "development" {
		gin.SetMode(gin.ReleaseMode)
	}
	router := gin.New()
	router.Use(gin.Recovery(), middleware.Logger())
	// Compress for clients that accept it. The catalogue and the wider tables run to hundreds of kilobytes of JSON
	// that gzip to a tenth; CloudFront passes the encoding through and caches it per encoding.
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	// Public, read-only data: any origin may read it, without credentials.
	corsConfig := cors.DefaultConfig()
	if len(cfg.AllowedOrigins) > 0 {
		corsConfig.AllowOrigins = cfg.AllowedOrigins
	} else {
		corsConfig.AllowAllOrigins = true
	}
	corsConfig.AllowMethods = []string{"GET", "HEAD", "OPTIONS"}
	corsConfig.ExposeHeaders = []string{"Content-Disposition", "X-Request-ID"}
	router.Use(cors.New(corsConfig))

	h := handlers.New(database, reg, cfg)
	router.GET("/health", h.Health)

	api := router.Group("/api", middleware.Cache(cfg.CacheSeconds))
	api.GET("/catalogue", h.ListCatalogue)
	api.GET("/tables", h.ListTables)
	api.GET("/tables/:schema/:table", h.GetTable)
	api.GET("/tables/:schema/:table/rows", h.GetRows)
	api.GET("/tables/:schema/:table/csv", h.GetCSV)
	api.GET("/codelists/:dsd", h.GetCodelist)
	api.GET("/search", h.Search)

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: router, ReadHeaderTimeout: 10 * time.Second}
	go func() {
		log.Info().Str("port", cfg.Port).Str("environment", cfg.Environment).Msg("Listening")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("Server failed")
		}
	}()

	<-ctx.Done()
	log.Info().Msg("Shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error().Err(err).Msg("Forced shutdown")
		os.Exit(1)
	}
}

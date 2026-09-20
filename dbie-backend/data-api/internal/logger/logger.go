package logger

import (
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

const loggerKey = "logger"

// Init initialises the global zerolog logger: JSON in deployed environments, console output in development.
func Init() {
	env := os.Getenv("ENVIRONMENT")
	if env == "production" || env == "prod" || env == "common" {
		zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	} else {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	}

	switch strings.ToLower(os.Getenv("LOG_LEVEL")) {
	case "debug":
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	case "warn", "warning":
		zerolog.SetGlobalLevel(zerolog.WarnLevel)
	case "error":
		zerolog.SetGlobalLevel(zerolog.ErrorLevel)
	default:
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}
}

// SetInContext stores a request-scoped logger on the Gin context.
func SetInContext(c *gin.Context, l *zerolog.Logger) {
	c.Set(loggerKey, l)
}

// FromContext returns the request-scoped logger, or the global one.
func FromContext(c *gin.Context) *zerolog.Logger {
	if l, ok := c.Get(loggerKey); ok {
		if logger, ok := l.(*zerolog.Logger); ok {
			return logger
		}
	}
	return &log.Logger
}

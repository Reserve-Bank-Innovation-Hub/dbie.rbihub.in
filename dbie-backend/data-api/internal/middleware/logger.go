package middleware

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rbih/dbie-data-api/internal/logger"
	"github.com/rs/xid"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// Logger logs every request with a request id, status and timing, as Pratirupa's services do.
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		requestID := xid.New().String()
		reqLogger := log.With().Str("request_id", requestID).Logger()
		logger.SetInContext(c, &reqLogger)
		c.Header("X-Request-ID", requestID)

		c.Next()

		status := c.Writer.Status()
		var event *zerolog.Event
		switch {
		case status >= 500:
			event = reqLogger.Error()
		case status >= 400:
			event = reqLogger.Warn()
		default:
			event = reqLogger.Info()
		}
		event.Str("method", c.Request.Method).
			Str("path", c.Request.URL.Path).
			Str("query", c.Request.URL.RawQuery).
			Int("status", status).
			Dur("duration", time.Since(start)).
			Str("client_ip", c.ClientIP()).
			Int("bytes", c.Writer.Size()).
			Msg("request")
	}
}

// Cache sets Cache-Control on successful responses: the data behind the API changes only when a load runs, so
// clients and any CDN in front may keep responses for a while. The header has to go out with the status line, so
// the writer is wrapped and the header set the moment the status is known: cacheable for 200, no-store otherwise.
func Cache(seconds int) gin.HandlerFunc {
	value := fmt.Sprintf("public, max-age=%d", seconds)
	return func(c *gin.Context) {
		c.Writer = &cacheWriter{ResponseWriter: c.Writer, value: value}
		c.Next()
	}
}

type cacheWriter struct {
	gin.ResponseWriter
	value string
}

func (w *cacheWriter) setHeader(status int) {
	if w.Written() {
		return
	}
	if status == 200 {
		w.Header().Set("Cache-Control", w.value)
	} else {
		w.Header().Set("Cache-Control", "no-store")
	}
}

func (w *cacheWriter) WriteHeader(status int) {
	w.setHeader(status)
	w.ResponseWriter.WriteHeader(status)
}

func (w *cacheWriter) Write(b []byte) (int, error) {
	w.setHeader(w.Status())
	return w.ResponseWriter.Write(b)
}

func (w *cacheWriter) WriteString(s string) (int, error) {
	w.setHeader(w.Status())
	return w.ResponseWriter.WriteString(s)
}

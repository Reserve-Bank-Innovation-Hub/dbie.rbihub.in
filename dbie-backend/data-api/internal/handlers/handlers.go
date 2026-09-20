// Package handlers holds every HTTP handler as a method on *Handler, Pratirupa's shape. All endpoints are GET and
// public: the data is public RBI data, and the service connects with a read-only role.
package handlers

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rbih/dbie-data-api/internal/config"
	"github.com/rbih/dbie-data-api/internal/db"
	"github.com/rbih/dbie-data-api/internal/registry"
)

// Handler carries the dependencies every handler needs.
type Handler struct {
	db       *db.DB
	registry *registry.Registry
	cfg      *config.Config
}

// New builds the handler set.
func New(database *db.DB, reg *registry.Registry, cfg *config.Config) *Handler {
	return &Handler{db: database, registry: reg, cfg: cfg}
}

// Health reports the service and its registry.
func (h *Handler) Health(c *gin.Context) {
	tables, catalogue, loadedAt := h.registry.Stats()
	c.JSON(200, gin.H{"status": "ok", "tables": tables, "catalogue_entries": catalogue, "registry_loaded_at": loadedAt})
}

// table resolves the :schema/:table path or answers 404.
func (h *Handler) table(c *gin.Context) (*registry.Table, bool) {
	t, ok := h.registry.Get(c.Param("schema"), c.Param("table"))
	if !ok {
		c.JSON(404, gin.H{"error": "no such table", "message": "use /api/tables to list the loaded tables"})
		return nil, false
	}
	return t, true
}

func intParam(c *gin.Context, name string, fallback int) (int, error) {
	v := c.Query(name)
	if v == "" {
		return fallback, nil
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return 0, fmt.Errorf("%s must be an integer", name)
	}
	return n, nil
}

// jsonValue converts a pgx value for JSON: dates as YYYY-MM-DD, numerics as exact number literals, arrays as
// arrays. Numbers keep every digit the file had; a client that wants floats parses them.
func jsonValue(v any) any {
	switch x := v.(type) {
	case nil:
		return nil
	case time.Time:
		return x.Format("2006-01-02")
	case pgtype.Numeric:
		if !x.Valid {
			return nil
		}
		s, err := x.Value()
		if err != nil {
			return nil
		}
		if str, ok := s.(string); ok {
			return json.Number(str)
		}
		return s
	case pgtype.Date:
		if !x.Valid {
			return nil
		}
		return x.Time.Format("2006-01-02")
	case []any:
		out := make([]any, len(x))
		for i, e := range x {
			out[i] = jsonValue(e)
		}
		return out
	case []string:
		return x
	}
	return v
}

// textValue converts a pgx value for CSV.
func textValue(v any) string {
	switch x := jsonValue(v).(type) {
	case nil:
		return ""
	case string:
		return x
	case json.Number:
		return x.String()
	case []string:
		return strings.Join(x, "\x1f")
	case []any:
		parts := make([]string, len(x))
		for i, e := range x {
			parts[i] = fmt.Sprint(e)
		}
		return strings.Join(parts, "\x1f")
	default:
		return fmt.Sprint(x)
	}
}

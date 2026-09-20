package handlers

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/rbih/dbie-data-api/internal/logger"
)

// ListCatalogue lists DBIE menu entries and SDMX datasets (meta.catalogue), with their load status: what DBIE
// has, what the database holds, and why anything is missing.
func (h *Handler) ListCatalogue(c *gin.Context) {
	limit, err := intParam(c, "limit", 200)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	offset, err := intParam(c, "offset", 0)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	if limit <= 0 || limit > 2000 {
		limit = 2000
	}
	var where []string
	var args []any
	add := func(clause string, v any) {
		args = append(args, v)
		where = append(where, strings.Replace(clause, "?", "$"+itoa(len(args)), 1))
	}
	if v := c.Query("source"); v != "" {
		add("source = ?", v)
	}
	if v := c.Query("schema"); v != "" {
		add("schema_name = ?", v)
	}
	if v := c.Query("status"); v != "" {
		add("status LIKE ?", v+"%")
	}
	if v := c.Query("kind"); v != "" {
		add("kind = ?", v)
	}
	if v := strings.TrimSpace(c.Query("q")); v != "" {
		add("(title ILIKE ? OR menu_path ILIKE ?)", "%"+v+"%")
		where[len(where)-1] = strings.Replace(where[len(where)-1], "ILIKE ?", "ILIKE $"+itoa(len(args)), 1)
	}
	sql := `SELECT entry_id, source, menu_path, title, report_id, dsd_code, frequency, period_from, period_to, kind, schema_name, table_name, status, row_count, notes, count(*) OVER () AS total FROM meta.catalogue`
	if len(where) > 0 {
		sql += " WHERE " + strings.Join(where, " AND ")
	}
	sql += " ORDER BY source, menu_path, title LIMIT " + itoa(limit) + " OFFSET " + itoa(offset)

	rows, err := h.db.Pool.Query(c.Request.Context(), sql, args...)
	if err != nil {
		logger.FromContext(c).Error().Err(err).Msg("catalogue query failed")
		c.JSON(500, gin.H{"error": "database error"})
		return
	}
	defer rows.Close()
	fields := rows.FieldDescriptions()
	data := make([]map[string]any, 0, 128)
	var total int64
	for rows.Next() {
		vals, err := rows.Values()
		if err != nil {
			c.JSON(500, gin.H{"error": "database error"})
			return
		}
		item := make(map[string]any, len(fields))
		for i, f := range fields {
			if string(f.Name) == "total" {
				total = vals[i].(int64)
				continue
			}
			item[string(f.Name)] = jsonValue(vals[i])
		}
		data = append(data, item)
	}
	c.JSON(200, gin.H{"data": data, "total": total, "limit": limit, "offset": offset})
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var b [20]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		b[i] = '-'
	}
	return string(b[i:])
}

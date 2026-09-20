package handlers

import (
	"encoding/csv"
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/rbih/dbie-data-api/internal/logger"
	"github.com/rbih/dbie-data-api/internal/query"
	"github.com/rbih/dbie-data-api/internal/registry"
)

// ListTables lists the loaded tables, optionally narrowed by schema, source or a word in the title or DBIE path.
func (h *Handler) ListTables(c *gin.Context) {
	schema, source, q := c.Query("schema"), c.Query("source"), strings.ToLower(strings.TrimSpace(c.Query("q")))
	out := make([]*registry.Table, 0, 64)
	for _, t := range h.registry.List() {
		if schema != "" && t.Schema != schema {
			continue
		}
		if source != "" && t.Source != source {
			continue
		}
		if q != "" && !strings.Contains(strings.ToLower(t.Title), q) && !strings.Contains(strings.ToLower(t.DBIEPath), q) && !strings.Contains(t.Key, q) {
			continue
		}
		out = append(out, t)
	}
	// The list view omits column details; fetch one table for those.
	type item struct {
		Key      string `json:"key"`
		Source   string `json:"source"`
		Schema   string `json:"schema"`
		Table    string `json:"table"`
		Title    string `json:"title"`
		DBIEPath string `json:"dbie_path"`
		Freq     string `json:"frequency,omitempty"`
		Rows     int64  `json:"row_count"`
		Layout   string `json:"layout"`
	}
	items := make([]item, len(out))
	for i, t := range out {
		items[i] = item{t.Key, t.Source, t.Schema, t.Name, t.Title, t.DBIEPath, t.Frequency, t.RowCount, t.Layout}
	}
	c.JSON(200, gin.H{"data": items, "total": len(items)})
}

// GetTable returns one table's identity, columns and provenance.
func (h *Handler) GetTable(c *gin.Context) {
	t, ok := h.table(c)
	if !ok {
		return
	}
	var provenance any
	var err error
	if t.DSDCode != "" {
		provenance, err = h.rowAsJSON(c, `SELECT dsd_code, element_id, label, sector, sub_sector, frequency, start_date, flow_type, is_alphanumeric, dimension_columns, first_period, last_period, source_file, source_sha256, scraped_at, loaded_at, notes FROM meta.sdmx_dataset WHERE dsd_code = $1`, t.DSDCode)
	} else {
		provenance, err = h.rowAsJSON(c, `SELECT report_id, report_name, section, category, subsection, group_title, frequency, period_from, period_to, kind, document_id, exported_at, layout, files, tabs, row_count, width, loaded_at, notes FROM meta.report WHERE report_id = $1`, t.ReportID)
	}
	if err != nil {
		logger.FromContext(c).Error().Err(err).Msg("provenance query failed")
		c.JSON(500, gin.H{"error": "database error"})
		return
	}
	c.JSON(200, gin.H{"data": t, "provenance": provenance})
}

// rowAsJSON returns one row as a column → value map, or nil when there is none.
func (h *Handler) rowAsJSON(c *gin.Context, sql string, args ...any) (map[string]any, error) {
	rows, err := h.db.Pool.Query(c.Request.Context(), sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, rows.Err()
	}
	vals, err := rows.Values()
	if err != nil {
		return nil, err
	}
	out := map[string]any{}
	for i, f := range rows.FieldDescriptions() {
		out[string(f.Name)] = jsonValue(vals[i])
	}
	return out, nil
}

// params reads the row parameters shared by the JSON and CSV endpoints.
func params(c *gin.Context, t *registry.Table) (query.Params, error) {
	p := query.Params{Filters: map[string][]string{}, From: c.Query("from"), To: c.Query("to"), Labels: c.Query("labels") == "1" || c.Query("labels") == "true"}
	var err error
	if p.Limit, err = intParam(c, "limit", 0); err != nil {
		return p, err
	}
	if p.Offset, err = intParam(c, "offset", 0); err != nil {
		return p, err
	}
	if o := c.Query("order"); o != "" {
		p.Order = strings.Split(o, ",")
	}
	reserved := map[string]bool{"limit": true, "offset": true, "order": true, "from": true, "to": true, "labels": true, "count": true}
	for key, vals := range c.Request.URL.Query() {
		if reserved[key] {
			continue
		}
		if _, ok := t.HasColumn(key); !ok {
			return p, fmt.Errorf("unknown parameter %q: filters are column names (see the table's columns)", key)
		}
		for _, v := range vals {
			for _, part := range strings.Split(v, ",") {
				if part = strings.TrimSpace(part); part != "" {
					p.Filters[key] = append(p.Filters[key], part)
				}
			}
		}
	}
	return p, nil
}

// GetRows returns a page of rows: columns in order, rows as arrays, and the total for the filter when count=1.
func (h *Handler) GetRows(c *gin.Context) {
	t, ok := h.table(c)
	if !ok {
		return
	}
	p, err := params(c, t)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	q, err := query.Build(t, p, h.cfg.MaxRows)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	ctx := c.Request.Context()
	rows, err := h.db.Pool.Query(ctx, q.SQL, q.Args...)
	if err != nil {
		logger.FromContext(c).Error().Err(err).Str("sql", q.SQL).Msg("rows query failed")
		c.JSON(500, gin.H{"error": "database error"})
		return
	}
	defer rows.Close()
	data := make([][]any, 0, 256)
	for rows.Next() {
		vals, err := rows.Values()
		if err != nil {
			c.JSON(500, gin.H{"error": "database error"})
			return
		}
		row := make([]any, len(vals))
		for i, v := range vals {
			row[i] = jsonValue(v)
		}
		data = append(data, row)
	}
	if rows.Err() != nil {
		c.JSON(500, gin.H{"error": "database error"})
		return
	}
	out := gin.H{"table": t.Key, "columns": q.Columns, "rows": data, "limit": q.Limit, "offset": p.Offset, "returned": len(data)}
	if c.Query("count") == "1" || c.Query("count") == "true" {
		var total int64
		if err := h.db.Pool.QueryRow(ctx, q.Count, q.Args[:q.CountArgs]...).Scan(&total); err != nil {
			c.JSON(500, gin.H{"error": "database error"})
			return
		}
		out["total"] = total
	}
	c.JSON(200, out)
}

// GetCSV streams the table (or the filtered slice of it) as CSV. No row limit: the whole table, in load order.
func (h *Handler) GetCSV(c *gin.Context) {
	t, ok := h.table(c)
	if !ok {
		return
	}
	p, err := params(c, t)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	q, err := query.Build(t, p, 0)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	rows, err := h.db.Pool.Query(c.Request.Context(), q.SQL, q.Args...)
	if err != nil {
		logger.FromContext(c).Error().Err(err).Msg("csv query failed")
		c.JSON(500, gin.H{"error": "database error"})
		return
	}
	defer rows.Close()

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s.csv"`, t.Name))
	w := csv.NewWriter(c.Writer)
	_ = w.Write(q.Columns)
	record := make([]string, len(q.Columns))
	n := 0
	for rows.Next() {
		vals, err := rows.Values()
		if err != nil {
			break
		}
		for i, v := range vals {
			record[i] = textValue(v)
		}
		if err := w.Write(record); err != nil {
			return // client went away
		}
		if n++; n%2000 == 0 {
			w.Flush()
			if w.Error() != nil {
				return
			}
		}
	}
	w.Flush()
}

package handlers

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/rbih/dbie-data-api/internal/logger"
)

// Search finds tables by words in their DBIE title or menu path, and SDMX datasets by words in their code-list
// labels (so "currency with the public" finds the money-stock tables that carry that component).
func (h *Handler) Search(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	if len(q) < 2 {
		c.JSON(400, gin.H{"error": "q must have at least two characters"})
		return
	}
	limit, err := intParam(c, "limit", 50)
	if err != nil || limit <= 0 || limit > 500 {
		limit = 50
	}
	pattern := "%" + q + "%"
	ctx := c.Request.Context()

	rows, err := h.db.Pool.Query(ctx, `SELECT source, menu_path, title, schema_name, table_name, status, row_count FROM meta.catalogue WHERE title ILIKE $1 OR menu_path ILIKE $1 ORDER BY (schema_name IS NULL), title LIMIT $2`, pattern, limit)
	if err != nil {
		logger.FromContext(c).Error().Err(err).Msg("search query failed")
		c.JSON(500, gin.H{"error": "database error"})
		return
	}
	type hit struct {
		Source   string  `json:"source"`
		MenuPath string  `json:"menu_path"`
		Title    string  `json:"title"`
		Schema   *string `json:"schema"`
		Table    *string `json:"table"`
		Status   string  `json:"status"`
		Rows     *int64  `json:"row_count"`
	}
	tables := make([]hit, 0, 32)
	for rows.Next() {
		var x hit
		if err := rows.Scan(&x.Source, &x.MenuPath, &x.Title, &x.Schema, &x.Table, &x.Status, &x.Rows); err != nil {
			rows.Close()
			c.JSON(500, gin.H{"error": "database error"})
			return
		}
		tables = append(tables, x)
	}
	rows.Close()

	rows, err = h.db.Pool.Query(ctx, `SELECT c.dsd_code, d.label, d.schema_name, d.table_name, c.dim_code, c.code, c.label FROM meta.sdmx_codelist c JOIN meta.sdmx_dataset d ON d.dsd_code = c.dsd_code WHERE c.label ILIKE $1 ORDER BY d.label, c.dim_code, c.code LIMIT $2`, pattern, limit)
	if err != nil {
		logger.FromContext(c).Error().Err(err).Msg("codelist search failed")
		c.JSON(500, gin.H{"error": "database error"})
		return
	}
	type codeHit struct {
		DSDCode string  `json:"dsd_code"`
		Dataset string  `json:"dataset"`
		Schema  string  `json:"schema"`
		Table   string  `json:"table"`
		DimCode string  `json:"dim_code"`
		Code    *string `json:"code"`
		Label   *string `json:"label"`
	}
	codes := make([]codeHit, 0, 32)
	for rows.Next() {
		var x codeHit
		if err := rows.Scan(&x.DSDCode, &x.Dataset, &x.Schema, &x.Table, &x.DimCode, &x.Code, &x.Label); err != nil {
			rows.Close()
			c.JSON(500, gin.H{"error": "database error"})
			return
		}
		codes = append(codes, x)
	}
	rows.Close()
	c.JSON(200, gin.H{"q": q, "tables": tables, "codes": codes})
}

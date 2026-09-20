package handlers

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/rbih/dbie-data-api/internal/logger"
)

// GetCodelist returns a dataset's code lists: for every dimension (or the one in ?dim=), each code with its label,
// hierarchy level and parent.
func (h *Handler) GetCodelist(c *gin.Context) {
	dsd := strings.ToUpper(c.Param("dsd"))
	sql := `SELECT dim_code, dim_name, value_id, code, label, parent_value_id, level FROM meta.sdmx_codelist WHERE dsd_code = $1`
	args := []any{dsd}
	if dim := c.Query("dim"); dim != "" {
		sql += " AND dim_code = $2"
		args = append(args, strings.ToUpper(dim))
	}
	sql += " ORDER BY dim_code, level, code"
	rows, err := h.db.Pool.Query(c.Request.Context(), sql, args...)
	if err != nil {
		logger.FromContext(c).Error().Err(err).Msg("codelist query failed")
		c.JSON(500, gin.H{"error": "database error"})
		return
	}
	defer rows.Close()
	type entry struct {
		ValueID  string  `json:"value_id"`
		Code     *string `json:"code"`
		Label    *string `json:"label"`
		ParentID *string `json:"parent_value_id"`
		Level    *int    `json:"level"`
	}
	dims := map[string]*struct {
		Code   string  `json:"dim_code"`
		Name   *string `json:"dim_name"`
		Values []entry `json:"values"`
	}{}
	var order []string
	for rows.Next() {
		var dimCode string
		var dimName *string
		var e entry
		if err := rows.Scan(&dimCode, &dimName, &e.ValueID, &e.Code, &e.Label, &e.ParentID, &e.Level); err != nil {
			c.JSON(500, gin.H{"error": "database error"})
			return
		}
		d, ok := dims[dimCode]
		if !ok {
			d = &struct {
				Code   string  `json:"dim_code"`
				Name   *string `json:"dim_name"`
				Values []entry `json:"values"`
			}{Code: dimCode, Name: dimName}
			dims[dimCode] = d
			order = append(order, dimCode)
		}
		d.Values = append(d.Values, e)
	}
	if len(order) == 0 {
		c.JSON(404, gin.H{"error": "no code lists for this dataset"})
		return
	}
	out := make([]any, len(order))
	for i, k := range order {
		out[i] = dims[k]
	}
	c.JSON(200, gin.H{"dsd_code": dsd, "dimensions": out})
}

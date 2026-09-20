// Package query turns request parameters into SQL that can only touch registered tables and columns. Every
// identifier comes from the registry (never from the request text), every value is a bind parameter, and the
// row limit is clamped. The same builder serves the JSON page and the CSV stream.
package query

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/rbih/dbie-data-api/internal/registry"
)

// Params are the request's parameters after parsing.
type Params struct {
	// Column equality filters; several values for one column mean "any of".
	Filters map[string][]string
	// Range on time_period (SDMX tables), inclusive, ISO dates.
	From, To string
	// Sort: column names with an optional ":desc".
	Order  []string
	Limit  int
	Offset int
	// Add a <dimension>_label column for every dimension with a code list.
	Labels bool
}

// Rows is the built statement.
type Rows struct {
	SQL       string
	Args      []any
	Columns   []string // output column names in order
	Limit     int      // the effective page size (0 when unbounded)
	Count     string   // count(*) over the same filter, same Args[:CountArgs]
	CountArgs int
}

// Build validates params against the table and produces the statement. Errors are user errors (400).
func Build(t *registry.Table, p Params, maxRows int) (*Rows, error) {
	var where []string
	var args []any
	arg := func(v any) string { args = append(args, v); return fmt.Sprintf("$%d", len(args)) }

	// Filters, in a stable order so the SQL text is cacheable.
	keys := make([]string, 0, len(p.Filters))
	for k := range p.Filters {
		keys = append(keys, k)
	}
	sortStrings(keys)
	for _, col := range keys {
		typ, ok := t.HasColumn(col)
		if !ok {
			return nil, fmt.Errorf("unknown column %q", col)
		}
		vals := p.Filters[col]
		if len(vals) == 0 {
			continue
		}
		cast, err := arrayCast(typ, vals)
		if err != nil {
			return nil, fmt.Errorf("column %q: %w", col, err)
		}
		where = append(where, fmt.Sprintf("t.%s = ANY(%s::%s)", quote(col), arg(vals), cast))
	}
	if p.From != "" || p.To != "" {
		typ, ok := t.HasColumn("time_period")
		if !ok || typ != "date" {
			return nil, fmt.Errorf("from/to need a date time_period column; this table has none")
		}
		if p.From != "" {
			if !isDate(p.From) {
				return nil, fmt.Errorf("from must be YYYY-MM-DD")
			}
			where = append(where, fmt.Sprintf("t.time_period >= %s::date", arg(p.From)))
		}
		if p.To != "" {
			if !isDate(p.To) {
				return nil, fmt.Errorf("to must be YYYY-MM-DD")
			}
			where = append(where, fmt.Sprintf("t.time_period <= %s::date", arg(p.To)))
		}
	}
	countArgs := len(args)

	// Select list: the table's columns, plus labels for coded dimensions when asked.
	sel := make([]string, 0, len(t.Columns)+len(t.Codelists))
	cols := make([]string, 0, len(t.Columns)+len(t.Codelists))
	for _, c := range t.Columns {
		sel = append(sel, "t."+quote(c.Name))
		cols = append(cols, c.Name)
	}
	if p.Labels && t.DSDCode != "" {
		dsd := arg(t.DSDCode)
		for _, dim := range t.Codelists {
			// Scalar subquery rather than a join: a code can sit at more than one hierarchy level, and a join would
			// then multiply rows. The (dim_code, code) index keeps this cheap.
			sel = append(sel, fmt.Sprintf("(SELECT cl.label FROM meta.sdmx_codelist cl WHERE cl.dsd_code = %s AND cl.dim_code = %s AND cl.code = t.%s ORDER BY cl.level LIMIT 1) AS %s",
				dsd, arg(strings.ToUpper(dim)), quote(dim), quote(dim+"_label")))
			cols = append(cols, dim+"_label")
		}
	}

	// Order: requested columns, else the load order.
	var order []string
	for _, o := range p.Order {
		col, dir := o, "ASC"
		if i := strings.IndexByte(o, ':'); i >= 0 {
			col, dir = o[:i], strings.ToUpper(o[i+1:])
			if dir != "ASC" && dir != "DESC" {
				return nil, fmt.Errorf("order %q: use column or column:desc", o)
			}
		}
		if _, ok := t.HasColumn(col); !ok {
			return nil, fmt.Errorf("order: unknown column %q", col)
		}
		order = append(order, "t."+quote(col)+" "+dir)
	}
	if len(order) == 0 {
		if _, ok := t.HasColumn("src_line"); ok {
			order = []string{"t.src_line"}
		} else {
			order = []string{"t.src_file", "t.row_no"}
		}
	}

	limit := p.Limit
	if limit <= 0 {
		limit = 100
	}
	if maxRows > 0 && limit > maxRows {
		limit = maxRows
	}
	if p.Offset < 0 {
		return nil, fmt.Errorf("offset must not be negative")
	}

	from := fmt.Sprintf(" FROM %s.%s t", quote(t.Schema), quote(t.Name))
	whereSQL := ""
	if len(where) > 0 {
		whereSQL = " WHERE " + strings.Join(where, " AND ")
	}
	sql := "SELECT " + strings.Join(sel, ", ") + from + whereSQL + " ORDER BY " + strings.Join(order, ", ")
	if maxRows > 0 {
		sql += fmt.Sprintf(" LIMIT %d OFFSET %d", limit, p.Offset)
	} else {
		limit = 0
	}
	return &Rows{SQL: sql, Args: args, Columns: cols, Limit: limit, Count: "SELECT count(*)" + from + whereSQL, CountArgs: countArgs}, nil
}

// arrayCast picks the array type for an equality filter and checks the values fit it.
func arrayCast(typ string, vals []string) (string, error) {
	switch typ {
	case "text", "text[]":
		return "text[]", nil
	case "integer":
		for _, v := range vals {
			if _, err := strconv.ParseInt(v, 10, 64); err != nil {
				return "", fmt.Errorf("%q is not an integer", v)
			}
		}
		return "bigint[]", nil
	case "numeric":
		for _, v := range vals {
			if _, err := strconv.ParseFloat(v, 64); err != nil {
				return "", fmt.Errorf("%q is not a number", v)
			}
		}
		return "numeric[]", nil
	case "date":
		for _, v := range vals {
			if !isDate(v) {
				return "", fmt.Errorf("%q is not a date (YYYY-MM-DD)", v)
			}
		}
		return "date[]", nil
	}
	return "text[]", nil
}

func isDate(s string) bool {
	if len(s) != 10 || s[4] != '-' || s[7] != '-' {
		return false
	}
	for i, ch := range s {
		if i == 4 || i == 7 {
			continue
		}
		if ch < '0' || ch > '9' {
			return false
		}
	}
	return true
}

// quote double-quotes an identifier that came from the registry.
func quote(id string) string {
	return `"` + strings.ReplaceAll(id, `"`, `""`) + `"`
}

func sortStrings(a []string) {
	for i := 1; i < len(a); i++ {
		for j := i; j > 0 && a[j] < a[j-1]; j-- {
			a[j], a[j-1] = a[j-1], a[j]
		}
	}
}

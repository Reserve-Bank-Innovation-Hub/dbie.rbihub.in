// Package registry is the in-memory picture of what the database holds: every loaded table (from meta.tables), its
// columns and types (information_schema), and for SDMX tables its dimension columns and which of them have a code
// list. Handlers resolve every schema and table name through it, so a request can only ever reach a table the
// loaders registered, and every column name in a filter or sort is checked against it before it goes near SQL.
// Refreshed on a timer; loads are rare and a stale minute costs nothing.
package registry

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
)

// Column is a table column as Postgres reports it.
type Column struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

// Table is one loaded table and its DBIE identity.
type Table struct {
	Key       string     `json:"key"`
	Source    string     `json:"source"`
	Schema    string     `json:"schema"`
	Name      string     `json:"table"`
	Title     string     `json:"title"`
	DBIEPath  string     `json:"dbie_path"`
	Frequency string     `json:"frequency,omitempty"`
	RowCount  int64      `json:"row_count"`
	LoadedAt  *time.Time `json:"loaded_at,omitempty"`
	Layout    string     `json:"layout"` // typed (SDMX), columns or array (reports)
	Width     int        `json:"width,omitempty"`
	DSDCode   string     `json:"dsd_code,omitempty"`
	ReportID  int        `json:"report_id,omitempty"`
	Columns   []Column   `json:"columns"`
	// SDMX dimension columns (lower-case names) and, of those, the ones DBIE publishes a code list for.
	Dimensions []string `json:"dimensions,omitempty"`
	Codelists  []string `json:"codelists,omitempty"`

	columns map[string]string
}

// HasColumn reports whether the table has the column and returns its type.
func (t *Table) HasColumn(name string) (string, bool) {
	typ, ok := t.columns[name]
	return typ, ok
}

// HasCodelist reports whether a dimension column has a code list.
func (t *Table) HasCodelist(dim string) bool {
	for _, d := range t.Codelists {
		if d == dim {
			return true
		}
	}
	return false
}

// Registry is the snapshot, swapped whole on refresh.
type Registry struct {
	pool      *pgxpool.Pool
	mu        sync.RWMutex
	tables    map[string]*Table
	list      []*Table
	loadedAt  time.Time
	schemas   []string
	catalogue int
}

// New builds a registry and loads it once.
func New(ctx context.Context, pool *pgxpool.Pool) (*Registry, error) {
	r := &Registry{pool: pool}
	if err := r.Refresh(ctx); err != nil {
		return nil, err
	}
	return r, nil
}

// Run refreshes on a timer until ctx ends.
func (r *Registry) Run(ctx context.Context, every time.Duration) {
	t := time.NewTicker(every)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			if err := r.Refresh(ctx); err != nil {
				log.Warn().Err(err).Msg("Registry refresh failed; keeping the previous snapshot")
			}
		}
	}
}

// Get returns a table by schema and name.
func (r *Registry) Get(schema, name string) (*Table, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	t, ok := r.tables[schema+"."+name]
	return t, ok
}

// List returns every table, sorted by schema then name.
func (r *Registry) List() []*Table {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.list
}

// Stats describes the snapshot.
func (r *Registry) Stats() (tables int, catalogue int, loadedAt time.Time) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.list), r.catalogue, r.loadedAt
}

// Refresh rebuilds the snapshot from meta.* and information_schema.
func (r *Registry) Refresh(ctx context.Context) error {
	tables := map[string]*Table{}

	rows, err := r.pool.Query(ctx, `SELECT source, schema_name, table_name, title, dbie_path, coalesce(frequency, ''), coalesce(row_count, 0), loaded_at FROM meta.tables`)
	if err != nil {
		return fmt.Errorf("meta.tables: %w", err)
	}
	for rows.Next() {
		t := &Table{columns: map[string]string{}}
		if err := rows.Scan(&t.Source, &t.Schema, &t.Name, &t.Title, &t.DBIEPath, &t.Frequency, &t.RowCount, &t.LoadedAt); err != nil {
			rows.Close()
			return err
		}
		t.Key = t.Schema + "." + t.Name
		t.Layout = "typed"
		tables[t.Key] = t
	}
	rows.Close()

	rows, err = r.pool.Query(ctx, `SELECT schema_name, table_name, report_id, coalesce(layout, 'columns'), coalesce(width, 0) FROM meta.report WHERE table_name IS NOT NULL`)
	if err != nil {
		return fmt.Errorf("meta.report: %w", err)
	}
	for rows.Next() {
		var schema, name, layout string
		var id, width int
		if err := rows.Scan(&schema, &name, &id, &layout, &width); err != nil {
			rows.Close()
			return err
		}
		if t, ok := tables[schema+"."+name]; ok {
			t.ReportID, t.Layout, t.Width = id, layout, width
		}
	}
	rows.Close()

	rows, err = r.pool.Query(ctx, `SELECT d.schema_name, d.table_name, d.dsd_code, d.dimension_columns, coalesce(array_agg(DISTINCT lower(c.dim_code)) FILTER (WHERE c.dim_code IS NOT NULL), '{}') FROM meta.sdmx_dataset d LEFT JOIN meta.sdmx_codelist c ON c.dsd_code = d.dsd_code GROUP BY 1, 2, 3, 4`)
	if err != nil {
		return fmt.Errorf("meta.sdmx_dataset: %w", err)
	}
	for rows.Next() {
		var schema, name, dsd string
		var dims, lists []string
		if err := rows.Scan(&schema, &name, &dsd, &dims, &lists); err != nil {
			rows.Close()
			return err
		}
		if t, ok := tables[schema+"."+name]; ok {
			t.DSDCode, t.Dimensions = dsd, dims
			for _, d := range dims {
				for _, l := range lists {
					if d == l {
						t.Codelists = append(t.Codelists, d)
					}
				}
			}
		}
	}
	rows.Close()

	schemaSet := map[string]bool{}
	for _, t := range tables {
		schemaSet[t.Schema] = true
	}
	schemas := make([]string, 0, len(schemaSet))
	for s := range schemaSet {
		schemas = append(schemas, s)
	}
	sort.Strings(schemas)

	rows, err = r.pool.Query(ctx, `SELECT table_schema, table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = ANY($1) ORDER BY table_schema, table_name, ordinal_position`, schemas)
	if err != nil {
		return fmt.Errorf("information_schema.columns: %w", err)
	}
	for rows.Next() {
		var schema, name, col, typ string
		if err := rows.Scan(&schema, &name, &col, &typ); err != nil {
			rows.Close()
			return err
		}
		if t, ok := tables[schema+"."+name]; ok {
			typ = shortType(typ)
			t.Columns = append(t.Columns, Column{Name: col, Type: typ})
			t.columns[col] = typ
		}
	}
	rows.Close()

	var catalogue int
	if err := r.pool.QueryRow(ctx, `SELECT count(*) FROM meta.catalogue`).Scan(&catalogue); err != nil {
		return fmt.Errorf("meta.catalogue: %w", err)
	}

	list := make([]*Table, 0, len(tables))
	for _, t := range tables {
		list = append(list, t)
	}
	sort.Slice(list, func(i, j int) bool { return list[i].Key < list[j].Key })

	r.mu.Lock()
	r.tables, r.list, r.schemas, r.catalogue, r.loadedAt = tables, list, schemas, catalogue, time.Now()
	r.mu.Unlock()
	log.Info().Int("tables", len(list)).Int("catalogue", catalogue).Msg("Registry loaded")
	return nil
}

// shortType maps information_schema's spelling to the names the API uses.
func shortType(t string) string {
	switch t {
	case "character varying", "text", "character":
		return "text"
	case "integer", "smallint", "bigint":
		return "integer"
	case "numeric", "double precision", "real":
		return "numeric"
	case "date":
		return "date"
	case "timestamp with time zone", "timestamp without time zone":
		return "timestamp"
	case "boolean":
		return "boolean"
	case "ARRAY":
		return "text[]"
	}
	return strings.ToLower(t)
}

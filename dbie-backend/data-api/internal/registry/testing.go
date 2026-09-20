package registry

// NewForTest builds a Table without a database, for the query builder's tests.
func NewForTest(schema, name, dsd string, columns []Column, dimensions, codelists []string) *Table {
	t := &Table{Key: schema + "." + name, Schema: schema, Name: name, DSDCode: dsd, Columns: columns, Dimensions: dimensions, Codelists: codelists, columns: map[string]string{}}
	for _, c := range columns {
		t.columns[c.Name] = c.Type
	}
	if dsd != "" {
		t.Source, t.Layout = "sdmx", "typed"
	} else {
		t.Source, t.Layout = "publications", "columns"
	}
	return t
}

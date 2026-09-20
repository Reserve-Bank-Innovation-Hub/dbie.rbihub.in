package query

import (
	"strings"
	"testing"

	"github.com/rbih/dbie-data-api/internal/registry"
)

func sdmxTable() *registry.Table {
	return registry.NewForTest("financial_sector", "bmc_m_rn", "BMC_M_RN", []registry.Column{
		{Name: "src_line", Type: "integer"}, {Name: "dataflow", Type: "text"}, {Name: "comp_rn", Type: "text"},
		{Name: "freq", Type: "text"}, {Name: "time_period", Type: "date"}, {Name: "obs_value", Type: "numeric"},
	}, []string{"comp_rn", "freq"}, []string{"comp_rn"})
}

func reportTable() *registry.Table {
	return registry.NewForTest("public_finance", "r100_commercial_bank_survey", "", []registry.Column{
		{Name: "src_file", Type: "text"}, {Name: "tab", Type: "text"}, {Name: "period", Type: "text"},
		{Name: "row_no", Type: "integer"}, {Name: "c1", Type: "text"}, {Name: "c2", Type: "text"},
	}, nil, nil)
}

func TestDefaultsAndOrder(t *testing.T) {
	r, err := Build(sdmxTable(), Params{}, 5000)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(r.SQL, `FROM "financial_sector"."bmc_m_rn" t`) || !strings.HasSuffix(r.SQL, "ORDER BY t.src_line LIMIT 100 OFFSET 0") {
		t.Fatalf("unexpected SQL: %s", r.SQL)
	}
	if len(r.Args) != 0 || len(r.Columns) != 6 {
		t.Fatalf("args %v columns %v", r.Args, r.Columns)
	}
	r, _ = Build(reportTable(), Params{}, 5000)
	if !strings.Contains(r.SQL, "ORDER BY t.src_file, t.row_no") {
		t.Fatalf("report default order: %s", r.SQL)
	}
}

func TestFiltersAreParameters(t *testing.T) {
	r, err := Build(sdmxTable(), Params{Filters: map[string][]string{"comp_rn": {"CMS1", "CMS11"}, "freq": {"M"}}, From: "2020-04-01", To: "2021-03-31"}, 5000)
	if err != nil {
		t.Fatal(err)
	}
	want := `WHERE t."comp_rn" = ANY($1::text[]) AND t."freq" = ANY($2::text[]) AND t.time_period >= $3::date AND t.time_period <= $4::date`
	if !strings.Contains(r.SQL, want) {
		t.Fatalf("SQL %s", r.SQL)
	}
	if strings.Contains(r.SQL, "CMS1") {
		t.Fatal("value leaked into SQL text")
	}
	if r.CountArgs != 4 || !strings.HasSuffix(r.Count, want) {
		t.Fatalf("count %s (%d)", r.Count, r.CountArgs)
	}
}

func TestRejectsUnknownAndBadValues(t *testing.T) {
	cases := []Params{
		{Filters: map[string][]string{"nope": {"x"}}},
		{Filters: map[string][]string{"obs_value": {"abc"}}},
		{Filters: map[string][]string{"src_line": {"1.5"}}},
		{From: "01-04-2020"},
		{Order: []string{"comp_rn:sideways"}},
		{Order: []string{"drop table"}},
		{Offset: -1},
	}
	for i, p := range cases {
		if _, err := Build(sdmxTable(), p, 5000); err == nil {
			t.Errorf("case %d accepted %+v", i, p)
		}
	}
	if _, err := Build(reportTable(), Params{From: "2020-01-01"}, 5000); err == nil {
		t.Error("from accepted on a table without time_period")
	}
}

func TestLabelsAndLimits(t *testing.T) {
	r, err := Build(sdmxTable(), Params{Labels: true, Limit: 99999, Offset: 10, Order: []string{"time_period:desc", "comp_rn"}}, 5000)
	if err != nil {
		t.Fatal(err)
	}
	if r.Columns[len(r.Columns)-1] != "comp_rn_label" || !strings.Contains(r.SQL, `cl.dim_code = $2 AND cl.code = t."comp_rn"`) {
		t.Fatalf("labels: %s %v", r.SQL, r.Columns)
	}
	if r.Args[0] != "BMC_M_RN" || r.Args[1] != "COMP_RN" {
		t.Fatalf("label args %v", r.Args)
	}
	if !strings.HasSuffix(r.SQL, `ORDER BY t."time_period" DESC, t."comp_rn" ASC LIMIT 5000 OFFSET 10`) {
		t.Fatalf("order/limit: %s", r.SQL)
	}
	// Unbounded (CSV) build has no LIMIT.
	r, _ = Build(sdmxTable(), Params{}, 0)
	if strings.Contains(r.SQL, "LIMIT") {
		t.Fatalf("csv build should not limit: %s", r.SQL)
	}
}

# Adding new data visualisations — DBIE

Guide for adding new charts, tables, and data endpoints to DBIE.

---

## Architecture pattern

All data features follow this consistent flow:

```
Excel file → Go parser → Service → Handler → API endpoint
                ↓
         Frontend API client → Server component → Client component
                ↓
         Plotly chart or AG Grid table
```

**Reference implementations:**
- Forex reserves (indicators): Chart + table with weekly data
- Credit classification (publications): Complex table with nested data

---

## Quick reference — file locations

| Layer | Location | Reference file |
|-------|----------|----------------|
| Model | `backend/internal/models/` | `forex_reserves.go` |
| Parser | `backend/internal/parser/` | `forex_reserves_parser.go` |
| Service | `backend/internal/service/` | `indicators_service.go` |
| Handler | `backend/internal/handlers/` | `indicators.go` |
| Routes | `backend/cmd/server/main.go` | Lines 73-81 |
| API client | `frontend/src/lib/api/` | `indicators.ts` |
| Chart | `frontend/src/components/charts/` | `ForexReservesChart.tsx` |
| Table | `frontend/src/components/tables/` | `ForexReservesGrid.tsx` |
| Page | `frontend/src/app/(auth)/{category}/{feature}/` | `indicators/forex-reserves/` |

---

## Backend implementation

### Step 1: Create data model

**Location:** `backend/internal/models/{feature_name}.go`

See `backend/internal/models/forex_reserves.go` for a complete example.

**Key points:**
- Use `json` tags matching frontend field names (camelCase)
- Use `float64` for all numeric values
- Create both a data struct and a wrapper struct with metadata

### Step 2: Create Excel parser

**Location:** `backend/internal/parser/{feature_name}_parser.go`

See `backend/internal/parser/forex_reserves_parser.go` for a complete example.

**Excel parsing tips:**
- Column/row indexing starts at 0
- Merged cells: only first cell contains value
- Use `strings.TrimSpace()` on all cell values
- Track year/period markers for merged header cells

**Common patterns:**

```go
// Year markers (e.g., "2025-26") vs data rows
isDate := strings.Contains(col1, "Nov") || strings.Contains(col1, "Jan") // etc
if !isDate {
    currentYear = col1
    continue
}

// parseFloat helper (already defined in credit_classification_parser.go)
// Handles commas, empty strings, and "-" values
```

### Step 3: Add to service layer

**Location:** `backend/internal/service/{service_name}_service.go`

See `backend/internal/service/indicators_service.go` for complete examples including:
- Full data endpoint (`GetForexReserves`)
- Recent/subset endpoint (`GetForexReservesRecent`)

### Step 4: Create handler

**Location:** `backend/internal/handlers/{handler_name}.go`

See `backend/internal/handlers/indicators.go` for the pattern.

### Step 5: Register route

**Location:** `backend/cmd/server/main.go`

Add routes following the existing pattern (lines 73-81 for indicators).

**Testing:** Air will auto-reload. Check logs for route registration.

---

## Frontend implementation

### Step 1: Create API client

**Location:** `frontend/src/lib/api/{category}.ts`

See `frontend/src/lib/api/indicators.ts` for complete examples including:
- TypeScript interfaces matching backend models
- Async fetch functions with proper typing

### Step 2: Create page route

**Directory:** `frontend/src/app/(auth)/{category}/{feature}/`

See `frontend/src/app/(auth)/indicators/forex-reserves/` for the complete pattern:
- `page.tsx` — Server component (fetches data, sets metadata)
- `page.client.tsx` — Client component (renders UI)
- `loading.tsx` — Loading skeleton
- `{feature}-page.css` — Page-specific styles

---

## Chart components

### Chart configuration

All charts use centralized config from `frontend/src/components/charts/chartConfig.ts`:
- `CHART_COLORS` — Named colour palette (16 colors)
- `getBaseLayout()` — Common layout (fonts, legend, margins)
- `getBaseConfig()` — Plotly controls configuration
- `createTitle()` / `createAxis()` — Helper functions

**Available colours:** `purpleDark`, `purpleLight`, `blueDark`, `blueMid`, `blueLight`, `greenDark`, `greenMid`, `greenLight`, `yellowDark`, `yellowMid`, `orangeMid`, `redDark`, `redMid`, `redLight`

### Creating a chart

**Location:** `frontend/src/components/charts/{Feature}Chart.tsx`

See `frontend/src/components/charts/ForexReservesChart.tsx` for a complete example showing:
- Dynamic import for SSR safety
- useMemo for data transformation
- Mixed bar + line traces
- Custom hover templates
- Responsive layout

**Chart types:**
- Line: `type: "scatter", mode: "lines"`
- Bar: `type: "bar"` with `barmode: "group"` or `"stack"`
- Stacked area: `type: "scatter", stackgroup: "one"`

---

## Table components

### AG Grid configuration

**Location:** `frontend/src/components/tables/{Feature}Grid.tsx`

See `frontend/src/components/tables/ForexReservesGrid.tsx` for a complete example showing:
- Custom theme based on `themeQuartz`
- Column groups with `ColGroupDef`
- Number formatter with Indian locale
- Pinned columns, pagination, sorting

**Key features (Community):**
- ✅ Sorting, filtering, pagination
- ✅ Pinned columns, column grouping
- ✅ Number formatting with `valueFormatter`
- ❌ Set filters, range selection = Enterprise only

---

## Excel inspection workflow

Before parsing, always inspect the file structure:

```go
// Create backend/inspect_{feature}.go
package main

import (
    "fmt"
    "github.com/xuri/excelize/v2"
)

func main() {
    f, _ := excelize.OpenFile("../frontend/src/sample-data/File.xlsx")
    defer f.Close()
    rows, _ := f.GetRows(f.GetSheetList()[0])

    for i := 0; i < 15 && i < len(rows); i++ {
        fmt.Printf("Row %d: ", i+1)
        for j := 0; j < 10 && j < len(rows[i]); j++ {
            if rows[i][j] != "" {
                fmt.Printf("[%d: %s] ", j, rows[i][j])
            }
        }
        fmt.Println()
    }
}
```

Run: `cd backend && go run inspect_{feature}.go`

---

## Testing checklist

1. ✅ Backend compiles: `cd backend && go build ./cmd/server`
2. ✅ Route registered: Check Air logs for `GET /api/...`
3. ✅ API returns data: `curl http://localhost:8080/api/...`
4. ✅ Correct row count and values
5. ✅ Frontend fetches: Check browser network tab
6. ✅ Chart/table renders correctly
7. ✅ No console errors

---

## Common issues

| Issue | Solution |
|-------|----------|
| Air doesn't rebuild | Touch `cmd/server/main.go` |
| All data values are 0 | Check column offset in parser |
| "No valid data found" | Check row start index, skip conditions |
| Period/year is empty | Check merged cell tracking |
| AG Grid module error | Use `theme={customTheme}` with Theming API |
| Grid doesn't fill height | Use `flex: 1` on grid wrapper |

---

## Directory structure

```
backend/
├── internal/
│   ├── models/           # Data structures
│   ├── parser/           # Excel/file parsers
│   ├── service/          # Business logic
│   └── handlers/         # HTTP handlers
└── cmd/server/main.go    # Route registration

frontend/src/
├── lib/api/              # API clients + TypeScript interfaces
├── components/
│   ├── charts/           # Plotly chart components
│   └── tables/           # AG Grid table components
└── app/(auth)/           # Next.js page routes
    ├── indicators/
    └── publications/
```

---

## Implementation checklist

When adding a new visualisation:

1. ✅ Get Excel file, place in `frontend/src/sample-data/`
2. ✅ Run inspection script to understand structure
3. ✅ Create model in `backend/internal/models/`
4. ✅ Create parser in `backend/internal/parser/`
5. ✅ Add methods to service in `backend/internal/service/`
6. ✅ Create handler methods in `backend/internal/handlers/`
7. ✅ Register routes in `backend/cmd/server/main.go`
8. ✅ Test backend API with curl
9. ✅ Add interfaces and functions to `frontend/src/lib/api/`
10. ✅ Create page route in `frontend/src/app/(auth)/`
11. ✅ Create grid/chart component in `frontend/src/components/`
12. ✅ Test end-to-end

---

**Document version:** 2.0
**Last updated:** 2025-11-25
**Status:** Simplified — references actual code files

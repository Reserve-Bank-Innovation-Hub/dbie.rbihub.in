# DBIE scraper

Downloads every SDMX time series published by the RBI Database on Indian Economy (DBIE) portal as CSV.

## What it gets

252 elements across 6 sectors:

| Sector              | Elements |
|---------------------|---------:|
| Corporate Sector    |       65 |
| Real Sector         |       58 |
| Financial Markets   |       36 |
| External Sector     |       35 |
| Financial Sector    |       29 |
| Public Finance      |       29 |

By frequency: 153 Annual-FY, 50 Monthly, 18 Quarterly-FY, 11 Weekly, 10 Daily, 8 Fortnightly, 1 Quarterly, 1 Annual-CY.

## Output format

Each element is saved as SDMX CSV at `data/<Sector>/<SubSector>/<DSD_CODE>.csv`. Sample:

```csv
DATAFLOW,AUDST,FREQ,REPYEAREND,REPYEARSTART,TYP_EXT_DEBT_RN,UNIT_MULT,TIME_PERIOD,UNIT_MEASURE,OBS_VALUE
RBI:EXT_DBT_RT_RN(1.0),N_A,QFY,2005,2004,GROSS_TTL_DBT,0,2004-06-30,INR,5180100000000
...
```

## How it works

DBIE exposes two data surfaces:

1. **Reports** (SAP BusinessObjects Enterprise Web Intelligence reports) — auth-walled, redirects guests to `UI5logon.jsp`. Not scrapable without RBI credentials. See `recon/output/REPORTS-PATH-FINDINGS.md`.
2. **SDMX Data Query wizard** at `/DBIE/#/dbie/dataquery_enhanced` — guest-accessible, downloads SDMX CSV. This is what we scrape.

The scraper drives the wizard with Playwright. For each element: select it in the sector tree → fill dates (format depends on frequency) → select all dimensions → click View Data → wait for Output → pick "SDMX CSV" from the download dropdown. Average ~30s per element.

We use Playwright (not direct HTTP) because the wizard's Impala query payload is AES-encrypted on the client with a static key, and the CSV download is only triggered from the rendered Output view.

## Usage

```bash
pnpm install   # at repo root                               # installs playwright
node scripts/fetch-sdmx-tree.mjs               # (re)generates sdmx-tree.json (the master list)
node scripts/scrape-sdmx.mjs                   # scrape everything (resumable via manifest.json)

# Filters
node scripts/scrape-sdmx.mjs --sector "External Sector"
node scripts/scrape-sdmx.mjs --sub    "External Debt"
node scripts/scrape-sdmx.mjs --dsd    EXT_DBT_RT_RN
node scripts/scrape-sdmx.mjs --limit  10
node scripts/scrape-sdmx.mjs --headful         # show the browser (debugging)
node scripts/scrape-sdmx.mjs --verbose
```

## Files

```
dbie-scraper/
├── recon/
│   ├── wizard-probe.mjs           # end-to-end Playwright recon; writes recon/output/
│   ├── reports-probe.mjs          # HTTP probe of the Reports path (documents the auth wall)
│   └── output/                    # recon artefacts (gitignored)
│       ├── wizard-traffic.jsonl   # every gateway request/response from the probe
│       ├── wizard-*.png           # screenshot at each wizard step
│       ├── wizard-download-*.csv  # the actual downloaded file
│       └── REPORTS-PATH-FINDINGS.md
├── src/
│   ├── fetch-sdmx-tree.mjs        # writes sdmx-tree.json + sdmx-tree-raw.json
│   └── scrape-sdmx.mjs            # the production scraper
├── catalogue.json                 # Reports path catalogue (copied from dbie-download for reference)
├── sdmx-tree.json                 # SDMX element master list (252 entries)
├── manifest.json                  # per-element status, resumable
└── data/                          # scraped CSVs (gitignored)
```

## Status of the `manifest.json`

```json
{
  "results": {
    "EXT_DBT_RT_RN": { "status": "ok", "file": "data/.../EXT_DBT_RT_RN.csv", "bytes": 14815, "took": 30, "at": "..." },
    "SOME_CODE":     { "status": "no-record", "took": 25, "at": "..." },
    "OTHER_CODE":    { "status": "error", "error": "...", "took": 12, "at": "..." }
  }
}
```

- `ok` — CSV downloaded.
- `no-record` — wizard ran to completion but the query returned no rows (usually because dimension selection couldn't be completed; worth a retry after tweaks).
- `error` / `timeout` / `session-expired` — scraper error; next run retries.

Delete the entry (or the whole file) to force a re-scrape.

## Known limitations

- **Partial dimension coverage.** For some elements the "Select all dimensions" pass doesn't tick every leaf — meaning the CSV may only contain one dimension value's data. See `scrape-sdmx.mjs → selectAllDimensions()`. A more thorough walker is a reasonable follow-up.
- **Date formats are heuristic** per frequency. Daily / Weekly / Fortnightly use `MM-DD-YYYY`; Annual uses `YYYY`; Monthly and Quarterly use `MM-YYYY`. If DBIE changes the input widget, these break.
- **Guest session lifetime** is short — long waits inside the wizard can trigger "Session has expired" and abort. The scraper detects and marks `session-expired`.

## Credits

Builds on scaffolding from `../dbie-download/` (catalogue enumeration approach, SPA navigation pattern). This repo takes a different pivot — SDMX wizard instead of the auth-walled Reports path.

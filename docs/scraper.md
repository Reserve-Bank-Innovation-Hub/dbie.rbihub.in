# DBIE scraper

Downloads every SDMX time series published by the RBI Database on Indian Economy (DBIE)
portal as CSV — over plain HTTP, no browser. Also enumerates the Statistics and Publications
menus into `data/reports-catalogue.json`.

## What it gets

252 elements across 6 sectors and 24 sub-sectors (`data/sdmx-tree.json`, refreshed by
`pnpm scrape:tree`). By frequency: 153 Annual-FY, 50 Monthly, 18 Quarterly-FY, 11 Weekly,
10 Daily, 8 Fortnightly, 1 Quarterly, 1 Annual-CY.

The `FREQ` column carries DBIE's short codes: `D` daily, `W` weekly, `2W` or `F` fortnightly, `M` monthly,
`Q` quarterly (calendar year), `QFY` quarterly (financial year), `AFY` annual (financial year), `ACY` annual
(calendar year). A financial year runs April to March: `REPYEARSTART` 2023 with `REPYEAREND` 2024 is FY 2023-24.
Codes with the `_RN` suffix are RBI's own (dataset and dimension codes such as `EXT_DBT_RT_RN` and
`TYP_EXT_DEBT_RN`); the SDMX-global columns (`FREQ`, `TIME_PERIOD`, `OBS_VALUE`, `UNIT_MEASURE`) carry none.
`DATAFLOW` spells the full reference, `RBI:EXT_DBT_RT_RN(1.0)`: agency, code, version.

Each element is saved as SDMX CSV at `data/sdmx-raw/<Sector>/<SubSector>/<DSD_CODE>.csv`
(gitignored staging); `pnpm data:ingest` files them into `data/sdmx/` under readable names.
Sample:

```csv
DATAFLOW,AUDST,FREQ,REPYEAREND,REPYEARSTART,TYP_EXT_DEBT_RN,UNIT_MULT,TIME_PERIOD,UNIT_MEASURE,OBS_VALUE
RBI:EXT_DBT_RT_RN(1.0),N_A,QFY,2005,2004,GROSS_TTL_DBT,0,2004-06-30,INR,5180100000000
```

## How it works

The portal's Data Query wizard is an Angular front end over a JSON gateway
(`https://data.rbi.org.in/CIMS_Gateway_DBIE/GATEWAY/SERVICES/<service>`). The wizard
encrypts most request fields with a static AES key baked into its bundle; that cipher is
reimplemented in `scripts/lib/dbie-gateway.mjs`, so the scraper can speak to the gateway
directly. Per element it performs the same calls the wizard makes:

| Step | Service | Purpose |
|---|---|---|
| 1 | `security_generateSessionToken` | guest bearer token (once per worker) |
| 2 | `dbie_getElementDetailsActionEnhanced` | fact table name, frequency, flow type |
| 3 | `dbie_getCodeListActionEnhanced` | dimension codes (every value is selected: no filter rule is sent) |
| 4 | `dbie_insertPolicyActionEnhanced` | save a query "policy": GROUP BY each dimension and the unit, plus a FROM/TO date window |
| 5 | `dbie_createDDLActionEnhanced` | materialise the query |
| 6 | `download/dbie_getSDMXExcelData` | the SDMX CSV (despite the name) |

The Output-tab render (`dbie_getImpalaDQActionEnhanced`, a multi-megabyte JSON) is not
needed for the download and is skipped. It is used only as a fallback when the CSV export
fails server-side (status `export-error`); the rows are then kept as
`data/sdmx-raw/json/<DSD>.json` so nothing is lost.

Typical cost: 3–8 s per element, ~20 s for the largest (WPI: 461k rows, 45 MB).
A full run at the default concurrency of 3 takes about ten minutes.

### Date windows

`from` is the element's declared start date (`ELE_START_DATE`); Daily elements have none,
so they use `--daily-from` (default `2011-01-01`). `to` is today. Annual series are
aligned the way the wizard aligns them: financial-year elements run from 1 April of the
first FY to 31 March of the current FY; calendar-year elements from 1 January to
31 December. There are no lookback caps — the gateway returns full history in one call.

The scraper groups by every code-list dimension, exactly as the wizard does when every value is
selected, so every dimension value is included. Browser-era files sometimes contained aggregate rows
coded `N_A` for a dimension the wizard had failed to select (sums or, for rates, meaningless
averages); HTTP downloads never contain those. `N_A` is still a legitimate code in some series.

### Validation

Every download is checked before it is written: it must start with the SDMX header, carry
`TIME_PERIOD` and `OBS_VALUE`, and contain at least one observation. Row count, number of
distinct periods, first/last period, distinct values per dimension column and the
code-list size per dimension are recorded in the manifest so coverage can be reviewed.
Rows with an unexpected column count or a non-ISO period are counted as warnings.

## Usage

```bash
pnpm scrape                                   # every element not yet OK in the manifest
pnpm scrape -- --force                        # everything again
pnpm scrape -- --retry-failures               # only elements whose last status is not OK
pnpm scrape -- --dsd EXT_DBT_RT_RN,FR_EXG_RESV_RN --from 2020-01-01 --to 2026-06-30
pnpm scrape -- --sector "External Sector" --sub "External Debt" --limit 5
pnpm scrape -- --concurrency 3 --daily-from 2011-01-01 --verbose
pnpm scrape -- --dry-run                      # print the plan and date windows only

pnpm data:ingest                              # data/sdmx-raw → data/sdmx (idempotent)
pnpm scrape:report                            # data/scrape-report-<date>.md: added/revised/removed vs git HEAD
pnpm scrape:tree                              # refresh data/sdmx-tree.json
pnpm scrape:catalogue                         # refresh data/reports-catalogue.json (Statistics + Publications)
pnpm data:coverage                            # data/coverage-report.md: what the Reports menus have that SDMX does not
```

Keep concurrency low; this is a public service and the guest session pool is shared.

## Manifest (`data/scrape-manifest.json`)

```json
{
  "started": "2026-09-17T08:12:26.000Z",
  "method": "http",
  "results": {
    "EXT_DBT_RT_RN": { "status": "ok", "file": "data/sdmx-raw/External_Sector/External_Debt/EXT_DBT_RT_RN.csv",
                       "bytes": 878104, "rows": 10495, "periods": 87, "first": "2004-06-30", "last": "2025-12-31",
                       "dims": { "TYP_EXT_DEBT_RN": 63 }, "codelist": { "TYP_EXT_DEBT_RN": 63, "UNIT_MEASURE": 3 },
                       "from": "2004-06-30", "to": "2026-09-17", "took": 2, "at": "..." },
    "CALL_MONEY_RN":  { "status": "export-error", "error": "not a CSV: Error Internal Server Error",
                       "jsonRows": 8682, "jsonFile": "data/sdmx-raw/json/CALL_MONEY_RN.json", "took": 24, "at": "..." }
  }
}
```

- `ok` — CSV downloaded and validated.
- `export-error` — the query ran but the CSV export servlet failed (HTTP 200 with an HTML error page, retried three times); rows kept as JSON.
- `no-details` — the gateway knows no fact table for the element.
- `error` — gateway or network error after four attempts (5 s / 20 s / 60 s back-off), or the per-element budget (`--budget`, default 15 min) was exceeded.

Delete an entry (or use `--retry-failures`) to redo it.

## Files

```
scripts/
├── lib/dbie-gateway.mjs        # cipher + gateway client (session, JSON posts, multipart downloads)
├── scrape-sdmx.mjs             # the scraper
├── ingest-sdmx.mjs             # staging → data/sdmx with kebab names
├── report-scrape-diff.mjs      # review report against git HEAD
├── fetch-sdmx-tree.mjs         # element master list (dbie_getSectorAction, plaintext)
├── fetch-reports-catalogue.mjs # Statistics + Publications table catalogue (dbie_getReportsDbie)
├── compare-coverage.mjs        # Reports catalogue vs SDMX coverage
├── export-reports.mjs          # Statistics + Publications report tables via the BOE Raylight REST proxy
├── lib/boe-raylight.mjs        # Raylight client (session, refresh, input controls, export, logoff)
└── recon/                      # Playwright probes, kept for re-deriving the flow if the portal changes
```

## When it breaks

- **Self-check fails at start-up** ("the gateway did not understand an encrypted request"):
  the cipher constants have rotated. Fetch the current `main.*.js` from `https://data.rbi.org.in/`,
  search for `this.tokenResponse=`, and update `TOKEN`, `SALT` (`tokenStatus`) and `IV`
  (`tokenResponse`) in `scripts/lib/dbie-gateway.mjs`.
- **Payload shapes change** (a call returns `status: error` for every element): capture one wizard
  run in a browser with `scripts/recon/wizard-probe.mjs`, decrypt the request bodies with `dec()`
  from the gateway module, and diff against the shapes in `scrape-sdmx.mjs`.
- **`Query creation failed`** from `dbie_createDDLActionEnhanced` is transient on the portal side;
  the retry schedule normally clears it. If it persists for one element, try a narrower `--from`.
- **`export-error` on an element** (today only alphanumeric series such as `CALL_MONEY_RN`, whose
  values are ranges like `4.50-5.15`): the CSV exporter cannot serialise them; the JSON fallback holds
  the data.

## Known limitations

- Daily elements carry no start date on the portal; the window starts at `--daily-from`.
- The gateway's `test_user` / `test_dept` policy owner is what the public wizard itself sends; policies
  are throw-away server-side objects with random names.
- Prompted report documents hold at most 50 choices, because Raylight returns at most 50 values for a
  prompt's list (input-control lists are not capped). Four documents are affected today; see the scrape report.
- Report exports land in `data/reports/` (CSV + xlsx + `<id>.meta.json` per document, `data/reports-manifest.json`,
  `data/reports-cuid-cache.json`). Two district-level CSVs exceed GitHub's 100 MB file limit and are git-ignored;
  keep such files out of the repository (object storage) and re-export the district documents yearly, not monthly.
- The Reports and Publications menus (SAP BusinessObjects documents) are handled by `scripts/export-reports.mjs`
  (see its header for the flow and the pacing rules); guest SAP sessions are rationed, so it polls for one.

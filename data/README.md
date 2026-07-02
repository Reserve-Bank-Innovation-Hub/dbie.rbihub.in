# DBIE data directory

279 tables drawn from the RBI's Database on Indian Economy, in two source formats.

```
data/
├── sdmx/                            # 236 CSVs — scraped from DBIE's SDMX Data Query wizard
│   ├── corporate-sector/
│   ├── external-sector/
│   ├── financial-markets/
│   ├── financial-sector/
│   ├── public-finance/
│   └── real-sector/
├── publications/                    # 43 xlsx — downloaded manually from Monthly RBI Bulletin
│   └── monthly-rbi-bulletin/
│       ├── rbi/
│       ├── money-and-banking/
│       ├── prices-and-production/
│       ├── government-accounts-and-treasury-bills/
│       ├── financial-markets/
│       ├── external-sector/
│       └── payments-and-settlements-systems/
├── catalogue.json                   # machine-readable index over everything (the source of truth)
├── catalogue-summary.md             # human-readable summary
├── build-catalogue.mjs              # rebuilds catalogue.json from the file tree + sdmx-tree.json
└── rename-kebab.mjs                 # renames files/folders to descriptive kebab-case (idempotent)
```

## File naming

Every file and folder uses lower-kebab-case descriptive names. The DSD code / RBIB table number lives inside `catalogue.json`, not in the filename.

- SDMX CSVs: `data/sdmx/<sector>/<sub-sector>/<kebab-label>.csv`
  - e.g. `data/sdmx/external-sector/external-debt/external-debt-ratio.csv`
- RBIB xlsx: `data/publications/monthly-rbi-bulletin/<topic>/table-NN-<kebab-label>.xlsx`
  - e.g. `data/publications/monthly-rbi-bulletin/external-sector/table-33-foreign-exchange-reserves-weekly.xlsx`

When two SDMX elements share a label (only one case: `FOREX_RATE_A_RN` / `FOREX_RATE_AFY_RN`, both labelled "Exchange rate of indian rupees"), the filenames carry a frequency suffix: `-fy` / `-cy`.

Re-run `node data/rename-kebab.mjs` after adding new scraped files. It's idempotent — files already in kebab form are left alone.

## Why two formats

The two paths cover different slices of DBIE:

| | **SDMX CSV** | **RBIB xlsx** |
|---|---|---|
| Surface | SDMX Data Query wizard (guest-accessible) | Monthly RBI Bulletin (behind SAP auth — fetched manually) |
| Coverage | Macro time-series across 6 sectors, 24 sub-sectors | The 43-45 tables RBI publishes as the monthly snapshot |
| Shape | Long, normalised — one observation per row (`DATAFLOW, FREQ, TIME_PERIOD, OBS_VALUE, …dimensions`) | Wide, pivoted — dates across columns, nested row headers |
| Update path | Re-run `dbie-scraper/src/scrape-sdmx.mjs` | Manual download each month |
| Use | Feed charts, compute deltas, power the narrative | Read-ready tables for direct reproduction |

Some tables exist in both forms (e.g. RBIB Table 33 "Foreign Exchange Reserves Weekly" ↔ `FR_EXG_RESV_RN`). `catalogue.json` records these links under `sdmxDuplicates`.

## Categorisation — eight themes

Every entry in `catalogue.json` is tagged with one primary theme. Themes reflect how a reader would ask for the data, not how RBI files it.

| Theme | SDMX | RBIB | Total |
|---|---:|---:|---:|
| Corporate | 65 | 0 | 65 |
| External | 35 | 12 | 47 |
| Money & Banking | 28 | 17 | 45 |
| Growth | 35 | 1 | 36 |
| Markets | 27 | 5 | 32 |
| Government | 28 | 3 | 31 |
| Prices | 18 | 4 | 22 |
| Payments | 0 | 1 | 1 |

Theme rules are defined in `build-catalogue.mjs` — `sdmxTheme()` uses the sector/sub-sector; `rbibTheme()` uses the bulletin topic folder. Fixing a miscategorised table is a one-line edit there.

## Other metadata per entry

- `frequency` — Daily / Weekly / Fortnightly / Monthly / Quarterly / Annual (FY or CY)
- `shape` — `stock` / `flow` / `rate` / `index` / `other`. Drives the default visualisation (stocks → area, flows → bars, rates → thin lines, indices → normalised 100-base lines). Heuristic is rough — 183/279 land in `other` and a more thorough pass would improve this.
- `bytes` — file size for quick sanity checks
- `sdmxDuplicates` — for RBIB entries, a list of SDMX IDs that likely contain the same series

## Catalogue entry shapes

**SDMX:**
```json
{
  "id": "sdmx:EXT_DBT_RT_RN",
  "source": "sdmx",
  "format": "sdmx-csv",
  "path": "data/sdmx/external-sector/external-debt/external-debt-ratio.csv",
  "label": "External Debt Ratio",
  "sector": "External Sector",
  "subSector": "External Debt",
  "dsdCode": "EXT_DBT_RT_RN",
  "frequency": "Quarterly - Financial Year",
  "startDate": "2004-06-30",
  "themes": ["External"],
  "shape": "stock",
  "bytes": 14815
}
```

**RBIB:**
```json
{
  "id": "rbib:33",
  "source": "rbib",
  "format": "xlsx",
  "path": "data/publications/monthly-rbi-bulletin/external-sector/table-33-foreign-exchange-reserves-weekly.xlsx",
  "label": "Foreign Exchange Reserves Weekly",
  "publication": "monthly-rbi-bulletin",
  "topic": "external-sector",
  "tableNo": 33,
  "frequency": "Weekly",
  "themes": ["External"],
  "shape": "stock",
  "sdmxDuplicates": ["sdmx:FR_EXG_RESV_RN"],
  "bytes": 12345
}
```

## Rebuilding the catalogue

After adding or removing files from `sdmx/` or `publications/`:

```bash
node data/build-catalogue.mjs
```

The script reads the file tree, looks up SDMX metadata from the scraper's `sdmx-tree.json` (at `dbie-scraper/sdmx-tree.json`), applies the theme/shape/frequency rules, and rewrites `catalogue.json` and `catalogue-summary.md`.

## Coverage caveats

- **~60% of DBIE's Statistics catalogue** is in SDMX (230/398 tables). The rest — Banking / NBFC / Financial Institutions / Key Rates / Socio-Economic Indicators / Survey of Professional Forecasters — sits behind SAP authentication and can only be added manually.
- The RBIB set covers 43 of the 45 numbered Bulletin tables (Tables 18 and 39 are missing from the manual download). Re-download from RBI's monthly bulletin to fill.
- 9 Daily-frequency SDMX elements returned empty — a quirk of the wizard's Daily date picker. Re-run after fixing `datesForFreq()` in the scraper.
- A few RBIB↔SDMX duplicate links may be approximate — the detector is a substring match on labels. Treat `sdmxDuplicates` as a hint, not an authority.

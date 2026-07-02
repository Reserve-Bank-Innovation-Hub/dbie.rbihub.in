# DBIE data — learnings

What we figured out while scraping, cataloguing and normalising the 279 tables in `data/`. Written as a field log so the next person (or the next iteration) doesn't re-learn the same things.

---

## 1. DBIE has two data surfaces, and only one is scrapeable

| Surface | URL | Auth | Scraped? |
|---|---|---|---|
| **SDMX Data Query wizard** | `/DBIE/#/dbie/dataquery_enhanced` | Guest — no login | **Yes (236/252)** |
| **Reports** (Statistics + Publications) | `/DBIE/#/dbie/reports/...` | SAP BusinessObjects | **No** |

The Reports path drops visitors at `/BOE/OpenDocument/.../UI5logon.jsp`. The SPA calls `login_getSapToken` on page load and, for guest users, gets back `{sapToken: null, sapLogonToken: null, status: true}` — a "success" response with no actual SAP session. The WebI viewer then redirects to login.

**Unlock conditions:** RBI-issued named-user account on the BOE tenant, or an RBI-side change that provisions guest SAP sessions for public reports. Neither is available.

Reports catalogue has 398 tables across 31 Statistics subsections; SDMX exposes ~60% of that taxonomic space. The full gap analysis is in `data/pages-index.md` and `dbie-scraper/recon/output/REPORTS-PATH-FINDINGS.md`.

---

## 2. The wizard flow, start to finish

The SPA does all this behind the scenes; a headless scraper has to replicate it:

1. `security_generateSessionToken` → returns bearer token (no login)
2. `dbie_mainMenuList`, `dbie_menuMappingList` — bootstrap
3. `dbie_getSectorAction` → returns the **full element tree with `DSD_CODE` and `ELEMENT_LABEL`** (public, plaintext JSON). This is the master list — 252 elements across 6 sectors, 24 sub-sectors. Fetch it once and you have the catalogue.
4. User picks an element (click leaf in tree)
5. `dbie_getCodeListActionEnhanced` → returns dimensions + allowed values. **Request payload is AES-encrypted client-side**; response is plaintext.
6. User fills dates. Format depends on the element's frequency:
   - Annual (FY/CY): `YYYY`
   - Quarterly / Monthly: `MM-YYYY`
   - Daily / Weekly / Fortnightly: `MM-DD-YYYY`
7. User selects dimension values (you must tick at least one leaf per dimension — blank → zero rows returned).
8. `dbie_createDDLActionEnhanced` creates a saved "policy" (query spec) with an encrypted random `policyName`.
9. `dbie_getImpalaDQActionEnhanced` runs the actual Impala query. Payload heavily encrypted; returns row data.
10. User clicks the **"Download SDMX" `<select>`** (it's a dropdown, not a button) → picks **"SDMX CSV"** → browser downloads the CSV.

Download options are `sdmx` (CSV, tidy) and `xmlsdmx` (SDMX-ML). No SDMX-JSON option.

---

## 3. Why direct-HTTP replay doesn't work

The DBIE SPA wraps sensitive payload fields through `encryptPipe.transform("encrypt", …)` — a static client-side AES. For example, `dbie_getImpalaDQActionEnhanced` sends:

```json
{"body":{"dimData":{
  "dsdCode":"PE+13f8+Vjdy0Fuj37Q3MQ==",
  "advanceOptions":"QlAU23oEIEEvtRPWlXajsQ==",
  "policyName":"i2SMCeYnwobFCxWIivNpDw==",
  "fromDate":"2kz56KncJsyHSJHUsEH5kA==",
  ...
}}}
```

The key is baked into the JS bundle (reversible if you want to spend the time), but Playwright-driving the SPA lets the encryption happen naturally — it's the faster path.

**What IS reachable via direct HTTP** (plaintext JSON):
- `security_generateSessionToken`
- `dbie_mainMenuList`, `dbie_menuMappingList`, `dbie_getSectorAction`
- The download endpoints `dbie_getSDMXExcelData`, `dbie_FileDownloadHDFSAction` take plain-string `{dsdCode, policyName}` — but you still need a valid `policyName`, which is created by the encrypted flow.

Summary: catalogue enumeration is trivial via HTTP; data extraction requires the SPA.

---

## 4. Angular SPA gotchas we hit

- **URL encoding.** The hash-router crashes (`NG04002: 'Combined'`) on unencoded `&`, `(`, `)`. Encode each path segment.
- **Readonly date inputs.** `<input readonly>` on From/To dates — must `removeAttribute('readonly')` AND `el.readOnly = false` before typing.
- **Keyboard typing beats `fill()`.** `Locator.fill()` bypasses Angular form bindings on the date inputs. Use `page.keyboard.type('MM-YYYY', { delay: 30 })`.
- **Future "To Date" gets clamped.** Filling `12-31-2030` silently became `04-30-1917` (some 100-year wrap). Use today's date or earlier.
- **Session-expired modal is ALWAYS in the DOM.** Check visibility (`offsetParent !== null`), not text presence, or every `waitUntil` returns immediately.
- **"Select All" spans collide with the header.** Click them `{ force: true }` and be ready for most to be hidden (inside collapsed accordions).
- **Download is a `<select>`, not a button.** Use `page.selectOption('select.sdmxDD', 'sdmx')`.
- **"View Data" is the trigger to Output**, not "Next" or "Finish". One trap for the scraper.

---

## 5. RBI naming conventions

- `_RN` suffix marks RBI-namespaced codes. Dimension and element codes get it (`TYP_EXT_DEBT_RN`, `IND_CLASF_RN`, `FR_EXG_RESV_RN`). SDMX-global codes don't (`FREQ`, `TIME_PERIOD`, `OBS_VALUE`, `UNIT_MEASURE`).
- The `DATAFLOW` column makes the full reference explicit: `RBI:EXT_DBT_RT_RN(1.0)` = agency `RBI`, code `EXT_DBT_RT_RN`, version `1.0`.
- Formal RN expansion isn't documented anywhere I found. The authoritative code-list metadata lives at `data.rbi.org.in/FusionRegistry` — worth probing if you need resolved human labels for every code.

Frequency short codes in the data:

| Code | Meaning |
|---|---|
| `D` | Daily |
| `W` | Weekly |
| `2W` / `F` | Fortnightly |
| `M` | Monthly |
| `Q` | Quarterly (calendar year) |
| `QFY` | Quarterly (financial year) |
| `AFY` | Annual (financial year) |
| `ACY` | Annual (calendar year) |

Financial year in RBI data = April–March. `REPYEAREND: 2024, REPYEARSTART: 2023` → FY 2023-24.

---

## 6. The SDMX CSVs share one schema

All 236 SDMX CSVs have the same 9-column observation core:

```
DATAFLOW, AUDST, FREQ, REPYEAREND, REPYEARSTART, UNIT_MULT, TIME_PERIOD, UNIT_MEASURE, OBS_VALUE
```

Plus 0–3 dimension columns that vary per table (e.g. `TYP_EXT_DEBT_RN`, `IND_CLASF_RN`, `COUNTRYCODE`). One TypeScript interface, one Go struct, or one Postgres table (with `dimensions jsonb`) covers every file.

The 43 RBIB xlsx files don't share this shape out of the box — they're wide/pivoted with nested headers — but **melt cleanly to the same long-format observation schema** at build time.

---

## 7. Coverage gaps and their pattern

### SDMX scrape: 244 of 252 elements OK (97%) after second-pass fixes

Initial scrape hit 236/252 with shallow dimension coverage. A second pass (2026-04-21) with rewritten dimension selection, DSD-based tree targeting, 10-/5-year lookback retries, and per-element context reset brought this to **244 OK**. Dimension depth per file improved dramatically — `EXT_DBT_RT_RN` went from 171 rows to **10,256 rows (60×)**, `BAL_SHT_FDI_LIA_COMP_RN` grew 100×.

**Fixes applied (in `dbie-scraper/src/scrape-sdmx.mjs`):**

| Fix | Code change | Impact |
|---|---|---|
| Thorough dimension expansion | Iteratively click every `[aria-expanded="false"]`, then force-check every checkbox, then assert count > 0 | Recovered 3 National Income state-wise elements; grew all 244 files' dimension depth |
| Daily date-format handling | Default fallback from `1990-01-01` → frequency-aware cap (15 yrs for Daily) when `startDate` is null | Recovered 9 Daily elements (FOREX_RATE_D_RN, CALL_MONEY_RN, BSE_IND_D_RN, …) |
| DSD-based leaf selector | Match tree leaf on `dsdCode` parenthesised text, not `label` | Fixed FOREX_RATE_A_RN → was byte-identical to AFY_RN because both share label |
| Per-element context reset | Fresh `browser.newContext()` per element | Eliminates state leaks between successive elements |
| Network-event-based output detection | Listen for `dbie_getImpalaDQActionEnhanced` response instead of DOM polling | Prevents tab OOM crashes on WPI-sized rendered tables |
| Lookback clamp for Monthly+ | Max 25 years for Monthly, 30 for Quarterly, 40 for Annual | Keeps Impala queries tractable; WPI's 1982 startDate would otherwise crash |
| `--retry-failures` + `--max-years N` | Re-scrape only non-OK entries with overridden lookback | Two retry passes recovered 16 of the original 22 failures |

### Remaining 6 failures after retries (down from 16)

| DSD | Status | Issue |
|---|---|---|
| `CPI_RUC_ST_RN` | timeout | State-wise CPI — query too big even at 5-year window |
| `WAGE_RATES_RN` | timeout | Hit 7-min budget |
| `INX_WPI_RN` | no-record | Query ran but empty — needs investigation |
| `CALL_MONEY_RN` | error | Download event timed out (query OK, download trigger didn't fire) |
| `CSG_DEF_RN` | error | Tree leaf locator missed |
| `SG_RECPT_RN` | error | Tree leaf locator missed |

Plus 2 intentional skips (`WHOLE_PRICE_INDEX_RN`, `WHOLE_PRICE_INDEX_INF_RN`) — known-heavy, covered by RBIB Table 22.

### Against the authoritative Reports catalogue (398 Statistics tables): 230 downloaded (58%)

The 168-table gap concentrates in one cluster:

| Sub-sector | Missing |
|---|---:|
| Banking — Assets & Liabilities | 27 |
| Banking — Sectoral Statistics | 21 |
| Financial Institutions | 19 |
| Banking — Performance Indicators | 8 |
| Non Banking Financial Companies | 3 |
| Key Rates | 5 |
| Socio-Economic Indicators | 2 |
| Survey of Professional Forecasters | 3 |
| **Total fully missing** | **88** |

The remaining ~80 gaps sit inside "partially covered" sub-sectors (Financial Markets granularity, Prices/Wages regional breakdowns, National Income). Publications (14 Bulletin titles) are a separate auth-walled catalogue — 43/45 covered manually as xlsx.

### The 89 "extras"

89 SDMX elements didn't match any DBIE Report name. Most are granular cuts (multiple growth-rate variants per report) rather than genuinely additional series.

---

## 8. The `FOREX_RATE_A_RN` scraper bug — resolved

Initial scrape downloaded both `FOREX_RATE_A_RN` (Annual CY) and `FOREX_RATE_AFY_RN` (Annual FY) as **byte-identical files** because both share the tree label "Exchange rate of indian rupees" and my selector matched by `label` with `.first()` → always hit FY.

**Fix (shipped 2026-04-21):** select leaf by DSD code (`label:has-text("<DSD>")`) since the tree shows the DSD in parentheses after the human label. After re-scrape, `FOREX_RATE_A_RN.csv` (CY) contains genuinely different data from `FOREX_RATE_AFY_RN.csv` (FY) — different REPYEAREND, different aggregation period.

Rename-script collision handling also upgraded: when two DSDs share a kebab(label), each file's target name gets a frequency-suffix (`-fy` / `-cy` / `-q` / `-m` / `-d` / …) automatically. No more silent skips when two elements would rename to the same filename.

---

## 9. Architecture decisions taken

### One universal schema, not 8 domain tables
Attempted "one table per theme (Agriculture / Banking / …)" but DBIE data within a domain is **ragged** — state×crop×year mixed with year-only mixed with region×category. Universal long-format with `dimensions JSONB` is the minimum that handles all of it without massive sparse columns. Build **materialised views per page** on top when you need typed reads.

Two DB tables total:
- `tables(id, source, label, theme, sector, sub_sector, frequency, shape, …, dimensions text[])`
- `observations(table_id, time_period, obs_value, unit_measure, dimensions jsonb)` with a GIN index on `dimensions`.

### Frontend-preprocess, not backend-serve (for now)
At 279 tables / ~68 MB raw, static JSON in `frontend/public/data/` is simpler than a Go API hop. Backend stays scoped to user/auth concerns. Migration path: swap the file read for a backend fetch when growth or dynamic filtering demands it.

### Tidy JSON + wide CSV as the output format — not SDMX-JSON
SDMX-JSON is "universal" only within the statistical-agency community (it's positional coordinates + declared metadata). For React charts and human downloads you want:
- **Long-format JSON** per table with resolved labels (drop `_RN`, resolve codes to human names) for the app
- **Wide-format CSV** (dates down, dimension×unit across) for the "Download" button
Both generated from the same long-format intermediate.

### File naming
Every file and folder in `data/` is lower-kebab-case and descriptive. DSD codes / RBIB table numbers live inside `catalogue.json`, not in filenames. Idempotent rebuild via `data/rename-kebab.mjs`.

---

## 10. Artefacts produced

In **`dbie-scraper/`** (sibling repo):
- `src/fetch-sdmx-tree.mjs` — enumerates the 252 SDMX elements via HTTP (no browser)
- `src/scrape-sdmx.mjs` — Playwright scraper, resumable via `manifest.json`
- `src/fetch-reports-catalogue.mjs` — Playwright-drives the 31 Statistics subsections to enumerate all 398 Reports tables (catalogue only — the reports themselves are auth-walled)
- `src/compare-coverage.mjs` — diff the Reports catalogue against our SDMX downloads
- `recon/` — wizard probe + diagnostic screenshots + captured API traffic
- `sdmx-tree.json` — 252 element master list
- `reports-catalogue.json` — 398 authoritative Reports tables
- `manifest.json` — per-element scrape status
- `coverage-report.md` + `.csv` — per-sub-sector coverage analysis

In **`dbie-revamp/data/`** (this repo):
- `sdmx/` — 236 scraped CSVs (kebab-named, grouped by sector → sub-sector)
- `publications/monthly-rbi-bulletin/` — 43 manually-downloaded RBIB xlsx
- `catalogue.json` — the unified 279-entry index with themes, frequency, shape, duplicate links
- `catalogue-summary.md` — theme × source counts
- `pages-index.md` — per-route (`/prices`, `/external`, …) table listings
- `build-catalogue.mjs` — regenerates `catalogue.json` + `catalogue-summary.md`
- `rename-kebab.mjs` — idempotent kebab-case renaming
- `README.md` — structural documentation for the data directory

---

## 11. What remains

- **9 Daily-frequency SDMX elements** — retry after fixing the date picker format in `dbie-scraper/src/scrape-sdmx.mjs` (`datesForFreq()`)
- **Re-scrape `FOREX_RATE_A_RN`** to get actual CY data (currently duplicates FY)
- **RBIB xlsx melter** — each of the 43 files has nested headers that need per-file logic to flatten. Generic melter for ~30 of them; hand-tuned for BoP / BPM6 tables.
- **Code-list resolution** — `TYP_EXT_DEBT_RN: GROSS_TTL_DBT` → "Gross Total Debt". Either hand-maintain the ~50 codes the home page actually surfaces, or auto-scrape from `dbie_getCodeListActionEnhanced`.
- **88 Banking/NBFC/SPF/Socio-Economic tables** behind SAP auth — only unlocked with RBI credentials or manual per-table xlsx downloads.
- **Postgres ingestion pipeline** — `schema.sql` + `build-postgres.mjs` that melts SDMX + RBIB into `tables.csv` and `observations.csv` for `\copy` into the `docker-compose` Postgres instance.

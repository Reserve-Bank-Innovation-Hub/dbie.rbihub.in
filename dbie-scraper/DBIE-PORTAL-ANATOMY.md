# DBIE portal — anatomy for future scrapes

A field guide for the next person (or the next pass) scraping RBI's Database on Indian Economy. Captures how the portal is actually structured, where the auth walls sit, which endpoints are plaintext vs encrypted, and the specific gotchas that cost time during the first build.

Reading this first saves you ~2 days of reverse-engineering.

---

## 1. The portal has four layers. Know which layer you're hitting.

```
Browser
  ↓ (TLS)
WAF / bot detection (F5 TSPD — serves 48 KB of obfuscated JS on raw curl)
  ↓ (solved challenge cookies)
Angular SPA  ←  static JS bundle at data.rbi.org.in/DBIE/main.*.js
  ↓ (in-browser)
Gateway API  ←  https://data.rbi.org.in/CIMS_Gateway_DBIE/GATEWAY/SERVICES/<service>
  ↓ (Oracle-backed)
SAP BusinessObjects (BOE)  ←  /BOE/OpenDocument/...  — auth-walled for reports
```

**Implications:**
- `curl` without a headless browser gets the TSPD challenge, not real data. Always use Playwright for end-to-end work.
- The Gateway is where the useful data lives. Most services are JSON-in, JSON-out with HTML-entity-encoded bodies.
- BOE is a separate auth domain — sessions provisioned by `login_getSapToken`. For guest users, that endpoint returns `{sapToken: null, sapLogonToken: null, status: true}` — the SPA thinks success, BOE disagrees.
- The **legacy portal at `dbieold.rbi.org.in` is dead** — WebLogic bridge returns 503 ("No backend server available for connection: timed out after 10 seconds"). Only the DNS and TLS shell respond. Not a backup source.

---

## 2. Two data surfaces — one scrapeable, one not

### SDMX Data Query wizard — scrapeable (guest access)
- URL: `https://data.rbi.org.in/DBIE/#/dbie/dataquery_enhanced`
- 252 elements across 6 sectors, 24 sub-sectors
- Output: SDMX CSV download per element, ~30 s per element via Playwright
- Every file has the same 9-column observation core (`DATAFLOW, AUDST, FREQ, REPYEAREND, REPYEARSTART, UNIT_MULT, TIME_PERIOD, UNIT_MEASURE, OBS_VALUE`) plus 0–3 dimension columns

### Reports + Publications — **NOT scrapeable as a guest**
- URLs: `/DBIE/#/dbie/reports/Statistics/<Category>/<Subsection>` and `/Publication/...`
- Catalogue enumeration is public (via `dbie_getReportsDbie` — 398 Statistics tables)
- Opening any report → SAP BOE WebI popup → redirects to `UI5logon.jsp` for guests
- Unlock requires an RBI-issued named-user account on the BOE tenant
- For now: **download RBIB (Monthly Bulletin) tables manually** from RBI's Bulletin pages; they're the same data in xlsx

Coverage against the authoritative Reports list: ~60% of Statistics tables overlap with SDMX sub-sectors; the full cluster of **Banking + NBFC + Key Rates + SPF + Socio-Economic** (88 tables) is behind the wall.

---

## 3. Gateway service reference

All at `https://data.rbi.org.in/CIMS_Gateway_DBIE/GATEWAY/SERVICES/<name>`. POST with headers:
```
content-type: application/json
channelkey: key2
datatype: application/json
referer: https://data.rbi.org.in/DBIE/
authorization: <bearer from security_generateSessionToken>
```

### Public / plaintext — callable from pure HTTP
| Service | Purpose | Request body |
|---|---|---|
| `security_generateSessionToken` | Get a guest bearer token | `{"body":{}}` — token in `Authorization` response header |
| `security_keepSessionValid` | Heartbeat | `{"body":{}}` |
| `dbie_menuMappingList` | Top-level menu tree | `{"body":{}}` |
| `dbie_mainMenuList` | Main menu items | `{"body":{}}` |
| `dbie_getSectorAction` | **SDMX element tree — the master catalogue** | `{"body":{"body":{}}}` — returns a nested structure with `DSD_CODE`, `ELEMENT_LABEL`, `ELEMENT_FREQUENCY_NAME`, `ELE_START_DATE` |
| `dbie_getReportsDbie` | Reports list for a subsection (non-SDMX catalogue) | `{"body":{"departments":[...],"menu":...,"portal":"DBIE","function":"reports"}}` — shape varies; easiest via Playwright intercept |

### Encrypted on the way in, plaintext out — require SPA's static AES key
| Service | Purpose |
|---|---|
| `dbie_getCodeListActionEnhanced` | Dimension code lists for a selected element |
| `dbie_getElementDetailsActionEnhanced` | Table metadata (column_name, table_name in Impala) |
| `dbie_createDDLActionEnhanced` | Save the current query as a "policy" |
| `dbie_getImpalaDQActionEnhanced` | **The actual data query** — returns Impala rows |
| `dbie_getReportLink` | OpenDocument URL for a given reportId |

The encryption is `encryptPipe.transform("encrypt", value)` in the bundle — AES with a static key baked into the JS. Reversible with effort. In practice, **let Playwright drive the SPA** and capture/replay the encrypted payloads.

### Data-download endpoints (FormData, not JSON)
| Endpoint | Body |
|---|---|
| `/download/dbie_getSDMXExcelData` | FormData with `requestMessage={"body":{"dsdCode":"...","policyName":"..."}}` → Excel blob (unused; CSV download below is cleaner) |
| `/download/dbie_dataQueryFileDownloadHDFS` | `requestMessage={"body":{"downloadFileType":...,"fileName":...}}` → blob |
| `dbie_csvConvert` | Convert SDMX → CSV in-place |

### Guest session facts
- `security_generateSessionToken` returns a bearer — valid for session lifetime (~30–60 minutes of idle)
- `login_CIMSaudit` logs `username: "GUEST_USER"`, `usertype: "External"` — confirms guest access works
- `login_getSapToken` returns `{sapToken: null}` for guest — useless for BOE but harmless

---

## 4. The wizard flow — what happens when you click through

```
1. security_generateSessionToken                         (get bearer)
2. dbie_mainMenuList, dbie_menuMappingList, …            (SPA bootstrap)
3. dbie_getSectorAction                                  (fetch element tree)
4. User ticks a leaf in tree
   → dbie_getCodeListActionEnhanced                      (dimensions for this element)
5. User picks frequency, fills date range
6. User picks dimension values on Dimension step
7. User (or --Select All--) on Advanced Options
8. Click View Data
   → dbie_createDDLActionEnhanced                        (save the query)
   → dbie_getImpalaDQActionEnhanced                      (run Impala — THIS is the long one)
9. Output tab renders the table
10. <select class="sdmxDD"> becomes active; selecting "SDMX CSV" triggers download
```

The **"Download SDMX" is a `<select>` dropdown**, not a button. Options: `sdmx` (CSV) and `xmlsdmx` (SDMX-ML). Use `page.selectOption('select.sdmxDD', 'sdmx')`.

---

## 5. Angular SPA gotchas — every one of these cost us time

1. **Hash-route encoding.** URLs with `&`, `(`, `)`, `#` crash the router with `NG04002`. URL-encode each path segment:
   ```js
   const encoded = reportPath.split('/').map(seg =>
     seg.replace(/&/g, '%26').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/#/g, '%23')
   ).join('/');
   ```
2. **Date inputs are `readonly`.** Strip it before typing:
   ```js
   await page.evaluate(() =>
     document.querySelectorAll('input[placeholder="Select From Date"],input[placeholder="Select To Date"]')
       .forEach(el => { el.readOnly = false; el.removeAttribute('readonly'); }));
   ```
3. **`locator.fill()` doesn't trigger Angular form bindings** on the date inputs. Use `page.keyboard.type('MM-YYYY', { delay: 30 })` after clicking.
4. **Future dates get silently clamped.** `12-31-2030` as From-Date became `04-30-1917` (appears to be a 100-year-wrap clamp). Use today's date or earlier as the "To" bound.
5. **Session-expired modal is ALWAYS in the DOM, hidden.** Check visibility (`el.offsetParent !== null`), not text presence, or every check returns true.
6. **"Select All" spans live inside collapsed accordions.** Must expand every `[aria-expanded="false"]` iteratively (up to ~5 rounds for state-level trees) before clicking them. See §6.
7. **Tree leaves with duplicate labels.** Two elements can share a human label (e.g. `FOREX_RATE_A_RN` and `FOREX_RATE_AFY_RN` both "Exchange rate of indian rupees"). Match the leaf by **DSD code**, not label: `label:has-text("<DSD_CODE>")`. The tree shows the DSD in parentheses.
8. **View Data, not Finish/Next.** The last wizard step's action button is labelled **"View Data"**.
9. **Output tab has massive DOM for large queries** (WPI renders 100k+ rows). `page.evaluate()` on that DOM **crashes the tab** with "Target crashed". Detect readiness via the `dbie_getImpalaDQActionEnhanced` network response instead of DOM polling — see §7.

---

## 6. Dimension selection — the subtle one

Most "OK" scrapes in the first pass returned only 1–2 dimension values' worth of data because dimension selection was flaky. The fix pattern that actually works:

```js
async function selectAllDimensions(page) {
    // 1. Iteratively expand every collapsed accordion until none remain.
    let expanded = -1;
    for (let round = 0; round < 8 && expanded !== 0; round++) {
        expanded = await page.evaluate(() => {
            let n = 0;
            for (const el of document.querySelectorAll('[aria-expanded="false"]')) {
                try { el.click(); n++; } catch {}
            }
            return n;
        });
        await page.waitForTimeout(500);
        // Click every visible Select All span in this round
        const sa = page.locator('span.selectAllCss');
        const saN = await sa.count();
        for (let i = 0; i < saN; i++) {
            try { await sa.nth(i).click({ timeout: 1000, force: true }); } catch {}
        }
        await page.waitForTimeout(400);
    }
    // 2. Force every checkbox checked. click() alone misses Angular's [(ngModel)].
    await page.evaluate(() => {
        for (const cb of document.querySelectorAll('input[type="checkbox"]')) {
            if (!cb.checked) {
                cb.checked = true;
                cb.dispatchEvent(new Event('input', { bubbles: true }));
                cb.dispatchEvent(new Event('change', { bubbles: true }));
                try { cb.click(); } catch {}
            }
        }
    });
    await page.waitForTimeout(1000);
    // 3. Verify. Return count so the caller can assert > 0.
    return await page.evaluate(
      () => document.querySelectorAll('input[type="checkbox"]:checked').length
    );
}
```

If the returned count is zero, something's wrong with the tree expansion — bail out before clicking View Data, otherwise you get a successful query with empty results.

---

## 7. Output-ready detection — use the network, not the DOM

For WPI-sized queries (25+ years × many dimensions), the Output tab's rendered `<table>` can exceed the headless-browser's memory and crash the tab. **Don't poll DOM.** Watch for the Impala query's network response:

```js
// Before clicking View Data:
const impalaResponsePromise = page.waitForResponse(
    r => /dbie_getImpalaDQActionEnhanced/.test(r.url()),
    { timeout: 300000 },
);
await clickViewData(page);

// Wait on the network event, not the DOM:
const resp = await Promise.race([
    impalaResponsePromise,
    new Promise(r => setTimeout(() => r(null), timeoutMs)),
]);
```

The response body, when decoded, tells you whether the query returned rows:
```js
const result = env?.body?.result?.[0]?.data?.result;
if (Array.isArray(result) && result.length === 0) {
    return { status: 'no-record' };  // query OK, no data matched
}
```

Once the response arrives, the `<select class="sdmxDD">` dropdown is wired up and you can trigger the download.

---

## 8. Date format per frequency — empirically determined

The calendar widget's `data-date` attribute contains a Unix timestamp; the input field stores `MM-DD-YYYY`, `MM-YYYY`, or `YYYY` depending on the element's frequency. Use:

| Frequency | Format | Example |
|---|---|---|
| Annual - Financial Year | `YYYY` | `2001` |
| Annual - Calendar Year | `YYYY` | `2001` |
| Quarterly - Financial Year | `MM-YYYY` (quarter-end month) | `03-2001` |
| Quarterly | `MM-YYYY` | `03-2001` |
| Monthly | `MM-YYYY` | `01-2001` |
| Fortnightly | `MM-DD-YYYY` | `01-15-2016` |
| Weekly | `MM-DD-YYYY` | `01-01-2011` |
| Daily | `MM-DD-YYYY` | `04-17-2011` |

### `startDate` quirks

- `startDate` in `dbie_getSectorAction` is **null for all 10 Daily elements**. Fall back to a 15-year lookback.
- Several Monthly elements (WPI especially) declare startDates in the 1980s — Impala queries across 40+ years of data crash or timeout. **Cap the effective lookback** to 25 years for Monthly, 30 for Quarterly, 40 for Annual. Worth making configurable via `--max-years`.

---

## 9. Scraper design patterns that paid off

### Context-per-element reset
Browser contexts (NOT the browser itself) close and reopen between elements. A previous attempt reused one long-lived context and `FOREX_RATE_A_RN` came back byte-identical to `FOREX_RATE_AFY_RN` — the download handler from the prior element leaked forward.

```js
async function makeContext() {
    const ctx = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        acceptDownloads: true,
    });
    return { ctx, page: await ctx.newPage() };
}
// per element: const { ctx, page } = await makeContext(); ... await ctx.close();
```

### Per-element budget via `Promise.race`
Elements can hang indefinitely (Impala query stuck, DOM crash, session lost). Cap total wall time per element at 6 minutes:
```js
const r = await Promise.race([
    scrapeElement(page, t, ...),
    new Promise((_, rej) => setTimeout(
        () => rej(new Error(`per-element budget exceeded`)),
        360000,
    )),
]);
```

### Resumability + retry modes
Manifest with `status` per element: `ok | no-record | timeout | error | no-dimensions | skipped`. Flags:
- `--retry-failures` — clear non-OK entries from manifest, re-scrape only them
- `--max-years N` — override lookback (use `5` for stubborn large-query elements)
- `--skip A,B,C` — exclude known-pathological elements (e.g. `WHOLE_PRICE_INDEX_RN`)
- `--budget MS` — per-element wall-clock cap

### Rename-collision handling
When two DSDs share a kebab-cased label (only one real case today: the two FOREX_RATE variants), append a frequency-derived suffix (`-fy`, `-cy`, `-m`, `-d`, …) so filenames stay unique. See `rename-kebab.mjs` in `dbie-revamp/data/`.

---

## 10. Known intractable elements

Genuinely hard cases that didn't recover after all fixes. Document these and let manual xlsx fill the gap.

| DSD | Reason |
|---|---|
| `WHOLE_PRICE_INDEX_RN`, `WHOLE_PRICE_INDEX_INF_RN` | Impala query too large even at 10-year cap. RBIB Table 22 covers WPI in the Bulletin — use that. |
| `CPI_RUC_ST_RN` | State-wise CPI × all states × all commodities is just too big. |
| `WAGE_RATES_RN` | Hit 7-min budget at 5-year cap. |
| `INX_WPI_RN` | Returns empty `no-record` — likely a date/dim mismatch in the element; needs manual investigation |
| `CALL_MONEY_RN` | Download dropdown doesn't fire a download event. Possibly element-specific. Retry manually; if persistent, look for a different download mechanism on this specific series. |
| `CSG_DEF_RN`, `SG_RECPT_RN` | Tree leaf locator misses — the DSD text may not appear in the tree label for these, or they're under a different sub-sector. |

---

## 11. How to bootstrap a future scrape

From cold, to get a fresh full scrape working:

```bash
# 1. Grab the current element catalogue (public, fast — no browser)
node src/fetch-sdmx-tree.mjs                  # writes sdmx-tree.json

# 2. Spot-check with one known-good element to confirm the wizard still works
node src/scrape-sdmx.mjs --dsd EXT_DBT_RT_RN --verbose

# 3. If step 2 broke (SPA changes), re-probe:
node recon/wizard-probe.mjs                   # dumps traffic + screenshots
# Then read recon/output/wizard-*.png to see where the flow diverged

# 4. Full scrape with known-pathological elements skipped
node src/scrape-sdmx.mjs --skip WHOLE_PRICE_INDEX_RN,WHOLE_PRICE_INDEX_INF_RN

# 5. Retry failures at narrower lookback
node src/scrape-sdmx.mjs --retry-failures --max-years 10
# And again at --max-years 5 for the stubbornly-large ones
```

Expected result: **~97% OK** (~244/252), ~50 MB of SDMX CSVs. The remaining 3% is the "known intractable" list above.

Sync into `dbie-revamp` with:
```bash
rsync -a --exclude='.DS_Store' \
    ../dbie-scraper/data/ \
    ../dbie-revamp/data/sdmx/
cd ../dbie-revamp && node data/rename-kebab.mjs && node data/build-catalogue.mjs && node data/build-pages-index.mjs
```

---

## 12. Probe / diagnostic scripts

Useful reconnaissance tools in `recon/`:

| Script | Purpose |
|---|---|
| `wizard-probe.mjs` | Full end-to-end wizard traversal, captures network + screenshots per step |
| `reports-probe.mjs` | Walks the Reports catalogue via HTTP — confirms the auth wall |
| `dbieold-probe.mjs` | Confirms the legacy portal is dead (kept as evidence) |
| `dbieold-probe2.mjs` | Deeper check on multiple dbieold endpoints |
| `probe-daily-date.mjs` | Determines the canonical date format for Daily elements by clicking the calendar |
| `capture-req.mjs` | Captures the request/response body for a specific gateway endpoint |

The `recon/output/` directory (gitignored) holds the artefacts: screenshots, traffic logs, captured API responses.

---

## 13. What to update when this doc breaks

If RBI changes the SPA, expect:

- **New hash-route structure** → update `WIZARD_URL` and tree-nav selectors in `scrape-sdmx.mjs`
- **Different auth scheme** → re-probe via `recon/wizard-probe.mjs`, inspect `main.*.js` for new encryption / new endpoints
- **New download format** → look for `sdmxDD` equivalent in the new bundle; may be renamed
- **Different gateway URL** → search the bundle for `CIMS_Gateway` replacement

Start at `recon/wizard-probe.mjs`. The traffic log tells you everything.

---

*Last updated 2026-04-22 after the second full scrape pass (244/252 OK, 50 MB).*

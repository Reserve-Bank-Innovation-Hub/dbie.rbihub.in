// Playwright-driven DBIE SDMX scraper.
//
// For each element in sdmx-tree.json:
//   1. Navigate to the SDMX Data Query wizard (auth-free guest access).
//   2. Click through the sector → sub-sector → element in the tree.
//   3. Fill the From/To dates in a format suited to the element's frequency.
//   4. Select all dimensions (expand panels, click Select All and remaining checkboxes).
//   5. Click View Data to trigger the Impala query.
//   6. Wait for the Output tab to populate.
//   7. Select "SDMX CSV" from the Download SDMX dropdown; save the downloaded file.
//   8. Record status in manifest.json for resumability.
//
// Usage:
//   node src/scrape-sdmx.mjs                            # scrape everything
//   node src/scrape-sdmx.mjs --sector "External Sector" # filter
//   node src/scrape-sdmx.mjs --dsd EXT_DBT_RT_RN        # single element
//   node src/scrape-sdmx.mjs --limit 10                 # first N elements
//   node src/scrape-sdmx.mjs --headful                  # show the browser (debugging)

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const WIZARD_URL = 'https://data.rbi.org.in/DBIE/#/dbie/dataquery_enhanced';
const DATA_DIR = path.join(REPO, 'data', 'sdmx-raw');   // staging: raw DSD-coded CSVs (gitignored); ingest-sdmx.mjs -> data/sdmx
const MANIFEST = path.join(REPO, 'data', 'scrape-manifest.json');
const TREE_FILE = path.join(REPO, 'data', 'sdmx-tree.json');
const TODAY = new Date();

// --------- CLI parsing
const argv = process.argv.slice(2);
const flag = name => {
    const idx = argv.indexOf(name);
    return idx >= 0 ? argv[idx + 1] : null;
};
const hasFlag = name => argv.includes(name);

const filterSector = flag('--sector');
const filterSubSector = flag('--sub');
const filterDsd = flag('--dsd');
const limit = flag('--limit') ? parseInt(flag('--limit'), 10) : null;
const headful = hasFlag('--headful');
const verbose = hasFlag('--verbose');
const skipList = (flag('--skip') || '').split(',').map(s => s.trim()).filter(Boolean);
const perElementBudgetMs = parseInt(flag('--budget') || '360000', 10);  // 6 min default
// How long to wait for the Impala query response before declaring a timeout.
// Heavy tables (WPI's commodity tree, state-wise CPI, wage rates) can exceed
// the 5-min default; raise with --output-wait for those. Keep --budget above it.
const outputWaitMs = parseInt(flag('--output-wait') || '300000', 10);
// Wall-clock cap for the dimension-selection step. The old leaf-by-leaf strategy
// could grind 6+ min on giant trees (wage rates, state-wise CPI) and blow the
// budget before the query even ran. The group-level "Select All" path is fast;
// this guard keeps any fallback from running away.
const selectBudgetMs = parseInt(flag('--select-budget') || '90000', 10);
// --thorough: don't trust the group-level "Select All" to cascade. Fully expand
// every nested accordion and click every unchecked leaf. Slower, but needed when
// a "Select All" silently picks only a default value for a dimension — e.g. wage
// rates came back MALE-only because the gender dimension wasn't fully selected.
const thorough = hasFlag('--thorough');
const maxYearsOverride = flag('--max-years') ? parseInt(flag('--max-years'), 10) : null;
const retryFailures = hasFlag('--retry-failures');

// --------- Helpers
const slug = s => (s || '').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_').slice(0, 120);
const pad = (n, w = 2) => String(n).padStart(w, '0');

function log(msg) { console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`); }

function loadManifest() {
    if (fs.existsSync(MANIFEST)) return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    return { started: new Date().toISOString(), results: {} };
}

function saveManifest(m) {
    fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2));
}

// --------- Date formatting
// The DBIE date picker's format depends on the element's frequency.
// We cover the eight frequencies observed in sdmx-tree.json.
//
// Edge case: for Daily / Weekly / Fortnightly elements, startDate from
// dbie_getSectorAction is often null. Defaulting to 1990-01-01 then fails
// because the actual series history is shorter and the Impala query returns
// no rows. We use frequency-aware fallbacks instead.
function datesForFreq(freq, startDateIso) {
    // Lookback cap per frequency. Two purposes:
    //   (a) if startDate is missing (null in sdmx-tree for Daily series), use this as default
    //   (b) clamp very deep histories — WPI with a 1982 startDate produces an Impala
    //       query so large the backend times out past 5 minutes. 25 years of monthly is
    //       plenty for a narrative layer; full history isn't worth the scrape cost.
    const maxLookbackYears = {
        'Daily': 15, 'Weekly': 20, 'Fortnightly': 20,
        'Monthly': 25, 'Quarterly': 30, 'Quarterly - Financial Year': 30,
        'Annual - Financial Year': 40, 'Annual - Calendar Year': 40,
    };
    const maxYears = maxYearsOverride ?? (maxLookbackYears[freq] ?? 25);
    const cap = new Date(TODAY.getFullYear() - maxYears, 0, 1);

    const startRaw = startDateIso ? new Date(startDateIso) : cap;
    let start = isNaN(startRaw.getTime()) ? cap : startRaw;
    if (start < cap) start = cap;  // clamp to keep queries tractable

    // "To" date slightly in the past so queries never hit future-date rejection.
    const end = new Date(TODAY.getFullYear(), TODAY.getMonth(), 0); // last day of prev month

    const sY = start.getFullYear();
    const sM = start.getMonth() + 1;
    const sD = start.getDate();
    const eY = end.getFullYear();
    const eM = end.getMonth() + 1;
    const eD = end.getDate();

    switch (freq) {
        case 'Annual - Financial Year':
        case 'Annual - Calendar Year':
            // Wizard accepts YYYY for annual.
            return { from: String(sY), to: String(eY) };
        case 'Quarterly':
        case 'Quarterly - Financial Year':
        case 'Monthly':
            // MM-YYYY.
            return { from: `${pad(sM)}-${sY}`, to: `${pad(eM)}-${eY}` };
        case 'Fortnightly':
        case 'Weekly':
        case 'Daily':
        default:
            // MM-DD-YYYY.
            return { from: `${pad(sM)}-${pad(sD)}-${sY}`, to: `${pad(eM)}-${pad(eD)}-${eY}` };
    }
}

// --------- Wizard steps
async function resetWizardPage(page) {
    // Full reload so the SPA re-bootstraps a session and the wizard starts clean.
    await page.goto('about:blank').catch(() => {});
    await page.goto(WIZARD_URL, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(4000);
}

async function selectElementInTree(page, sector, subSector, label, dsdCode) {
    // Open the sector, then sub-sector, then tick the element's checkbox.
    // The tree label shows both human label AND the parenthesised DSD code:
    //   "Exchange Rate Of Indian Rupees - (FOREX_RATE_A_RN)"
    // Matching on label alone is unsafe because two elements can share a label
    // (e.g. FOREX_RATE_A_RN / FOREX_RATE_AFY_RN) — picking .first() would
    // silently download the wrong series. Match on DSD code.
    await page.getByText(sector, { exact: true }).first().click({ timeout: 15000 });
    await page.waitForTimeout(1000);
    if (subSector) {
        await page.getByText(subSector, { exact: true }).first().click({ timeout: 15000 });
        await page.waitForTimeout(1000);
    }
    const leaf = page.locator(`label:has-text("${dsdCode}")`).first();
    await leaf.waitFor({ timeout: 10000 });
    await leaf.click({ timeout: 5000 });
    await page.waitForTimeout(1200);
}

async function clickNext(page) {
    const btn = page.locator('button:has-text("Next")').first();
    await btn.waitFor({ timeout: 15000 });
    await btn.click();
    await page.waitForTimeout(2500);
}

async function fillDates(page, freq, startDate) {
    const { from, to } = datesForFreq(freq, startDate);
    // DBIE inputs are readonly by default to force calendar use — strip first, then type.
    await page.evaluate(() => {
        document.querySelectorAll('input[placeholder="Select From Date"],input[placeholder="Select To Date"]')
            .forEach(el => { el.readOnly = false; el.removeAttribute('readonly'); });
    });
    const fromInput = page.locator('input[placeholder="Select From Date"]').first();
    await fromInput.click();
    await page.keyboard.type(from, { delay: 35 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    const toInput = page.locator('input[placeholder="Select To Date"]').first();
    await toInput.click();
    await page.keyboard.type(to, { delay: 35 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1500);
    return { from, to };
}

async function selectAllDimensions(page) {
    // Select every dimension value, fast. The old strategy expanded every nested
    // accordion across 8 rounds and then clicked every leaf checkbox individually
    // — on giant trees (wage rates: state×district×occupation; state-wise CPI:
    // state×item×rural/urban) that ran 6+ minutes and exhausted the budget before
    // the query even fired.
    //
    // New strategy: lean on the wizard's own "Select All" controls, which cascade
    // to all descendants through Angular's real handler (no fighting ngModel).
    //   1. One expand pass so each dimension's root "Select All" is in the DOM.
    //   2. Click every "Select All" control once.
    //   3. Only if nothing got checked, fall back to a single JS force-check pass
    //      (no per-element click — that was the slow part).
    // The whole thing is wall-clock bounded by selectBudgetMs.
    const deadline = Date.now() + selectBudgetMs;

    // 1. Expand top-level collapsed accordions (single pass — the "Select All"
    //    controls cascade to collapsed children, so we don't need to open all).
    await page.evaluate(() => {
        for (const el of document.querySelectorAll('[aria-expanded="false"]')) {
            try { el.click(); } catch {}
        }
    });
    await page.waitForTimeout(800);

    // 2. Click each "Select All" control once.
    const sa = page.locator('span.selectAllCss');
    const saN = await sa.count();
    for (let i = 0; i < saN && Date.now() < deadline; i++) {
        try { await sa.nth(i).click({ timeout: 1500, force: true }); } catch {}
    }
    await page.waitForTimeout(1000);

    const countChecked = () => page.evaluate(
        () => document.querySelectorAll('input[type="checkbox"]:checked').length,
    );
    let checkedCount = await countChecked();

    // 3. Fallback: if the Select All controls didn't register (or none existed),
    //    force-check every box in one JS pass. Dispatch change/input so Angular
    //    sees it — but skip the per-element click() that made the old path crawl.
    if (checkedCount === 0 && Date.now() < deadline) {
        await page.evaluate(() => {
            for (const cb of document.querySelectorAll('input[type="checkbox"]')) {
                if (!cb.checked) {
                    cb.checked = true;
                    cb.dispatchEvent(new Event('input', { bubbles: true }));
                    cb.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });
        await page.waitForTimeout(1000);
        checkedCount = await countChecked();
    }

    return checkedCount;
}

async function clickViewData(page) {
    const btn = page.locator('button:has-text("View Data")').first();
    await btn.waitFor({ timeout: 15000 });
    await btn.click();
}

async function waitForOutputReady(page, impalaResponsePromise, timeoutMs = 300000) {
    // Wait primarily on the Impala-query network response. This avoids polling
    // a massive rendered table via page.evaluate(), which crashes the tab for
    // series like WPI (100k+ rows in the Output DOM).
    const deadline = Date.now() + timeoutMs;

    // Race the Impala response against the timeout. Distinguish a genuine
    // no-response timeout from a response that arrived but whose body we could
    // not read: the SDMX CSV download is a separate endpoint, so an unreadable
    // body is no reason to bail — proceed to the download instead.
    let impalaBody = null;
    let sawResponse = false;
    try {
        const resp = await Promise.race([
            impalaResponsePromise.then(r => { sawResponse = true; return r; }),
            new Promise(r => setTimeout(() => r(null), timeoutMs)),
        ]);
        if (resp) {
            try { impalaBody = await resp.text(); } catch {}
        }
    } catch {
        // waitForResponse rejected (its own timeout / page closed) — genuine timeout.
    }
    if (!sawResponse) return { status: 'timeout' };

    // Parse the response shape: if the result array is empty, the query ran
    // but matched no rows. Only meaningful when we actually read the body.
    if (impalaBody) {
        try {
            const decoded = impalaBody
                .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
                .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
            const env = JSON.parse(decoded);
            const result = env?.body?.result?.[0]?.data?.result;
            if (Array.isArray(result) && result.length === 0) {
                return { status: 'no-record' };
            }
        } catch {
            // If parsing fails, we'll still attempt the download below.
        }
    }

    // Once the Impala response has arrived, the Download dropdown is wired up.
    // Wait a small grace period for the SPA to attach the dropdown handler,
    // then let the caller drive the download.
    await page.waitForTimeout(2500);

    // Cheap DOM-free check for session-expired via a lightweight eval.
    try {
        const expired = await page.evaluate(() => {
            const n = document.querySelectorAll('[class*="modal"]:not([class*="hide"])').length;
            if (n === 0) return false;
            return /Session has expired/i.test(document.body.innerText || '');
        });
        if (expired) return { status: 'session-expired' };
    } catch {
        // If even that crashed, the tab is unstable — but we still have the data.
    }

    return { status: 'ok', tableRows: null };
}

async function downloadSdmxCsv(page) {
    const dropdown = page.locator('select.sdmxDD').first();
    await dropdown.waitFor({ timeout: 10000 });
    const [dl] = await Promise.all([
        page.waitForEvent('download', { timeout: 40000 }),
        dropdown.selectOption('sdmx'),
    ]);
    return dl;
}

async function scrapeElement(page, el, sector, subSector) {
    const outDir = path.join(DATA_DIR, slug(sector), slug(subSector));
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `${el.dsdCode}.csv`);

    await resetWizardPage(page);
    await selectElementInTree(page, sector, subSector, el.label, el.dsdCode);
    await clickNext(page); // → Frequency
    const dates = await fillDates(page, el.frequency, el.startDate);
    if (verbose) log(`    dates: ${dates.from} → ${dates.to}`);
    await clickNext(page); // → Dimension
    const checkedCount = await selectAllDimensions(page);
    if (verbose) log(`    dimensions checked: ${checkedCount}`);
    if (checkedCount === 0) {
        return { status: 'no-dimensions', reason: 'selectAllDimensions ticked 0 checkboxes' };
    }
    await clickNext(page); // → Advanced Options

    // Arm the Impala-response listener BEFORE clicking View Data. Only one
    // response to this endpoint fires per query, so we capture the right one.
    const impalaResponsePromise = page.waitForResponse(
        r => /dbie_getImpalaDQActionEnhanced/.test(r.url()),
        { timeout: outputWaitMs },
    );
    await clickViewData(page);

    const outcome = await waitForOutputReady(page, impalaResponsePromise, outputWaitMs);
    if (outcome.status !== 'ok') return { status: outcome.status, checkedCount };

    const dl = await downloadSdmxCsv(page);
    await dl.saveAs(outFile);
    const stat = fs.statSync(outFile);
    return { status: 'ok', file: outFile, bytes: stat.size, tableRows: outcome.tableRows, checkedCount };
}

// --------- Main loop
async function main() {
    if (!fs.existsSync(TREE_FILE)) {
        console.error('sdmx-tree.json missing. Run `node scripts/fetch-sdmx-tree.mjs` first.');
        process.exit(1);
    }
    const tree = JSON.parse(fs.readFileSync(TREE_FILE, 'utf8'));
    const manifest = loadManifest();

    // --retry-failures: drop non-OK entries so they re-scrape; keep OKs cached.
    if (retryFailures) {
        let wiped = 0;
        for (const [k, v] of Object.entries(manifest.results)) {
            if (v.status !== 'ok' && v.status !== 'skipped') {
                delete manifest.results[k];
                wiped++;
            }
        }
        log(`--retry-failures: cleared ${wiped} non-OK manifest entries`);
        saveManifest(manifest);
    }

    // Flatten tree with sector/subSector context and apply filters.
    const tasks = [];
    for (const g of tree) {
        if (filterSector && g.sector !== filterSector) continue;
        if (filterSubSector && g.subSector !== filterSubSector) continue;
        for (const el of g.elements) {
            if (filterDsd && el.dsdCode !== filterDsd) continue;
            tasks.push({ sector: g.sector, subSector: g.subSector, ...el });
        }
    }
    const effective = limit ? tasks.slice(0, limit) : tasks;
    log(`Planned: ${effective.length} element(s) (of ${tasks.length} matching, ${tree.reduce((n, g) => n + g.elements.length, 0)} total).`);

    const browser = await chromium.launch({ headless: !headful });

    // Per-element, we throw away the context and build a fresh one. A previous
    // attempt reused one long-lived context and FOREX_RATE_A_RN (CY) ended up
    // with FOREX_RATE_AFY_RN (FY) data byte-for-byte — the download handler
    // from the prior element apparently leaked forward. A fresh context per
    // element is ~1s more expensive and eliminates the class of bug.
    async function makeContext() {
        const ctx = await browser.newContext({
            viewport: { width: 1440, height: 1000 },
            acceptDownloads: true,
        });
        const page = await ctx.newPage();
        return { ctx, page };
    }

    let ok = 0, failed = 0, skipped = 0, noRecord = 0;
    try {
        for (let i = 0; i < effective.length; i++) {
            const t = effective[i];
            const key = t.dsdCode;
            const prev = manifest.results[key];
            const prefix = `[${i + 1}/${effective.length}] ${t.sector} / ${t.subSector} / ${t.dsdCode}`;

            if (prev?.status === 'ok' && fs.existsSync(prev.file)) {
                log(`${prefix} — cached (${prev.bytes}b)`);
                skipped++;
                continue;
            }
            if (skipList.includes(t.dsdCode)) {
                log(`${prefix} — SKIPPED (via --skip)`);
                manifest.results[key] = { status: 'skipped', reason: 'in --skip list', at: new Date().toISOString() };
                saveManifest(manifest);
                skipped++;
                continue;
            }

            log(`${prefix} (${t.frequency})`);
            const t0 = Date.now();
            const { ctx, page } = await makeContext();
            try {
                const r = await Promise.race([
                    scrapeElement(page, t, t.sector, t.subSector),
                    new Promise((_, rej) => setTimeout(
                        () => rej(new Error(`per-element budget exceeded (${perElementBudgetMs}ms)`)),
                        perElementBudgetMs,
                    )),
                ]);
                const dt = Math.round((Date.now() - t0) / 1000);
                if (r.status === 'ok') {
                    manifest.results[key] = {
                        status: 'ok', file: r.file, bytes: r.bytes,
                        tableRows: r.tableRows, checkedCount: r.checkedCount,
                        took: dt, at: new Date().toISOString(),
                    };
                    log(`    OK (${r.bytes}b, rows=${r.tableRows}, dims=${r.checkedCount}, ${dt}s) → ${r.file}`);
                    ok++;
                } else if (r.status === 'no-record') {
                    manifest.results[key] = { status: 'no-record', checkedCount: r.checkedCount, took: dt, at: new Date().toISOString() };
                    log(`    NO RECORDS (${dt}s, dims=${r.checkedCount}) — query ran but empty`);
                    noRecord++;
                } else if (r.status === 'no-dimensions') {
                    manifest.results[key] = { status: 'no-dimensions', reason: r.reason, took: dt, at: new Date().toISOString() };
                    log(`    NO DIMENSIONS (${dt}s) — checkbox count was 0`);
                    failed++;
                } else {
                    manifest.results[key] = { status: r.status, took: dt, at: new Date().toISOString() };
                    log(`    ${r.status.toUpperCase()} (${dt}s)`);
                    failed++;
                }
            } catch (e) {
                const dt = Math.round((Date.now() - t0) / 1000);
                manifest.results[key] = { status: 'error', error: e.message, took: dt, at: new Date().toISOString() };
                log(`    ERROR (${dt}s): ${e.message}`);
                failed++;
            } finally {
                await ctx.close().catch(() => {});
            }
            saveManifest(manifest);
            // Small pause between elements to avoid hammering DBIE.
            await new Promise(r => setTimeout(r, 1500));
        }
    } finally {
        await browser.close();
    }

    log(`\nDone — ok=${ok}, no-record=${noRecord}, failed=${failed}, skipped=${skipped}.`);
    log(`Manifest: ${MANIFEST}`);
}

main().catch(err => { console.error(err); process.exit(1); });

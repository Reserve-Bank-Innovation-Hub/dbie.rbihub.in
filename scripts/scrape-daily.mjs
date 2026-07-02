// Month-chunked daily SDMX scraper for DBIE.
//
// The DBIE wizard clamps Daily-frequency queries to ~1 month: after the From
// date is typed, the To field silently resets to From + 1 month (proven in
// scripts/recon/probe-daily-range.mjs). So a multi-month daily series must be
// fetched one calendar month at a time and stitched together.
//
// For each month M in the requested range this script:
//   1. Navigates the SDMX Data Query wizard (auth-free guest access).
//   2. Selects the element by DSD code (default FOREX_RATE_D_RN, under
//      Financial Markets → Forex Market).
//   3. Types From = first day of M (MM-DD-YYYY). The wizard auto-clamps To to
//      the last day of M — which is exactly the chunk we want (for the current
//      month we type To = yesterday so we don't request future dates).
//   4. Selects all dimensions, clicks View Data, downloads the SDMX CSV.
//   5. Parses the chunk and APPENDS it into the committed daily CSV, deduping
//      on (CURRENCY, TIME_PERIOD). The committed CSV keeps its exact header and
//      is re-sorted by TIME_PERIOD then CURRENCY on every run.
//
// The script is idempotent (dedupe on re-run) and resilient: a failed month is
// retried once, other months keep going, and failures are reported at the end.
// Raw chunk downloads are staged under data/sdmx-raw/daily/<dsd>/<YYYY-MM>.csv
// (gitignored) for debuggability.
//
// Usage:
//   node scripts/scrape-daily.mjs                        # from = month after last committed row → current month
//   node scripts/scrape-daily.mjs --from 2025-11 --to 2026-07
//   node scripts/scrape-daily.mjs --dsd FOREX_RATE_D_RN
//   node scripts/scrape-daily.mjs --headful              # show the browser (debugging)

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const WIZARD_URL = 'https://data.rbi.org.in/DBIE/#/dbie/dataquery_enhanced';
// The committed daily CSV the fetcher appends into (SDMX-CSV shape).
const COMMITTED_CSV = path.join(
    REPO, 'data', 'sdmx', 'financial-markets', 'forex-market',
    'exchange-rate-of-the-indian-rupee-daily.csv',
);
const RAW_DIR = path.join(REPO, 'data', 'sdmx-raw', 'daily'); // gitignored chunk staging

// The FOREX_RATE_D_RN element lives here in the tree.
const SECTOR = 'Financial Markets';
const SUB = 'Forex Market';

const TODAY = new Date();

// --------- CLI parsing
const argv = process.argv.slice(2);
const flag = name => {
    const idx = argv.indexOf(name);
    return idx >= 0 ? argv[idx + 1] : null;
};
const hasFlag = name => argv.includes(name);

const dsd = flag('--dsd') || 'FOREX_RATE_D_RN';
const headful = hasFlag('--headful');
const cliFrom = flag('--from'); // YYYY-MM
const cliTo = flag('--to');     // YYYY-MM

// --------- Helpers
const pad = (n, w = 2) => String(n).padStart(w, '0');
function log(msg) { console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`); }

// Enumerate "YYYY-MM" strings from `from` to `to` inclusive.
function monthRange(fromYM, toYM) {
    const [fy, fm] = fromYM.split('-').map(Number);
    const [ty, tm] = toYM.split('-').map(Number);
    const out = [];
    let y = fy, m = fm;
    while (y < ty || (y === ty && m <= tm)) {
        out.push(`${y}-${pad(m)}`);
        m++;
        if (m > 12) { m = 1; y++; }
    }
    return out;
}

const lastDayOfMonth = (y, m /*1-12*/) => new Date(y, m, 0).getDate();

// Launch chromium, tolerating a Playwright version whose bundled
// chrome-headless-shell isn't downloaded. Playwright's default headless launch
// reaches for chrome-headless-shell-<build>; if that build is missing but a
// full chromium build IS present in the ms-playwright cache, fall back to it via
// executablePath. Keeps the script runnable without a fresh `playwright install`.
async function launchBrowser() {
    const opts = { headless: !headful };
    try {
        return await chromium.launch(opts);
    } catch (e) {
        if (!/Executable doesn't exist|please run|playwright install/i.test(e.message)) throw e;
        const cacheDir = process.env.PLAYWRIGHT_BROWSERS_PATH
            || path.join(process.env.HOME || '', 'Library', 'Caches', 'ms-playwright');
        let full = null;
        try {
            for (const d of fs.readdirSync(cacheDir)) {
                if (!/^chromium-\d+$/.test(d)) continue; // full chromium, not *_headless_shell-*
                for (const bin of [
                    path.join(cacheDir, d, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
                    path.join(cacheDir, d, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
                    path.join(cacheDir, d, 'chrome-linux', 'chrome'),
                ]) {
                    if (fs.existsSync(bin)) { full = bin; break; }
                }
                if (full) break;
            }
        } catch {}
        if (!full) throw e;
        log(`    (chrome-headless-shell missing; using full chromium at ${full})`);
        return await chromium.launch({ ...opts, executablePath: full });
    }
}

// --------- Committed-CSV read/parse/write
// Rows are parsed into an index keyed by `${CURRENCY}|${TIME_PERIOD}` so a
// re-run overwrites the same observation rather than duplicating it.
function readCommitted() {
    const text = fs.readFileSync(COMMITTED_CSV, 'utf8');
    const lines = text.split(/\r?\n/);
    const header = lines[0];
    const cols = header.split(',');
    const iCurrency = cols.indexOf('CURRENCY');
    const iTime = cols.indexOf('TIME_PERIOD');
    if (iCurrency < 0 || iTime < 0) {
        throw new Error(`committed CSV missing CURRENCY/TIME_PERIOD columns: ${header}`);
    }
    const rows = new Map();
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const parts = line.split(',');
        const key = `${parts[iCurrency]}|${parts[iTime]}`;
        rows.set(key, line);
    }
    return { header, cols, iCurrency, iTime, rows };
}

function writeCommitted(header, cols, rows) {
    const iCurrency = cols.indexOf('CURRENCY');
    const iTime = cols.indexOf('TIME_PERIOD');
    // Sort by TIME_PERIOD then CURRENCY.
    const sorted = [...rows.values()].sort((a, b) => {
        const pa = a.split(','), pb = b.split(',');
        const ta = pa[iTime], tb = pb[iTime];
        if (ta < tb) return -1;
        if (ta > tb) return 1;
        const ca = pa[iCurrency], cb = pb[iCurrency];
        return ca < cb ? -1 : ca > cb ? 1 : 0;
    });
    const body = sorted.join('\n');
    fs.writeFileSync(COMMITTED_CSV, `${header}\n${body}\n`);
    return sorted.length;
}

// Parse a downloaded SDMX chunk into raw CSV lines (excluding its own header),
// re-keyed on (CURRENCY, TIME_PERIOD). We keep the chunk lines verbatim; only
// their column layout must match the committed header (same element → it does).
function parseChunk(chunkText, committedCols) {
    const lines = chunkText.split(/\r?\n/);
    const header = (lines[0] || '').split(',');
    const iCurrency = header.indexOf('CURRENCY');
    const iTime = header.indexOf('TIME_PERIOD');
    if (iCurrency < 0 || iTime < 0) {
        return { rows: new Map(), headerMismatch: true, chunkHeader: lines[0] };
    }
    // Guard: the chunk header must be identical to the committed header so a
    // verbatim line copy stays column-aligned.
    const headerMismatch = header.join(',') !== committedCols.join(',');
    const rows = new Map();
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const parts = line.split(',');
        const cur = parts[iCurrency];
        const time = parts[iTime];
        if (!cur || !time) continue;
        rows.set(`${cur}|${time}`, line);
    }
    return { rows, headerMismatch, chunkHeader: lines[0] };
}

// --------- Modal dismissal (DBIE high-load banner)
// DBIE throws a transient modal ("...currently unavailable...") on load and
// sometimes right after View Data. Dismiss any real blocker; ignore the page's
// own feedback banner.
async function dismissModal(page) {
    try {
        const seen = await page.evaluate(() => {
            const backdrop = document.querySelector('.modal-backdrop.show');
            const dialog = [...document.querySelectorAll('.modal, [class*="modal"]')]
                .find(m => m.offsetParent !== null && /currently unavailable|high load on the system/i.test(m.innerText || ''));
            return { hasBackdrop: !!backdrop, highLoad: !!dialog };
        });
        if (!seen.hasBackdrop && !seen.highLoad) return false;
        const ok = page.locator('button:has-text("OK"), .modal button:has-text("Ok")').first();
        if (await ok.count()) { await ok.click({ timeout: 3000 }).catch(() => {}); }
        else {
            const x = page.locator('.modal .close, .modal [aria-label="Close"], button:has-text("×")').first();
            if (await x.count()) await x.click({ timeout: 3000 }).catch(() => {});
        }
        await page.waitForTimeout(1000);
        return true;
    } catch { return false; }
}

// --------- Wizard steps (mirror scrape-sdmx.mjs)
async function resetWizard(page) {
    for (let attempt = 1; attempt <= 4; attempt++) {
        await page.goto('about:blank').catch(() => {});
        await page.goto(WIZARD_URL, { waitUntil: 'networkidle', timeout: 90000 });
        await page.waitForTimeout(4000);
        if (await dismissModal(page)) log(`    resetWizard: dismissed high-load modal (attempt ${attempt})`);
        const blocked = await page.evaluate(() => !!document.querySelector('.modal-backdrop.show'));
        if (!blocked) return;
        log(`    resetWizard: backdrop still present after attempt ${attempt}, reloading…`);
        await page.waitForTimeout(3000);
    }
    log('    resetWizard: WARNING — modal backdrop persisted after 4 attempts');
}

async function selectElement(page) {
    await page.getByText(SECTOR, { exact: true }).first().click({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.getByText(SUB, { exact: true }).first().click({ timeout: 15000 });
    await page.waitForTimeout(1000);
    const leaf = page.locator(`label:has-text("${dsd}")`).first();
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

// Type From = first-of-month, then To = intended last day. The wizard clamps To
// to From's month anyway, so typing the true last day is belt-and-braces; for
// the current month we cap To at yesterday to avoid future-date rejection.
async function fillMonthDates(page, from /*MM-DD-YYYY*/, to /*MM-DD-YYYY*/) {
    await page.evaluate(() => {
        document.querySelectorAll('input[placeholder="Select From Date"],input[placeholder="Select To Date"]')
            .forEach(el => { el.readOnly = false; el.removeAttribute('readonly'); });
    });
    const fromInput = page.locator('input[placeholder="Select From Date"]').first();
    await fromInput.click();
    await page.keyboard.type(from, { delay: 35 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(800); // let the To auto-clamp land
    const toInput = page.locator('input[placeholder="Select To Date"]').first();
    await toInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.keyboard.type(to, { delay: 35 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1500);
}

async function selectAllDimensions(page) {
    const deadline = Date.now() + 90000;
    await page.evaluate(() => {
        for (const el of document.querySelectorAll('[aria-expanded="false"]')) {
            try { el.click(); } catch {}
        }
    });
    await page.waitForTimeout(800);
    const sa = page.locator('span.selectAllCss');
    const saN = await sa.count();
    for (let i = 0; i < saN && Date.now() < deadline; i++) {
        try { await sa.nth(i).click({ timeout: 1500, force: true }); } catch {}
    }
    await page.waitForTimeout(1000);
    const countChecked = () => page.evaluate(
        () => document.querySelectorAll('input[type="checkbox"]:checked').length);
    let checked = await countChecked();
    if (checked === 0 && Date.now() < deadline) {
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
        checked = await countChecked();
    }
    return checked;
}

async function viewDataAndDownload(page, outCsv) {
    await dismissModal(page);
    const impalaPromise = page.waitForResponse(
        r => /dbie_getImpalaDQActionEnhanced/.test(r.url()), { timeout: 180000 });
    const btn = page.locator('button:has-text("View Data")').first();
    await btn.waitFor({ timeout: 15000 });
    await btn.click();
    await page.waitForTimeout(1500);
    await dismissModal(page); // high-load modal can fire right after View Data

    let sawResponse = false;
    await Promise.race([
        impalaPromise.then(r => { sawResponse = true; return r; }),
        new Promise(r => setTimeout(() => r(null), 180000)),
    ]).catch(() => null);
    if (!sawResponse) return { status: 'timeout' };
    await page.waitForTimeout(2500);

    try {
        const dropdown = page.locator('select.sdmxDD').first();
        await dropdown.waitFor({ timeout: 10000 });
        const [dl] = await Promise.all([
            page.waitForEvent('download', { timeout: 40000 }),
            dropdown.selectOption('sdmx'),
        ]);
        await dl.saveAs(outCsv);
        return { status: 'ok', file: outCsv };
    } catch (e) {
        return { status: 'download-failed', error: e.message };
    }
}

// Fetch one calendar month, returning the raw CSV text (or a failure status).
async function fetchMonth(browser, ym /*YYYY-MM*/) {
    const [y, m] = ym.split('-').map(Number);
    const isCurrentMonth = (y === TODAY.getFullYear() && m === TODAY.getMonth() + 1);
    // From = first of month. To = last of month, but for the current month cap
    // at yesterday so we never request future dates.
    const fromStr = `${pad(m)}-01-${y}`;
    let toDay = lastDayOfMonth(y, m);
    if (isCurrentMonth) {
        const yest = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 1);
        // Only clamp if yesterday is within this month (it always is for the current month).
        toDay = yest.getDate();
    }
    const toStr = `${pad(m)}-${pad(toDay)}-${y}`;

    const rawMonthDir = path.join(RAW_DIR, dsd);
    fs.mkdirSync(rawMonthDir, { recursive: true });
    const outCsv = path.join(rawMonthDir, `${ym}.csv`);

    const ctx = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        acceptDownloads: true,
    });
    const page = await ctx.newPage();
    try {
        await resetWizard(page);
        await selectElement(page);
        await clickNext(page); // → dates
        await fillMonthDates(page, fromStr, toStr);
        await clickNext(page); // → dimensions
        const checked = await selectAllDimensions(page);
        if (checked === 0) return { status: 'no-dimensions' };
        await clickNext(page); // → advanced options
        const dl = await viewDataAndDownload(page, outCsv);
        if (dl.status !== 'ok') return { status: dl.status, error: dl.error };
        const text = fs.readFileSync(outCsv, 'utf8');
        return { status: 'ok', file: outCsv, text, from: fromStr, to: toStr };
    } catch (e) {
        return { status: 'error', error: e.message };
    } finally {
        await ctx.close().catch(() => {});
    }
}

// --------- Main
async function main() {
    if (!fs.existsSync(COMMITTED_CSV)) {
        console.error(`Committed daily CSV missing: ${COMMITTED_CSV}`);
        process.exit(1);
    }
    const committed = readCommitted();

    // Default From = month AFTER the newest TIME_PERIOD already committed.
    let fromYM = cliFrom;
    if (!fromYM) {
        let maxTime = '';
        for (const line of committed.rows.values()) {
            const t = line.split(',')[committed.iTime];
            if (t > maxTime) maxTime = t;
        }
        if (!maxTime) {
            console.error('Committed CSV has no rows and no --from given.');
            process.exit(1);
        }
        const [my, mm] = maxTime.slice(0, 7).split('-').map(Number);
        let ny = my, nm = mm + 1;
        if (nm > 12) { nm = 1; ny++; }
        fromYM = `${ny}-${pad(nm)}`;
    }
    const toYM = cliTo || `${TODAY.getFullYear()}-${pad(TODAY.getMonth() + 1)}`;

    const months = monthRange(fromYM, toYM);
    log(`Committed CSV: ${committed.rows.size} rows. Fetching ${dsd} for ${months.length} month(s): ${fromYM} → ${toYM}`);

    const browser = await launchBrowser();
    const failed = [];
    let totalAdded = 0;
    try {
        for (let i = 0; i < months.length; i++) {
            const ym = months[i];
            const prefix = `[${i + 1}/${months.length}] ${ym}`;
            log(`${prefix} — fetching…`);

            let result = await fetchMonth(browser, ym);
            if (result.status !== 'ok') {
                log(`${prefix} — ${result.status}${result.error ? `: ${result.error}` : ''}; retrying once…`);
                await new Promise(r => setTimeout(r, 2000));
                result = await fetchMonth(browser, ym);
            }

            if (result.status !== 'ok') {
                log(`${prefix} — FAILED (${result.status}${result.error ? `: ${result.error}` : ''})`);
                failed.push({ ym, status: result.status, error: result.error });
                await new Promise(r => setTimeout(r, 1500));
                continue;
            }

            const chunk = parseChunk(result.text, committed.cols);
            if (chunk.headerMismatch) {
                log(`${prefix} — FAILED (header mismatch)\n    committed: ${committed.header}\n    chunk:     ${chunk.chunkHeader}`);
                failed.push({ ym, status: 'header-mismatch' });
                continue;
            }
            let added = 0, updated = 0;
            for (const [key, line] of chunk.rows) {
                if (committed.rows.has(key)) updated++; else added++;
                committed.rows.set(key, line);
            }
            totalAdded += added;
            log(`${prefix} — OK: chunk ${chunk.rows.size} rows (${added} new, ${updated} overlap) [from ${result.from} to ${result.to}]`);

            // Persist after each month so a mid-run crash keeps progress.
            writeCommitted(committed.header, committed.cols, committed.rows);
            await new Promise(r => setTimeout(r, 1500));
        }
    } finally {
        await browser.close();
    }

    const finalCount = writeCommitted(committed.header, committed.cols, committed.rows);
    log(`\nDone — committed CSV now ${finalCount} rows (+${totalAdded} new this run).`);
    if (failed.length) {
        log(`FAILED months (${failed.length}): ${failed.map(f => `${f.ym}(${f.status})`).join(', ')}`);
        log('Re-run the script to retry — dedupe makes it idempotent.');
    } else {
        log('All months fetched successfully.');
    }
    log(`Committed CSV: ${COMMITTED_CSV}`);
}

main().catch(err => { console.error(err); process.exit(1); });

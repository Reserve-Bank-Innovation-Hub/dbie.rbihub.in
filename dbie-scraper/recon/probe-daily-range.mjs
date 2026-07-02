// Probe: why do Daily-frequency elements return only ~1 month of data?
//
// Symptom (observed in old checkout): FOREX_RATE_D_RN scraped with from=01-01-2011,
// to≈2026 produced 80 rows, all in Jan 2011 (TIME_PERIOD max = 2011-01-31).
// Weekly/monthly/annual elements fetch full ranges fine with the same code.
//
// The daily picker is a jQuery bootstrap-datepicker (class "datepicker
// datepicker-dropdown dropdown-menu", «Month YYYY» nav). Suspicion: typing a
// value into a bootstrap-datepicker sets the input's .value string, but does NOT
// commit the parsed Date into the widget's internal model / fire changeDate unless
// the value is parsed on the picker's own terms. The wizard submits the picker's
// model date, not the raw string — so the To-date gets clamped.
//
// This probe:
//   TRIAL A — replicate production exactly (type + Tab). Read back BOTH input
//             .value strings, then complete flow → download SDMX CSV → parse
//             TIME_PERIOD min/max + row count.
//   TRIAL B — same window, but commit each date the way the widget expects:
//             set value then fire a proper key/blur sequence AND dispatch the
//             bootstrap-datepicker 'changeDate'. Compare CSV range.
//   TRIAL C — smaller windows (via production path) to see whether the cap is
//             exactly "from's month" regardless of To.
//
// Target: FOREX_RATE_D_RN (Financial Markets → Forex Market, Daily).
// Headless. One element per run. Generous waits (main scrape runs concurrently).

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const WIZARD_URL = 'https://data.rbi.org.in/DBIE/#/dbie/dataquery_enhanced';
const OUT = path.resolve('recon/output/daily-range');
fs.mkdirSync(OUT, { recursive: true });

const SECTOR = 'Financial Markets';
const SUB = 'Forex Market';
const DSD = 'FOREX_RATE_D_RN';

function log(msg) { console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`); }

// --- Wizard driving, mirroring src/scrape-sdmx.mjs selectors/waits ---

// DBIE throws a transient modal ("Due to high load on the system, the reports
// are currently unavailable. Please try again shortly.") on load and sometimes
// at View Data — more so while the concurrent full scrape hammers it. Dismiss
// any modal (OK / X) and report whether one was seen.
async function dismissModal(page) {
    try {
        const seen = await page.evaluate(() => {
            // Only treat a *visible* modal-backdrop as a blocker; the page's own
            // feedback banner ("...Please provide your feedback...") must NOT count.
            const backdrop = document.querySelector('.modal-backdrop.show');
            // A high-load dialog specifically contains "currently unavailable".
            const dialog = [...document.querySelectorAll('.modal, [class*="modal"]')]
                .find(m => m.offsetParent !== null && /currently unavailable|high load on the system/i.test(m.innerText || ''));
            return { hasBackdrop: !!backdrop, highLoad: !!dialog };
        });
        if (!seen.hasBackdrop && !seen.highLoad) return { dismissed: false };
        // Prefer the OK button, else the close (×) control.
        const ok = page.locator('button:has-text("OK"), .modal button:has-text("Ok")').first();
        if (await ok.count()) { await ok.click({ timeout: 3000 }).catch(() => {}); }
        else {
            const x = page.locator('.modal .close, .modal [aria-label="Close"], button:has-text("×")').first();
            if (await x.count()) await x.click({ timeout: 3000 }).catch(() => {});
        }
        await page.waitForTimeout(1000);
        return { dismissed: true, ...seen };
    } catch { return { dismissed: false }; }
}

async function resetWizard(page) {
    // Retry the load a few times: the high-load modal often clears on reload.
    for (let attempt = 1; attempt <= 4; attempt++) {
        await page.goto('about:blank').catch(() => {});
        await page.goto(WIZARD_URL, { waitUntil: 'networkidle', timeout: 90000 });
        await page.waitForTimeout(4000);
        const m = await dismissModal(page);
        if (m.dismissed) log(`  resetWizard: dismissed high-load modal (attempt ${attempt}), waiting before continuing`);
        // Confirm the tree is interactable (no lingering backdrop).
        const blocked = await page.evaluate(() =>
            !!document.querySelector('.modal-backdrop.show'));
        if (!blocked) return;
        log(`  resetWizard: backdrop still present after attempt ${attempt}, reloading…`);
        await page.waitForTimeout(3000);
    }
    log('  resetWizard: WARNING — modal backdrop persisted after 4 attempts');
}

async function selectElement(page) {
    await page.getByText(SECTOR, { exact: true }).first().click({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.getByText(SUB, { exact: true }).first().click({ timeout: 15000 });
    await page.waitForTimeout(1000);
    const leaf = page.locator(`label:has-text("${DSD}")`).first();
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

// Read both date input .value strings + the bootstrap-datepicker internal model.
// bootstrap-datepicker stashes its state on the jQuery data of the input:
//   $(input).data('datepicker').dates   -> array of committed Date objects
//   $(input).data('datepicker').viewDate-> currently displayed month
async function readDateState(page, tag) {
    const state = await page.evaluate(() => {
        const out = {};
        for (const [k, id] of [['from', 'startDaily'], ['to', 'endDaily']]) {
            const el = document.getElementById(id)
                || document.querySelector(`input[placeholder="Select ${k === 'from' ? 'From' : 'To'} Date"]`);
            if (!el) { out[k] = { missing: true }; continue; }
            const rec = { value: el.value, readonly: el.readOnly };
            // Try to reach the bootstrap-datepicker instance (jQuery may or may not be global).
            try {
                const jq = window.jQuery || window.$;
                if (jq) {
                    const dp = jq(el).data('datepicker');
                    if (dp) {
                        rec.dpDates = (dp.dates || []).map(d => {
                            try { return new Date(d).toISOString().slice(0, 10); } catch { return String(d); }
                        });
                        rec.dpViewDate = dp.viewDate ? new Date(dp.viewDate).toISOString().slice(0, 10) : null;
                    } else {
                        rec.dpDates = 'no-datepicker-data';
                    }
                } else {
                    rec.dpDates = 'no-jquery';
                }
            } catch (e) { rec.dpErr = String(e); }
            out[k] = rec;
        }
        return out;
    });
    log(`  [${tag}] from.value="${state.from?.value}" dpDates=${JSON.stringify(state.from?.dpDates)} | to.value="${state.to?.value}" dpDates=${JSON.stringify(state.to?.dpDates)}`);
    return state;
}

// Production path: strip readonly, click, type, Tab.
async function fillDatesProd(page, from, to) {
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
}

// Candidate-fix path: type each date, then commit the way bootstrap-datepicker
// expects (Enter inside the field triggers its parse+changeDate), and finally
// close with Escape so the picker doesn't re-open over the next input.
async function fillDatesCommit(page, from, to) {
    await page.evaluate(() => {
        document.querySelectorAll('input[placeholder="Select From Date"],input[placeholder="Select To Date"]')
            .forEach(el => { el.readOnly = false; el.removeAttribute('readonly'); });
    });

    async function commitOne(placeholder, val) {
        const input = page.locator(`input[placeholder="${placeholder}"]`).first();
        await input.click();
        await page.waitForTimeout(300);
        // Clear any existing content.
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Delete');
        await page.keyboard.type(val, { delay: 40 });
        await page.waitForTimeout(300);
        // Enter = bootstrap-datepicker "parse current input + set date + changeDate".
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
        // Also nudge the widget explicitly via its own API if reachable.
        await page.evaluate(({ placeholder, val }) => {
            const el = document.querySelector(`input[placeholder="${placeholder}"]`);
            if (!el) return;
            const jq = window.jQuery || window.$;
            if (jq) {
                try {
                    const $el = jq(el);
                    if ($el.data('datepicker')) {
                        $el.datepicker('update', val);
                        $el.trigger('changeDate');
                    }
                } catch {}
            }
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        }, { placeholder, val });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
    }

    await commitOne('Select From Date', from);
    await commitOne('Select To Date', to);
    await page.waitForTimeout(800);
}

// Candidate-fix path D: set From, let it settle (it auto-prefills To with the
// from-month's last day), THEN forcibly clear + set To LAST and *verify the
// readback* — retrying the clear/type until To reads exactly the intended value.
// No From interaction happens after To is set, so nothing re-prefills it.
async function fillDatesVerify(page, from, to) {
    await page.evaluate(() => {
        document.querySelectorAll('input[placeholder="Select From Date"],input[placeholder="Select To Date"]')
            .forEach(el => { el.readOnly = false; el.removeAttribute('readonly'); });
    });

    // 1. Set From first, plainly (type + Tab). This triggers the To auto-prefill.
    const fromInput = page.locator('input[placeholder="Select From Date"]').first();
    await fromInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.keyboard.type(from, { delay: 35 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1200); // let the To auto-prefill land

    const readTo = () => page.evaluate(() => {
        const el = document.getElementById('endDaily')
            || document.querySelector('input[placeholder="Select To Date"]');
        return el ? el.value : null;
    });
    log(`  [verify] To after From settle: "${await readTo()}"`);

    // 2. Set To LAST, with a clear+type+verify retry loop.
    const toInput = page.locator('input[placeholder="Select To Date"]').first();
    let readback = null;
    for (let attempt = 1; attempt <= 5; attempt++) {
        await toInput.click();
        await page.waitForTimeout(200);
        // Hard-clear: select-all + delete a few times, plus a JS blank as belt-and-braces.
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Delete');
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Backspace');
        await page.evaluate(() => {
            const el = document.getElementById('endDaily')
                || document.querySelector('input[placeholder="Select To Date"]');
            if (el) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }
        });
        await page.waitForTimeout(200);
        await toInput.click();
        await page.keyboard.type(to, { delay: 40 });
        await page.keyboard.press('Tab'); // commit via blur, no Enter/changeDate re-sync
        await page.waitForTimeout(800);
        readback = await readTo();
        log(`  [verify] To attempt ${attempt}: readback="${readback}"`);
        if (readback === to) break;
    }
    if (readback !== to) log(`  [verify] WARNING: To never matched intended "${to}" (last="${readback}")`);
    await page.waitForTimeout(500);
}

// Candidate-fix path E: drive BOTH dates through the calendar widget itself,
// not by typing. bootstrap-datepicker's day-cell click is the only path that
// fires the (dateChange) binding Angular reads at query time — typing updates
// the DOM .value but not the bound model (proved by trial D: clean To input,
// still 1-month CSV). We navigate the month/year switcher then click the day.
async function pickViaCalendar(page, placeholder, y, m /*1-12*/, d) {
    const input = page.locator(`input[placeholder="${placeholder}"]`).first();
    await input.click();
    await page.waitForTimeout(800);
    // The visible datepicker popup. Navigate to the target month/year by reading
    // the ".datepicker-switch" title and stepping prev/next.
    const targetLabel = new Date(y, m - 1, 1)
        .toLocaleString('en-US', { month: 'long', year: 'numeric' }); // "June 2026"
    for (let i = 0; i < 400; i++) {
        const cur = await page.evaluate(() => {
            const sw = document.querySelector('.datepicker-days .datepicker-switch, .datepicker .datepicker-switch');
            return sw ? sw.textContent.trim() : null;
        });
        if (!cur) break;
        if (cur === targetLabel) break;
        // Decide direction by comparing dates.
        const curDate = new Date(cur + ' 1');
        const tgtDate = new Date(y, m - 1, 1);
        const dir = tgtDate < curDate ? '.prev' : '.next';
        const arrow = page.locator(`.datepicker-days ${dir}, .datepicker ${dir}`).first();
        if (!(await arrow.count())) break;
        await arrow.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(120);
    }
    // Click the day cell (exclude .old/.new spillover cells from adjacent months).
    const dayCell = page.locator('.datepicker-days td.day:not(.old):not(.new)', { hasText: new RegExp(`^${d}$`) }).first();
    await dayCell.click({ timeout: 3000 }).catch(async () => {
        // Fallback: any matching day cell.
        await page.locator('.datepicker td.day', { hasText: new RegExp(`^${d}$`) }).first().click({ timeout: 3000 }).catch(() => {});
    });
    await page.waitForTimeout(600);
}

async function fillDatesCalendar(page, from, to) {
    await page.evaluate(() => {
        document.querySelectorAll('input[placeholder="Select From Date"],input[placeholder="Select To Date"]')
            .forEach(el => { el.readOnly = false; el.removeAttribute('readonly'); });
    });
    // from/to are MM-DD-YYYY strings.
    const [fm, fd, fy] = from.split('-').map(Number);
    const [tm, td, ty] = to.split('-').map(Number);
    await pickViaCalendar(page, 'Select From Date', fy, fm, fd);
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);
    await pickViaCalendar(page, 'Select To Date', ty, tm, td);
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(800);
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
    if (checked === 0) {
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
    // Capture the actual Impala request payload — this reveals the real From/To
    // the SPA submits, independent of what the inputs visibly show.
    let reqPayload = null;
    const onReq = req => {
        if (/dbie_getImpalaDQActionEnhanced/.test(req.url())) {
            try { reqPayload = req.postData(); } catch {}
        }
    };
    page.on('request', onReq);
    const impalaPromise = page.waitForResponse(
        r => /dbie_getImpalaDQActionEnhanced/.test(r.url()), { timeout: 300000 });
    const btn = page.locator('button:has-text("View Data")').first();
    await btn.waitFor({ timeout: 15000 });
    await btn.click();
    await page.waitForTimeout(1500);
    await dismissModal(page); // high-load modal can fire right after View Data

    let sawResponse = false;
    const resp = await Promise.race([
        impalaPromise.then(r => { sawResponse = true; return r; }),
        new Promise(r => setTimeout(() => r(null), 300000)),
    ]).catch(() => null);
    page.off('request', onReq);
    if (reqPayload) {
        // Pull any date-looking tokens out of the payload for the log.
        const dates = (reqPayload.match(/\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2}/g) || []);
        log(`  [impala] payload dates: ${JSON.stringify([...new Set(dates)])}`);
        log(`  [impala] payload (first 600): ${reqPayload.slice(0, 600)}`);
    }
    if (!sawResponse) return { status: 'timeout', reqPayload };
    await page.waitForTimeout(2500);

    // Download SDMX CSV.
    try {
        const dropdown = page.locator('select.sdmxDD').first();
        await dropdown.waitFor({ timeout: 10000 });
        const [dl] = await Promise.all([
            page.waitForEvent('download', { timeout: 40000 }),
            dropdown.selectOption('sdmx'),
        ]);
        await dl.saveAs(outCsv);
        return { status: 'ok', file: outCsv, reqPayload };
    } catch (e) {
        return { status: 'download-failed', error: e.message, reqPayload };
    }
}

// Parse a downloaded SDMX CSV: TIME_PERIOD min/max + row count + monthly histogram.
function analyseCsv(file) {
    if (!fs.existsSync(file)) return { exists: false };
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return { exists: true, rows: 0 };
    const hdr = lines[0].split(',').map(s => s.replace(/"/g, '').trim());
    const ti = hdr.findIndex(h => /^TIME_PERIOD$/i.test(h));
    if (ti < 0) return { exists: true, rows: lines.length - 1, note: 'no TIME_PERIOD column', hdr };
    const dates = lines.slice(1).map(r => (r.split(',')[ti] || '').replace(/"/g, '').trim()).filter(Boolean).sort();
    const months = {};
    for (const d of dates) { const m = d.slice(0, 7); months[m] = (months[m] || 0) + 1; }
    return {
        exists: true,
        rows: lines.length - 1,
        timeMin: dates[0],
        timeMax: dates[dates.length - 1],
        distinctMonths: Object.keys(months).length,
        months,
    };
}

async function runTrial(browser, { tag, from, to, fill, outCsv, shot }) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    const page = await ctx.newPage();
    const trial = { tag, from, to };
    try {
        log(`TRIAL ${tag}: from=${from} to=${to} (fill=${fill.name})`);
        await resetWizard(page);
        await selectElement(page);
        await clickNext(page);          // → Frequency / dates step
        await page.screenshot({ path: path.join(OUT, `${shot}-1-dates-before.png`) }).catch(() => {});
        await fill(page, from, to);
        trial.afterType = await readDateState(page, `${tag}:afterType`);
        await page.screenshot({ path: path.join(OUT, `${shot}-2-dates-after-type.png`) }).catch(() => {});
        await clickNext(page);          // → Dimension step
        // Re-read after advancing: does moving off the step reset the To-date?
        trial.afterNext = { note: 'inputs not present on dimension step (expected)' };
        const checked = await selectAllDimensions(page);
        trial.checked = checked;
        log(`  [${tag}] dimensions checked: ${checked}`);
        await page.screenshot({ path: path.join(OUT, `${shot}-3-dimensions.png`) }).catch(() => {});
        await clickNext(page);          // → Advanced Options
        const dl = await viewDataAndDownload(page, outCsv);
        trial.download = { status: dl.status, error: dl.error };
        if (dl.reqPayload) {
            const dates = (dl.reqPayload.match(/\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2}/g) || []);
            trial.impalaPayloadDates = [...new Set(dates)];
            trial.impalaPayloadSnippet = dl.reqPayload.slice(0, 800);
        }
        await page.screenshot({ path: path.join(OUT, `${shot}-4-output.png`) }).catch(() => {});
        trial.csv = analyseCsv(outCsv);
        log(`  [${tag}] download=${dl.status} | csv rows=${trial.csv.rows} min=${trial.csv.timeMin} max=${trial.csv.timeMax} months=${trial.csv.distinctMonths}`);
    } catch (e) {
        trial.error = e.message;
        log(`  [${tag}] ERROR: ${e.message}`);
        await page.screenshot({ path: path.join(OUT, `${shot}-ERROR.png`) }).catch(() => {});
    } finally {
        await ctx.close().catch(() => {});
    }
    return trial;
}

async function main() {
    const which = process.argv[2] || 'all'; // A | B | C | all
    const browser = await chromium.launch({ headless: true });
    const results = {};
    try {
        if (which === 'A' || which === 'all') {
            results.A = await runTrial(browser, {
                tag: 'A-prod-2.5y', from: '01-01-2024', to: '06-30-2026',
                fill: fillDatesProd, outCsv: path.join(OUT, 'trialA-prod.csv'), shot: 'A',
            });
        }
        if (which === 'B' || which === 'all') {
            results.B = await runTrial(browser, {
                tag: 'B-commit-2.5y', from: '01-01-2024', to: '06-30-2026',
                fill: fillDatesCommit, outCsv: path.join(OUT, 'trialB-commit.csv'), shot: 'B',
            });
        }
        if (which === 'C' || which === 'all') {
            // Smaller window via production path: does it still clamp to from's month?
            results.C = await runTrial(browser, {
                tag: 'C-prod-3mo', from: '01-01-2024', to: '03-31-2024',
                fill: fillDatesProd, outCsv: path.join(OUT, 'trialC-prod-3mo.csv'), shot: 'C',
            });
        }
        if (which === 'D' || which === 'all') {
            // Proposed fix: set From, let To auto-prefill, then clear+set To LAST
            // with readback verification. Expect the full 2.5y range.
            results.D = await runTrial(browser, {
                tag: 'D-verify-2.5y', from: '01-01-2024', to: '06-30-2026',
                fill: fillDatesVerify, outCsv: path.join(OUT, 'trialD-verify.csv'), shot: 'D',
            });
        }
        if (which === 'E' || which === 'all') {
            // Proposed fix: drive both dates via the calendar widget (native
            // day-cell click → fires the model-updating binding). Expect full range.
            results.E = await runTrial(browser, {
                tag: 'E-calendar-2.5y', from: '01-01-2024', to: '06-30-2026',
                fill: fillDatesCalendar, outCsv: path.join(OUT, 'trialE-calendar.csv'), shot: 'E',
            });
        }
    } finally {
        await browser.close();
    }
    fs.writeFileSync(path.join(OUT, 'findings.json'), JSON.stringify(results, null, 2));
    log(`\nArtefacts in ${OUT}/`);
    log(`findings.json written.`);
}

main().catch(err => { console.error(err); process.exit(1); });

// Drives the DBIE SDMX Data Query wizard end-to-end for ONE element,
// captures every gateway request+response, saves the Output-step download.
//
// Target element: External Sector → External Debt → "External Debt Ratio" (EXT_DBT_RT_RN)
//   — chosen because it's the first element prior probes used; small dataset so runs fast.
//
// Output goes to recon/output/:
//   wizard-traffic.jsonl  — one line per captured API call
//   wizard-step-N.png     — screenshot after each wizard step
//   wizard-download.*     — the actual downloaded file (Excel, CSV, or whatever we get)
//   wizard-summary.json   — quick summary (success, download path, API count)

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('recon/output');
fs.mkdirSync(OUT_DIR, { recursive: true });

const WIZARD_URL = 'https://data.rbi.org.in/DBIE/#/dbie/dataquery_enhanced';
const ELEMENT_CODE = 'EXT_DBT_RT_RN';
const CATEGORY = 'External Sector';
const SUBCATEGORY = 'External Debt';

const trafficLog = fs.createWriteStream(path.join(OUT_DIR, 'wizard-traffic.jsonl'));
const summary = {
    element: ELEMENT_CODE,
    startedAt: new Date().toISOString(),
    steps: [],
    apiCalls: 0,
    downloads: [],
    errors: [],
};

const decode = raw => raw
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

const log = msg => {
    const line = `[${new Date().toISOString().slice(11, 19)}] ${msg}`;
    console.log(line);
};

async function screenshot(page, label) {
    const file = path.join(OUT_DIR, `wizard-${label}.png`);
    await page.screenshot({ path: file, fullPage: true }).catch(e => {
        summary.errors.push({ at: label, err: `screenshot: ${e.message}` });
    });
    summary.steps.push({ label, at: new Date().toISOString(), screenshot: file });
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    acceptDownloads: true,
});
const page = await ctx.newPage();

// Capture every gateway call and every download-related request.
page.on('response', async r => {
    const url = r.url();
    if (!/CIMS_Gateway|\/download\//.test(url)) return;
    summary.apiCalls++;
    const name = url.split('?')[0].split('/').slice(-2).join('/');
    const req = r.request();
    const record = {
        t: new Date().toISOString(),
        name,
        url,
        status: r.status(),
        contentType: r.headers()['content-type'] || '',
        reqBody: req.postData()?.slice(0, 4000) || null,
    };
    // Try to read body as text. Skip binary blobs (Excel, etc.).
    const ct = record.contentType;
    if (/json|text|xml|html/.test(ct)) {
        try {
            const raw = await r.text();
            record.respBody = decode(raw).slice(0, 4000);
        } catch (e) {
            record.respBodyErr = e.message;
        }
    } else {
        record.respBytes = parseInt(r.headers()['content-length'] || '0', 10) || null;
    }
    trafficLog.write(JSON.stringify(record) + '\n');
});

// Catch any actual download (Excel/CSV/Zip blob).
ctx.on('page', p => {
    p.on('download', async d => {
        const file = path.join(OUT_DIR, `wizard-download-${d.suggestedFilename()}`);
        try {
            await d.saveAs(file);
            summary.downloads.push({ file, suggestedFilename: d.suggestedFilename() });
            log(`  DOWNLOAD saved → ${file}`);
        } catch (e) {
            summary.errors.push({ at: 'download', err: e.message });
        }
    });
});
page.on('download', async d => {
    const file = path.join(OUT_DIR, `wizard-download-${d.suggestedFilename()}`);
    try {
        await d.saveAs(file);
        summary.downloads.push({ file, suggestedFilename: d.suggestedFilename() });
        log(`  DOWNLOAD saved → ${file}`);
    } catch (e) {
        summary.errors.push({ at: 'download', err: e.message });
    }
});

try {
    log(`Opening ${WIZARD_URL}`);
    await page.goto(WIZARD_URL, { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForTimeout(5000);
    await screenshot(page, '1-landed');

    // -------- STEP 1: select the element
    log(`Expanding tree: ${CATEGORY} → ${SUBCATEGORY} → ${ELEMENT_CODE}`);
    await page.getByText(CATEGORY, { exact: true }).first().click();
    await page.waitForTimeout(1500);
    await page.getByText(SUBCATEGORY, { exact: true }).first().click();
    await page.waitForTimeout(1500);
    await screenshot(page, '2-tree-expanded');

    // Check the leaf's checkbox
    await page.locator(`label:has-text("${ELEMENT_CODE}")`).first().click();
    await page.waitForTimeout(1500);
    await screenshot(page, '3-element-checked');

    // -------- Helper: click "Next" on the current wizard step
    async function clickNext(stepLabel) {
        const btn = page.locator('button:has-text("Next")').first();
        await btn.waitFor({ timeout: 15000 });
        await btn.click();
        await page.waitForTimeout(3500);
        await screenshot(page, stepLabel);
    }

    // -------- STEP 2: Frequency + date range
    await clickNext('4-frequency');

    // Inspect the date inputs so we understand the DOM shape.
    const dateInfo = await page.evaluate(() => {
        const info = [];
        for (const ph of ['Select From Date', 'Select To Date']) {
            const el = document.querySelector(`input[placeholder="${ph}"]`);
            if (!el) { info.push({ ph, missing: true }); continue; }
            info.push({
                ph,
                tag: el.tagName,
                type: el.type,
                readonly: el.readOnly,
                disabled: el.disabled,
                mask: el.getAttribute('mask') || el.getAttribute('mat-input-mask') || null,
                classes: el.className,
            });
        }
        return info;
    });
    log(`  date inputs: ${JSON.stringify(dateInfo)}`);

    // Strategy: strip readonly, focus, click, type digits char-by-char.
    await page.evaluate(() => {
        document.querySelectorAll('input[placeholder="Select From Date"],input[placeholder="Select To Date"]')
            .forEach(el => { el.readOnly = false; el.removeAttribute('readonly'); });
    });
    // The wizard's date format differs by frequency:
    //   Annual / Financial Year → YYYY or MM-YYYY
    //   Quarterly / Financial Year → MM-YYYY (where MM is the quarter-end month)
    //   Monthly → MM-YYYY
    //   Daily / Weekly → MM-DD-YYYY
    // EXT_DBT_RT_RN is Quarterly-FY, so use MM-YYYY.
    const fromInput = page.locator('input[placeholder="Select From Date"]').first();
    await fromInput.click();
    await page.keyboard.type('03-1990', { delay: 40 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);

    const toInput = page.locator('input[placeholder="Select To Date"]').first();
    await toInput.click();
    await page.keyboard.type('12-2025', { delay: 40 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(2500);
    await screenshot(page, '4a-frequency-dates');

    // -------- STEP 3: Dimension — expand and select all values
    await clickNext('5-dimension');

    // Introspect the dimension panel so we understand its DOM.
    const dimInfo = await page.evaluate(() => {
        const panels = [...document.querySelectorAll('[class*="panel"], [class*="accordion"], mat-expansion-panel')];
        const checkboxes = [...document.querySelectorAll('input[type="checkbox"]')];
        const selectAllCandidates = [...document.querySelectorAll('*')]
            .filter(el => /select all/i.test(el.textContent || '') && el.children.length === 0)
            .map(el => ({ tag: el.tagName, text: (el.textContent || '').slice(0, 50) }));
        return {
            panels: panels.length,
            checkboxes: checkboxes.length,
            selectAllCandidates: selectAllCandidates.slice(0, 10),
        };
    });
    log(`  dimension panel: ${JSON.stringify(dimInfo)}`);

    // Click anything that says "Select All", then expand remaining panels and tick their checkboxes.
    const selectAllLocators = page.locator('text=/Select All/i');
    const saCount = await selectAllLocators.count();
    for (let i = 0; i < saCount; i++) {
        try {
            await selectAllLocators.nth(i).click({ timeout: 2000 });
            await page.waitForTimeout(300);
        } catch (e) {
            log(`    select-all ${i} click failed: ${e.message}`);
        }
    }

    // Also click any expansion headers so their children render, then tick ALL checkboxes.
    await page.evaluate(() => {
        // Expand anything that looks collapsed
        for (const el of document.querySelectorAll('[aria-expanded="false"], [class*="collapsed"]')) {
            try { el.click(); } catch {}
        }
    });
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
        for (const cb of document.querySelectorAll('input[type="checkbox"]:not(:checked)')) {
            try {
                cb.click();
            } catch {}
        }
    });
    await page.waitForTimeout(1500);
    await screenshot(page, '5a-dimension-selected');

    // -------- STEP 4: Advanced Options (accept defaults)
    await clickNext('6-advanced');

    // -------- STEP 5: View Data → Output page
    // From the Advanced Options screen, the action button is "View Data" (not Next/Finish).
    log('Clicking View Data to reach Output');
    const viewDataBtn = page.locator('button:has-text("View Data")').first();
    await viewDataBtn.waitFor({ timeout: 15000 });
    await viewDataBtn.click();

    // The Impala query triggers a number of API calls. Poll for the actual data-query
    // response. We look for any call to an Impala/DataQuery/createDDL endpoint.
    let dataResponseSeen = false;
    const dataResponseHandler = r => {
        const url = r.url();
        if (/dbie_getImpalaDQ|dbie_createDDL|dbie_getPublicationData|dbie_getApiResponse/.test(url)) {
            dataResponseSeen = true;
        }
    };
    page.on('response', dataResponseHandler);

    for (let i = 0; i < 30; i++) {
        const state = await page.evaluate(() => {
            const visible = el => el && el.offsetParent !== null;
            // Detect the session-expired modal only if actually visible.
            const sessionExpired = [...document.querySelectorAll('*')]
                .some(el => visible(el) && /Session has expired/i.test(el.textContent || '') && el.children.length === 0);
            const tables = [...document.querySelectorAll('table')];
            const dataTable = tables.find(t => t.rows.length > 3);
            return {
                sessionExpired,
                tableRows: dataTable?.rows.length || 0,
                charts: document.querySelectorAll('[class*="highcharts"], [id*="chart"], canvas').length,
            };
        });
        if (state.sessionExpired) { log(`  SESSION EXPIRED at poll ${i}`); break; }
        if (state.tableRows > 3 || state.charts > 0) {
            log(`  output ready after ${i * 2}s — tableRows=${state.tableRows}, charts=${state.charts}`);
            break;
        }
        await page.waitForTimeout(2000);
    }
    await page.waitForTimeout(3000);
    await screenshot(page, '7-output');
    log(`  data response observed: ${dataResponseSeen}`);

    // -------- STEP 6: Trigger download via the "Download SDMX" <select> dropdown.
    // Enumerate the select options so we know what formats are offered.
    const ddOptions = await page.evaluate(() => {
        const sel = document.querySelector('select.sdmxDD');
        if (!sel) return null;
        return [...sel.options].map(o => ({ value: o.value, label: o.textContent.trim(), disabled: o.disabled }));
    });
    log(`  sdmx dropdown options: ${JSON.stringify(ddOptions)}`);

    // Try each non-disabled option and capture any download that fires.
    const dropdown = page.locator('select.sdmxDD').first();
    if (ddOptions) {
        for (const opt of ddOptions) {
            if (opt.disabled || !opt.value) continue;
            log(`  selecting SDMX option: ${opt.label} (${opt.value})`);
            try {
                const [dl] = await Promise.all([
                    page.waitForEvent('download', { timeout: 30000 }).catch(() => null),
                    dropdown.selectOption(opt.value),
                ]);
                if (dl) {
                    log(`    download fired: ${dl.suggestedFilename()}`);
                    summary.downloadSelector = `sdmxDD:${opt.value}`;
                    await page.waitForTimeout(5000);
                    break;
                } else {
                    log(`    no download triggered`);
                }
                // Reset the dropdown to the placeholder before trying next.
                await dropdown.selectOption({ index: 0 }).catch(() => {});
                await page.waitForTimeout(500);
            } catch (e) {
                log(`    selectOption failed: ${e.message}`);
            }
        }
    }
    await screenshot(page, '8-after-download-click');

    // Look for any OTHER download UI element: Excel / CSV button elsewhere on the page.
    const otherDlInfo = await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('button, a, [class*="download"], [class*="export"]')) {
            const txt = (el.textContent || '').trim();
            if (!/excel|csv|xlsx|download/i.test(txt) || txt.length > 40) continue;
            out.push({
                tag: el.tagName,
                text: txt,
                cls: el.className?.toString?.().slice(0, 60) || '',
            });
        }
        return out;
    });
    log(`  other download ui: ${JSON.stringify(otherDlInfo)}`);

    // Also try CSV conversion if there's a separate button.
    const csvBtn = page.locator('button:has-text("CSV"), a:has-text("CSV")').first();
    if (await csvBtn.count().catch(() => 0)) {
        log('Trying CSV button');
        try {
            const [dl] = await Promise.all([
                page.waitForEvent('download', { timeout: 20000 }).catch(() => null),
                csvBtn.click({ timeout: 3000 }),
            ]);
            if (dl) log(`  CSV download fired: ${dl.suggestedFilename()}`);
            await page.waitForTimeout(3000);
        } catch (e) {
            log(`  CSV button failed: ${e.message}`);
        }
    }

    // Log the visible text of the Output page for diagnostic value.
    const bodyText = await page.textContent('body').catch(() => '');
    fs.writeFileSync(path.join(OUT_DIR, 'wizard-output-body.txt'), bodyText || '', 'utf8');
} catch (e) {
    summary.errors.push({ at: 'main', err: e.message, stack: e.stack });
    log(`FAIL: ${e.message}`);
    await screenshot(page, 'ERROR');
} finally {
    summary.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(OUT_DIR, 'wizard-summary.json'), JSON.stringify(summary, null, 2));
    trafficLog.end();
    await browser.close();
    log(`Done. ${summary.apiCalls} API calls captured, ${summary.downloads.length} download(s).`);
}

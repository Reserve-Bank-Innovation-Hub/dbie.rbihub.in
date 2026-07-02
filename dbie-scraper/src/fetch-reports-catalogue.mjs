// Enumerates every table in DBIE's Statistics tree by driving the SPA to each
// subsection and intercepting the dbie_getReportsDbie response. The catalogue
// endpoint is public; only the reports themselves sit behind SAP BOE auth.
//
// Output (reports-catalogue.json) looks like:
//   [
//     { "section": "Statistics", "category": "Corporate Sector", "subsection": "Finances of FDI Companies",
//       "groups": [
//         { "title": "...", "reports": [
//             { "reportName": "Statement 01: ...", "reportId": 12345, "frequency": "Annual", "from": "31-Mar-2013", "to": "31-Mar-2024", "raw": {...} },
//             ...
//         ] }
//       ] }
//   ]
//
// Usage:
//   node src/fetch-reports-catalogue.mjs                       # all Statistics subsections
//   node src/fetch-reports-catalogue.mjs --section Statistics
//   node src/fetch-reports-catalogue.mjs --sub "External Debt" # single subsection
//   node src/fetch-reports-catalogue.mjs --headful             # show browser

import { chromium } from 'playwright';
import fs from 'node:fs';

const argv = process.argv.slice(2);
const flag = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i+1] : null; };
const has  = n => argv.includes(n);

const filterSection = flag('--section') || 'Statistics';
const filterSub     = flag('--sub');
const headful       = has('--headful');

const OUT = 'reports-catalogue.json';

const decode = raw => raw
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

const log = msg => console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`);

async function captureReports(page, reportPath) {
    // Angular router chokes on '&', '#', '(', ')'. URL-encode each segment
    // independently so '/' is preserved as path separator.
    const encoded = reportPath
        .split('/')
        .map(seg => seg
            .replace(/&/g, '%26')
            .replace(/#/g, '%23')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29'))
        .join('/');
    const url = `https://data.rbi.org.in/DBIE/#${encoded}`;
    const waitReports = page.waitForResponse(
        r => r.url().endsWith('/dbie_getReportsDbie'),
        { timeout: 120000 },
    );
    // Full page reload so the SPA re-bootstraps a fresh session.
    await page.goto('about:blank').catch(() => {});
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const resp = await waitReports;
    const env = JSON.parse(decode(await resp.text()));
    if (env.header?.status !== 'success') throw new Error(`api: ${JSON.stringify(env.header)}`);
    return env.body?.reports || [];
}

function normaliseReport(r) {
    // Match what the website exposes: Table Name, Frequency, From, To.
    return {
        reportName : r.reportName || '',
        reportId   : r.reportId ?? null,
        frequency  : r.reportFreq || '',
        from       : r.fromdate || '',
        to         : r.todate || '',
        period     : r.reportPeriod || '',
        tableNo    : r.tableNo || '',
        section    : r.section || '',
        subSection : r.subSection || '',
    };
}

async function main() {
    const catalogue = JSON.parse(fs.readFileSync('catalogue.json', 'utf8'));
    const targets = [];
    for (const sec of catalogue) {
        if (filterSection && sec.section !== filterSection) continue;
        for (const cat of sec.categories) {
            for (const sub of cat.subsections) {
                if (filterSub && sub.subsection !== filterSub) continue;
                targets.push({
                    section: sec.section,
                    category: cat.category,
                    subsection: sub.subsection,
                    reportPath: sub.reportPath,
                });
            }
        }
    }
    log(`Planned: ${targets.length} subsection(s).`);

    const browser = await chromium.launch({ headless: !headful });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();

    const results = [];
    let ok = 0, failed = 0;
    try {
        for (let i = 0; i < targets.length; i++) {
            const t = targets[i];
            const prefix = `[${i+1}/${targets.length}] ${t.section}/${t.category}/${t.subsection}`;
            try {
                const rawGroups = await captureReports(page, t.reportPath);
                const groups = (rawGroups || []).map(g => ({
                    title: g.title || '',
                    reports: (g.subs || []).map(normaliseReport),
                }));
                const nReports = groups.reduce((n, g) => n + g.reports.length, 0);
                log(`${prefix} — ${groups.length} groups, ${nReports} reports`);
                results.push({ ...t, groups });
                ok++;
            } catch (e) {
                log(`${prefix} FAIL: ${e.message}`);
                results.push({ ...t, error: e.message });
                failed++;
            }
            // polite pause
            await page.waitForTimeout(800);
        }
    } finally {
        await browser.close();
    }

    fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
    const totalReports = results.reduce((n, r) => n + (r.groups?.reduce((m, g) => m + g.reports.length, 0) || 0), 0);
    log(`\nWrote ${OUT} — ${ok} ok, ${failed} failed, ${totalReports} reports total.`);
}

main().catch(e => { console.error(e); process.exit(1); });

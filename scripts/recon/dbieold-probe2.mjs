// Second pass: probe the direct statistics/publications URLs with Playwright
// so the TSPD JS challenge gets solved naturally. Capture whatever the real
// backend returns.

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('recon/output/dbieold');
fs.mkdirSync(OUT_DIR, { recursive: true });

const URLS = [
    { name: 'home',         url: 'https://dbieold.rbi.org.in/DBIE/dbie.rbi?site=home' },
    { name: 'publications', url: 'https://dbieold.rbi.org.in/DBIE/dbie.rbi?site=publications' },
    { name: 'statistics',   url: 'https://dbieold.rbi.org.in/DBIE/dbie.rbi?site=statistics' },
    { name: 'sitemap',      url: 'https://dbieold.rbi.org.in/DBIE/Sitemap.jsp' },
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
});
const page = await ctx.newPage();

const summary = [];
for (const t of URLS) {
    console.log(`\n=== ${t.name} — ${t.url}`);
    let lastStatus = null;
    const handler = r => { if (r.url() === t.url || r.url() === t.url + '/') lastStatus = r.status(); };
    page.on('response', handler);
    try {
        await page.goto(t.url, { waitUntil: 'networkidle', timeout: 60000 });
    } catch (e) {
        console.log(`  goto error: ${e.message}`);
    }
    // Let the TSPD challenge run.
    await page.waitForTimeout(10000);
    page.off('response', handler);

    const finalUrl = page.url();
    const title = await page.title().catch(() => '');
    const bodyText = await page.textContent('body').catch(() => '');
    const html = await page.content().catch(() => '');
    const links = await page.$$eval('a[href]', as =>
        as.map(a => ({ href: a.getAttribute('href') || '', text: (a.textContent || '').trim().slice(0, 80) }))
          .filter(l => l.href && !l.href.startsWith('javascript:'))
    ).catch(() => []);

    fs.writeFileSync(path.join(OUT_DIR, `${t.name}.html`), html);
    fs.writeFileSync(path.join(OUT_DIR, `${t.name}-body.txt`), bodyText || '');
    await page.screenshot({ path: path.join(OUT_DIR, `${t.name}.png`), fullPage: true }).catch(() => {});

    const row = {
        name: t.name,
        initialStatus: lastStatus,
        finalUrl,
        title,
        htmlBytes: html.length,
        bodyTextLen: (bodyText || '').length,
        linkCount: links.length,
        looksLikeTspdChallenge: /bobcmn|TSPD|challenge|support_id/.test(html),
        firstLinks: links.slice(0, 10),
    };
    summary.push(row);
    console.log(`  status=${lastStatus}  title="${title}"  size=${html.length}  links=${links.length}`);
    console.log(`  TSPD-challenge HTML: ${row.looksLikeTspdChallenge}`);
    console.log(`  body snippet: ${(bodyText || '').slice(0, 200).replace(/\s+/g, ' ')}`);
}

fs.writeFileSync(path.join(OUT_DIR, 'probe2-summary.json'), JSON.stringify(summary, null, 2));
await browser.close();
console.log(`\nSaved: ${OUT_DIR}/{home,publications,statistics,sitemap}.{html,txt,png}`);

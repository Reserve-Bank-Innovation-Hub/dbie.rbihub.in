// Probes the legacy DBIE portal (dbieold.rbi.org.in) to see what surface it offers
// and whether it's scrape-friendly.
//
// Captures:
//   - landing page HTML + screenshot
//   - all network traffic (URL, status, content-type, size)
//   - all <a href>, <iframe src>, <form action> links discovered
//   - whether the site is server-rendered (HTML in response) or client-side

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('recon/output/dbieold');
fs.mkdirSync(OUT_DIR, { recursive: true });

const START_URL = 'https://dbieold.rbi.org.in/';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
});
const page = await ctx.newPage();

const traffic = [];
page.on('response', r => {
    traffic.push({
        url: r.url(),
        status: r.status(),
        contentType: r.headers()['content-type'] || '',
        length: parseInt(r.headers()['content-length'] || '0', 10) || null,
    });
});

console.log(`Opening ${START_URL}`);
try {
    await page.goto(START_URL, { waitUntil: 'networkidle', timeout: 60000 });
} catch (e) {
    console.log(`  goto error: ${e.message}`);
}
await page.waitForTimeout(5000);

const finalUrl = page.url();
console.log(`Final URL after redirects: ${finalUrl}`);

const title = await page.title().catch(() => '');
const bodyText = await page.textContent('body').catch(() => '');
const html = await page.content().catch(() => '');

await page.screenshot({ path: path.join(OUT_DIR, 'landing.png'), fullPage: true }).catch(() => {});
fs.writeFileSync(path.join(OUT_DIR, 'landing.html'), html);
fs.writeFileSync(path.join(OUT_DIR, 'landing-body.txt'), bodyText || '');
fs.writeFileSync(path.join(OUT_DIR, 'traffic.json'), JSON.stringify(traffic, null, 2));

// Enumerate all links visible on the page.
const links = await page.$$eval('a, iframe, form', els =>
    els.map(el => ({
        tag: el.tagName,
        href: el.getAttribute('href') || el.getAttribute('src') || el.getAttribute('action') || '',
        text: (el.textContent || '').trim().slice(0, 100),
    })).filter(l => l.href)
).catch(() => []);
fs.writeFileSync(path.join(OUT_DIR, 'links.json'), JSON.stringify(links, null, 2));

console.log(`\nTitle: ${title}`);
console.log(`Body text length: ${(bodyText || '').length} chars`);
console.log(`HTML size: ${html.length} chars`);
console.log(`Network requests captured: ${traffic.length}`);
console.log(`Links / iframes / forms discovered: ${links.length}`);
console.log(`\nFirst 20 links:`);
for (const l of links.slice(0, 20)) {
    console.log(`  [${l.tag}] ${l.href.slice(0, 100)}  "${l.text.slice(0, 50)}"`);
}
console.log(`\nFirst 20 network responses:`);
for (const t of traffic.slice(0, 20)) {
    console.log(`  ${t.status}  ${t.contentType.slice(0, 30).padEnd(30)}  ${t.url.slice(0, 90)}`);
}

await browser.close();
console.log(`\nArtefacts written to ${OUT_DIR}/`);

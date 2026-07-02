import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

const events = [];
page.on('request', r => {
    if (/CIMS_Gateway/.test(r.url()) || r.url().endsWith('/dbie_getReportsDbie')) {
        const name = r.url().split('/').pop();
        events.push({ t: Date.now(), kind: 'req', name, body: r.postData()?.slice(0, 200) || '' });
    }
});
page.on('response', r => {
    if (/CIMS_Gateway/.test(r.url()) || r.url().endsWith('/dbie_getReportsDbie')) {
        const name = r.url().split('/').pop();
        events.push({ t: Date.now(), kind: 'res', name, status: r.status() });
    }
});
page.on('pageerror', e => events.push({ t: Date.now(), kind: 'err', msg: e.message }));
page.on('console', msg => { if (msg.type() === 'error') events.push({ t: Date.now(), kind: 'console', msg: msg.text().slice(0, 120) }); });

const url = 'https://data.rbi.org.in/DBIE/#/dbie/reports/Statistics/Public Finance/Central & State Govt. Finance (Combined)';
console.log(`Going to: ${url}`);
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('goto err:', e.message));
await page.waitForTimeout(15000);

console.log('\nCaptured events:');
for (const e of events) {
    if (e.kind === 'req') console.log(`  REQ  ${e.name}  ${e.body.slice(0, 80)}`);
    else if (e.kind === 'res') console.log(`  RES  ${e.name}  ${e.status}`);
    else console.log(`  ${e.kind.toUpperCase()}  ${e.msg}`);
}
console.log(`\nTotal events: ${events.length}`);
console.log(`getReportsDbie calls: ${events.filter(e => e.name === 'dbie_getReportsDbie').length}`);

// Also check the page's visible heading to see what the SPA actually rendered.
const heading = await page.locator('h1, h2, h3').first().textContent().catch(() => '');
console.log(`\nPage heading: ${heading?.trim()}`);

await browser.close();

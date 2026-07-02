// Probe: what date format does the Daily-frequency picker accept?
// Target: FOREX_RATE_D_RN (Daily).
//
// Strategy: open the wizard, pick FOREX_RATE_D_RN, advance to the Frequency step,
// click the From-Date input and inspect the calendar widget's expected format.
// Also try clicking a date in the calendar and reading the field's resulting value.

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('recon/output/daily-probe');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await ctx.newPage();

console.log('Opening wizard…');
await page.goto('https://data.rbi.org.in/DBIE/#/dbie/dataquery_enhanced', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(5000);

// Navigate: Financial Market → Forex Market → FOREX_RATE_D_RN
await page.getByText('Financial Markets', { exact: true }).first().click();
await page.waitForTimeout(1500);
await page.getByText('Forex Market', { exact: true }).first().click();
await page.waitForTimeout(1500);
await page.locator('label:has-text("FOREX_RATE_D_RN")').first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, '1-element-selected.png'), fullPage: true });

await page.locator('button:has-text("Next")').first().click();
await page.waitForTimeout(3500);
await page.screenshot({ path: path.join(OUT, '2-frequency-step.png'), fullPage: true });

// Inspect the date inputs: placeholder, mask, readonly, type, maxlength
const inputInfo = await page.evaluate(() => {
    const out = [];
    for (const ph of ['Select From Date', 'Select To Date']) {
        const el = document.querySelector(`input[placeholder="${ph}"]`);
        if (!el) { out.push({ ph, missing: true }); continue; }
        out.push({
            ph,
            type: el.type,
            value: el.value,
            readonly: el.readOnly,
            disabled: el.disabled,
            maxLength: el.maxLength,
            mask: el.getAttribute('mask') || el.getAttribute('data-mask') || null,
            placeholder: el.placeholder,
            outerHTML: el.outerHTML.slice(0, 250),
        });
    }
    return out;
});
console.log('Inputs:', JSON.stringify(inputInfo, null, 2));
fs.writeFileSync(path.join(OUT, 'inputs.json'), JSON.stringify(inputInfo, null, 2));

// Open the calendar on From-Date
await page.evaluate(() => {
    document.querySelectorAll('input[placeholder="Select From Date"],input[placeholder="Select To Date"]')
        .forEach(el => { el.readOnly = false; el.removeAttribute('readonly'); });
});
await page.locator('input[placeholder="Select From Date"]').first().click();
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(OUT, '3-calendar-open.png'), fullPage: true });

// If a datepicker popup appeared, scrape any visible grid cells with date numbers
const calendarInfo = await page.evaluate(() => {
    const popup = document.querySelector('.bs-datepicker, ngx-mat-datepicker, mat-calendar, [class*="datepicker"], [class*="DatePicker"]');
    if (!popup) return { found: false };
    return {
        found: true,
        classList: popup.className,
        childText: popup.textContent?.slice(0, 400),
        html: popup.outerHTML.slice(0, 1500),
    };
});
console.log('Calendar popup:', JSON.stringify(calendarInfo, null, 2));
fs.writeFileSync(path.join(OUT, 'calendar.json'), JSON.stringify(calendarInfo, null, 2));

// Try several date format guesses on the From input by typing.
// After each attempt, read back the input value to see what the form interprets.
const FORMATS_TO_TRY = [
    '15-08-2024',      // DD-MM-YYYY
    '08-15-2024',      // MM-DD-YYYY
    '2024-08-15',      // YYYY-MM-DD
    '15/08/2024',      // DD/MM/YYYY
    '08/15/2024',      // MM/DD/YYYY
    '15.08.2024',      // DD.MM.YYYY
];

const results = [];
for (const fmt of FORMATS_TO_TRY) {
    await page.evaluate(ph => {
        const el = document.querySelector(`input[placeholder="${ph}"]`);
        if (el) el.value = '';
    }, 'Select From Date');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const input = page.locator('input[placeholder="Select From Date"]').first();
    await input.click();
    await page.waitForTimeout(400);
    await page.keyboard.type(fmt, { delay: 40 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(600);
    const readback = await page.evaluate(ph => {
        const el = document.querySelector(`input[placeholder="${ph}"]`);
        return el?.value || '';
    }, 'Select From Date');
    results.push({ typed: fmt, readback });
    console.log(`  typed ${fmt.padEnd(12)}  →  readback="${readback}"`);
}
fs.writeFileSync(path.join(OUT, 'format-trials.json'), JSON.stringify(results, null, 2));

// Definitive test: click a specific day on the calendar widget and read back.
// This is what the wizard itself generates when the user interacts naturally.
await page.evaluate(ph => {
    const el = document.querySelector(`input[placeholder="${ph}"]`);
    if (el) el.value = '';
}, 'Select From Date');
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await page.locator('input[placeholder="Select From Date"]').first().click();
await page.waitForTimeout(1200);
// Go back 3 months to ensure past date (safe for Daily series)
for (let i = 0; i < 3; i++) {
    await page.locator('.datepicker .prev').first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(200);
}
// Click day '15' on whatever month the widget now shows
await page.locator('.datepicker td.day', { hasText: /^15$/ }).first().click({ timeout: 3000 }).catch(() => {});
await page.waitForTimeout(800);

const canonical = await page.evaluate(ph => {
    const el = document.querySelector(`input[placeholder="${ph}"]`);
    return el?.value || '';
}, 'Select From Date');
console.log(`\nCanonical format emitted by calendar click: "${canonical}"`);
fs.writeFileSync(path.join(OUT, 'canonical-format.json'), JSON.stringify({ canonical }, null, 2));

await browser.close();
console.log(`\nArtefacts in ${OUT}/`);

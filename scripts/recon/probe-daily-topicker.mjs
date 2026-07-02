// Focused probe: inspect the TO datepicker for FOREX_RATE_D_RN.
// We know: From commits fine; To auto-prefills to from-month's last day; typing
// into To does not update the Angular model (query still returns 1 month); the
// Impala payload encrypts fromDate/toDate so we can't read them. Question: what
// constrains To, and what interaction actually moves the To model forward?
//
// This probe:
//   1. Select element → dates step.
//   2. Set From via calendar to 01-01-2024.
//   3. Open the To picker and dump: switch label, is .next disabled?, the popup
//      HTML, and any max/endDate hints. Screenshot.
//   4. Try to navigate To forward one month via .next and report if it moved.
//   5. Also inspect what Angular events exist on the To input (oninput vs the
//      datepicker changeDate wiring) by dumping listeners we can detect.

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const WIZARD_URL = 'https://data.rbi.org.in/DBIE/#/dbie/dataquery_enhanced';
const OUT = path.resolve('recon/output/daily-range');
fs.mkdirSync(OUT, { recursive: true });
const log = m => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

async function dismissModal(page) {
    try {
        const seen = await page.evaluate(() => {
            const backdrop = document.querySelector('.modal-backdrop.show');
            const dialog = [...document.querySelectorAll('.modal, [class*="modal"]')]
                .find(m => m.offsetParent !== null && /currently unavailable|high load on the system/i.test(m.innerText || ''));
            return { hasBackdrop: !!backdrop, highLoad: !!dialog };
        });
        if (!seen.hasBackdrop && !seen.highLoad) return false;
        const ok = page.locator('button:has-text("OK")').first();
        if (await ok.count()) await ok.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(800);
        return true;
    } catch { return false; }
}

async function reset(page) {
    for (let i = 0; i < 5; i++) {
        await page.goto('about:blank').catch(() => {});
        await page.goto(WIZARD_URL, { waitUntil: 'networkidle', timeout: 90000 });
        await page.waitForTimeout(4000);
        await dismissModal(page);
        const blocked = await page.evaluate(() => !!document.querySelector('.modal-backdrop.show'));
        if (!blocked) return;
        log(`  reset attempt ${i + 1}: backdrop present, retrying`);
        await page.waitForTimeout(2500);
    }
}

function dumpPicker(page, tag) {
    return page.evaluate((tag) => {
        // The currently visible bootstrap-datepicker popup.
        const pops = [...document.querySelectorAll('.datepicker.datepicker-dropdown')]
            .filter(p => p.offsetParent !== null || /display:\s*block/.test(p.getAttribute('style') || ''));
        const p = pops[0];
        if (!p) return { tag, found: false };
        const sw = p.querySelector('.datepicker-days .datepicker-switch, .datepicker-switch');
        const nextTh = p.querySelector('.datepicker-days .next, .next');
        const prevTh = p.querySelector('.datepicker-days .prev, .prev');
        return {
            tag,
            found: true,
            switchLabel: sw ? sw.textContent.trim() : null,
            nextDisabled: nextTh ? nextTh.className.includes('disabled') : null,
            prevDisabled: prevTh ? prevTh.className.includes('disabled') : null,
            html: p.outerHTML.slice(0, 1200),
        };
    }, tag);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await ctx.newPage();
const out = {};
try {
    log('reset + select element');
    await reset(page);
    await page.getByText('Financial Markets', { exact: true }).first().click({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.getByText('Forex Market', { exact: true }).first().click({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.locator('label:has-text("FOREX_RATE_D_RN")').first().click({ timeout: 5000 });
    await page.waitForTimeout(1200);
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(2500);

    await page.evaluate(() => {
        document.querySelectorAll('input[placeholder="Select From Date"],input[placeholder="Select To Date"]')
            .forEach(el => { el.readOnly = false; el.removeAttribute('readonly'); });
    });

    // --- Inspect FROM picker first ---
    await page.locator('input[placeholder="Select From Date"]').first().click();
    await page.waitForTimeout(800);
    out.fromPickerInitial = await dumpPicker(page, 'from-initial');
    log(`FROM picker: switch=${out.fromPickerInitial.switchLabel} nextDisabled=${out.fromPickerInitial.nextDisabled} prevDisabled=${out.fromPickerInitial.prevDisabled}`);
    await page.screenshot({ path: path.join(OUT, 'F-from-picker.png') }).catch(() => {});
    // Navigate From back to Jan 2024 and click day 1.
    for (let i = 0; i < 60; i++) {
        const cur = await page.evaluate(() => {
            const sw = document.querySelector('.datepicker.datepicker-dropdown .datepicker-switch');
            return sw ? sw.textContent.trim() : null;
        });
        if (!cur || cur === 'January 2024') break;
        await page.locator('.datepicker.datepicker-dropdown .prev').first().click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(120);
    }
    await page.locator('.datepicker.datepicker-dropdown td.day:not(.old):not(.new)', { hasText: /^1$/ }).first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(800);
    const fromVal = await page.evaluate(() => document.getElementById('startDaily')?.value);
    log(`FROM set to: "${fromVal}"`);
    out.fromVal = fromVal;

    // --- Now open the TO picker and inspect it ---
    await page.locator('input[placeholder="Select To Date"]').first().click();
    await page.waitForTimeout(1000);
    out.toPickerInitial = await dumpPicker(page, 'to-initial');
    log(`TO picker: switch=${out.toPickerInitial.switchLabel} nextDisabled=${out.toPickerInitial.nextDisabled} prevDisabled=${out.toPickerInitial.prevDisabled}`);
    await page.screenshot({ path: path.join(OUT, 'F-to-picker-open.png') }).catch(() => {});

    // Try clicking .next a few times and see if the switch label advances.
    const labels = [out.toPickerInitial.switchLabel];
    for (let i = 0; i < 5; i++) {
        const before = await page.evaluate(() => document.querySelector('.datepicker.datepicker-dropdown .datepicker-switch')?.textContent.trim());
        await page.locator('.datepicker.datepicker-dropdown .next').first().click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(200);
        const after = await page.evaluate(() => document.querySelector('.datepicker.datepicker-dropdown .datepicker-switch')?.textContent.trim());
        labels.push(after);
        if (before === after) { log(`  TO .next stuck at "${after}" (step ${i + 1})`); break; }
    }
    out.toNextProgression = labels;
    log(`TO .next progression: ${JSON.stringify(labels)}`);
    await page.screenshot({ path: path.join(OUT, 'F-to-picker-after-next.png') }).catch(() => {});

    // Try the datepicker-switch (month→year→decade zoom-out) then pick 2026.
    await page.evaluate(() => { const el = document.getElementById('endDaily'); if (el) el.blur?.(); });
    await page.locator('input[placeholder="Select To Date"]').first().click();
    await page.waitForTimeout(600);
    // Click the switch to zoom to months view, then again to years view.
    await page.locator('.datepicker.datepicker-dropdown .datepicker-switch').first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(300);
    await page.locator('.datepicker.datepicker-dropdown .datepicker-switch').first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(300);
    out.toPickerZoomOut = await dumpPicker(page, 'to-zoomout');
    await page.screenshot({ path: path.join(OUT, 'F-to-picker-zoomout.png') }).catch(() => {});
    log(`TO zoom-out view switch=${out.toPickerZoomOut.switchLabel} nextDisabled=${out.toPickerZoomOut.nextDisabled}`);
} catch (e) {
    out.error = e.message;
    log(`ERROR: ${e.message}`);
} finally {
    fs.writeFileSync(path.join(OUT, 'topicker-findings.json'), JSON.stringify(out, null, 2));
    await browser.close();
    log(`Wrote topicker-findings.json`);
}

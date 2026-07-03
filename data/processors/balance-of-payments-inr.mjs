// balance-of-payments-inr.mjs — India's overall balance of payments (₹ crore)
// Source: Table 41 of the Monthly RBI Bulletin.
//
// Currency twin of Table 40 (balance-of-payments-usd.mjs). The parsing approach
// is identical; only the source file and the unit string differ.
//
// Workbook layout (two sheets):
//   Sheet 0 "1990-91 Q1 to 1999-00 Q4"  — 1990-91:Q1 → 1999-00:Q4, 42 item columns
//   Sheet 1 "2000-01 Q1 Onwards "        — 2025-26:Q3 → 2000-01:Q1 (newest-first),
//     60 item columns (extended FDI/portfolio/services sub-breakdown)
//
// Row structure: identical to Table 40 — header at row 5, data from row 6;
// each quarter has Credit / Debit / Net rows; period label on Credit row only.
//
// Output shape:
//   {
//     reportTitle : string,
//     unit        : string,               // "₹ crore"
//     items       : BoPItem[],
//     periods     : string[],             // newest-first
//     data        : BoPEntry[],
//   }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRC = path.join(
    __dirname,
    '..', 'publications', 'monthly-rbi-bulletin', 'external-sector',
    'table-41-indias-overall-balance-of-payments-rupees-crore.xlsx',
);
const OUT = path.join(__dirname, 'out', 'balance-of-payments-inr.json');

const REPORT_TITLE = 'Balance of payments — ₹ crore (Table 41)';

// "-", blank, null → null; otherwise parse as number (strip commas).
function parseValue(raw) {
    if (raw == null) return null;
    const s = String(raw).trim().replaceAll(',', '');
    if (s === '' || s === '-') return null;
    const n = Number(s);
    return Number.isNaN(n) ? null : n;
}

// Split a header like "1.2.1 Services" into { code, label }.
// "Overall Balance of Payments (1+2+3)" → code "0".
// "B.1.b) Foreign Investment Abroad" (sheet 0 legacy) → synthetic code.
function parseItemHeader(raw) {
    const text = String(raw).trim();
    const m = text.match(/^(\d+(?:\.\d+)*)\s+(.*)/);
    if (m) {
        return { code: m[1], label: m[2].trim() };
    }
    if (/^Overall Balance/.test(text)) {
        return { code: '0', label: text };
    }
    if (/^B\.1\.b\)/.test(text)) {
        return { code: '2.1.1.2_legacy', label: 'Foreign Investment Abroad' };
    }
    return { code: text, label: text };
}

function parentCode(code) {
    if (code === '0') return null;
    const idx = code.lastIndexOf('.');
    return idx === -1 ? '0' : code.slice(0, idx);
}

function parseSheet(ws) {
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

    const hdr = rows[5] || [];
    const items = [];
    for (let c = 3; c < hdr.length; c++) {
        const cell = hdr[c];
        if (cell == null || String(cell).trim() === '') continue;
        const { code, label } = parseItemHeader(cell);
        items.push({ col: c, code, label, parent: parentCode(code) });
    }

    const entries = [];
    let currentPeriod = null;

    for (let r = 6; r < rows.length; r++) {
        const row = rows[r] || [];

        const periodCell = row[1] != null ? String(row[1]).trim() : '';
        if (/^\d{4}-\d{2}:Q\d$/.test(periodCell)) {
            currentPeriod = periodCell;
        }

        const typeCell = row[2] != null ? String(row[2]).trim() : '';
        if (typeCell !== 'Credit' && typeCell !== 'Debit' && typeCell !== 'Net') continue;
        if (!currentPeriod) continue;

        const values = items.map((item) => parseValue(row[item.col]));
        entries.push({ period: currentPeriod, type: typeCell, values });
    }

    return { items, entries };
}

function buildCanonicalItems(items1) {
    return items1.map(({ col: _col, ...rest }) => rest);
}

function projectEntries(sheet0Entries, sheet0Items, canonicalItems) {
    const codeToCanonIdx = new Map(canonicalItems.map((item, i) => [item.code, i]));
    const nCols = canonicalItems.length;

    return sheet0Entries.map(({ period, type, values: srcVals }) => {
        const projected = new Array(nCols).fill(null);
        sheet0Items.forEach((item, si) => {
            const ci = codeToCanonIdx.get(item.code);
            if (ci != null) projected[ci] = srcVals[si];
        });
        return { period, type, values: projected };
    });
}

function main() {
    const wb = XLSX.read(fs.readFileSync(SRC), { type: 'buffer' });

    if (wb.SheetNames.length < 2) {
        throw new Error(`expected 2 sheets, found ${wb.SheetNames.length}`);
    }

    const sheet0 = parseSheet(wb.Sheets[wb.SheetNames[0]]);
    const sheet1 = parseSheet(wb.Sheets[wb.SheetNames[1]]);

    const canonicalItems = buildCanonicalItems(sheet1.items);
    const sheet0Projected = projectEntries(sheet0.entries, sheet0.items, canonicalItems);

    // Sheet 1 is newest-first; sheet 0 is oldest-first, so reverse it before appending.
    const allEntries = [
        ...sheet1.entries,
        ...sheet0Projected.slice().reverse(),
    ];

    // Deduplicate: first occurrence wins (sheet 1 is more detailed for any overlap).
    const seen = new Set();
    const deduped = allEntries.filter(({ period, type }) => {
        const key = `${period}|${type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Extract period labels in order from Credit rows.
    const periods = [];
    const seenPeriods = new Set();
    for (const e of deduped) {
        if (e.type === 'Credit' && !seenPeriods.has(e.period)) {
            periods.push(e.period);
            seenPeriods.add(e.period);
        }
    }

    const result = {
        reportTitle : REPORT_TITLE,
        unit        : '₹ crore',
        items       : canonicalItems,
        periods,
        data        : deduped,
    };

    fs.writeFileSync(OUT, JSON.stringify(result));

    const sizeMB = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
    console.log(
        `wrote ${periods.length} quarters × ${canonicalItems.length} items ` +
        `→ ${OUT} (${sizeMB} MB)`,
    );

    selfCheck(result);
    console.log('self-check passed');
}

// ---------------------------------------------------------------------------
// Self-check: three hard-coded cell assertions per sheet, plus shape checks.
// ---------------------------------------------------------------------------

function fail(msg) {
    console.error(`SELF-CHECK FAILED: ${msg}`);
    process.exit(1);
}

function selfCheck(result) {
    const { items, periods, data } = result;

    if (!Array.isArray(items) || items.length === 0) fail('items array is empty');
    if (!Array.isArray(periods) || periods.length === 0) fail('periods array is empty');
    if (!Array.isArray(data) || data.length === 0) fail('data array is empty');

    const periodSet = new Set(periods);
    if (periodSet.size !== periods.length) fail('duplicate period labels in periods array');

    const typesPerPeriod = new Map();
    for (const e of data) {
        if (!typesPerPeriod.has(e.period)) typesPerPeriod.set(e.period, new Set());
        typesPerPeriod.get(e.period).add(e.type);
    }
    for (const [p, types] of typesPerPeriod) {
        if (types.size !== 3) {
            fail(`period ${p} has ${types.size} transaction types, expected 3`);
        }
    }

    const codeIdx = new Map(items.map((item, i) => [item.code, i]));
    function assertCell(period, type, code, expected, label) {
        const entry = data.find((e) => e.period === period && e.type === type);
        if (!entry) fail(`entry for (${period}, ${type}) not found — ${label}`);
        const idx = codeIdx.get(code);
        if (idx == null) fail(`item code "${code}" not found — ${label}`);
        const got = entry.values[idx];
        if (got !== expected) fail(`${label}: expected ${expected}, got ${got}`);
    }

    // Sheet 0 assertions (values read from workbook at inspection time).
    // 1990-91:Q1 Credit: Overall BoP (code "0") = 20476
    assertCell('1990-91:Q1', 'Credit', '0', 20476,
        '1990-91:Q1 Credit overall BoP');
    // 1990-91:Q1 Credit: Current Account (code "1") = 11071
    assertCell('1990-91:Q1', 'Credit', '1', 11071,
        '1990-91:Q1 Credit current account');
    // 1990-91:Q1 Credit: Merchandise (code "1.1") = 7477
    assertCell('1990-91:Q1', 'Credit', '1.1', 7477,
        '1990-91:Q1 Credit merchandise');

    // Sheet 1 assertions (values read from workbook at inspection time).
    // 2000-01:Q1 Credit: Overall BoP = 134419, Merchandise = 46529
    assertCell('2000-01:Q1', 'Credit', '0', 134419,
        '2000-01:Q1 Credit overall BoP (sheet 1)');
    assertCell('2000-01:Q1', 'Credit', '1.1', 46529,
        '2000-01:Q1 Credit merchandise (sheet 1)');
    // 2025-26:Q3 Credit: Current Account = 2449348.24549427
    assertCell('2025-26:Q3', 'Credit', '1', 2449348.24549427,
        '2025-26:Q3 Credit current account');
}

main();

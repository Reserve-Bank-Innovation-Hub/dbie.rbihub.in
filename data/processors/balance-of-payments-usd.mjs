// balance-of-payments-usd.mjs — India's overall balance of payments (US$ million)
// Source: Table 40 of the Monthly RBI Bulletin.
//
// Workbook layout (two sheets):
//   Sheet 0 "1990-91 Q1 to 1999-00 Q4"  — 1990-91:Q1 → 1999-00:Q4, 45 item columns
//     (rows newest-to-oldest within each FY due to source format; we store as-found)
//   Sheet 1 "2000-01 Q1 Onwards"         — 2025-26:Q3 → 2000-01:Q1 (newest-first),
//     62 item columns (adds sub-breakdown for Miscellaneous services, FDI components,
//     Portfolio investment sub-items; sheet 2 also overlaps 2000-01 to 2013-14 with
//     sheet 0 — we use sheet 0 for 1990-2000 only and sheet 1 for 2000 onwards)
//
// Row structure (both sheets):
//   row 0        blank
//   row 1        report title
//   row 2        blank
//   row 3        unit  "(US$ Millions)"
//   row 4        blank
//   row 5        header row: col 1 = "Year/Quarter", col 2 = "Transaction Type",
//                            col 3+ = BoP item labels with numeric code prefix
//   row 6+       data rows: each quarter has exactly 3 consecutive rows:
//                  Credit, Debit, Net (col 1 carries the quarter label on the
//                  first/Credit row only; Debit and Net rows have null in col 1)
//
// The quarter label format is "YYYY-YY:QN" (e.g. "2025-26:Q3").
// A "-" string or null in a value cell → null in JSON.
//
// Output shape:
//   {
//     reportTitle : string,
//     unit        : string,               // "US$ millions"
//     items       : BoPItem[],            // ordered list of all BoP items
//     periods     : string[],             // quarter labels, newest-first across both sheets
//     data        : BoPEntry[],           // one entry per (period, transactionType) triplet
//   }
//
//   BoPItem  = { code: string, label: string, parent: string|null }
//   BoPEntry = { period: string, type: "Credit"|"Debit"|"Net",
//                values: (number|null)[] }  // aligned to items[]

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRC = path.join(
    __dirname,
    '..', 'publications', 'monthly-rbi-bulletin', 'external-sector',
    'table-40-indias-overall-balance-of-payments-us-million.xlsx',
);
const OUT = path.join(__dirname, 'out', 'balance-of-payments-usd.json');

const REPORT_TITLE = 'Balance of payments — US$ million (Table 40)';

// "-", blank, null → null; otherwise parse as number (strip commas).
function parseValue(raw) {
    if (raw == null) return null;
    const s = String(raw).trim().replaceAll(',', '');
    if (s === '' || s === '-') return null;
    const n = Number(s);
    return Number.isNaN(n) ? null : n;
}

// Split a header like "1.2.1 Services" into code + label.
// The code is the leading dotted-number token; the rest is the label.
// Some headers like "Overall Balance of Payments (1+2+3)" have no leading code —
// we assign code "0" for the overall total.
// "B.1.b) Foreign Investment Abroad" is an odd legacy label in sheet 0; treat it
// as a leaf under 2.1 with a synthetic code.
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
        // Legacy label present only in sheet 0 for "Foreign Investment Abroad"
        return { code: '2.1.1.2_legacy', label: 'Foreign Investment Abroad' };
    }
    return { code: text, label: text };
}

function parentCode(code) {
    if (code === '0') return null;
    const idx = code.lastIndexOf('.');
    return idx === -1 ? '0' : code.slice(0, idx);
}

// Parse one sheet. Returns { items, entries } where entries are ordered
// newest-first (as they appear in the source for sheet 1) or oldest-first
// (sheet 0).
function parseSheet(ws) {
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

    // Header row is row 5 (index 5).
    const hdr = rows[5] || [];
    // Items start at col 3 (0-indexed).
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

        // Period label appears only on Credit row; carry forward for Debit and Net.
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

// Merge items from two sheets into a canonical ordered list. The two sheets have
// different column sets (sheet 0 is a reduced layout). We use sheet 1's items as
// the canonical set (it is a superset) and map sheet 0 items into it by code,
// filling unmapped positions with null.
function buildCanonicalItems(items1) {
    return items1.map(({ col: _col, ...rest }) => rest);
}

// For sheet 0 entries, project their values into the canonical item order.
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

    // Canonical items come from sheet 1 (the superset schema).
    const canonicalItems = buildCanonicalItems(sheet1.items);

    // Sheet 1: entries are newest-first (2025-26:Q3 down to 2000-01:Q1).
    // Sheet 0: entries run 1990-91:Q1 to 1999-00:Q4 (oldest-first); project and append.
    const sheet0Projected = projectEntries(sheet0.entries, sheet0.items, canonicalItems);

    // Final period list: sheet 1 (newest-first) then sheet 0 reversed to give
    // oldest-to-newest continuation — but we want the full list newest-first,
    // so we reverse sheet 0 and place it at the end.
    const allEntries = [
        ...sheet1.entries,
        ...sheet0Projected.slice().reverse(),
    ];

    // Deduplicate: sheet 1 may contain some 2000-01 to 2013-14 overlap with sheet 0.
    // We keep only the first occurrence (sheet 1 takes precedence as more detailed).
    const seen = new Set();
    const deduped = allEntries.filter(({ period, type }) => {
        const key = `${period}|${type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Extract unique period labels (Credit rows only, in order).
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
        unit        : 'US$ millions',
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
// Self-check: fail loudly on unexpected shapes or drifted known-cell values.
// Three assertions per sheet read straight off the workbook at inspection time.
// ---------------------------------------------------------------------------

function fail(msg) {
    console.error(`SELF-CHECK FAILED: ${msg}`);
    process.exit(1);
}

function selfCheck(result) {
    const { items, periods, data } = result;

    // Basic shape.
    if (!Array.isArray(items) || items.length === 0) fail('items array is empty');
    if (!Array.isArray(periods) || periods.length === 0) fail('periods array is empty');
    if (!Array.isArray(data) || data.length === 0) fail('data array is empty');

    // Periods must be unique.
    const periodSet = new Set(periods);
    if (periodSet.size !== periods.length) fail('duplicate period labels in periods array');

    // Each quarter should have exactly 3 entries (Credit / Debit / Net).
    const typesPerPeriod = new Map();
    for (const e of data) {
        if (!typesPerPeriod.has(e.period)) typesPerPeriod.set(e.period, new Set());
        typesPerPeriod.get(e.period).add(e.type);
    }
    for (const [p, types] of typesPerPeriod) {
        if (types.size !== 3) {
            fail(`period ${p} has ${types.size} transaction types, expected 3 (${[...types].join(', ')})`);
        }
    }

    // Helper: find an entry by (period, type) and check item value at given code.
    const codeIdx = new Map(items.map((item, i) => [item.code, i]));
    function assertCell(period, type, code, expected, label) {
        const entry = data.find((e) => e.period === period && e.type === type);
        if (!entry) fail(`entry for (${period}, ${type}) not found — ${label}`);
        const idx = codeIdx.get(code);
        if (idx == null) fail(`item code "${code}" not found — ${label}`);
        const got = entry.values[idx];
        if (got !== expected) fail(`${label}: expected ${expected}, got ${got}`);
    }

    // Sheet 0 assertions — values read from workbook at inspection time.
    // 1990-91:Q1 Credit: col3 (Overall BoP, code "0") = 11410
    assertCell('1990-91:Q1', 'Credit', '0', 11410,
        '1990-91:Q1 Credit overall BoP');
    // 1990-91:Q1 Credit: code "1" (Current Account) = 6170
    assertCell('1990-91:Q1', 'Credit', '1', 6170,
        '1990-91:Q1 Credit current account');
    // 1990-91:Q1 Credit: code "1.1" (Merchandise) = 4168
    assertCell('1990-91:Q1', 'Credit', '1.1', 4168,
        '1990-91:Q1 Credit merchandise');

    // Sheet 1 assertions — values read from workbook at inspection time.
    // 2000-01:Q1 Credit: Overall BoP = 30478, Merchandise = 10550
    assertCell('2000-01:Q1', 'Credit', '0', 30478,
        '2000-01:Q1 Credit overall BoP (sheet 1)');
    assertCell('2000-01:Q1', 'Credit', '1.1', 10550,
        '2000-01:Q1 Credit merchandise (sheet 1)');
    // 2025-26:Q3 Credit: Current Account = 274864.568555786
    assertCell('2025-26:Q3', 'Credit', '1', 274864.568555786,
        '2025-26:Q3 Credit current account');
}

main();

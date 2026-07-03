// Processor: net-state-domestic-product-state-wise-at-current-prices (annual).
//
// Source xlsx — "Net State Domestic Product - State-wise (At Current Prices).xlsx"
// — contains one sheet ("Report 1") with five sub-tables stacked vertically, each
// covering a different base year. Only the first sub-table (Base Year: 2011-12) is
// emitted; it spans 2011-12 to 2024-25 (14 years, newest-first).
//
// Sheet layout (0-indexed rows):
//   row 0         blank
//   row 1 (col 1) report title
//   row 3 (col 1) "Base Year : 2011-12"
//   row 5 (col 1) "(Rupees Crores)"
//   row 7         header: col[1]="Year", col[2]="Andhra Pradesh", …, col[33]="Delhi"
//   row 8         column-number labels (skipped)
//   rows 9–…      data rows, newest-first — stop when col[1] matches /Base Year/i
//
// Values in this file are decimal strings (e.g. "1267396.415") — no commas.
//
// Emits:
//   out/net-state-domestic-product-state-wise-at-current-prices.json
//   {
//     reportTitle : string,
//     baseYear    : string,
//     unit        : string,
//     years       : string[],
//     states      : string[],
//     data        : Record<string, (number | null)[]>,
//   }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const XLSX_SRC = path.join(
    __dirname,
    '../publications/handbook-statistics-on-indian-economy/annual-series/national-income-saving-employment',
    'Net State Domestic Product - State-wise (At Current Prices).xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Handles both integer-formatted ("698,187") and decimal ("1267396.415") values.
// Returns null for blank / dash / unparseable.
function parseNum(s) {
    if (s == null) return null;
    const t = String(s).trim().replace(/,/g, '');
    if (t === '' || t === '-' || t === 'N/A') return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
}

function cellStr(row, i) {
    const v = row[i];
    return v == null ? '' : String(v).trim();
}

function parse(buf) {
    const wb = XLSX.read(buf, { type: 'buffer' });
    if (wb.SheetNames.length === 0) throw new Error('no sheets in workbook');

    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, {
        header   : 1,
        raw      : false,
        defval   : null,
        blankrows: true,
    });

    // Locate the Year header row within the first 12 rows.
    let headerRow = -1;
    let states = [];

    for (let i = 0; i < Math.min(rows.length, 12); i++) {
        const c1 = cellStr(rows[i] || [], 1);
        if (/^Year$/i.test(c1) || /^STATE\s*\/\s*UNION/i.test(c1)) {
            headerRow = i;
            states = (rows[i] || []).slice(2).filter((v) => v != null && !/^\d+$/.test(String(v).trim())).map(String);
            break;
        }
    }

    if (headerRow < 0) throw new Error('could not locate the Year header row');
    if (states.length === 0) throw new Error('no state columns found');

    const stateCount = states.length;
    const years = [];
    const rawValues = {};
    states.forEach((s) => { rawValues[s] = []; });

    let dataStarted = false;
    for (let i = headerRow + 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const c1 = cellStr(row, 1);

        // Skip the column-number row immediately after the header.
        if (!dataStarted && /^1$/.test(c1)) continue;

        // Stop at the next sub-table boundary.
        if (dataStarted && /Base Year/i.test(c1)) break;

        // Year rows match "YYYY-YY" or "YYYY-YYYY".
        if (!/^\d{4}-\d{2,4}/.test(c1)) continue;

        dataStarted = true;
        years.push(c1.replace(/\s+$/, ''));

        for (let ci = 0; ci < stateCount; ci++) {
            const state = states[ci];
            rawValues[state].push(parseNum(row[2 + ci]));
        }
    }

    if (years.length === 0) throw new Error('no year data rows found');

    return {
        reportTitle : 'Net State Domestic Product — state-wise (at current prices)',
        baseYear    : '2011-12',
        unit        : 'Rupees crores',
        years,
        states,
        data        : rawValues,
    };
}

// ---------------------------------------------------------------------------
// Self-check.
// ---------------------------------------------------------------------------

function fail(msg) {
    console.error(`SELF-CHECK FAILED: ${msg}`);
    process.exit(1);
}

function yearIdx(out, label) {
    const i = out.years.indexOf(label);
    if (i < 0) fail(`year "${label}" not found in output`);
    return i;
}

// Tolerance-aware numeric comparison (for decimal values).
function approxEq(a, b, tol = 0.01) {
    return Math.abs(a - b) <= tol;
}

function selfCheck(out) {
    const { years, states, data } = out;

    if (years.length < 12) fail(`expected ≥12 years, got ${years.length}`);
    if (states.length < 30) fail(`expected ≥30 states, got ${states.length}`);

    // Years are unique.
    const seen = new Set();
    for (const y of years) {
        if (seen.has(y)) fail(`duplicate year "${y}"`);
        seen.add(y);
    }

    // Years are ordered newest-first.
    for (let i = 1; i < years.length; i++) {
        const prev = Number(years[i - 1].slice(0, 4));
        const curr = Number(years[i].slice(0, 4));
        if (curr >= prev) fail(`years not newest-first at index ${i}: "${years[i - 1]}" then "${years[i]}"`);
    }

    // Assertion 1: 2023-24, Andhra Pradesh ≈ 1267396.415.
    {
        const idx = yearIdx(out, '2023-24');
        const val = data['Andhra Pradesh'][idx];
        if (val == null || !approxEq(val, 1267396.415, 1)) {
            fail(`2023-24 Andhra Pradesh: expected ≈1267396.415, got ${val}`);
        }
    }

    // Assertion 2: 2023-24, Gujarat ≈ 2143868.5.
    {
        const idx = yearIdx(out, '2023-24');
        const val = data['Gujarat'][idx];
        if (val == null || !approxEq(val, 2143868.5, 1)) {
            fail(`2023-24 Gujarat: expected ≈2143868.5, got ${val}`);
        }
    }

    // Assertion 3: 2011-12, Andhra Pradesh = 339996.
    {
        const idx = yearIdx(out, '2011-12');
        const val = data['Andhra Pradesh'][idx];
        if (val !== 339996) fail(`2011-12 Andhra Pradesh: expected 339996, got ${val}`);
    }

    // Each state must have the correct value count.
    for (const s of states) {
        if (!data[s]) fail(`state "${s}" missing from data`);
        if (data[s].length !== years.length) {
            fail(`state "${s}": expected ${years.length} values, got ${data[s].length}`);
        }
    }
}

function main() {
    const out = parse(fs.readFileSync(XLSX_SRC));
    selfCheck(out);

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const outPath = path.join(OUT_DIR, 'net-state-domestic-product-state-wise-at-current-prices.json');
    fs.writeFileSync(outPath, JSON.stringify(out));

    const sizeMB = (fs.statSync(outPath).size / 1024).toFixed(1);
    console.log(
        `wrote ${out.years.length} years × ${out.states.length} states ` +
        `(${out.years[out.years.length - 1]} to ${out.years[0]}; base year ${out.baseYear}) ` +
        `→ ${outPath} (${sizeMB} KB); self-check passed`,
    );
}

main();

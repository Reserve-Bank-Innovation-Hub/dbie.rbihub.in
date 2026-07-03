// Processor: per-capita-net-state-domestic-product-state-wise-at-current-prices (annual).
//
// Source xlsx — "Per Capita Net State Domestic Product - State-wise (At Current Prices).xlsx"
// — contains one sheet ("Report 1") with five sub-tables stacked vertically for
// different base years. Only the first sub-table (Base Year: 2011-12) is emitted;
// it spans 2011-12 to 2024-25 (14 years, newest-first).
//
// Values are per-capita rupees at current prices — decimal strings (e.g. "237950.6251").
// Unit is "Rupees". Header col[1] is "State / Union Territory".
// 33 states/UTs (includes Puducherry).
//
// Emits:
//   out/per-capita-net-state-domestic-product-state-wise-at-current-prices.json
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
    'Per Capita Net State Domestic Product - State-wise (At Current Prices).xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Decimal strings like "237950.6251"; strip commas defensively.
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

    // Locate the column-header row.
    let headerRow = -1;
    let states = [];

    for (let i = 0; i < Math.min(rows.length, 12); i++) {
        const c1 = cellStr(rows[i] || [], 1);
        if (/^Year$/i.test(c1) || /^STATE\s*\/\s*UNION/i.test(c1) || /^State\s*\/\s*Union/i.test(c1)) {
            headerRow = i;
            states = (rows[i] || []).slice(2).filter((v) => v != null && !/^\d+$/.test(String(v).trim())).map(String);
            break;
        }
    }

    if (headerRow < 0) throw new Error('could not locate the column-header row');
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
        reportTitle : 'Per capita Net State Domestic Product — state-wise (at current prices)',
        baseYear    : '2011-12',
        unit        : 'Rupees',
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

    // Assertion 1: 2023-24, Andhra Pradesh ≈ 237950.6251.
    {
        const idx = yearIdx(out, '2023-24');
        const val = data['Andhra Pradesh'][idx];
        if (val == null || !approxEq(val, 237950.6251)) {
            fail(`2023-24 Andhra Pradesh: expected ≈237950.6251, got ${val}`);
        }
    }

    // Assertion 2: 2023-24, Gujarat ≈ 297722.2986.
    {
        const idx = yearIdx(out, '2023-24');
        const val = data['Gujarat'][idx];
        if (val == null || !approxEq(val, 297722.2986)) {
            fail(`2023-24 Gujarat: expected ≈297722.2986, got ${val}`);
        }
    }

    // Assertion 3: 2011-12, Andhra Pradesh = 69000.
    {
        const idx = yearIdx(out, '2011-12');
        const val = data['Andhra Pradesh'][idx];
        if (val !== 69000) fail(`2011-12 Andhra Pradesh: expected 69000, got ${val}`);
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
    const outPath = path.join(OUT_DIR, 'per-capita-net-state-domestic-product-state-wise-at-current-prices.json');
    fs.writeFileSync(outPath, JSON.stringify(out));

    const sizeMB = (fs.statSync(outPath).size / 1024).toFixed(1);
    console.log(
        `wrote ${out.years.length} years × ${out.states.length} states ` +
        `(${out.years[out.years.length - 1]} to ${out.years[0]}; base year ${out.baseYear}) ` +
        `→ ${outPath} (${sizeMB} KB); self-check passed`,
    );
}

main();

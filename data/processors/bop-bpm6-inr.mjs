// bop-bpm6-inr.mjs — Standard Presentation of BoP in India as per BPM6, ₹ crore (Table 43).
//
// Identical sheet layout to Table 42 (bop-bpm6-usd.mjs) — same BPM6 item rows,
// same quarter columns, same Credit/Debit/Net sub-column pattern — except that
// the unit is "Rupees Crores" and values are in ₹ crore.  Values in this table
// are formatted with comma grouping ("2,449,283") so the parser must strip commas.
//
// Sheet layout (single "Quarterly" sheet):
//   row 0           blank
//   row 1 (col 1)   report title
//   row 2           blank
//   row 3 (col 1)   "(Rupees Crores )"  ← unit label
//   row 4           blank
//   row 5           quarter header row (cols 2, 5, 8, … stride 3)
//   row 6           Credit / Debit / Net sub-headers
//   rows 7-87       BPM6 item rows

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(
    __dirname,
    '..', 'publications', 'monthly-rbi-bulletin', 'external-sector',
    'table-43-standard-presentation-of-bop-in-india-as-per-bpm6-rs-crore.xlsx',
);
const OUT = path.join(__dirname, 'out', 'bop-bpm6-inr.json');

const REPORT_TITLE = 'Standard presentation of BoP in India as per BPM6 (Table 43)';

// Strip commas, treat "", "-", "N/A" and nullish as null; otherwise Number().
function parseValue(raw) {
    if (raw == null) return null;
    const s = String(raw).trim().replaceAll(',', '');
    if (s === '' || s === '-' || s === 'N/A') return null;
    const val = Number(s);
    return Number.isNaN(val) ? null : val;
}

// Extract BPM6 code from item label: first whitespace-delimited token that looks
// like a code ("1", "1.A", "1.A.b.1", "3.5.4", etc.).
function extractCode(raw) {
    const text = String(raw).trim();
    const firstSpace = text.search(/\s/);
    if (firstSpace === -1) return { code: text, label: text };
    const token = text.slice(0, firstSpace);
    if (/^[\dA-Za-z]+(\.[.\dA-Za-z]+)*$/.test(token)) {
        return { code: token, label: text.slice(firstSpace).trim() };
    }
    return { code: text, label: text };
}

// Infer indent level from leading spaces in the raw cell string.
function indentLevel(raw) {
    const text = String(raw);
    const leading = text.length - text.trimStart().length;
    if (leading === 0) return 0;
    if (leading <= 6) return 1;
    if (leading <= 14) return 2;
    if (leading <= 22) return 3;
    return 4;
}

// Parse quarter header, extracting the status code (P/PR/F) from the
// parenthesised suffix if present.
function parseQuarterHeader(raw) {
    const text = String(raw).trim();
    const m = text.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (m) return { label: m[1].trim(), status: m[2] };
    return { label: text, status: '' };
}

function main() {
    const wb = XLSX.read(fs.readFileSync(SRC), { type: 'buffer' });
    const ws = wb.Sheets['Quarterly'];
    if (!ws) throw new Error('sheet "Quarterly" not found');

    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

    // Row 3 carries the unit label.
    const unitRaw = String((rows[3] || [])[1] || '').trim();
    const unit = unitRaw || '₹ crore';

    // Row 5: quarter header labels at cols 2, 5, 8, … (stride 3).
    const hdrRow = rows[5] || [];
    const columns = [];
    for (let c = 2; c < hdrRow.length; c += 3) {
        if (!hdrRow[c]) break;
        columns.push({ ...parseQuarterHeader(hdrRow[c]), col: c });
    }

    // Rows 7-87: BPM6 item rows.
    const itemRows = [];
    for (let r = 7; r < rows.length; r++) {
        const rawLabel = (rows[r] || [])[1];
        if (rawLabel && String(rawLabel).trim() !== '') itemRows.push(rows[r]);
    }
    const items = itemRows.map((row) => ({ ...extractCode(row[1]), indent: indentLevel(row[1]) }));

    // Since the export of 28-09-2026 a quarter can span two columns, one per status ("Jan-Mar 2026 (P)" holding
    // every row but one, "Jan-Mar 2026 (PR)" holding row 38 alone). The columns of one quarter are merged cell by
    // cell; the quarter takes the status of the column holding most of its values.
    const quarters = [];
    const values = itemRows.map(() => []); // outer index = item, inner = [quarters × 3 (credit/debit/net)]
    for (const label of [...new Set(columns.map((c) => c.label))]) {
        const cols = columns.filter((c) => c.label === label);
        let best = null;
        const merged = itemRows.map((row) => [0, 1, 2].map((k) => {
            let v = null;
            for (const c of cols) {
                const x = parseValue(row[c.col + k]);
                if (x == null) continue;
                if (v != null && v !== x) throw new Error(`${label}: ${row[1].trim()} has two values, ${v} and ${x}`);
                v = x;
                c.filled = (c.filled || 0) + 1;
            }
            return v;
        }));
        for (const c of cols) if (!best || (c.filled || 0) > (best.filled || 0)) best = c;
        quarters.push({ label, status: best.status, filled: merged.flat().filter((v) => v != null).length });
        merged.forEach((v, i) => values[i].push(v));
    }

    // A newest quarter with next to nothing in it is not yet published: Jan-Mar 2026 in the rupee table of
    // 28-09-2026 carries row 38 alone. It is left out; a sparse quarter anywhere else fails the self-check.
    const full = Math.max(...quarters.map((q) => q.filled));
    while (quarters.length && quarters[0].filled < full / 2) {
        quarters.shift();
        values.forEach((v) => v.shift());
    }
    const sparse = quarters.filter((q) => q.filled < full / 2).map((q) => `${q.label} (${q.filled} of ${full})`);
    quarters.forEach((q) => delete q.filled);

    const result = { reportTitle: REPORT_TITLE, unit, quarters, items, values };
    fs.writeFileSync(OUT, JSON.stringify(result));

    const sizeMB = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
    console.log(
        `bop-bpm6-inr: ${items.length} items × ${quarters.length} quarters` +
        ` → ${OUT} (${sizeMB} MB)`,
    );

    if (sparse.length) fail(`quarters with under half the values of a full quarter: ${sparse.join(', ')}`);
    selfCheck(result);
    console.log('self-check passed');
}

// ---------------------------------------------------------------------------
// Self-check: hard-coded cell assertions sampled directly from the workbook,
// plus structural invariants.
// ---------------------------------------------------------------------------

// Sampled from the workbook at inspection time (values in ₹ crore, comma-stripped):
//   [ itemCode, quarterLabel, measure ("credit"|"debit"|"net"), expectedValue ]
const KNOWN_CELLS = [
    // Row 7 = "1  Current Account", Q1 = Oct-Dec 2025 (PR). The export of 28-09-2026 revised the two newest
    // quarters (before: 2449283 / -117378, 2325744 / -123115, 200114 / -32607, -10749) and spells the newest
    // label "Oct-Dec 2025", where it had been "Oct-Dec2025".
    ['1', 'Oct-Dec 2025', 'credit',  2446112],
    ['1', 'Oct-Dec 2025', 'net',     -143084],
    // Row 7, Q2 = Jul-Sep 2025
    ['1', 'Jul-Sep 2025', 'credit', 2325920],
    ['1', 'Jul-Sep 2025', 'net',    -126308],
    // Row 45 = "3.1 Direct Investment", Q1
    ['3.1', 'Oct-Dec 2025', 'credit', 207052],
    ['3.1', 'Oct-Dec 2025', 'net',    -45726],
    // Row 87 = "5 Net errors and omissions", Q1 net
    ['5', 'Oct-Dec 2025', 'net',      -20562],
    // Settled history: unchanged by that revision.
    ['1', 'Jan-Mar 2024', 'credit', 2104999],
    ['3.1', 'Jan-Mar 2024', 'net',  19086],
];

const MEASURE_IDX = { credit: 0, debit: 1, net: 2 };

function fail(msg) {
    console.error(`SELF-CHECK FAILED: ${msg}`);
    process.exit(1);
}

function selfCheck(result) {
    if (result.items.length < 80) {
        fail(`expected ≥80 items, got ${result.items.length}`);
    }
    if (result.quarters.length < 50) {
        fail(`expected ≥50 quarters, got ${result.quarters.length}`);
    }

    // Quarter labels unique.
    const seenQ = new Set();
    for (const q of result.quarters) {
        if (seenQ.has(q.label)) fail(`duplicate quarter label "${q.label}"`);
        seenQ.add(q.label);
    }

    // Build lookup maps for assertions.
    const itemIdx    = new Map(result.items.map((item, i) => [item.code, i]));
    const quarterIdx = new Map(result.quarters.map((q, i) => [q.label, i]));

    for (const [code, qLabel, measure, expected] of KNOWN_CELLS) {
        const ii = itemIdx.get(code);
        const qi = quarterIdx.get(qLabel);
        if (ii == null) fail(`item code "${code}" not found`);
        if (qi == null) fail(`quarter "${qLabel}" not found`);
        const got = result.values[ii][qi][MEASURE_IDX[measure]];
        if (Math.abs(got - expected) > 0.5) {
            fail(`[${code}, ${qLabel}, ${measure}] expected ${expected}, got ${got}`);
        }
    }
}

main();

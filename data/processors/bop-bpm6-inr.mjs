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
    const quarters = [];
    for (let c = 2; c < hdrRow.length; c += 3) {
        if (!hdrRow[c]) break;
        quarters.push(parseQuarterHeader(hdrRow[c]));
    }

    // Rows 7-87: BPM6 item rows.
    const items = [];
    const values = []; // outer index = item, inner = [quarters × 3 (credit/debit/net)]

    for (let r = 7; r < rows.length; r++) {
        const row = rows[r] || [];
        const rawLabel = row[1];
        if (!rawLabel || String(rawLabel).trim() === '') continue;

        const { code, label } = extractCode(rawLabel);
        const indent = indentLevel(rawLabel);
        items.push({ code, label, indent });

        const itemVals = [];
        for (let q = 0; q < quarters.length; q++) {
            const base = 2 + q * 3;
            itemVals.push([
                parseValue(row[base]),     // Credit
                parseValue(row[base + 1]), // Debit
                parseValue(row[base + 2]), // Net
            ]);
        }
        values.push(itemVals);
    }

    const result = { reportTitle: REPORT_TITLE, unit, quarters, items, values };
    fs.writeFileSync(OUT, JSON.stringify(result));

    const sizeMB = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
    console.log(
        `bop-bpm6-inr: ${items.length} items × ${quarters.length} quarters` +
        ` → ${OUT} (${sizeMB} MB)`,
    );

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
    // Row 7 = "1  Current Account", Q1 = Oct-Dec 2025 (P)
    ['1', 'Oct-Dec2025', 'credit',  2449283],
    ['1', 'Oct-Dec2025', 'net',     -117378],
    // Row 7, Q2 = Jul-Sep 2025
    ['1', 'Jul-Sep 2025', 'credit', 2325744],
    ['1', 'Jul-Sep 2025', 'net',    -123115],
    // Row 45 = "3.1 Direct Investment", Q1
    ['3.1', 'Oct-Dec2025', 'credit', 200114],
    ['3.1', 'Oct-Dec2025', 'net',    -32607],
    // Row 87 = "5 Net errors and omissions", Q1 net
    ['5', 'Oct-Dec2025', 'net',      -10749],
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

// bop-bpm6-usd.mjs — Standard Presentation of BoP in India as per BPM6, US$ million (Table 42).
//
// Sheet layout (single "Quarterly" sheet):
//   row 0           blank
//   row 1 (col 1)   report title
//   row 2           blank
//   row 3 (col 1)   "(US$ Millions)"  ← unit label
//   row 4           blank
//   row 5           header row: col 1 = "Item", cols 2/5/8/… = quarter labels
//                   ("Oct-Dec2025 (P)", "Jul-Sep 2025 (PR)", …), each spanning 3
//                   sub-columns (Credit, Debit, Net — see row 6)
//   row 6           sub-header: "Credit", "Debit", "Net" repeating per quarter
//   rows 7-87       BPM6 item rows; col 1 = item label (code embedded as prefix,
//                   e.g. "1  Current Account (1.A+1.B+1.C)", "1.A.b.1 …")
//                   cols 2+ = Credit/Debit/Net values per quarter, newest-first.
//                   "-" means zero/not applicable and is kept as null.
//
// Output shape (see BopBpm6 interface in src/lib/api/tables/bop-bpm6-usd.ts):
//   { reportTitle, unit, quarters, items, values }
//   quarters: [{ label, status }]         — 59 quarters newest-first
//   items:    [{ code, label, parent, indent }]  — 81 BPM6 rows
//   values:   items × quarters × 3 (credit, debit, net), null for "-"

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(
    __dirname,
    '..', 'publications', 'monthly-rbi-bulletin', 'external-sector',
    'table-42-standard-presentation-of-bop-in-india-as-per-bpm6-us-million.xlsx',
);
const OUT = path.join(__dirname, 'out', 'bop-bpm6-usd.json');

const REPORT_TITLE = 'Standard presentation of BoP in India as per BPM6 (Table 42)';

// Strip commas, treat "", "-", "N/A" and nullish as null; otherwise Number().
function parseValue(raw) {
    if (raw == null) return null;
    const s = String(raw).trim().replaceAll(',', '');
    if (s === '' || s === '-' || s === 'N/A') return null;
    const val = Number(s);
    return Number.isNaN(val) ? null : val;
}

// Extract BPM6 code from item label: first whitespace-delimited token that looks
// like a code ("1", "1.A", "1.A.b.1", "3.5.4", etc.). Falls back to the label
// verbatim if the first token doesn't match.
function extractCode(raw) {
    const text = String(raw).trim();
    const firstSpace = text.search(/\s/);
    if (firstSpace === -1) return { code: text, label: text };
    const token = text.slice(0, firstSpace);
    // BPM6 codes: digits and/or uppercase/lowercase letters separated by dots
    if (/^[\dA-Za-z]+(\.[.\dA-Za-z]+)*$/.test(token)) {
        return { code: token, label: text.slice(firstSpace).trim() };
    }
    return { code: text, label: text };
}

// Infer indent level from leading spaces in the raw cell string (the source
// sheet uses spaces to visually indent sub-items).
function indentLevel(raw) {
    const text = String(raw);
    const leading = text.length - text.trimStart().length;
    // Observed indent groups: 0, 4, 12, 20, 28 spaces → levels 0–4
    if (leading === 0) return 0;
    if (leading <= 6) return 1;
    if (leading <= 14) return 2;
    if (leading <= 22) return 3;
    return 4;
}

// Parse the quarter label and status from a header like "Oct-Dec2025 (P)" or
// "Jul-Sep 2025 (PR)". The status code is the parenthesised suffix if present.
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
    const unit = unitRaw || 'US$ million';

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
        `bop-bpm6-usd: ${items.length} items × ${quarters.length} quarters` +
        ` → ${OUT} (${sizeMB} MB)`,
    );

    selfCheck(result);
    console.log('self-check passed');
}

// ---------------------------------------------------------------------------
// Self-check: at least three hard-coded cell assertions sampled directly from
// the workbook, plus structural invariants (unique quarters, item count).
// ---------------------------------------------------------------------------

// Sampled from the workbook at inspection time:
//   [ itemCode, quarterLabel, measure ("credit"|"debit"|"net"), expectedValue ]
const KNOWN_CELLS = [
    // Row 7 = "1  Current Account", Q1 = Oct-Dec 2025 (P)
    ['1', 'Oct-Dec2025', 'credit',  274857.2557],
    ['1', 'Oct-Dec2025', 'debit',   288029.3692],
    ['1', 'Oct-Dec2025', 'net',     -13172.11357],
    // Row 7, Q2 = Jul-Sep 2025
    ['1', 'Jul-Sep 2025', 'net',    -14099.52909],
    // Row 45 = "3.1 Direct Investment", Q1
    ['3.1', 'Oct-Dec2025', 'credit', 22456.72556],
    ['3.1', 'Oct-Dec2025', 'net',    -3659.109123],
    // Row 87 = "5 Net errors and omissions", Q1 net
    ['5', 'Oct-Dec2025', 'net',      -1206.203451],
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
    const itemIdx  = new Map(result.items.map((item, i) => [item.code, i]));
    const quarterIdx = new Map(result.quarters.map((q, i) => [q.label, i]));

    for (const [code, qLabel, measure, expected] of KNOWN_CELLS) {
        const ii = itemIdx.get(code);
        const qi = quarterIdx.get(qLabel);
        if (ii == null) fail(`item code "${code}" not found`);
        if (qi == null) fail(`quarter "${qLabel}" not found`);
        const got = result.values[ii][qi][MEASURE_IDX[measure]];
        if (Math.abs(got - expected) > 0.001) {
            fail(`[${code}, ${qLabel}, ${measure}] expected ${expected}, got ${got}`);
        }
    }
}

main();

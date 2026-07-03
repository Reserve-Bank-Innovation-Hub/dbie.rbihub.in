// Processor: rbi-survey (Table 10, Monthly RBI Bulletin — Money and Banking).
//
// Source xlsx — one sheet "Report 1":
//   row 0          blank
//   row 1 (col 1)  "Reserve Bank of India Survey"
//   row 3 (col 1)  "(Rupees Crores)"
//   row 5          column codes: "Month / Item", "C.I", "C.II", "C.II.1", "C.III",
//                  "C.IV", "S.I", "S.I.1", "S.I.1.1", "S.I.1.1.1", "S.I.1.1.2",
//                  "S.I.1.1.3", "S.I.1.1.3.1", "S.I.1.1.4", "S.I.1.1.5", "S.I.1.2",
//                  "S.I.2", "S.I.2.1", "S.I.3", "S.I.3.1", "S.I.3.2", "S.II",
//                  "S.III", "S.III.1", "S.III.2", "S.IV"
//   row 6          column descriptions (full names)
//   rows 7..881    data rows — col 1 is an Excel date serial, cols 2..26 are numeric values;
//                  '-' → null; older rows show '-' for items not yet tracked.
//   rows 882..     blank + notes footer
//
// Unlike Table 8, every column in Table 10 carries a unique code in row 5 — no
// "Excluding Merger" variant columns.
//
// Emits: out/rbi-survey.json
//   {
//     reportTitle : string,
//     unit        : string,          // "Rupees Crores"
//     columns     : RbiSurveyColumn[],
//     periods     : string[],        // "YYYY-MM-DD", newest-first
//     values      : (number|null)[][], // periods × columns matrix
//   }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(
    __dirname,
    '../publications/monthly-rbi-bulletin/money-and-banking',
    'table-10-reserve-bank-of-india-survey.xlsx',
);
const OUT = path.join(__dirname, 'out', 'rbi-survey.json');

// Strip commas, treat blank/dash as null.
function parseNum(raw) {
    if (raw == null) return null;
    const s = String(raw).trim().replace(/,/g, '');
    if (s === '' || s === '-' || s === 'N/A') return null;
    const val = Number(s);
    return Number.isFinite(val) ? val : null;
}

// Convert an Excel date serial to "YYYY-MM-DD".
function excelSerialToISO(serial) {
    const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
    return d.toISOString().split('T')[0];
}

function parse() {
    const wb = XLSX.read(fs.readFileSync(SRC), { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
        header   : 1,
        raw      : true,     // keep numeric serials as numbers
        defval   : null,
        blankrows: true,
    });

    const CODE_ROW  = 5;
    const DESC_ROW  = 6;
    const DATA_START = 7;

    const codeRow = rows[CODE_ROW] || [];
    const descRow = rows[DESC_ROW] || [];

    // Build column list from cols 2..26.
    const columns = [];
    for (let c = 2; c < codeRow.length; c++) {
        const rawCode = codeRow[c];
        const desc    = String(descRow[c] || '').trim();
        if (rawCode == null && desc === '') continue;
        if (rawCode == null) continue; // Table 10 has no null-code columns
        const code = String(rawCode).trim();
        columns.push({ col: c, code, label: desc });
    }

    // Parse data rows.
    const periods = [];
    const values  = [];

    for (let r = DATA_START; r < rows.length; r++) {
        const row = rows[r] || [];
        const dateCell = row[1];
        if (dateCell == null || typeof dateCell !== 'number' || dateCell < 10000) continue;

        const iso = excelSerialToISO(dateCell);
        periods.push(iso);
        values.push(columns.map(col => parseNum(row[col.col])));
    }

    return {
        reportTitle : 'Reserve Bank of India survey',
        unit        : 'Rupees Crores',
        columns     : columns.map(({ col, ...rest }) => rest),
        periods,
        values,
    };
}

// --- self-check -----------------------------------------------------------
function selfCheck(out) {
    const errors = [];

    if (!Array.isArray(out.periods) || out.periods.length < 870) {
        errors.push(`expected ≥870 period rows, got ${out.periods?.length ?? 'n/a'}`);
    }
    if (!Array.isArray(out.columns) || out.columns.length < 25) {
        errors.push(`expected ≥25 columns, got ${out.columns?.length ?? 'n/a'}`);
    }

    // Periods must be unique.
    const seen = new Set(out.periods);
    if (seen.size !== out.periods.length) {
        errors.push(`periods not unique: ${out.periods.length} rows, ${seen.size} distinct`);
    }

    // Periods must be ordered newest-first (strictly descending).
    for (let i = 1; i < out.periods.length; i++) {
        if (out.periods[i - 1] <= out.periods[i]) {
            errors.push(`periods not newest-first at index ${i}: ${out.periods[i - 1]} then ${out.periods[i]}`);
            break;
        }
    }

    // Hard-coded cell assertions read directly from the source sheet.
    const codeIdx   = new Map(out.columns.map((c, i) => [c.code, i]));
    const periodIdx = new Map(out.periods.map((p, i) => [p, i]));

    const assertions = [
        // [ period,       code,    expected ]
        ['2026-01-31', 'C.I',   4000946.759],
        ['2026-01-31', 'C.II',  804976.54],
        ['2026-01-31', 'C.IV',  4923190.2414],
        ['2026-01-31', 'S.IV',  2841812.8],
        ['2025-12-31', 'C.I',   3923522.533],
        ['2025-12-31', 'C.IV',  4799135.4762],
        ['2022-08-12', 'C.I',   3213966.359],
        ['1952-02-29', 'C.I',   1292],
    ];

    for (const [period, code, expected] of assertions) {
        const pi = periodIdx.get(period);
        const ci = codeIdx.get(code);
        if (pi == null) { errors.push(`period not found: ${period}`); continue; }
        if (ci == null) { errors.push(`column code not found: ${code}`); continue; }
        const got = out.values[pi][ci];
        if (got !== expected) {
            errors.push(`[${period}, ${code}] expected ${expected}, got ${got}`);
        }
    }

    return errors;
}

function main() {
    const out = parse();
    const errors = selfCheck(out);

    if (errors.length > 0) {
        console.error('rbi-survey self-check FAILED:');
        errors.forEach(e => console.error('  ' + e));
        process.exit(1);
    }

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(out));

    console.log(
        `rbi-survey: ${out.columns.length} columns × ${out.periods.length} periods ` +
        `(newest ${out.periods[0]}, oldest ${out.periods[out.periods.length - 1]}); self-check passed`,
    );
}

main();

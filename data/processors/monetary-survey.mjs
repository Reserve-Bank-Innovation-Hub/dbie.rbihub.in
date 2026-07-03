// Processor: monetary-survey (Table 8, Monthly RBI Bulletin — Money and Banking).
//
// Source xlsx — one sheet "Monetary Survey":
//   row 0          blank
//   row 1 (col 1)  "Monetary Survey"
//   row 3 (col 1)  "(Rupees Crores)"
//   row 5          column codes: "Month/ Item", "NM1", "NM2", null (excl-merger variant),
//                  "NM3", null (excl-merger), "C.I", "C.II", null (excl-merger), "C.II.2",
//                  null (excl-merger), "C.II.1", … "S.IV"
//   row 6          column descriptions (full names; excl-merger cols repeat with that suffix)
//   rows 7..722    data rows — col 1 is an Excel date serial, cols 2..37 are numeric values;
//                  '-' → null; a handful of nulls are genuine gaps.
//   rows 723..     blank + notes footer
//
// Every "Excluding Merger" column (where row 5 code is null but row 6 description has
// "(Excluding Merger)") is assigned a synthetic code = <previous code>_excl_merger.
//
// Emits: out/monetary-survey.json
//   {
//     reportTitle : string,
//     unit        : string,          // "Rupees Crores"
//     columns     : MonetarySurveyColumn[],
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
    'table-08-monetary-survey.xlsx',
);
const OUT = path.join(__dirname, 'out', 'monetary-survey.json');

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

    // Header rows are at fixed positions per inspection.
    const CODE_ROW = 5;
    const DESC_ROW = 6;
    const DATA_START = 7;

    const codeRow = rows[CODE_ROW] || [];
    const descRow = rows[DESC_ROW] || [];

    // Build column list from cols 2..37.
    const columns = [];
    let lastCode = null;
    for (let c = 2; c < codeRow.length; c++) {
        const rawCode = codeRow[c];
        const desc    = String(descRow[c] || '').trim();
        if (rawCode == null && desc === '') continue; // completely empty — skip

        let code;
        if (rawCode != null) {
            code     = String(rawCode).trim();
            lastCode = code;
        } else {
            // "Excluding Merger" variant — synthesise a code.
            code = lastCode ? `${lastCode}_excl_merger` : `col${c}_excl_merger`;
        }

        columns.push({ col: c, code, label: desc });
    }

    // Parse data rows.
    const periods = [];
    const values  = [];

    for (let r = DATA_START; r < rows.length; r++) {
        const row = rows[r] || [];
        const dateCell = row[1];
        // Skip blank/footer rows — only accept rows where col 1 is a numeric serial.
        if (dateCell == null || typeof dateCell !== 'number' || dateCell < 10000) continue;

        const iso = excelSerialToISO(dateCell);
        periods.push(iso);
        values.push(columns.map(col => parseNum(row[col.col])));
    }

    return {
        reportTitle : 'Monetary survey',
        unit        : 'Rupees Crores',
        columns     : columns.map(({ col, ...rest }) => rest),
        periods,
        values,
    };
}

// --- self-check -----------------------------------------------------------
function selfCheck(out) {
    const errors = [];

    if (!Array.isArray(out.periods) || out.periods.length < 700) {
        errors.push(`expected ≥700 period rows, got ${out.periods?.length ?? 'n/a'}`);
    }
    if (!Array.isArray(out.columns) || out.columns.length < 30) {
        errors.push(`expected ≥30 columns, got ${out.columns?.length ?? 'n/a'}`);
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
    const codeIdx = new Map(out.columns.map((c, i) => [c.code, i]));
    const periodIdx = new Map(out.periods.map((p, i) => [p, i]));

    const assertions = [
        // [ period,       code,    expected ]
        ['2026-01-31', 'NM1',  7312842.722],
        ['2026-01-31', 'NM2',  17336563.38],
        ['2026-01-31', 'C.I',  3906775.084],
        ['2025-12-31', 'NM3',  30303667.46],
        ['2025-12-31', 'S.IV', 5483625.202],
        ['2022-08-12', 'NM1',  5265598.762],
        ['1999-04-23', 'NM1',  310782],
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
        console.error('monetary-survey self-check FAILED:');
        errors.forEach(e => console.error('  ' + e));
        process.exit(1);
    }

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(out));

    console.log(
        `monetary-survey: ${out.columns.length} columns × ${out.periods.length} periods ` +
        `(newest ${out.periods[0]}, oldest ${out.periods[out.periods.length - 1]}); self-check passed`,
    );
}

main();

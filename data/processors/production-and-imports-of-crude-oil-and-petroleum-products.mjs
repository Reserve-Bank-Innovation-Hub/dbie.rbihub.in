// Processor: production-and-imports-of-crude-oil-and-petroleum-products
// Source: Handbook — Annual Series — Output and Prices
//
// Excel layout ("Report 1" sheet, 63 rows):
//   row 1  title
//   row 3  units "(Millions Metric Tonnes (MMT))"
//   row 5  group headers: col[2]="Production", col[4]="Imports"
//   row 6  sub-column labels: Crude oil / POL products / Crude oil / POL products
//   row 7  column numbers 1..5
//   rows 8–61  data, newest-first; year label in col[1] (trim trailing spaces)
//   row 62 Notes/Source footnote
//
// Emits (newest-first):
//   out/production-and-imports-of-crude-oil-and-petroleum-products.json

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRC = path.join(
    __dirname,
    '..',
    'publications',
    'handbook-statistics-on-indian-economy',
    'annual-series',
    'output-and-prices',
    'Production and Imports of Crude Oil and Petroleum Products.xlsx',
);

const OUT_DIR = path.join(__dirname, 'out');
const OUT     = path.join(OUT_DIR, 'production-and-imports-of-crude-oil-and-petroleum-products.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cellStr(row, i) {
    const v = row[i];
    return v == null ? '' : String(v);
}

// Strip commas; '-', '', 'N/A' → null.
function parseNum(s) {
    s = String(s == null ? '' : s).trim().replace(/,/g, '');
    if (s === '' || s === '-' || s === 'N/A') return null;
    const val = Number(s);
    return Number.isFinite(val) ? val : null;
}

// Returns true when the label looks like a financial year "YYYY-YY".
function isYearLabel(label) {
    return /^\d{4}-\d{2}/.test(label);
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

function parse(buf) {
    const wb = XLSX.read(buf, { type: 'buffer' });
    if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

    for (const sn of wb.SheetNames) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
            header   : 1,
            raw      : false,
            defval   : null,
            blankrows: true,
        });

        let reportTitle  = '';
        let dataStartRow = -1;

        for (let i = 0; i < Math.min(rows.length, 12); i++) {
            const row = rows[i] || [];
            const c1  = cellStr(row, 1).trim();

            // Row 0 (index 0) holds the report title.
            if (i === 0 && c1) {
                reportTitle = c1;
            }

            // Column-number row "1","2",…,"5" immediately precedes the data rows.
            if (c1 === '1' && cellStr(row, 2).trim() === '2') {
                dataStartRow = i + 1;
                break;
            }
        }

        if (dataStartRow < 0) continue; // not the data sheet — try the next one

        const data = [];
        for (let i = dataStartRow; i < rows.length; i++) {
            const row  = rows[i] || [];
            const year = cellStr(row, 1).trim();
            if (year === '') continue;
            if (/^Note/i.test(year) || /^Source/i.test(year)) continue;
            if (!isYearLabel(year)) continue; // skip anything that is not a "YYYY-YY" data row

            data.push({
                year      : year,
                crude_prod: parseNum(row[2]),
                pol_prod  : parseNum(row[3]),
                crude_imp : parseNum(row[4]),
                pol_imp   : parseNum(row[5]),
            });
        }

        if (data.length === 0) throw new Error('no valid data rows found in sheet');

        return {
            reportTitle : reportTitle || 'Production and imports of crude oil and petroleum products',
            units       : 'Millions metric tonnes (MMT)',
            columns     : [
                { code: 'crude_prod', label: 'Production — crude oil',    group: 'Production' },
                { code: 'pol_prod',   label: 'Production — POL products', group: 'Production' },
                { code: 'crude_imp',  label: 'Imports — crude oil',       group: 'Imports'    },
                { code: 'pol_imp',    label: 'Imports — POL products',    group: 'Imports'    },
            ],
            data,
        };
    }

    throw new Error('could not locate the data header row in any sheet');
}

// ---------------------------------------------------------------------------
// Self-check: fail loudly on shape or known-cell drift
// ---------------------------------------------------------------------------

function selfCheck(out) {
    const { data } = out;
    const errors   = [];

    if (!Array.isArray(data) || data.length < 50) {
        errors.push(`expected ≥50 annual rows, got ${data ? data.length : 'n/a'}`);
    }

    // Known cells verified against the source sheet.
    const known = [
        { year: '2024-25', crude_prod: 26.49,         tol: 0.001 },
        { year: '2024-25', pol_prod:   283.7706487,    tol: 0.01  },
        { year: '2024-25', crude_imp:  243.2249714,    tol: 0.01  },
        { year: '2024-25', pol_imp:    50.90301779,    tol: 0.01  },
        { year: '2023-24', crude_prod: 27.16836632,    tol: 0.001 },
        { year: '2022-23', crude_prod: 27.82735883,    tol: 0.001 },
        { year: '1974-75', crude_prod: 8,              tol: 0.01  },
        { year: '1973-74', crude_prod: 7,              tol: 0.01  },
    ];

    for (const exp of known) {
        const row = data.find((r) => r.year === exp.year);
        if (!row) { errors.push(`known year missing: ${exp.year}`); continue; }

        for (const [field, val] of Object.entries(exp)) {
            if (field === 'year' || field === 'tol') continue;
            if (val == null) continue;
            if (Math.abs((row[field] ?? NaN) - val) > exp.tol) {
                errors.push(`${exp.year} ${field}: expected ${val}, got ${row[field]}`);
            }
        }
    }

    // Years must be unique.
    const keys = data.map((r) => r.year);
    const uniq = new Set(keys);
    if (uniq.size !== keys.length) {
        errors.push(`years not unique: ${keys.length} rows, ${uniq.size} distinct`);
    }

    // Ordered newest-first (strictly descending by the 4-digit start year).
    for (let i = 1; i < keys.length; i++) {
        const prev = parseInt(keys[i - 1], 10);
        const curr = parseInt(keys[i], 10);
        if (!Number.isNaN(prev) && !Number.isNaN(curr) && prev <= curr) {
            errors.push(`not strictly newest-first at row ${i}: ${keys[i - 1]} then ${keys[i]}`);
            break;
        }
    }

    return errors;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    const out    = parse(fs.readFileSync(SRC));
    const errors = selfCheck(out);

    if (errors.length > 0) {
        console.error('production-and-imports-of-crude-oil-and-petroleum-products self-check FAILED:');
        errors.forEach((e) => console.error('  ' + e));
        process.exit(1);
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(out));

    console.log(
        `wrote ${out.data.length} annual rows ` +
        `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}); self-check passed`,
    );
}

main();

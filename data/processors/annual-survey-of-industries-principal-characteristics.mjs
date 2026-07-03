// Processor: annual-survey-of-industries-principal-characteristics
//
// Source xlsx: Handbook of Statistics on Indian Economy → Annual Series →
//   Output and Prices → Annual Survey of Industries - Principal Characteristics.xlsx
//
// Sheet "Report 1" layout (0-based row indices):
//   row 0  : title ("Annual Survey of Industries - Principal Characteristics")
//   row 2  : subtitle / units note
//   row 4  : column headers (col 1 = "Industry Characterstics", col 2..28 = items 1..27,
//             col 29-31 = null/sub-col markers, col 32 = "28. Gross capital formation")
//   row 5  : sub-column labels for item 27 at positions 29-31, col 32 = "(iv) Total"
//   row 6  : column numbers "1".."32"
//   rows 7..40 : data rows (year, values[2..32]) — newest-first
//   row 42 : source footnote
//
// Column mapping (1-based, matching the source sheet):
//   col 1  = year label
//   col 2  = code "1"  Number of factories
//   col 3  = code "2"  Fixed capital
//   ...
//   col 27 = code "26" Gross fixed capital formation
//   col 28 = code "27_total" Addition in stock — total (header/aggregate; may be null)
//   col 29 = code "27a" Addition in stock — material, fuels, etc.
//   col 30 = code "27b" Addition in stock — semi-finished goods
//   col 31 = code "27c" Addition in stock — finished goods
//   col 32 = code "28"  Gross capital formation
//
// Emits (newest-first):
//   out/annual-survey-of-industries-principal-characteristics.json
//     { reportTitle, units, characteristics:[{code, label}],
//       data:[{year, values:{code: number|null}}] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRC = path.join(
    __dirname,
    '..', 'publications',
    'handbook-statistics-on-indian-economy',
    'annual-series', 'output-and-prices',
    'Annual Survey of Industries - Principal Characteristics.xlsx',
);

const OUT_DIR = path.join(__dirname, 'out');
const OUT = path.join(OUT_DIR, 'annual-survey-of-industries-principal-characteristics.json');

// Characteristic definitions in column order (col 2..32 in the source sheet).
// Each entry holds a stable code used as the key in data[*].values.
const CHARACTERISTICS = [
    { code: '1',        label: 'Number of factories' },               // col 2
    { code: '2',        label: 'Fixed capital' },                      // col 3
    { code: '3',        label: 'Working capital' },                    // col 4
    { code: '4',        label: 'Invested capital' },                   // col 5
    { code: '5',        label: 'Outstanding loans' },                  // col 6
    { code: '6',        label: 'Number of workers' },                  // col 7
    { code: '7',        label: 'Man-days — workers' },                 // col 8
    { code: '8',        label: 'Number of employees' },                // col 9
    { code: '9',        label: 'Man-days — employees' },               // col 10
    { code: '10',       label: 'Total persons engaged' },              // col 11
    { code: '11',       label: 'Wages to workers' },                   // col 12
    { code: '12',       label: 'Total emoluments' },                   // col 13
    { code: '13',       label: 'Provident and other funds' },          // col 14
    { code: '14',       label: 'Workmen and staff welfare expenses' }, // col 15
    { code: '15',       label: 'Fuels consumed' },                     // col 16
    { code: '16',       label: 'Material consumed' },                  // col 17
    { code: '17',       label: 'Total inputs' },                       // col 18
    { code: '18',       label: 'Products and by-products' },           // col 19
    { code: '19',       label: 'Value of output' },                    // col 20
    { code: '20',       label: 'Depreciation' },                       // col 21
    { code: '21',       label: 'Net value added' },                    // col 22
    { code: '22',       label: 'Rent paid' },                          // col 23
    { code: '23',       label: 'Interest paid' },                      // col 24
    { code: '24',       label: 'Net income' },                         // col 25
    { code: '25',       label: 'Net fixed capital formation' },        // col 26
    { code: '26',       label: 'Gross fixed capital formation' },      // col 27
    { code: '27_total', label: 'Addition in stock — total' },          // col 28
    { code: '27a',      label: 'Addition in stock — material, fuels, etc.' }, // col 29
    { code: '27b',      label: 'Addition in stock — semi-finished goods' },    // col 30
    { code: '27c',      label: 'Addition in stock — finished goods' }, // col 31
    { code: '28',       label: 'Gross capital formation' },            // col 32
];

// DATA_COL_START: the 0-based sheet column index for code "1" (Number of factories).
// Sheet columns: col 0 = unused, col 1 = year label, col 2 = first data column.
const DATA_COL_START = 2;

// Strip commas and coerce to number. Returns null for blank / dash / non-numeric.
function parseNum(v) {
    const s = String(v == null ? '' : v).trim().replace(/,/g, '');
    if (s === '' || s === '-' || s === 'N/A') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

function main() {
    const wb = XLSX.read(fs.readFileSync(SRC), { type: 'buffer' });

    // The data lives on a single sheet ("Report 1") — scan all sheets, pick the one
    // that contains the column-number row ("1" "2" ... "32").
    let reportTitle = '';
    let units = '';
    const data = [];

    for (const sheetName of wb.SheetNames) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
            header   : 1,
            raw      : false,
            defval   : null,
            blankrows: true,
        });

        // Locate the column-number row: col 1 = "1", col 2 = "2" (first data characteristic).
        let dataStartRow = -1;

        for (let i = 0; i < Math.min(rows.length, 12); i++) {
            const row = rows[i] || [];

            // Row 1 (0-based): report title
            if (i === 1) {
                const t = String(row[1] || '').trim();
                if (t) reportTitle = t;
            }

            // Row 3 (0-based): units note (strip parentheses if present)
            if (i === 3) {
                const u = String(row[1] || '').trim().replace(/^\(|\)$/g, '');
                if (u) units = u;
            }

            // Column-number row (row 7, 0-based): col 1 = "1", col 2 = "2".
            const c1 = String(row[1] == null ? '' : row[1]).trim();
            const c2 = String(row[2] == null ? '' : row[2]).trim();
            if (c1 === '1' && c2 === '2') {
                dataStartRow = i + 1;
                break;
            }
        }

        if (dataStartRow < 0) continue; // not the right sheet

        // Parse data rows.
        for (let i = dataStartRow; i < rows.length; i++) {
            const row = rows[i] || [];
            const rawYear = String(row[1] == null ? '' : row[1]).trim();

            // Skip blank, notes, and source rows.
            if (!rawYear) continue;
            if (/^(Note|Source)/i.test(rawYear)) continue;

            // Accept rows whose first cell looks like a financial year "YYYY-YY".
            if (!/^\d{4}-\d{2}/.test(rawYear)) continue;

            const year = rawYear.replace(/\s+$/, ''); // strip trailing spaces

            const values = {};
            CHARACTERISTICS.forEach((ch, idx) => {
                values[ch.code] = parseNum(row[DATA_COL_START + idx]);
            });

            data.push({ year, values });
        }

        break; // found and processed
    }

    if (data.length === 0) throw new Error('No data rows found — check source file path and sheet structure');

    const result = {
        reportTitle : reportTitle || 'Annual survey of industries — principal characteristics',
        units,
        characteristics: CHARACTERISTICS.map(({ code, label }) => ({ code, label })),
        data,
    };

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(result));

    selfCheck(result);

    console.log(
        `wrote ${data.length} annual rows → ${OUT} ` +
        `(newest ${data[0].year}, oldest ${data[data.length - 1].year}; ` +
        `${result.characteristics.length} characteristics)`,
    );
}

// --- Self-check: exit non-zero if the output deviates from known facts ---
function selfCheck(r) {
    const fail = (msg) => {
        console.error(`SELF-CHECK FAILED: ${msg}`);
        process.exit(1);
    };

    // 1) At least 30 data rows (source has ~34 years).
    if (r.data.length < 30) {
        fail(`expected ≥30 annual rows, got ${r.data.length}`);
    }

    // 2) Characteristics count must be 31 (codes 1..26, 27_total, 27a, 27b, 27c, 28).
    if (r.characteristics.length !== 31) {
        fail(`expected 31 characteristics, got ${r.characteristics.length}`);
    }

    // 3) Years must be unique.
    const years = r.data.map((d) => d.year);
    if (new Set(years).size !== years.length) {
        fail('duplicate year labels found');
    }

    // 4) Years must be strictly decreasing (newest-first).
    for (let i = 1; i < years.length; i++) {
        const prev = parseInt(years[i - 1], 10);
        const curr = parseInt(years[i], 10);
        if (!Number.isNaN(prev) && !Number.isNaN(curr) && prev <= curr) {
            fail(`years not strictly newest-first at position ${i}: ${years[i - 1]} then ${years[i]}`);
        }
    }

    // 5) Known cell values (verified against the source xlsx).
    const byYear = Object.fromEntries(r.data.map((d) => [d.year, d.values]));

    const knownCells = [
        // col 2 = factories: 2023-24=260061, 2022-23=253334, 1990-91=110179
        { year: '2023-24', code: '1',  want: 260061 },
        { year: '2022-23', code: '1',  want: 253334 },
        { year: '1990-91', code: '1',  want: 110179 },
        // col 20 = value of output: 2022-23=14486602.28
        { year: '2022-23', code: '19', want: 14486602.28 },
        // col 22 = net value added: 2022-23=1880411.13
        { year: '2022-23', code: '21', want: 1880411.13 },
        // col 7 = workers: 2021-22=13609931
        { year: '2021-22', code: '6',  want: 13609931 },
    ];

    for (const { year, code, want } of knownCells) {
        if (!byYear[year]) {
            fail(`known year missing: ${year}`);
        }
        const got = byYear[year][code];
        if (got == null || Math.abs(got - want) > 0.01) {
            fail(`[${year}][${code}] expected ${want}, got ${got}`);
        }
    }

    console.log('self-check passed: row count, year ordering, uniqueness, and 5 known cells OK');
}

main();

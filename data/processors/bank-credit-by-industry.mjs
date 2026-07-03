// Bank credit by industry processor — Table 16 of the Monthly RBI Bulletin
// (money-and-banking). The workbook has a single sheet ("New Format") with
// industry rows in the stub and period columns across the top. We emit
// out/bank-credit-by-industry.json with every period included in full.
//
// Sheet layout ("New Format"):
//   row 0            blank
//   row 1 (col 1)    "Industry - Wise Deployment Of Bank Credit"
//   row 2            blank
//   row 3 (col 1)    "(Amount in Rupees Crores)"
//   row 4            blank
//   row 5 (col 1)    "Serial No" | col 2: "Industry" | cols 3+: "Outstanding as on"
//   row 6 (col 1)    null | col 2: null | cols 3+: period dates like
//                    "January,  18 2019" … "December,  31 2025" (84 date columns,
//                    0-indexed cols 3–86)
//   rows 7+          industry rows: serial code in col 1, label in col 2,
//                    float amounts in cols 3+
//   row 52+          notes / source text — skipped
//
// Values are decimal (e.g. 2715406.47). Blank cells become null.
// The period date format carries a comma: "January,  18 2019" — preserved as-is
// in the output periods array.
import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(
    __dirname,
    '..', 'publications', 'monthly-rbi-bulletin', 'money-and-banking',
    'table-16-industry-wise-deployment-of-bank-credit.xlsx',
);
const OUT = path.join(__dirname, 'out', 'bank-credit-by-industry.json');

const REPORT_TITLE = 'Industry-wise deployment of bank credit (Table 16)';
const UNIT         = 'Rupees crores';

// Map from serial code (as it appears in col 1) to canonical industry label.
// The 42 rows are in the order they appear in the sheet.
const INDUSTRY_LABELS = new Map([
    ['2',      'Industries (2.1 to 2.19)'],
    ['2.1',    'Mining & Quarrying (incl. Coal)'],
    ['2.2',    'Food Processing'],
    ['2.2.1',  'Sugar'],
    ['2.2.2',  'Edible Oils & Vanaspati'],
    ['2.2.3',  'Tea'],
    ['2.2.4',  'Others'],
    ['2.3',    'Beverage & Tobacco'],
    ['2.4',    'Textiles'],
    ['2.4.1',  'Cotton Textiles'],
    ['2.4.2',  'Jute Textiles'],
    ['2.4.3',  'Man-Made Textiles'],
    ['2.4.4',  'Other Textiles'],
    ['2.5',    'Leather & Leather Products'],
    ['2.6',    'Wood & Wood Products'],
    ['2.7',    'Paper & Paper Products'],
    ['2.8',    'Petroleum, Coal Products & Nuclear Fuels'],
    ['2.9',    'Chemicals & Chemical Products'],
    ['2.9.1',  'Fertiliser'],
    ['2.9.2',  'Drugs & Pharmaceuticals'],
    ['2.9.3',  'Petro Chemicals'],
    ['2.9.4',  'Others'],
    ['2.10',   'Rubber, Plastic & their Products'],
    ['2.11',   'Glass & Glassware'],
    ['2.12',   'Cement & Cement Products'],
    ['2.13',   'Basic Metal & Metal Product'],
    ['2.13.1', 'Iron & Steel'],
    ['2.13.2', 'Other Metal & Metal Product'],
    ['2.14',   'All Engineering'],
    ['2.14.1', 'Electronics'],
    ['2.14.2', 'Others'],
    ['2.15',   'Vehicles, Vehicle Parts & Transport Equipment'],
    ['2.16',   'Gems & Jewellery'],
    ['2.17',   'Construction'],
    ['2.18',   'Infrastructure'],
    ['2.18.1', 'Power'],
    ['2.18.2', 'Telecommunications'],
    ['2.18.3', 'Roads'],
    ['2.18.4', 'Airports'],
    ['2.18.5', 'Ports'],
    ['2.18.6', 'Railways'],
    ['2.18.7', 'Other Infrastructure'],
    ['2.19',   'Other Industries'],
]);

// Parent code = drop the last dotted segment ("2.2.1" -> "2.2"; "2.1" -> "2";
// "2" -> null, as it is the sole top-level row).
function parentCode(code) {
    const idx = code.lastIndexOf('.');
    return idx === -1 ? null : code.slice(0, idx);
}

// Numeric parse: strip commas, treat blank / "-" / "N/A" / nullish as null,
// otherwise Number(). Round to 2 decimal places to match source precision.
function parseValue(raw) {
    if (raw == null) return null;
    const s = String(raw).trim().replaceAll(',', '');
    if (s === '' || s === '-' || s === 'N/A') return null;
    const val = Number(s);
    if (Number.isNaN(val)) return null;
    // Round to 2 d.p. to avoid floating-point drift (source values are 2 d.p.).
    return Math.round(val * 100) / 100;
}

function main() {
    const wb = XLSX.read(fs.readFileSync(SRC), { type : 'buffer' });

    // The workbook has exactly one sheet ("New Format"). Fail loudly if the
    // layout changes unexpectedly.
    if (wb.SheetNames.length !== 1) {
        throw new Error(`Expected 1 sheet, got ${wb.SheetNames.length}: ${wb.SheetNames.join(', ')}`);
    }
    const ws = wb.Sheets[wb.SheetNames[0]];

    // raw:false so date-formatted cells come through as their display string
    // rather than an Excel serial number.
    const rows = XLSX.utils.sheet_to_json(ws, { header : 1, raw : false });

    // --- Locate the period header row (row index 6) -----------------------
    // Row 5 carries "Serial No" / "Industry" / "Outstanding as on";
    // row 6 carries the actual date strings in cols 3+.
    // Find the period row defensively.
    let periodRowIdx = -1;
    for (let r = 4; r < 10 && r < rows.length; r++) {
        const row = rows[r] || [];
        // The period row has no code/label in cols 1-2 but has date strings in col 3.
        const thirdCell = String(row[3] || '').trim();
        if (thirdCell.length > 0 && /[A-Za-z].*\d{4}/.test(thirdCell)) {
            periodRowIdx = r;
            break;
        }
    }
    if (periodRowIdx === -1) {
        throw new Error('Could not locate the period header row in the sheet');
    }

    const periodRow = rows[periodRowIdx] || [];
    // Period columns begin at index 3.
    const periods = [];
    const periodColIndices = [];
    for (let c = 3; c < periodRow.length; c++) {
        const cell = String(periodRow[c] || '').trim();
        if (cell.length > 0) {
            periods.push(cell);
            periodColIndices.push(c);
        }
    }
    if (periods.length === 0) {
        throw new Error('No period columns found in the period header row');
    }

    // --- Parse industry rows (start from row after period header) ----------
    const items = [];
    for (let r = periodRowIdx + 1; r < rows.length; r++) {
        const row = rows[r] || [];
        const rawCode = String(row[1] || '').trim();

        // Skip blank rows and notes/footer rows.
        if (!INDUSTRY_LABELS.has(rawCode)) continue;

        const label  = INDUSTRY_LABELS.get(rawCode);
        const parent = parentCode(rawCode);
        const values = periodColIndices.map((c) => parseValue(row[c]));

        items.push({ code : rawCode, label, parent, values });
    }

    if (items.length !== INDUSTRY_LABELS.size) {
        throw new Error(
            `Expected ${INDUSTRY_LABELS.size} industry rows, parsed ${items.length}. ` +
            `Missing: ${[...INDUSTRY_LABELS.keys()].filter(k => !items.find(i => i.code === k)).join(', ')}`,
        );
    }

    const result = { reportTitle : REPORT_TITLE, unit : UNIT, periods, items };
    fs.writeFileSync(OUT, JSON.stringify(result));

    const sizeMB = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
    console.log(`wrote ${OUT} (${sizeMB} MB)`);
    console.log(`  ${items.length} industries × ${periods.length} periods`);
    console.log(`  first period : ${periods[0]}`);
    console.log(`  last period  : ${periods[periods.length - 1]}`);

    selfCheck(result);
    console.log('self-check passed');
}

// ---------------------------------------------------------------------------
// Self-check: fail loudly (non-zero exit) if the parse drifts from the source.
//
// Known cells verified directly against the sheet (row, column values):
//   item "2"      (Industries total),          period "January,  18 2019" → 2715406.47
//   item "2.9.2"  (Drugs & Pharmaceuticals),   period "January,  18 2019" → 51186.01
//   item "2.18.1" (Power),                     period "January,  18 2019" → 557230.89
// ---------------------------------------------------------------------------
const KNOWN_CELLS = [
    // [ itemCode, periodLabel, expectedValue ]
    ['2',      'January,  18 2019', 2715406.47],
    ['2.9.2',  'January,  18 2019', 51186.01],
    ['2.18.1', 'January,  18 2019', 557230.89],
];

function fail(msg) {
    console.error(`SELF-CHECK FAILED: ${msg}`);
    process.exit(1);
}

function selfCheck(result) {
    // Periods must exist and be unique.
    if (!result.periods || result.periods.length === 0) {
        fail('periods array is empty');
    }
    const seenPeriods = new Set();
    for (const p of result.periods) {
        if (seenPeriods.has(p)) fail(`duplicate period "${p}"`);
        seenPeriods.add(p);
    }

    // Periods must be in ascending chronological order (oldest first).
    // Parse "January,  18 2019" -> extract the year and month name.
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const periodToOrdinal = (p) => {
        // Strip comma and normalise whitespace: "January,  18 2019" -> ["January", "18", "2019"]
        const parts = p.replace(',', '').trim().split(/\s+/);
        const monthIdx = MONTHS.indexOf(parts[0]);
        const year = Number(parts[parts.length - 1]);
        return year * 12 + (monthIdx < 0 ? 0 : monthIdx);
    };
    for (let i = 1; i < result.periods.length; i++) {
        const prev = periodToOrdinal(result.periods[i - 1]);
        const curr = periodToOrdinal(result.periods[i]);
        if (curr < prev) {
            fail(`periods not in ascending order at index ${i}: "${result.periods[i - 1]}" -> "${result.periods[i]}"`);
        }
    }

    // Items must include all expected industry codes.
    const codeToItem = new Map(result.items.map((it) => [it.code, it]));
    for (const code of INDUSTRY_LABELS.keys()) {
        if (!codeToItem.has(code)) fail(`missing industry code "${code}"`);
    }

    // Known-cell spot checks.
    const periodIdx = new Map(result.periods.map((p, i) => [p, i]));
    for (const [code, period, expected] of KNOWN_CELLS) {
        const pi = periodIdx.get(period);
        if (pi == null) fail(`period "${period}" not found`);
        const item = codeToItem.get(code);
        if (!item) fail(`industry code "${code}" not found`);
        const got = item.values[pi];
        if (got !== expected) {
            fail(`[${code}, "${period}"] expected ${expected}, got ${got}`);
        }
    }
}

main();

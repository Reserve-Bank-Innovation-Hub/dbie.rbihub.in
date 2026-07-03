// Processor: public-distribution-system-procurement-off-take-and-stocks
// Source: Handbook — Annual Series — Output and Prices
//
// Source xlsx carries one sheet with annual data on public distribution system
// procurement, off-take and stocks of rice and wheat in India, newest-first
// from "2025-26" back to "1950-51". Layout:
//   row 1  title "Public Distribution System - Procurement, Off-Take and Stocks"
//   row 3  units "(Lakhs Tonnes)"
//   row 5  group headers: Year | Procurement (cols 2-4) | Off-take (cols 5-7) | Stocks (cols 8-10)
//   row 6  sub-column labels: Rice, Wheat, Total under each group
//   row 7  column numbers 1..10
//   rows 8..83  data rows (newest-first), '-' for missing values
//   row 84 notes/source footnote
//
// Emits (newest-first):
//   out/public-distribution-system-procurement-off-take-and-stocks.json
//     {
//       reportTitle, units, columns,
//       data: [{ year, proc_rice, proc_wheat, proc_total,
//                offt_rice, offt_wheat, offt_total,
//                stck_rice, stck_wheat, stck_total } …]
//     }

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
    'Public Distribution System - Procurement, Off-Take and Stocks.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');
const OUT = path.join(OUT_DIR, 'public-distribution-system-procurement-off-take-and-stocks.json');

function cellStr(row, i) {
    const v = row[i];
    return v == null ? '' : String(v);
}

// Strip commas; '-' / '' / 'N/A' → null. Real zeros are preserved.
function parseNum(s) {
    s = String(s == null ? '' : s).trim().replace(/,/g, '');
    if (s === '' || s === '-' || s.toLowerCase() === 'n/a') return null;
    const val = Number(s);
    return Number.isFinite(val) ? val : null;
}

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

            // Column-number row "1","2",…,"10" immediately precedes the data rows.
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

            // Only accept rows whose first column looks like a financial-year label, e.g. "2025-26".
            if (!/^\d{4}-\d{2}/.test(year)) continue;

            data.push({
                year       : year.replace(/\s+$/, ''), // trim trailing spaces
                proc_rice  : parseNum(row[2]),
                proc_wheat : parseNum(row[3]),
                proc_total : parseNum(row[4]),
                offt_rice  : parseNum(row[5]),
                offt_wheat : parseNum(row[6]),
                offt_total : parseNum(row[7]),
                stck_rice  : parseNum(row[8]),
                stck_wheat : parseNum(row[9]),
                stck_total : parseNum(row[10]),
            });
        }

        if (data.length === 0) throw new Error('no valid data rows found in sheet');

        return {
            reportTitle : reportTitle || 'Public Distribution System - Procurement, Off-Take and Stocks',
            units       : 'Lakhs tonnes',
            columns     : [
                { code: 'proc_rice',  label: 'Procurement — rice',  group: 'Procurement' },
                { code: 'proc_wheat', label: 'Procurement — wheat', group: 'Procurement' },
                { code: 'proc_total', label: 'Procurement — total', group: 'Procurement' },
                { code: 'offt_rice',  label: 'Off-take — rice',     group: 'Off-take'    },
                { code: 'offt_wheat', label: 'Off-take — wheat',    group: 'Off-take'    },
                { code: 'offt_total', label: 'Off-take — total',    group: 'Off-take'    },
                { code: 'stck_rice',  label: 'Stocks — rice',       group: 'Stocks'      },
                { code: 'stck_wheat', label: 'Stocks — wheat',      group: 'Stocks'      },
                { code: 'stck_total', label: 'Stocks — total',      group: 'Stocks'      },
            ],
            data,
        };
    }

    throw new Error('could not locate the data header row in any sheet');
}

// --- self-check: fail loudly (non-zero exit) if shape or known cells drift ---
function selfCheck(out) {
    const { data } = out;
    const errors   = [];

    if (!Array.isArray(data) || data.length < 70) {
        errors.push(`expected ≥70 annual rows, got ${data ? data.length : 'n/a'}`);
    }

    // Known cells verified against the source sheet.
    const known = [
        {
            year       : '2024-25',
            proc_rice  : 544.79,
            proc_wheat : 266.05,
            proc_total : 810.84,
            offt_rice  : 427.02,
            offt_wheat : 222.47,
            offt_total : 649.49,
            stck_rice  : 631,
            stck_wheat : 117.9,
            stck_total : 750.3,
        },
        {
            year       : '2023-24',
            proc_rice  : 525.48,
            proc_wheat : 262,
            proc_total : 787.48,
        },
        {
            year      : '2011-12',
            proc_rice : 350.6,
            proc_wheat: 283.34,
        },
    ];

    for (const exp of known) {
        const row = data.find((r) => r.year === exp.year);
        if (!row) { errors.push(`known year missing: ${exp.year}`); continue; }
        for (const [ field, val ] of Object.entries(exp)) {
            if (field === 'year') continue;
            if (val == null) continue;
            const got = row[field];
            if (Math.abs((got ?? NaN) - val) > 0.015) {
                errors.push(`${exp.year} ${field}: expected ${val}, got ${got}`);
            }
        }
    }

    // Years must be unique.
    const keys = data.map((r) => r.year);
    const uniq = new Set(keys);
    if (uniq.size !== keys.length) {
        errors.push(`years not unique: ${keys.length} rows, ${uniq.size} distinct`);
    }

    // Ordered newest-first (strictly decreasing by the 4-digit start year).
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

function main() {
    const out    = parse(fs.readFileSync(SRC));
    const errors = selfCheck(out);

    if (errors.length > 0) {
        console.error('public-distribution-system self-check FAILED:');
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

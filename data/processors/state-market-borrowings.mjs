// Processor: state-market-borrowings — Monthly RBI Bulletin Table 51.
//
// Source xlsx has TWO sheets — "Annual" and "Monthly" — both following the same layout:
//   row 2  title "Market Borrowings of State Governments"
//   row 4  "(₹ Crores)"
//   row 6  period spans (forward-fill; Annual = fiscal years, Monthly = calendar months)
//   row 7  "Gross Amount Raised" / "Net Amount Raised" alternating per period
//   rows 8… state/UT data rows; col[1] = state name, col[2+] = values
//   last data row = "Total"; last row = source/notes
//
// Annual sheet (A1:S40): 9 fiscal years (2016-17 → 2024-25), 31 states + Total.
// Monthly sheet (A1:GG41): 94 calendar months (Apr 2018 → Jan 2026), same states.
//
// Emits → out/state-market-borrowings.json
//   { reportTitle, unit, annual: { columns, data }, monthly: { columns, data } }
//     columns: [{ period, measure }]  (measure = "gross" | "net")
//     data: [{ state, values: (number | null)[] }]

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC  = path.join(
    __dirname,
    '../publications/monthly-rbi-bulletin/occasional-series/table-51-market-borrowings-of-state-governments.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// "1,23,456.789" → 123456.789; "-" / blank → null.
function parseNum(v) {
    const s = String(v == null ? '' : v).trim().replace(/,/g, '');
    if (s === '' || s === '-' || s === 'N/A') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

function cellStr(row, i) {
    const v = row[i];
    return v == null ? '' : String(v).trim();
}

// Parse either sheet using the shared layout convention.
// Returns { columns: [{ period, measure }], data: [{ state, values }] }
function parseSheet(ws) {
    const rows = XLSX.utils.sheet_to_json(ws, {
        header    : 1,
        raw       : false,
        defval    : null,
        blankrows : true,
    });

    // --- Row 6 (index 5): period spans — forward-fill non-null values ---
    const periodRow   = rows[5] || [];
    const measureRow  = rows[6] || [];
    // Col 0 is always blank; col 1 is "State/Union Territory"; data starts at col 2.
    const columns = [];
    let currentPeriod = '';
    for (let ci = 2; ci < measureRow.length; ci++) {
        const p = cellStr(periodRow, ci);
        if (p !== '') currentPeriod = p;

        const m = cellStr(measureRow, ci).toLowerCase();
        let measure;
        if (m.includes('gross')) measure = 'gross';
        else if (m.includes('net'))   measure = 'net';
        else continue; // skip blank/unexpected columns

        columns.push({ period : currentPeriod, measure });
    }

    // --- Data rows: state name in col 1, values from col 2 ---
    const data = [];
    for (let ri = 7; ri < rows.length; ri++) {
        const row   = rows[ri] || [];
        const state = cellStr(row, 1);
        if (!state) continue;
        // Stop at the source/notes row (long text containing "Source:")
        if (/source\s*:/i.test(state)) break;

        const values = [];
        for (let ci = 2; ci < 2 + columns.length; ci++) {
            values.push(parseNum(row[ci]));
        }
        data.push({ state, values });
    }

    return { columns, data };
}

function parse(buf) {
    const wb = XLSX.read(buf, { type : 'buffer' });
    if (wb.SheetNames.length === 0) throw new Error('no sheets found');

    const reportTitle = 'Market Borrowings of State Governments';
    const unit        = '₹ Crores';

    const annual  = parseSheet(wb.Sheets['Annual']);
    const monthly = parseSheet(wb.Sheets['Monthly']);

    return { reportTitle, unit, annual, monthly };
}

// --- Self-check anchors verified against the source sheet ---
function selfCheck(out) {
    const errors = [];

    const { annual, monthly } = out;

    // Minimum row and column counts.
    if (annual.data.length < 25) {
        errors.push(`annual: expected ≥25 rows, got ${annual.data.length}`);
    }
    if (monthly.data.length < 25) {
        errors.push(`monthly: expected ≥25 rows, got ${monthly.data.length}`);
    }
    if (annual.columns.length < 16) {
        errors.push(`annual: expected ≥16 columns (9 years × 2 measures minus last net), got ${annual.columns.length}`);
    }
    if (monthly.columns.length < 180) {
        errors.push(`monthly: expected ≥180 columns (90+ months × 2), got ${monthly.columns.length}`);
    }

    // Annual: Andhra Pradesh 2024-25 gross = 78205.061, net = 57122.661.
    const ap = annual.data.find(r => r.state === 'Andhra Pradesh');
    if (!ap) {
        errors.push('annual: Andhra Pradesh row not found');
    } else {
        const col2024Gross = annual.columns.findIndex(c => c.period.trim() === '2024-25' && c.measure === 'gross');
        const col2024Net   = annual.columns.findIndex(c => c.period.trim() === '2024-25' && c.measure === 'net');
        if (col2024Gross < 0) {
            errors.push('annual: 2024-25 gross column not found');
        } else if (Math.abs((ap.values[col2024Gross] ?? NaN) - 78205.061) > 0.01) {
            errors.push(`annual: AP 2024-25 gross expected 78205.061, got ${ap.values[col2024Gross]}`);
        }
        if (col2024Net < 0) {
            errors.push('annual: 2024-25 net column not found');
        } else if (Math.abs((ap.values[col2024Net] ?? NaN) - 57122.661) > 0.01) {
            errors.push(`annual: AP 2024-25 net expected 57122.661, got ${ap.values[col2024Net]}`);
        }
    }

    // Annual: Andhra Pradesh 2023-24 gross = 68400.
    if (ap) {
        const col2023Gross = annual.columns.findIndex(c => c.period.trim() === '2023-24' && c.measure === 'gross');
        if (col2023Gross < 0) {
            errors.push('annual: 2023-24 gross column not found');
        } else if (Math.abs((ap.values[col2023Gross] ?? NaN) - 68400) > 0.01) {
            errors.push(`annual: AP 2023-24 gross expected 68400, got ${ap.values[col2023Gross]}`);
        }
    }

    // Annual: Arunachal Pradesh 2024-25 gross = 1010, net = 704.
    const aru = annual.data.find(r => r.state === 'Arunachal Pradesh');
    if (!aru) {
        errors.push('annual: Arunachal Pradesh row not found');
    } else {
        const col2024Gross = annual.columns.findIndex(c => c.period.trim() === '2024-25' && c.measure === 'gross');
        const col2024Net   = annual.columns.findIndex(c => c.period.trim() === '2024-25' && c.measure === 'net');
        if (col2024Gross >= 0 && Math.abs((aru.values[col2024Gross] ?? NaN) - 1010) > 0.01) {
            errors.push(`annual: Arunachal Pradesh 2024-25 gross expected 1010, got ${aru.values[col2024Gross]}`);
        }
        if (col2024Net >= 0 && Math.abs((aru.values[col2024Net] ?? NaN) - 704) > 0.01) {
            errors.push(`annual: Arunachal Pradesh 2024-25 net expected 704, got ${aru.values[col2024Net]}`);
        }
    }

    // State names must be unique.
    const annualStates  = annual.data.map(r => r.state);
    const monthlyStates = monthly.data.map(r => r.state);
    if (new Set(annualStates).size !== annualStates.length) {
        errors.push('annual: state names not unique');
    }
    if (new Set(monthlyStates).size !== monthlyStates.length) {
        errors.push('monthly: state names not unique');
    }

    // Each data row must have values aligned to columns.
    for (const row of annual.data) {
        if (row.values.length !== annual.columns.length) {
            errors.push(`annual: ${row.state} has ${row.values.length} values but ${annual.columns.length} columns`);
            break;
        }
    }
    for (const row of monthly.data) {
        if (row.values.length !== monthly.columns.length) {
            errors.push(`monthly: ${row.state} has ${row.values.length} values but ${monthly.columns.length} columns`);
            break;
        }
    }

    return errors;
}

function main() {
    const out = parse(fs.readFileSync(XLSX_SRC));

    const errors = selfCheck(out);
    if (errors.length > 0) {
        console.error('state-market-borrowings self-check FAILED:');
        errors.forEach(e => console.error('  ' + e));
        process.exit(1);
    }

    fs.mkdirSync(OUT_DIR, { recursive : true });
    fs.writeFileSync(
        path.join(OUT_DIR, 'state-market-borrowings.json'),
        JSON.stringify(out),
    );

    console.log(
        `wrote annual: ${out.annual.columns.length} columns (${out.annual.columns.length / 2} years), ` +
        `${out.annual.data.length} states; ` +
        `monthly: ${out.monthly.columns.length} columns (${out.monthly.columns.length / 2} months), ` +
        `${out.monthly.data.length} states; self-check passed`,
    );
}

main();

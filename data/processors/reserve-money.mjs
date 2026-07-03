// Processor: reserve-money (Table 11, Monthly RBI Bulletin — Money and Banking).
//
// Source xlsx — sheet "Report(i)":
//   row 0          blank
//   row 1 (col 1)  "Reserve Money : Components and Sources" (report title)
//   row 3 (col 1)  "Rupees Millions" (unit)
//   row 5          group headers: col 2 = "Reserve Money (…formula…)",
//                  col 3 = "1 Components", col 6 = "2 Sources"
//   row 6          sub-headers: col 2 = Reserve Money total, col 3–5 = Components 1.1–1.3,
//                  col 6–10 = Sources 2.1–2.5
//   rows 7–1301    data rows — col 1 = "DD Mon YYYY" date, cols 2–10 = values
//   row 1302       blank
//   rows 1303+     Note/Source footer lines
//
// Date format: "31 Mar 2026" (day month year). Data is newest-first.
//
// Emits: out/reserve-money.json
//   {
//     reportTitle : string,
//     unit        : string,          // "Rupees millions"
//     columns     : ReserveMoneyColumn[],
//     data        : [{ date, values: (number|null)[] }, …],   // newest-first
//   }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
    __dirname,
    '../publications/monthly-rbi-bulletin/money-and-banking',
    'table-11-reserve-money-components-and-sources.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Column specification — order matches xlsx columns 2–10.
const COLUMNS = [
    { code : 'RM',  label : 'Reserve money',                                  group : 'total'      },
    { code : '1.1', label : 'Currency in circulation',                         group : 'components' },
    { code : '1.2', label : "Bankers' deposits with RBI",                      group : 'components' },
    { code : '1.3', label : "'Other' deposits with RBI",                       group : 'components' },
    { code : '2.1', label : 'Net Reserve Bank credit to government',           group : 'sources'    },
    { code : '2.2', label : 'Reserve Bank credit to banks',                    group : 'sources'    },
    { code : '2.3', label : 'Reserve Bank credit to commercial sector',        group : 'sources'    },
    { code : '2.4', label : 'Net foreign exchange assets of RBI',              group : 'sources'    },
    { code : '2.5', label : "Government's currency liabilities to the public", group : 'sources'    },
];

// Month names for date parsing ("31 Mar 2026" → comparable integer).
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Returns null for blank/dash; parses decimal numbers directly (no commas in source).
function parseNum(raw) {
    if (raw == null) return null;
    const s = String(raw).trim();
    if (s === '' || s === '-' || s === 'N/A') return null;
    const val = Number(s);
    return Number.isFinite(val) ? val : null;
}

// "31 Mar 2026" → comparable integer year*10000 + monthIdx*100 + day, or null if unparseable.
function dateKey(label) {
    const m = label.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
    if (!m) return null;
    const day  = parseInt(m[1], 10);
    const mIdx = MONTH_NAMES.indexOf(m[2]);
    const year = parseInt(m[3], 10);
    if (mIdx < 0 || day < 1 || day > 31) return null;
    return year * 10000 + mIdx * 100 + day;
}

function parse(buf) {
    const wb = XLSX.read(buf, { type : 'buffer' });

    // Locate the target sheet by name; fall back to first sheet.
    const sheetName = wb.SheetNames.find(n => /report/i.test(n)) || wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
        header   : 1,
        raw      : false,   // return all cells as strings (numbers are already decimal)
        defval   : null,
        blankrows: true,
    });

    // Extract report title from row 1, col 1.
    const rawTitle = String((rows[1] || [])[1] || '').trim();
    const reportTitle = rawTitle || 'Reserve money — components and sources';

    // Data rows start at index 7 (0-based); skip rows where col 1 is blank or
    // a footer annotation (Note…, Source…, See…).
    const data = [];
    for (let i = 7; i < rows.length; i++) {
        const row = rows[i] || [];
        const rawDate = String(row[1] == null ? '' : row[1]).trim();
        if (rawDate === '') continue;
        if (/^(Note|Source|See)/i.test(rawDate)) continue;
        if (dateKey(rawDate) == null) continue; // not a data row

        const values = [];
        for (let c = 2; c <= 10; c++) {
            values.push(parseNum(row[c]));
        }
        data.push({ date : rawDate, values });
    }

    if (data.length === 0) throw new Error('no valid data rows found in sheet');

    return {
        reportTitle,
        unit    : 'Rupees millions',
        columns : COLUMNS,
        data,
    };
}

// --- self-check: fail loudly (non-zero exit) if the shape or known cells drift ---
function selfCheck(out) {
    const { data } = out;
    const errors   = [];

    if (!Array.isArray(data) || data.length < 1290) {
        errors.push(`expected ≥1290 data rows, got ${data ? data.length : 'n/a'}`);
    }

    // Known cells — verified against the source sheet.
    const known = [
        { date : '31 Mar 2026', colIdx : 0, expected : 51200349.91,  desc : 'reserve_money'      },
        { date : '31 Mar 2026', colIdx : 7, expected : 63436721.49,  desc : 'net_forex'          },
        { date : '31 Dec 2025', colIdx : 0, expected : 47991354.76,  desc : 'reserve_money'      },
    ];
    for (const { date, colIdx, expected, desc } of known) {
        const row = data.find(r => r.date === date);
        if (!row) { errors.push(`known date missing: "${date}"`); continue; }
        const got = row.values[colIdx];
        if (got !== expected) {
            errors.push(`${date} ${desc} (col ${colIdx}): expected ${expected}, got ${got}`);
        }
    }

    // Dates must be unique.
    const keys = data.map(r => dateKey(r.date));
    if (keys.some(k => k == null)) errors.push('some dates did not parse to a sortable key');
    const uniq = new Set(keys);
    if (uniq.size !== keys.length) {
        errors.push(`dates not unique: ${keys.length} rows, ${uniq.size} distinct`);
    }

    // Ordered strictly newest-first (strictly descending keys).
    for (let i = 1; i < keys.length; i++) {
        if (keys[i - 1] != null && keys[i] != null && keys[i - 1] <= keys[i]) {
            errors.push(
                `not strictly newest-first at row ${i}: "${data[i - 1].date}" then "${data[i].date}"`,
            );
            break;
        }
    }

    return errors;
}

function main() {
    const out = parse(fs.readFileSync(XLSX_SRC));

    const errors = selfCheck(out);
    if (errors.length > 0) {
        console.error('reserve-money self-check FAILED:');
        errors.forEach(e => console.error('  ' + e));
        process.exit(1);
    }

    fs.mkdirSync(OUT_DIR, { recursive : true });
    fs.writeFileSync(path.join(OUT_DIR, 'reserve-money.json'), JSON.stringify(out));

    console.log(
        `wrote ${out.data.length} data rows ` +
        `(newest ${out.data[0].date}, oldest ${out.data[out.data.length - 1].date}; ` +
        `unit: ${out.unit}); self-check passed`,
    );
}

main();

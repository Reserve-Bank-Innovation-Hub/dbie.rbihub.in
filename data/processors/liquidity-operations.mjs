// Processor: liquidity-operations — RBI Bulletin Table 3.
//
// Source xlsx carries one sheet ("Report 1") with daily RBI liquidity
// operations from Nov 1, 2012 to the latest available date. Layout:
//   row 1  blank
//   row 2  title "Liquidity Operations by RBI"
//   row 3  blank
//   row 4  "(Rupees Crores)"
//   row 5  blank
//   row 6  group headers (LAF, OMO, etc.)
//   row 7  leaf headers: Date | Repo | Reverse Repo | ... (16 data cols)
//   row 8  column numbers 1–16 (skip)
//   rows 9… data, newest-first ("Apr 5, 2026" format)
//
// Column mapping (0-indexed within each row array):
//   col[1]  = date string "MMM d, yyyy"
//   col[2]  = repo
//   col[3]  = reverse_repo
//   col[4]  = variable_rate_repo
//   col[5]  = variable_rate_reverse_repo
//   col[6]  = msf
//   col[7]  = sdf
//   col[8]  = standing_liquidity_facilities
//   col[9]  = omo_sale
//   col[10] = omo_purchase
//   col[11] = mss
//   col[12] = ltro
//   col[13] = tltro
//   col[14] = sltro_sfb
//   col[15] = special_reverse_repo
//   col[16] = slf_mutual_funds
//   col[17] = sls_nbfc_hfc
//
// Emits (newest-first):
//   out/liquidity-operations.json
//     { reportTitle, unit, data: [{ date, repo, reverse_repo, variable_rate_repo,
//       variable_rate_reverse_repo, msf, sdf, standing_liquidity_facilities,
//       omo_sale, omo_purchase, mss, ltro, tltro, sltro_sfb,
//       special_reverse_repo, slf_mutual_funds, sls_nbfc_hfc } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/rbi/table-03-liquidity-operations-by-rbi.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Month name → zero-padded number for parsing "Apr 5, 2026" style dates.
const MONTHS = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v).trim();
}

// "1,23,456.7" → 123456.7; "-" → null; negatives like "-450" are preserved.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// "Apr 5, 2026" → "Apr 5, 2026" (keep the source string as-is; no ISO conversion
// needed since the spec requires this format in the output). Also validates parse.
function parseDate(raw) {
  // Accept "Mon D, YYYY" or "Mon D, YYYY" with varying spacing.
  const m = raw.trim().match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
  if (!m) return null;
  const mon = MONTHS[m[1].slice(0, 1).toUpperCase() + m[1].slice(1, 3).toLowerCase()];
  if (!mon) return null;
  return `${m[1].slice(0, 1).toUpperCase()}${m[1].slice(1, 3).toLowerCase()} ${m[2]}, ${m[3]}`;
}

// Returns a comparable key "YYYYMMDD" for sort-order checking.
function dateKey(formatted) {
  const m = formatted.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
  if (!m) return '';
  const mon = MONTHS[m[1].slice(0, 1).toUpperCase() + m[1].slice(1, 3).toLowerCase()] || '00';
  return `${m[3]}${mon}${m[2].padStart(2, '0')}`;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
    header    : 1,
    raw       : false,
    defval    : null,
    blankrows : true,
  });

  // Row index 1 carries the report title.
  const reportTitle = cellStr(rows[1] || [], 1) || 'Liquidity Operations by RBI';

  // Data starts at row index 8 (rows 1–8 are headers/col-numbers).
  const DATA_START = 8;

  const data = [];
  for (let i = DATA_START; i < rows.length; i++) {
    const row = rows[i] || [];
    const raw = cellStr(row, 1);
    if (raw === '') continue;

    const date = parseDate(raw);
    if (!date) continue; // skip header remnants or trailing footnotes

    data.push({
      date                         : date,
      repo                         : parseNum(row[2]),
      reverse_repo                 : parseNum(row[3]),
      variable_rate_repo           : parseNum(row[4]),
      variable_rate_reverse_repo   : parseNum(row[5]),
      msf                          : parseNum(row[6]),
      sdf                          : parseNum(row[7]),
      standing_liquidity_facilities: parseNum(row[8]),
      omo_sale                     : parseNum(row[9]),
      omo_purchase                 : parseNum(row[10]),
      mss                          : parseNum(row[11]),
      ltro                         : parseNum(row[12]),
      tltro                        : parseNum(row[13]),
      sltro_sfb                    : parseNum(row[14]),
      special_reverse_repo         : parseNum(row[15]),
      slf_mutual_funds             : parseNum(row[16]),
      sls_nbfc_hfc                 : parseNum(row[17]),
    });
  }

  if (data.length === 0) throw new Error('no valid data rows found in sheet');

  return { reportTitle, unit: 'Rupees Crores', data };
}

// --- self-check: fail loudly (non-zero exit) if known cells or shape drifts ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 4100) {
    errors.push(`expected ≥4100 rows, got ${data ? data.length : 'n/a'}`);
  }

  // Anchor values read directly from the sheet.
  const known = [
    {
      date : 'Apr 5, 2026',
      check: (r) => r.msf === 1733 && r.sdf === 417370 && r.repo === null,
      desc : 'Apr 5, 2026: msf=1733, sdf=417370, repo=null',
    },
    {
      date : 'Apr 4, 2026',
      check: (r) => r.msf === 338 && r.sdf === 447817,
      desc : 'Apr 4, 2026: msf=338, sdf=447817',
    },
    {
      date : 'Nov 1, 2012',
      check: (r) => r.repo === 74125 && r.standing_liquidity_facilities === 515.5,
      desc : 'Nov 1, 2012: repo=74125, standing_liquidity_facilities=515.5',
    },
  ];

  for (const spec of known) {
    const row = data.find((r) => r.date === spec.date);
    if (!row) { errors.push(`known date missing: ${spec.date}`); continue; }
    if (!spec.check(row)) {
      errors.push(`${spec.date}: self-check failed — ${spec.desc} (got repo=${row.repo}, msf=${row.msf}, sdf=${row.sdf}, slf=${row.standing_liquidity_facilities})`);
    }
  }

  // Dates must be unique.
  const dates = data.map((r) => r.date);
  const uniq = new Set(dates);
  if (uniq.size !== dates.length) {
    errors.push(`dates not unique: ${dates.length} rows, ${uniq.size} distinct`);
  }

  // Ordered newest-first (strictly descending date keys).
  const keys = dates.map(dateKey);
  for (let i = 1; i < keys.length; i++) {
    if (keys[i - 1] <= keys[i]) {
      errors.push(`not strictly newest-first at row ${i}: ${data[i - 1].date} then ${data[i].date}`);
      break;
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('liquidity-operations self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'liquidity-operations.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} daily rows ` +
    `(newest ${out.data[0].date}, oldest ${out.data[out.data.length - 1].date}); ` +
    'self-check passed',
  );
}

main();

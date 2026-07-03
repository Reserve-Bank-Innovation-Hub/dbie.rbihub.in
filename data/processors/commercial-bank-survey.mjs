// Processor: commercial-bank-survey (fortnightly) — RBI Bulletin Table 12.
//
// Source xlsx carries one sheet ("Commercial Bank Survey") with fortnightly
// aggregate data across 33 series (liabilities + assets), newest-first from
// 2026-01-31 back to 1999-03-26.  Layout:
//   row 1  blank
//   row 2  title ("Commercial Bank Survey")
//   row 3  blank
//   row 4  units "(Rupees Crores)"
//   row 5  column codes: col B = "Fortnight", cols C–AI = series codes
//   row 6  column labels: verbose names
//   rows 7–706  data rows — col B = "YYYY-MM-DD", cols C–AI = numbers
//   row 707  blank
//   row 708  "Source : Reserve Bank Of India"
//
// Emits (newest-first):
//   out/commercial-bank-survey.json
//     { reportTitle, units, columns: [{code,rawCode,label}…], data: [{fortnight,…}…] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/money-and-banking/table-12-commercial-bank-survey.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Returns null for blank/dash/N/A so gaps remain distinct from real zeros.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// Full column map: [colIndex(0-based in row), rawCode, camelCode, label]
// colIndex 1 = date; series start at index 2.
const COLUMN_MAP = [
  [ 2,  'C.I',       'ci',          'Aggregate deposits of residents (C.I.1+C.I.2)' ],
  [ 3,  null,        'ciExMerger',  'Aggregate deposits of residents (excl. merger)' ],
  [ 4,  'C.I.1',     'ci1',         'Demand deposits' ],
  [ 5,  'C.I.2',     'ci2',         'Time deposits of residents (C.I.2.1+C.I.2.2)' ],
  [ 6,  null,        'ci2ExMerger', 'Time deposits of residents (excl. merger)' ],
  [ 7,  'C.I.2.1',   'ci21',        'Short-term time deposits' ],
  [ 8,  'C.I.2.1.1', 'ci211',       'Certificates of deposits (CDs)' ],
  [ 9,  'C.I.2.2',   'ci22',        'Long-term time deposits' ],
  [ 10, 'C.II',      'cii',         'Call/term funding from financial institutions' ],
  [ 11, 'S.I',       'si',          'Domestic credit (S.I.1+S.I.2)' ],
  [ 12, null,        'siExMerger',  'Domestic credit (excl. merger)' ],
  [ 13, 'S.I.1',     'si1',         'Credit to the government' ],
  [ 14, null,        'si1ExMerger', 'Credit to the government (excl. merger)' ],
  [ 15, 'S.I.2',     'si2',         'Credit to the commercial sector (S.I.2.1+S.I.2.2+S.I.2.3+S.I.2.4)' ],
  [ 16, null,        'si2ExMerger', 'Credit to the commercial sector (excl. merger)' ],
  [ 17, 'S.I.2.1',   'si21',        'Bank credit' ],
  [ 18, null,        'si21ExMerger','Bank credit (excl. merger)' ],
  [ 19, 'S.I.2.1.1', 'si211',       'Non-food credit' ],
  [ 20, null,        'si211ExMerger','Non-food credit (excl. merger)' ],
  [ 21, 'S.I.2.2',   'si22',        'Net credit to primary dealers' ],
  [ 22, 'S.I.2.3',   'si23',        'Investments in other approved securities' ],
  [ 23, 'S.I.2.4',   'si24',        'Other investments (in non-SLR securities)' ],
  [ 24, 'S.II',      'sii',         'Net foreign currency assets of commercial banks (S.II.1-S.II.2-S.II.3)' ],
  [ 25, 'S.II.1',    'sii1',        'Foreign currency assets' ],
  [ 26, 'S.II.2',    'sii2',        'Non-resident foreign currency repatriable fixed deposits' ],
  [ 27, 'S.II.3',    'sii3',        'Overseas foreign currency borrowings' ],
  [ 28, 'S.III',     'siii',        'Net bank reserves (S.III.1+S.III.2-S.III.3)' ],
  [ 29, 'S.III.1',   'siii1',       'Balances with the RBI' ],
  [ 30, 'S.III.2',   'siii2',       'Cash in hand' ],
  [ 31, 'S.III.3',   'siii3',       'Loans and advances from the RBI' ],
  [ 32, 'S.IV',      'siv',         'Capital account' ],
  [ 33, 'S.V',       'sv',          'Other items (net) (S.I+S.II+S.III-S.IV-C.I-C.II)' ],
  [ 34, 'S.V.1',     'sv1',         'Other demand and time liabilities (net of S.II.3)' ],
];

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
      header   : 1,
      raw      : true,
      defval   : null,
      blankrows: true,
    });

    // Find the data rows: a row is valid when col[1] matches YYYY-MM-DD.
    const data = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] || [];
      const date = String(row[1] == null ? '' : row[1]).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

      const entry = { fortnight: date };
      for (const [colIdx, , camelCode] of COLUMN_MAP) {
        entry[camelCode] = parseNum(row[colIdx]);
      }
      data.push(entry);
    }

    if (data.length === 0) continue; // wrong sheet

    // Build the columns descriptor.
    const columns = COLUMN_MAP.map(([, rawCode, code, label]) => ({ code, rawCode, label }));

    return {
      reportTitle : 'Commercial Bank Survey',
      units       : 'Rupees Crores',
      columns,
      data,
    };
  }

  throw new Error('could not locate data rows in any sheet');
}

// --- self-check: fail loudly (non-zero exit) if shape or known cells drift ---
function selfCheck(out) {
  const { columns, data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 700) {
    errors.push(`expected ≥700 fortnightly rows, got ${data ? data.length : 'n/a'}`);
  }

  if (!Array.isArray(columns) || columns.length !== 33) {
    errors.push(`expected 33 series columns, got ${columns ? columns.length : 'n/a'}`);
  }

  // Known cells (verified against the source sheet).
  const known = [
    { fortnight: '2026-01-31', ci: 24566192.63, ci1: 3141414.87, si: 28550801.07 },
    { fortnight: '2026-01-15', ci: 24179731.55 },
    { fortnight: '1999-03-26', ci: 662859 },
  ];
  for (const exp of known) {
    const row = data.find((r) => r.fortnight === exp.fortnight);
    if (!row) { errors.push(`known fortnight missing: ${exp.fortnight}`); continue; }
    for (const [key, expVal] of Object.entries(exp)) {
      if (key === 'fortnight') continue;
      const got = row[key];
      if (got == null || Math.abs(got - expVal) > 0.02) {
        errors.push(`${exp.fortnight} ${key}: expected ${expVal}, got ${got}`);
      }
    }
  }

  // Fortnights must be unique.
  const keys = data.map((r) => r.fortnight);
  const uniq = new Set(keys);
  if (uniq.size !== keys.length) {
    errors.push(`fortnights not unique: ${keys.length} rows, ${uniq.size} distinct`);
  }

  // Strictly newest-first (descending date strings — ISO dates compare lexicographically).
  for (let i = 1; i < keys.length; i++) {
    if (keys[i - 1] <= keys[i]) {
      errors.push(`not strictly newest-first at index ${i}: ${keys[i - 1]} then ${keys[i]}`);
      break;
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('commercial-bank-survey self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'commercial-bank-survey.json'), JSON.stringify(out));

  console.log(
    `wrote ${out.data.length} fortnightly rows ` +
    `(newest ${out.data[0].fortnight}, oldest ${out.data[out.data.length - 1].fortnight}; ` +
    `${out.columns.length} series); self-check passed`,
  );
}

main();

// Processor: scb-investments — RBI Bulletin Table 13.
//
// Source xlsx carries one sheet "Scheduled Commercial Banks' Inv" with fortnightly
// investment data for scheduled commercial banks across 10 categories, newest-first
// from "15-Mar-26" back to "06-Jun-97". Layout:
//   row 1  blank
//   row 2  title
//   row 3  blank
//   row 4  units header
//   row 5  group headers (SLR, Non-SLR, CP, Shares×3, Bonds×3, MF)
//   row 6  sub-headers ("Fortnight Ended", sub-labels 4.1–6.1)
//   rows 7–759  data rows (col B = "DD-Mon-YY" date, cols C–L = values)
//   rows 12–13  repeated header rows — skipped by label detection
//
// Emits (newest-first):
//   out/scb-investments.json
//     { reportTitle, units, columns: [{code,group,label}…], data: [{fortnight,…}…] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/money-and-banking/table-13-scheduled-commercial-banks-investments.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Month name → zero-padded two-digit number.
const MONTH_MAP = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

// "15-Mar-26" → "2026-03-15". Returns null on parse failure.
function parseDateKey(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
  if (!m) return null;
  const [, dd, mon, yy] = m;
  const mm = MONTH_MAP[mon];
  if (!mm) return null;
  const y2 = parseInt(yy, 10);
  const yyyy = y2 >= 97 ? 1900 + y2 : 2000 + y2;
  return `${yyyy}-${mm}-${dd.padStart(2, '0')}`;
}

// Strip commas, return null for blank/dash, numeric value otherwise.
function parseNum(s) {
  const t = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (t === '' || t === '-' || t === 'N/A') return null;
  const val = Number(t);
  return Number.isFinite(val) ? val : null;
}

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v).trim();
}

// Column metadata — mirrors the sheet's header structure.
const COLUMNS = [
  { code: 'slr',           group: 'SLR securities',               label: '1 SLR securities' },
  { code: 'nonSlrGovt',    group: 'Non-SLR government securities', label: '2 Non-SLR government securities' },
  { code: 'commercialPaper', group: 'Commercial paper',            label: '3 Commercial paper' },
  { code: 'sharesPs',      group: 'Shares',                        label: '4.1 Shares — PSUs' },
  { code: 'sharesPrivCorp', group: 'Shares',                       label: '4.2 Shares — private corporate sector' },
  { code: 'sharesOther',   group: 'Shares',                        label: '4.3 Shares — others' },
  { code: 'bondsPs',       group: 'Bonds/debentures',              label: '5.1 Bonds/debentures — PSUs' },
  { code: 'bondsPrivCorp', group: 'Bonds/debentures',              label: '5.2 Bonds/debentures — private corporate sector' },
  { code: 'bondsOther',    group: 'Bonds/debentures',              label: '5.3 Bonds/debentures — others' },
  { code: 'mutualFunds',   group: 'Instruments',                   label: '6.1 Instruments — mutual funds' },
];

function isHeaderRow(row) {
  // Detect repeated header rows by checking col[1] or col[2] content.
  const c1 = cellStr(row, 1);
  const c2 = cellStr(row, 2);
  return (
    /Fortnight\s+Ended/i.test(c1) ||
    /SLR\s+Securities/i.test(c2) ||
    /SLR\s+Securities/i.test(c1)
  );
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
      header: 1,
      raw: false,
      defval: null,
      blankrows: true,
    });

    // Find header row (row 6, 0-indexed row 5) — the one containing "Fortnight Ended".
    let headerRow = -1;
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const row = rows[i] || [];
      if (/Fortnight\s+Ended/i.test(cellStr(row, 1))) {
        headerRow = i;
        break;
      }
    }
    if (headerRow < 0) continue; // Not the data sheet.

    const seen = new Set();
    const rawData = [];

    for (let i = headerRow + 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const c1 = cellStr(row, 1);

      // Skip blank rows.
      if (c1 === '') continue;

      // Skip repeated header rows (rows 12–13 in the original, and any further repeats).
      if (isHeaderRow(row)) continue;

      // Skip source/note lines.
      if (/^Source:/i.test(c1) || /^Note:/i.test(c1)) continue;

      const fortnight = parseDateKey(c1);
      if (!fortnight) continue; // Not a data row.

      // Deduplicate — keep first occurrence.
      if (seen.has(fortnight)) continue;
      seen.add(fortnight);

      rawData.push({
        fortnight,
        slr:           parseNum(row[2]),
        nonSlrGovt:    parseNum(row[3]),
        commercialPaper: parseNum(row[4]),
        sharesPs:      parseNum(row[5]),
        sharesPrivCorp: parseNum(row[6]),
        sharesOther:   parseNum(row[7]),
        bondsPs:       parseNum(row[8]),
        bondsPrivCorp: parseNum(row[9]),
        bondsOther:    parseNum(row[10]),
        mutualFunds:   parseNum(row[11]),
      });
    }

    // The source sheet has a "top-5 recent" block before the main stream,
    // which breaks strict ordering. Sort newest-first after deduplication.
    const data = rawData.slice().sort((a, b) => (a.fortnight < b.fortnight ? 1 : -1));

    if (data.length === 0) throw new Error('no valid data rows found in sheet');

    return {
      reportTitle: "Scheduled Commercial Banks' Investments",
      units: 'Rupees Crores',
      columns: COLUMNS,
      data,
    };
  }

  throw new Error('could not locate the "Fortnight Ended" header row in any sheet');
}

// --- self-check: fail loudly (non-zero exit) if shape or known cells drift ---
function selfCheck(out) {
  const { data, columns } = out;
  const errors = [];

  // Minimum row count.
  if (!Array.isArray(data) || data.length < 740) {
    errors.push(`expected ≥740 data rows, got ${data ? data.length : 'n/a'}`);
  }

  // Column count.
  if (!Array.isArray(columns) || columns.length !== 10) {
    errors.push(`expected 10 columns, got ${columns ? columns.length : 'n/a'}`);
  }

  // Known cell spot checks.
  const TOL = 0.01;
  const byDate = Object.fromEntries(data.map(r => [r.fortnight, r]));

  const check = (date, field, expected, allowNull) => {
    const row = byDate[date];
    if (!row) { errors.push(`known date missing: ${date}`); return; }
    if (allowNull && expected === null) {
      if (row[field] !== null) errors.push(`${date}.${field}: expected null, got ${row[field]}`);
    } else if (expected === null) {
      if (row[field] !== null) errors.push(`${date}.${field}: expected null, got ${row[field]}`);
    } else {
      if (row[field] == null || Math.abs(row[field] - expected) > TOL) {
        errors.push(`${date}.${field}: expected ≈${expected}, got ${row[field]}`);
      }
    }
  };

  // "15-Mar-26" → slr ≈ 6922802.44, nonSlrGovt === null
  check('2026-03-15', 'slr', 6922802.44, false);
  check('2026-03-15', 'nonSlrGovt', null, true);

  // "15-Dec-25" → slr ≈ 6881357.58, nonSlrGovt ≈ 165975.45
  check('2025-12-15', 'slr', 6881357.58, false);
  check('2025-12-15', 'nonSlrGovt', 165975.45, false);

  // "31-Dec-25" → slr ≈ 13769966.25
  check('2025-12-31', 'slr', 13769966.25, false);

  // "06-Jun-97" → slr ≈ 205148.35
  check('1997-06-06', 'slr', 205148.35, false);

  // Fortnight values must be unique.
  const keys = data.map(r => r.fortnight);
  const uniq = new Set(keys);
  if (uniq.size !== keys.length) {
    errors.push(`fortnight not unique: ${keys.length} rows, ${uniq.size} distinct`);
  }

  // Ordered strictly newest-first (descending date strings in ISO format sort correctly).
  for (let i = 1; i < keys.length; i++) {
    if (keys[i - 1] <= keys[i]) {
      errors.push(`not strictly newest-first at row ${i}: ${keys[i - 1]} then ${keys[i]}`);
      break;
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('scb-investments self-check FAILED:');
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'scb-investments.json'), JSON.stringify(out));

  console.log(
    `wrote ${out.data.length} fortnightly rows ` +
    `(newest ${out.data[0].fortnight}, oldest ${out.data[out.data.length - 1].fortnight}; ` +
    `${out.columns.length} series); self-check passed`,
  );
}

main();

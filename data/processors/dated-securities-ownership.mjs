// Processor: dated-securities-ownership — Monthly RBI Bulletin table 47.
//
// Source xlsx carries three sheets:
//   "Ownership Pattern of Government" — GoI dated securities (76 rows, Mar 2007–Dec 2025)
//   "State Governments Securities"    — state govt securities (43 rows, Jun 2015–Dec 2025)
//   "Treasury Bills"                  — treasury bills (43 rows, Jun 2015–Dec 2025)
//
// All three sheets share the same layout:
//   row 1  title
//   row 3  "(In Percent)"
//   row 5  column headers: Month | (A/B/C) Total (in Rs. Crores) | 1 Commercial Banks | … | 12 Others
//   row 6… data rows: col[1] = "Mon YYYY", col[2] = total ₹ cr (strip commas), col[3..14] = % shares
//   last   source/notes footnote (excluded by period regex)
//
// Data rows detected by /^[A-Z][a-z]{2} \d{4}$/ on col[1]; newest-first, quarterly.
// "-" and blank → null (cells unpublished for that period).
//
// Emits → out/dated-securities-ownership.json
//   {
//     "reportTitle": "Ownership Pattern of Government of India Dated Securities",
//     "sections": [
//       { "key": "goi_dated",       "title": "Government of India dated securities",  "columns": […], "data": […] },
//       { "key": "state_securities", "title": "State governments securities",          "columns": […], "data": […] },
//       { "key": "treasury_bills",  "title": "Treasury bills",                        "columns": […], "data": […] }
//     ]
//   }

import * as XLSX from 'xlsx';
import fs      from 'node:fs';
import path    from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/occasional-series/table-47-ownership-pattern-of-government-of-india-dated-securities.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// ─── helpers ─────────────────────────────────────────────────────────────────

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// Strip commas, return numeric value or null for blank/dash cells.
function parseNum(v) {
  const s = String(v == null ? '' : v).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// "Dec 2025" → true.
const PERIOD_RE = /^[A-Z][a-z]{2} \d{4}$/;

// ─── parse one sheet ─────────────────────────────────────────────────────────

function parseSheet(wb, sheetName) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header    : 1,
    raw       : false,
    defval    : null,
    blankrows : true,
  });

  // Row 5 (0-indexed) carries the column headers.
  const headerRow = rows[5] || [];
  // Build column list from col[2] onwards (col[1] is "Month", col[0] is empty).
  const columns = [];
  for (let ci = 2; ci < headerRow.length; ci++) {
    const h = cellStr(headerRow, ci).trim();
    if (h) columns.push(h);
  }

  // Data rows start at row 6.
  const data = [];
  for (let i = 6; i < rows.length; i++) {
    const row = rows[i] || [];
    const period = cellStr(row, 1).trim();
    if (!PERIOD_RE.test(period)) continue;

    // Values: col[2] = total ₹ crore (numeric with commas), col[3..] = % shares.
    const values = [];
    for (let ci = 2; ci < 2 + columns.length; ci++) {
      values.push(parseNum(row[ci]));
    }

    data.push({ period, values });
  }

  return { columns, data };
}

// ─── parse ───────────────────────────────────────────────────────────────────

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length < 3) throw new Error(`expected 3 sheets, got ${wb.SheetNames.length}`);

  const goi   = parseSheet(wb, wb.SheetNames[0]);
  const state = parseSheet(wb, wb.SheetNames[1]);
  const tbill = parseSheet(wb, wb.SheetNames[2]);

  return {
    reportTitle : 'Ownership Pattern of Government of India Dated Securities',
    sections    : [
      { key: 'goi_dated',        title: 'Government of India dated securities', ...goi   },
      { key: 'state_securities', title: 'State governments securities',         ...state },
      { key: 'treasury_bills',   title: 'Treasury bills',                       ...tbill },
    ],
  };
}

// ─── self-check ──────────────────────────────────────────────────────────────

function selfCheck(out) {
  const errors = [];

  for (const section of out.sections) {
    // All sections must be non-empty.
    if (!section.data || section.data.length === 0) {
      errors.push(`section ${section.key}: no data rows`);
      continue;
    }

    // Every row's values.length must match columns.length.
    for (const row of section.data) {
      if (row.values.length !== section.columns.length) {
        errors.push(
          `section ${section.key} row ${row.period}: values.length=${row.values.length} ` +
          `!= columns.length=${section.columns.length}`,
        );
      }
    }

    // Periods must be unique per section.
    const periods = section.data.map(r => r.period);
    const uniq    = new Set(periods);
    if (uniq.size !== periods.length) {
      errors.push(`section ${section.key}: duplicate periods`);
    }

    // Newest-first — periods are "Mon YYYY"; compare full strings isn't ideal
    // so compare extracted numeric year+month.
    const MONTHS = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 };
    const toN = p => { const [m, y] = p.split(' '); return Number(y) * 100 + (MONTHS[m] || 0); };
    for (let i = 1; i < periods.length; i++) {
      if (toN(periods[i - 1]) < toN(periods[i])) {
        errors.push(
          `section ${section.key}: not newest-first at index ${i}: ` +
          `${periods[i - 1]} then ${periods[i]}`,
        );
        break;
      }
    }
  }

  // Anchor: goi_dated row count ≥ 70.
  const goi = out.sections.find(s => s.key === 'goi_dated');
  if (goi && goi.data.length < 70) {
    errors.push(`goi_dated: expected ≥70 rows, got ${goi.data.length}`);
  }

  // Anchor: goi_dated "Dec 2025" — total=12393606, commercial_banks=34.31, insurance=25.89.
  if (goi) {
    const dec25 = goi.data.find(r => r.period === 'Dec 2025');
    if (!dec25) {
      errors.push('goi_dated: missing anchor row Dec 2025');
    } else {
      const total = dec25.values[0];
      const commBanks = dec25.values[1];  // col 3 = "1 Commercial Banks"
      const insurance = dec25.values[4];  // col 6 = "4 Insurance Companies"
      if (total == null || Math.abs(total - 12393606) > 1) {
        errors.push(`goi_dated Dec 2025: total expected 12393606, got ${total}`);
      }
      if (commBanks == null || Math.abs(commBanks - 34.31) > 0.01) {
        errors.push(`goi_dated Dec 2025: commercial banks expected 34.31, got ${commBanks}`);
      }
      if (insurance == null || Math.abs(insurance - 25.89) > 0.01) {
        errors.push(`goi_dated Dec 2025: insurance expected 25.89, got ${insurance}`);
      }
    }
  }

  return errors;
}

// ─── main ────────────────────────────────────────────────────────────────────

function main() {
  const out    = parse(fs.readFileSync(XLSX_SRC));
  const errors = selfCheck(out);

  if (errors.length > 0) {
    console.error('dated-securities-ownership self-check FAILED:');
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'dated-securities-ownership.json'),
    JSON.stringify(out),
  );

  for (const s of out.sections) {
    const latest = s.data[0]?.period ?? '—';
    const oldest = s.data[s.data.length - 1]?.period ?? '—';
    console.log(`  ${s.key}: ${s.data.length} rows (${oldest} → ${latest}), ${s.columns.length} columns`);
  }
  console.log('wrote dated-securities-ownership.json; self-check passed');
}

main();

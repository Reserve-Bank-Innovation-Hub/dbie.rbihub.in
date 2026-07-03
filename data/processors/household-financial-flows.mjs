// Processor: household-financial-flows — RBI Bulletin Table 52(a).
//
// Source xlsx "Report 1" sheet layout (44 rows, 36 columns):
//   row[0]   blank
//   row[1]   title "Flow of Financial Assets and Liabilities of Households - Instrument-wise"
//   row[2]   blank
//   row[3]   "(Amount in Rupees Crores)"
//   row[4]   blank
//   row[5]   col[1] = "Item"; col[2..] = fiscal-year spans (forward-fill nulls)
//            "2018-19   ", "2019-20   ", …, "2024-25   "
//   row[6]   col[2..] = period labels "Q1","Q2","Q3","Q4","Annual" per year;
//            the newest year (2024-25) has only Q1–Q4, no Annual yet.
//   rows[7..41]  data rows (col[1] = item label, col[2..] = values)
//   row[42]  blank
//   row[43]  notes
//
// The table is PIVOTED: rows are items, columns are (year × period). This
// processor emits a dynamic columns[] array and a values[] array per item.
//
// Emits → out/household-financial-flows.json:
//   { reportTitle, unit, notes, columns: [{ year, period }], data: [{ item, values }] }

import * as XLSX from 'xlsx';
import fs          from 'node:fs';
import path        from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC  = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/occasional-series/' +
  'RBIB Table No. 52 (a)_ Flow of Financial Assets and Liabilities of Households - Instrument-wise.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// "1,23,456.7" → 123456.7. Returns null for blank/dash/N.A.
function parseNum(v) {
  const s = String(v == null ? '' : v).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N.A.' || s === 'N/A') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Normalise internal whitespace and trim surrounding whitespace/newlines.
function cleanLabel(v) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets in workbook');

  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, {
    header    : 1,
    raw       : false,
    defval    : null,
    blankrows : true,
  });

  // ── Extract title (row[1], col[1]) ──────────────────────────────────────────
  const reportTitle = cleanLabel(rows[1]?.[1])
    || 'Flow of Financial Assets and Liabilities of Households - Instrument-wise';

  // ── Build dynamic columns from rows[5] (years) and rows[6] (periods) ────────
  // Row[5]: years appear once per span, rest are null → forward-fill.
  const yearRow   = rows[5] || [];
  const periodRow = rows[6] || [];

  // Determine the total column width from the wider of the two rows.
  const numCols = Math.max(yearRow.length, periodRow.length);

  const columns   = [];
  let   currentYear = '';

  for (let ci = 2; ci < numCols; ci++) {
    const rawYear = cleanLabel(yearRow[ci]);
    if (rawYear && /^\d{4}-\d{2}/.test(rawYear)) {
      currentYear = rawYear.replace(/\s+/g, '').trim(); // strip trailing spaces
    }
    const period = cleanLabel(periodRow[ci]);
    if (!period && !currentYear) continue; // skip empty columns before data starts
    if (period) {
      columns.push({ year: currentYear, period });
    }
  }

  // ── Parse data rows[7..~41] ──────────────────────────────────────────────────
  const data  = [];
  const notes = [];

  for (let ri = 7; ri < rows.length; ri++) {
    const row   = rows[ri] || [];
    const label = cleanLabel(row[1]);

    if (!label) continue; // blank row

    // Detect notes row at the bottom. The note body may live in col[2] onwards
    // rather than col[1] (which just contains "Notes:") — collect all non-null
    // cells from the row and concatenate them.
    if (/^Notes?:/i.test(label)) {
      const parts = (row || [])
        .slice(1)
        .map(v => cleanLabel(v))
        .filter(s => s.length > 0);
      if (parts.length > 0) notes.push(parts.join(' '));
      continue;
    }

    // Rows whose col[1] is a section-only label (no values) — include them with
    // null values so the item order is preserved exactly.
    const values = columns.map((_, i) => {
      const colIdx = 2 + i; // col[2] is first data column
      return parseNum(row[colIdx]);
    });

    data.push({ item: label, values });
  }

  return { reportTitle, unit: 'Rupees Crores', notes, columns, data };
}

// ── Self-check ───────────────────────────────────────────────────────────────
function selfCheck(out) {
  const { columns, data } = out;
  const errors = [];

  // Minimum item count.
  if (data.length < 30) {
    errors.push(`expected ≥30 item rows, got ${data.length}`);
  }

  // Minimum column count: 6 full years × 5 + partial = at least 34.
  if (columns.length < 34) {
    errors.push(`expected ≥34 columns, got ${columns.length}`);
  }

  // Find anchor rows by item label.
  function findRow(label) {
    return data.find(r => r.item.toLowerCase().includes(label.toLowerCase()));
  }

  // Helper: find column index for a given year+period.
  function colIdx(year, period) {
    return columns.findIndex(c => c.year === year && c.period === period);
  }

  // Anchor 1: "Net Financial Assets (I-II)" 2018-19 Q1 = 274259.3
  const netFa = findRow('Net Financial Assets');
  if (!netFa) {
    errors.push('row "Net Financial Assets (I-II)" not found');
  } else {
    const ci = colIdx('2018-19', 'Q1');
    if (ci < 0) {
      errors.push('column 2018-19 Q1 not found');
    } else {
      const v = netFa.values[ci];
      if (v == null || Math.abs(v - 274259.3) > 0.5) {
        errors.push(`"Net Financial Assets" 2018-19 Q1: expected 274259.3, got ${v}`);
      }
    }

    // 2018-19 Annual = 1492445.3
    const ciAnn = colIdx('2018-19', 'Annual');
    if (ciAnn >= 0) {
      const v = netFa.values[ciAnn];
      if (v == null || Math.abs(v - 1492445.3) > 0.5) {
        errors.push(`"Net Financial Assets" 2018-19 Annual: expected 1492445.3, got ${v}`);
      }
    }

    // 2019-20 Q1 = 238613.6
    const ci2 = colIdx('2019-20', 'Q1');
    if (ci2 >= 0) {
      const v = netFa.values[ci2];
      if (v == null || Math.abs(v - 238613.6) > 0.5) {
        errors.push(`"Net Financial Assets" 2019-20 Q1: expected 238613.6, got ${v}`);
      }
    }
  }

  // Anchor 2: "Per cent of GDP" (first occurrence, row immediately after Net FA): 2018-19 Q1 = 6.0
  const pctGdpRows = data.filter(r => r.item === 'Per cent of GDP');
  if (pctGdpRows.length === 0) {
    errors.push('"Per cent of GDP" row not found');
  } else {
    const ci = colIdx('2018-19', 'Q1');
    if (ci >= 0) {
      const v = pctGdpRows[0].values[ci];
      if (v == null || Math.abs(v - 6.0) > 0.05) {
        errors.push(`"Per cent of GDP" (first) 2018-19 Q1: expected 6.0, got ${v}`);
      }
    }
  }

  // Values-length consistency.
  for (const row of data) {
    if (row.values.length !== columns.length) {
      errors.push(`row "${row.item}" has ${row.values.length} values but ${columns.length} columns`);
      break;
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('household-financial-flows self-check FAILED:');
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'household-financial-flows.json'),
    JSON.stringify(out),
  );

  const years = [...new Set(out.columns.map(c => c.year))];
  console.log(
    `wrote ${out.data.length} item rows, ${out.columns.length} columns ` +
    `(${years.length} fiscal years: ${years.join(', ')}); self-check passed`,
  );
}

main();

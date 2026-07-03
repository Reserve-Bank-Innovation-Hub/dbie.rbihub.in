// Processor: state-government-investments — RBI Bulletin Table 50.
//
// Source xlsx carries one sheet ("Report 1") with monthly investments
// by state governments in sinking, redemption and stabilisation funds
// and auction treasury bills (₹ Crores). Layout:
//   row 2  title "Investments by State Governments"
//   row 4  unit note "(₹ Crores)"
//   row 6  column headers: col[1] = "State/Union Territory";
//          col[2+] = month span labels, forward-filled (e.g. "During January 2026")
//   row 7  fund labels per column (e.g. "Consolidated Sinking Fund (CSF)", …)
//   rows 8..37  data: col[1] = state name, col[2+] = values
//   row 38  "Total" row — kept as a data row
//   row 40  notes
//   row 42  source
//
// Fund set varies by month:
//   Jan 2026, Dec 2025: CSF · GRF · ATBs · BSF
//   Nov 2025 and earlier: CSF · GRF · Government Securities · ATBs
//   Sep 2017 (last): CSF · GRF only
//
// Emits (most recent month first):
//   out/state-government-investments.json
//     { reportTitle, unit, notes, columns, data }
//   columns: [{ month, fund }, …]        (all month×fund combos, in source order)
//   data:    [{ state, values }, …]       (values aligned to columns[])

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/occasional-series/table-50-investments-by-state-governments.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v).trim();
}

// "1,23,456" → 123456. Returns null for blank/dash so gaps stay distinct from real zeros.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '--' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header    : 1,
    raw       : false,
    defval    : null,
    blankrows : true,
  });

  // Row 2 (index 1) — title
  const reportTitle = cellStr(rows[1] || [], 1) || 'Investments by State Governments';

  // Row 4 (index 3) — unit note "(₹ Crores)"
  const unitRaw = cellStr(rows[3] || [], 1);
  const unit = unitRaw.replace(/[()]/g, '').trim() || '₹ Crores';

  // Row 40 (index 39) — notes; first non-null cell holds the full multi-line note
  const notesRow = rows[39] || [];
  const notesText = notesRow.map(v => (v == null ? '' : String(v).trim())).filter(Boolean).join(' ').trim();
  const notes = notesText ? [notesText] : [];

  // Row 6 (index 5) — month span labels; forward-fill across merged cells.
  const row6 = rows[5] || [];
  const monthFill = new Array(row6.length).fill(null);
  let lastMonth = null;
  for (let i = 0; i < row6.length; i++) {
    const v = cellStr(row6, i);
    if (v && v !== 'State/Union Territory') {
      lastMonth = v;
    }
    monthFill[i] = lastMonth;
  }

  // Row 7 (index 6) — fund names per column.
  const row7 = rows[6] || [];

  // Build columns array from cols 2..end (col[1] is the state label).
  // Collect all columns that have a fund label.
  const columns = [];
  for (let i = 2; i < row7.length; i++) {
    const fund = cellStr(row7, i);
    const month = monthFill[i];
    if (fund && month) {
      columns.push({ month, fund, colIndex: i });
    }
  }

  if (columns.length === 0) throw new Error('no column definitions found');

  // Data rows: rows 8..38 (indices 7..37) — anything with a non-blank col[1].
  // Row 38 = "Total" — kept as a data row per instructions.
  const data = [];
  const stateSet = new Set();
  for (let ri = 7; ri < rows.length; ri++) {
    const row = rows[ri] || [];
    const stateName = cellStr(row, 1);
    if (!stateName) continue;
    // Stop at notes/source rows (text starts with "Notes:" or "Source:").
    if (/^(Notes|Source)\s*:/i.test(stateName)) break;

    if (stateSet.has(stateName)) continue; // guard against duplicate state names
    stateSet.add(stateName);

    const values = columns.map(({ colIndex }) => parseNum(row[colIndex]));
    data.push({ state: stateName, values });
  }

  if (data.length === 0) throw new Error('no data rows found');

  // Strip colIndex from emitted columns (it is internal only).
  const emittedColumns = columns.map(({ month, fund }) => ({ month, fund }));

  return { reportTitle, unit, notes, columns: emittedColumns, data };
}

// --- self-check: fail loudly on unexpected shape or known-anchor drift ---
function selfCheck(out) {
  const { columns, data } = out;
  const errors = [];

  // At least 25 state rows.
  if (data.length < 25) {
    errors.push(`expected ≥25 state rows, got ${data.length}`);
  }

  // State names must be unique.
  const states = data.map(r => r.state);
  const uniq = new Set(states);
  if (uniq.size !== states.length) {
    errors.push(`state names not unique: ${states.length} rows, ${uniq.size} distinct`);
  }

  // Every row must have values aligned to columns.
  for (const row of data) {
    if (row.values.length !== columns.length) {
      errors.push(`state "${row.state}" has ${row.values.length} values but ${columns.length} columns`);
      break;
    }
  }

  // Anchor — Andhra Pradesh: Jan 2026 CSF = 7994, GRF = 8040, ATBs = 0, BSF = null.
  const ap = data.find(r => r.state === 'Andhra Pradesh');
  if (!ap) {
    errors.push('Andhra Pradesh row missing');
  } else {
    const jan26 = columns.findIndex(c => c.month === 'During January 2026' && c.fund.includes('CSF'));
    const jan26grf = columns.findIndex(c => c.month === 'During January 2026' && c.fund.includes('GRF'));
    const jan26atb = columns.findIndex(c => c.month === 'During January 2026' && c.fund.includes('ATBs'));
    const jan26bsf = columns.findIndex(c => c.month === 'During January 2026' && c.fund.includes('BSF'));
    if (jan26 >= 0 && ap.values[jan26] !== 7994) {
      errors.push(`Andhra Pradesh Jan 2026 CSF: expected 7994, got ${ap.values[jan26]}`);
    }
    if (jan26grf >= 0 && ap.values[jan26grf] !== 8040) {
      errors.push(`Andhra Pradesh Jan 2026 GRF: expected 8040, got ${ap.values[jan26grf]}`);
    }
    if (jan26atb >= 0 && ap.values[jan26atb] !== 0) {
      errors.push(`Andhra Pradesh Jan 2026 ATBs: expected 0, got ${ap.values[jan26atb]}`);
    }
    if (jan26bsf >= 0 && ap.values[jan26bsf] !== null) {
      errors.push(`Andhra Pradesh Jan 2026 BSF: expected null (--), got ${ap.values[jan26bsf]}`);
    }
  }

  // Anchor — Arunachal Pradesh: Jan 2026 ATBs = 7600.
  const arp = data.find(r => r.state === 'Arunachal Pradesh');
  if (!arp) {
    errors.push('Arunachal Pradesh row missing');
  } else {
    const jan26atb = columns.findIndex(c => c.month === 'During January 2026' && c.fund.includes('ATBs'));
    if (jan26atb >= 0 && arp.values[jan26atb] !== 7600) {
      errors.push(`Arunachal Pradesh Jan 2026 ATBs: expected 7600, got ${arp.values[jan26atb]}`);
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('state-government-investments self-check FAILED:');
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }

  // Report per-month fund lists (just the first few months to show variation).
  const monthGroups = {};
  for (const { month, fund } of out.columns) {
    if (!monthGroups[month]) monthGroups[month] = [];
    monthGroups[month].push(fund);
  }
  const monthNames = [...new Set(out.columns.map(c => c.month))];
  console.log(
    `wrote ${out.data.length} state rows × ${out.columns.length} columns ` +
    `across ${monthNames.length} months`,
  );
  console.log('Per-month fund lists (first 4 months):');
  for (const m of monthNames.slice(0, 4)) {
    console.log(`  ${m}: ${monthGroups[m].join(' · ')}`);
  }
  console.log('  … (and', monthNames.length - 4, 'more months)');
  console.log('self-check passed');

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'state-government-investments.json'),
    JSON.stringify(out),
  );
}

main();

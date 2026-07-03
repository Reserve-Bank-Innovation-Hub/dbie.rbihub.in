// Processor: net-state-value-added-by-economic-activity-at-constant-prices
//
// Source xlsx: "Net State Value Added by Economic Activity (At Constant Prices)
// (Base_ 2011-2012).xlsx". Only the "NAS-2011-12" sheet is used (base year 2011-12
// series, the current RBI standard). The older "NAS-2004-05" sheet uses a different
// column layout and methodology and is intentionally skipped.
//
// Sheet "NAS-2011-12" layout (0-indexed row numbers):
//   row 1   title: "Net State Value Added by Economic Activity (At Constant Prices) …"
//   row 3   unit:  "(Rupees Crores)"
//   rows 6, 26, 46 … (every 20 rows): state/UT name header
//   rows +2 (e.g. row 8): column header ("Year" | activity names … | "TOTAL NSVA …")
//   rows +3 (e.g. row 9): column number row ("1" | "2" … | "13") — skipped
//   rows +4 … +18 (data rows, newest-first, up to 14 years: 2011-12 to 2024-25)
//   rows +19, +20: blank before next state block
//
// Column layout (0-indexed within each row; col 0 is always null):
//   col 1: year label e.g. "2024-25   "
//   col 2: Agriculture, Forestry and Fishing
//   col 3: Mining and Quarrying
//   col 4: Manufacturing
//   col 5: Electricity, Gas, Water Supply & Other Utility Services
//   col 6: Construction
//   col 7: Trade, Repair, Hotels and Restaurants
//   col 8: Transport, Storage, Communication & Services Related To Broadcasting
//   col 9: Financial Services
//   col 10: Real Estate, Ownership Of Dwelling & Professional Services
//   col 11: Public Administration
//   col 12: Other Services
//   col 13: TOTAL NSVA at basic prices   ← chart this for each state
//   (cols 14–33 are supplementary breakdowns; we ignore them)
//
// States/UTs covered (33): Andhra Pradesh, Arunachal Pradesh, Assam, Bihar,
//   Chhattisgarh, Goa, Gujarat, Haryana, Himachal Pradesh, Jammu & Kashmir,
//   Jharkhand, Karnataka, Kerala, Madhya Pradesh, Maharashtra, Manipur, Meghalaya,
//   Mizoram, Nagaland, Odisha, Punjab, Rajasthan, Sikkim, Tamil Nadu, Telangana,
//   Tripura, Uttar Pradesh, Uttarakhand, West Bengal, Andaman & Nicobar,
//   Chandigarh, Delhi, Puducherry.
//
// Emits: out/net-state-value-added-by-economic-activity-at-constant-prices.json
//   {
//     reportTitle : string,
//     unit        : string,
//     baseYear    : string,          // "2011-12"
//     activities  : string[],        // 12 activity names + "TOTAL NSVA at basic prices" (13 total)
//     states      : {
//       name   : string,             // state/UT name as it appears in the sheet
//       years  : string[],           // fiscal-year labels, newest-first, e.g. "2024-25"
//       values : (number | null)[][], // [year_idx][activity_idx], aligned to activities[]
//     }[]
//   }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/national-income-saving-employment',
  'Net State Value Added by Economic Activity (At Constant Prices) (Base_ 2011-2012).xlsx',
);
const OUT_DIR  = path.join(__dirname, 'out');
const OUT_FILE = 'net-state-value-added-by-economic-activity-at-constant-prices.json';

// The 12 sector columns + 1 total column we care about (cols 2–13).
const ACTIVITY_COL_START = 2;
const ACTIVITY_COL_END   = 13; // inclusive

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v).trim();
}

// "215,882.6014" → 215882.6014; '-' / '' / null → null.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === '—' || s === 'N/A') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// "2024-25   " → "2024-25"
function yearKey(label) {
  return label.trim();
}

// Is this a valid fiscal-year label like "2024-25" or "2011-12"?
function isYearCell(s) {
  return /^\d{4}-\d{2}\s*$/.test(s) || /^\d{4}-\d{2}$/.test(s.trim());
}

// Is this a state/UT name row? (col 1 has text; cols 2 onward are null)
function isStateHeader(row, activityHeaders) {
  const c1 = cellStr(row, 1);
  if (!c1) return false;
  if (/^(Year|Source|Note|Rupees|Base|Net State)/.test(c1)) return false;
  if (isYearCell(c1)) return false;
  if (/^\d+$/.test(c1)) return false;      // column-number row
  if (activityHeaders.some(h => h && c1 === h)) return false;
  return true;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  const SHEET = 'NAS-2011-12';
  if (!wb.Sheets[SHEET]) {
    throw new Error(`Sheet "${SHEET}" not found; available: ${wb.SheetNames.join(', ')}`);
  }

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[SHEET], {
    header   : 1,
    raw      : false,
    defval   : null,
    blankrows: true,
  });

  // Row 1: report title (col 1).
  const reportTitle = cellStr(rows[1] || [], 1) ||
    'Net State Value Added by Economic Activity (At Constant Prices) (Base: 2011-2012)';

  // Row 3: unit (col 1).
  const unit = cellStr(rows[3] || [], 1).replace(/[()]/g, '').trim() || 'Rupees Crores';

  // Scan for the first "Year" header row to extract activity column labels.
  // Collect cols 2–13 inclusive = 12 activity sectors + 1 total = 13 columns.
  const EXPECTED_ACTIVITY_COUNT = ACTIVITY_COL_END - ACTIVITY_COL_START + 1; // 12
  let activities = [];
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i] || [];
    if (cellStr(row, 1) === 'Year') {
      for (let c = ACTIVITY_COL_START; c <= ACTIVITY_COL_END; c++) {
        activities.push(cellStr(row, c));
      }
      break;
    }
  }
  if (activities.length !== EXPECTED_ACTIVITY_COUNT) {
    throw new Error(
      `expected ${EXPECTED_ACTIVITY_COUNT} activity columns, ` +
      `found ${activities.length}`
    );
  }

  // Walk the sheet, collecting state blocks.
  const states = [];
  let currentState = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const c1 = cellStr(row, 1);

    // Detect state header.
    if (isStateHeader(row, activities)) {
      if (currentState && currentState.years.length > 0) {
        states.push(currentState);
      }
      currentState = { name: c1, years: [], values: [] };
      continue;
    }

    if (!currentState) continue;

    // Skip blank rows, header rows ("Year"), column-number rows ("1"), Source/Note footers.
    if (!c1) continue;
    if (c1 === 'Year' || /^\d+$/.test(c1)) continue;
    if (/^(Source|Note)/i.test(c1)) continue;
    if (!isYearCell(c1)) continue;

    // Data row.
    const year   = yearKey(c1);
    const rowVals = [];
    for (let c = ACTIVITY_COL_START; c <= ACTIVITY_COL_END; c++) {
      rowVals.push(parseNum(row[c]));
    }
    currentState.years.push(year);
    currentState.values.push(rowVals);
  }

  // Flush the final state.
  if (currentState && currentState.years.length > 0) {
    states.push(currentState);
  }

  if (states.length === 0) throw new Error('no state blocks found in sheet NAS-2011-12');

  return {
    reportTitle,
    unit,
    baseYear   : '2011-12',
    activities,
    states,
  };
}

// ---------------------------------------------------------------------------
// Self-check: 3+ hard-coded cell assertions + uniqueness + ordering.
// ---------------------------------------------------------------------------

function fail(msg) {
  console.error(`SELF-CHECK FAILED: ${msg}`);
  process.exit(1);
}

function selfCheck(out) {
  const { activities, states } = out;

  // 1. Activity count must be 12 (12 sectors + total = 12 total columns: cols 2–13).
  if (activities.length !== 12) {
    fail(`expected 12 activity columns, got ${activities.length}`);
  }

  // 2. Last activity must be the total NSVA column.
  const totalLabel = activities[activities.length - 1];
  if (!/TOTAL NSVA/i.test(totalLabel)) {
    fail(`last activity column should be total NSVA, got "${totalLabel}"`);
  }

  // 3. State count (33 states/UTs).
  if (states.length !== 33) {
    fail(`expected 33 states/UTs, got ${states.length}`);
  }

  // 4. State names are unique.
  const nameSet = new Set(states.map(s => s.name));
  if (nameSet.size !== states.length) {
    fail(`duplicate state names found`);
  }

  // 5. Each state's years must be unique and in newest-first order.
  for (const st of states) {
    const ySet = new Set(st.years);
    if (ySet.size !== st.years.length) {
      fail(`state "${st.name}" has duplicate year labels`);
    }
    for (let i = 1; i < st.years.length; i++) {
      if (st.years[i - 1] <= st.years[i]) {
        fail(`state "${st.name}": years not strictly newest-first at index ${i}: ` +
             `"${st.years[i - 1]}" then "${st.years[i]}"`);
      }
    }
    // Each value row must have exactly 12 entries (cols 2–13 inclusive).
    for (let r = 0; r < st.values.length; r++) {
      if (st.values[r].length !== 12) {
        fail(`state "${st.name}" row ${r} has ${st.values[r].length} values, expected 12`);
      }
    }
  }

  // Hard-coded cell assertions (verified against the source sheet).
  // activities[0] = Agriculture …  activities[11] = TOTAL NSVA at basic prices (col 13).
  const TOTAL_IDX = 11; // last column (col 13, 0-indexed within our 12-element slice)

  // Assertion A: Andhra Pradesh, 2024-25, TOTAL NSVA = 673851.1152
  const ap = states.find(s => s.name === 'ANDHRA PRADESH');
  if (!ap) fail('ANDHRA PRADESH not found');
  const apIdx2024 = ap.years.indexOf('2024-25');
  if (apIdx2024 < 0) fail('ANDHRA PRADESH 2024-25 not found');
  const apTotal2024 = ap.values[apIdx2024][TOTAL_IDX];
  if (Math.abs(apTotal2024 - 673851.1152) > 0.001) {
    fail(`ANDHRA PRADESH 2024-25 TOTAL NSVA: expected 673851.1152, got ${apTotal2024}`);
  }

  // Assertion B: Andhra Pradesh, 2011-12, TOTAL NSVA = 310346.5242
  const apIdx2011 = ap.years.indexOf('2011-12');
  if (apIdx2011 < 0) fail('ANDHRA PRADESH 2011-12 not found');
  const apTotal2011 = ap.values[apIdx2011][TOTAL_IDX];
  if (Math.abs(apTotal2011 - 310346.5242) > 0.001) {
    fail(`ANDHRA PRADESH 2011-12 TOTAL NSVA: expected 310346.5242, got ${apTotal2011}`);
  }

  // Assertion C: Maharashtra, 2024-25, TOTAL NSVA = 1955543.319
  const mh = states.find(s => s.name === 'MAHARASHTRA');
  if (!mh) fail('MAHARASHTRA not found');
  const mhIdx2024 = mh.years.indexOf('2024-25');
  if (mhIdx2024 < 0) fail('MAHARASHTRA 2024-25 not found');
  const mhTotal2024 = mh.values[mhIdx2024][TOTAL_IDX];
  if (Math.abs(mhTotal2024 - 1955543.319) > 0.01) {
    fail(`MAHARASHTRA 2024-25 TOTAL NSVA: expected 1955543.319, got ${mhTotal2024}`);
  }

  // Assertion D: Puducherry, 2011-12, TOTAL NSVA = 13153.56
  const pu = states.find(s => s.name === 'PUDUCHERRY');
  if (!pu) fail('PUDUCHERRY not found');
  const puIdx2011 = pu.years.indexOf('2011-12');
  if (puIdx2011 < 0) fail('PUDUCHERRY 2011-12 not found');
  const puTotal2011 = pu.values[puIdx2011][TOTAL_IDX];
  if (Math.abs(puTotal2011 - 13153.56) > 0.001) {
    fail(`PUDUCHERRY 2011-12 TOTAL NSVA: expected 13153.56, got ${puTotal2011}`);
  }
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  selfCheck(out);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, OUT_FILE);
  fs.writeFileSync(outPath, JSON.stringify(out));

  const sizeMB  = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
  const stCount = out.states.length;
  const yrRange = `${out.states[0].years[out.states[0].years.length - 1]} → ${out.states[0].years[0]}`;
  console.log(
    `wrote ${stCount} states × ${out.activities.length} activities ` +
    `(${yrRange}; base ${out.baseYear}) ` +
    `→ ${OUT_FILE} (${sizeMB} MB); self-check passed`,
  );
}

main();

// Processor: international-investment-position (quarterly) — RBI Bulletin Table 44.
//
// Source xlsx carries several sheets; this processor reads ONLY the sheet whose
// name contains "BPM6" (sheet "IIP of India -Quarterly-BPM6"), which holds
// India's international investment position per IMF BPM6, in US$ millions.
//
// Sheet layout:
//   row 1  title
//   row 3  "Amount in US $ Millions"
//   row 5  header: col[1]="List", col[2]="Items", col[3..N]=quarter labels
//   rows 6–32  data rows: col[1]=code, col[2]=item name, col[3..N]=values
//
// Emits (newest-first quarters):
//   out/international-investment-position.json
//     { reportTitle, unit, standard, quarters, items, data }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/external-sector/table-44-international-investment-position.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// "1,198,020.002" -> 1198020.002. Returns null for blank/dash so gaps stay distinct from real zeros.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A' || s === 'NA') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// Strip trailing revision markers from a quarter label.
// "2025-26:Q3- P"  -> "2025-26:Q3"
// "2025-26:Q2- PR" -> "2025-26:Q2"
// "2024-25:Q4- R"  -> "2024-25:Q4"
function stripRevision(label) {
  return label.replace(/-\s*(PR?|R)\s*$/, '').trim();
}

// Proper nouns and acronyms kept with their natural casing when sentence-casing.
const PRESERVE = { india: 'India', iip: 'IIP', sdr: 'SDR', imf: 'IMF' };

// Convert a label to sentence case for display: first word capitalised, rest lower,
// except preserved proper nouns/acronyms and all-caps words.
function toSentenceCase(str) {
  // Strip trailing asterisk.
  str = str.replace(/\s*\*\s*$/, '').trim();
  const words = str.split(/\s+/);
  return words.map((w, i) => {
    const preserved = PRESERVE[w.toLowerCase()];
    if (preserved) return preserved;
    if (i === 0) return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    // Preserve acronyms and all-caps words (≥2 chars, all uppercase letters).
    if (/^[A-Z]{2,}$/.test(w)) return w;
    return w.toLowerCase();
  }).join(' ');
}

// Build composite item code from current section and the raw code column value.
// section: "A" or "B"; rawCode: "1", "1.1", "A", "B", etc.
function buildCode(section, rawCode) {
  if (rawCode === 'A' || rawCode === 'B') return rawCode;
  if (!section) return rawCode;
  return `${section}.${rawCode}`;
}

// Determine indent level from code.
// "A", "B", "NET" -> 0
// "A.1", "B.2", etc. -> 1
// "A.1.1", "A.2.2", etc. -> 2
function indentLevel(code) {
  if (code === 'A' || code === 'B' || code === 'NET') return 0;
  const parts = code.split('.');
  // parts[0] = section letter, remaining parts = numeric sub-path
  return parts.length - 1;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  // Find the BPM6 sheet.
  const bpm6SheetName = wb.SheetNames.find((n) => n.includes('BPM6'));
  if (!bpm6SheetName) throw new Error('could not find a sheet containing "BPM6" in its name');

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[bpm6SheetName], {
    header  : 1,
    raw     : false,
    defval  : null,
    blankrows: true,
  });

  // Locate the header row: col[1] === "List" (or contains "List").
  let headerRowIdx = -1;
  let reportTitle = 'International investment position: external assets and liabilities';

  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i] || [];
    const c1 = String(row[1] ?? '').trim();
    // Pick up title from row 1 if it looks like one.
    if (i === 0 && c1 && c1.length > 10) {
      reportTitle = c1;
    }
    if (c1 === 'List' || /^list$/i.test(c1)) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx < 0) throw new Error('could not locate the header row (col[1] = "List") in the BPM6 sheet');

  const headerRow = rows[headerRowIdx] || [];

  // Extract quarter labels from col[3] onwards, stopping at null/empty.
  const quarters = [];
  for (let c = 3; c < headerRow.length; c++) {
    const raw = String(headerRow[c] ?? '').trim();
    if (!raw) break;
    quarters.push(stripRevision(raw));
  }
  if (quarters.length === 0) throw new Error('no quarter columns found in header row');

  // Parse data rows.
  const items = [];
  const data  = {};
  let currentSection = '';

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const rawCode  = String(row[1] ?? '').trim();
    const rawLabel = String(row[2] ?? '').trim();

    // Skip completely empty rows.
    if (!rawCode && !rawLabel) continue;
    // Skip footnote / source rows.
    if (/^(Source|Note|P:|PR:|\*)/i.test(rawLabel)) continue;
    if (/^(Source|Note)/i.test(rawCode)) continue;

    let code;
    let label;
    let section;

    if (rawCode === 'A') {
      // Section A header.
      currentSection = 'A';
      code  = 'A';
      label = toSentenceCase(rawLabel);
      section = 'A';
    } else if (rawCode === 'B') {
      // Section B header.
      currentSection = 'B';
      code  = 'B';
      label = toSentenceCase(rawLabel);
      section = 'B';
    } else if (!rawCode && rawLabel && /net\s+iip/i.test(rawLabel)) {
      // Net IIP row — null/empty code column, label contains "Net IIP".
      code  = 'NET';
      label = 'Net IIP (Assets − Liabilities)';
      section = 'NET';
    } else if (rawCode && currentSection) {
      // Numbered sub-item under A or B.
      code    = buildCode(currentSection, rawCode);
      label   = toSentenceCase(rawLabel);
      section = currentSection;
    } else {
      // Unrecognised row shape — skip.
      continue;
    }

    // Collect values for each quarter column.
    const values = [];
    for (let c = 3; c < 3 + quarters.length; c++) {
      values.push(parseNum(row[c]));
    }

    items.push({ code, label, indent: indentLevel(code), section });
    data[code] = values;
  }

  if (items.length === 0) throw new Error('no valid item rows parsed from the BPM6 sheet');

  return {
    reportTitle : 'International investment position: external assets and liabilities',
    unit        : 'US$ millions',
    standard    : 'BPM6',
    quarters,
    items,
    data,
  };
}

// --- self-check: fail loudly (non-zero exit) if the shape or known cells drift ---
function selfCheck(out) {
  const { quarters, items, data } = out;
  const errors = [];

  // Must have at least 28 quarter columns.
  if (!Array.isArray(quarters) || quarters.length < 28) {
    errors.push(`expected ≥28 quarter columns, got ${quarters ? quarters.length : 'n/a'}`);
  }

  // Quarters must be unique.
  const uniqQ = new Set(quarters);
  if (uniqQ.size !== quarters.length) {
    errors.push(`quarters not unique: ${quarters.length} entries, ${uniqQ.size} distinct`);
  }

  // Hard-coded known cells (verified against the source sheet).
  const q0 = '2025-26:Q3'; // first (newest) quarter
  const q0Idx = quarters.indexOf(q0);
  if (q0Idx < 0) {
    errors.push(`expected quarter "${q0}" not found in quarters array`);
  } else {
    const known = [
      { code: 'A',   expected: 1198020.002 },
      { code: 'B',   expected: 1458505.97  },
      { code: 'NET', expected: -260485.9688 },
    ];
    for (const { code, expected } of known) {
      const vals = data[code];
      if (!vals) { errors.push(`data missing for code "${code}"`); continue; }
      const actual = vals[q0Idx];
      if (actual == null) {
        errors.push(`${code} @ ${q0}: expected ${expected}, got null`);
      } else if (Math.abs(actual - expected) > 0.01) {
        errors.push(`${code} @ ${q0}: expected ${expected}, got ${actual}`);
      }
    }
  }

  // All item codes must have corresponding data arrays.
  for (const item of items) {
    if (!data[item.code]) {
      errors.push(`item "${item.code}" has no data array`);
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('international-investment-position self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'international-investment-position.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.items.length} items × ${out.quarters.length} quarters ` +
    `(newest ${out.quarters[0]}, oldest ${out.quarters[out.quarters.length - 1]}); ` +
    `self-check passed`,
  );
}

main();

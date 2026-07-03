// Processor: changes-in-financial-assets-liabilities-of-the-household-sector (annual) — RBI HSIE Table.
//
// Source xlsx "Report 1" sheet layout:
//   row 1  title "Changes in Financial Assets/Liabilities of the Household Sector (At Current Prices)"
//   row 3  "(Rupees Crores)"
//   row 5  header: Year | Currency | Bank deposits | Non-banking deposits | Life insurance fund |
//                  Provident and pension fund | Claims on Government | Shares & debentures |
//                  Units of UTI | Trade Debt (Net) | Changes in financial assets (2 to 10) |
//                  Bank advances | Loans & advances from other financial institutions |
//                  Loans & advances from Government |
//                  Loans & advances from co-operative non-credit societies
//   row 6  column numbers "1" through "15"
//   rows 7–60 data newest-first (2023-24 to 1970-71)
//   row 62 Notes + Source
//
// Column mapping (0-based indices into the row array):
//   1 = Year, 2 = currency, 3 = bank_deposits, 4 = non_banking_deposits,
//   5 = life_insurance_fund, 6 = provident_pension_fund, 7 = claims_on_government,
//   8 = shares_debentures, 9 = units_of_uti, 10 = trade_debt_net,
//   11 = changes_in_financial_assets, 12 = bank_advances,
//   13 = loans_other_financial_institutions, 14 = loans_government,
//   15 = loans_cooperative_societies
//
// Emits:
//   out/changes-in-financial-assets-liabilities-of-the-household-sector.json
//     { reportTitle, unit, data: [{ year, currency, bank_deposits, … } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/national-income-saving-employment/Changes in Financial Assets_Liabilities of the Household Sector (At Current Prices).xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "1,442,142" -> 1442142. "269667.3507" -> 269667.3507.
// Returns null for blank/dash so gaps stay distinct from real zeros.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// "2023-24" -> 2023 (sort key, first 4 digits). Returns null if not a fiscal-year label.
function yearSortKey(label) {
  const m = String(label).trim().match(/^(\d{4})-\d{2}$/);
  return m ? parseInt(m[1], 10) : null;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  // Scan all sheets looking for the one with the expected header.
  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
      header   : 1,
      raw      : false,
      defval   : null,
      blankrows: true,
    });

    let reportTitle  = '';
    let unit         = 'Rupees Crores';
    let dataStartRow = -1;

    for (let i = 0; i < Math.min(rows.length, 12); i++) {
      const row = rows[i] || [];
      const c1  = cellStr(row, 1).trim();

      // Row 1: title
      if (/Financial Assets/i.test(c1) && /Household/i.test(c1)) {
        reportTitle = c1;
      }

      // Unit row e.g. "(Rupees Crores)"
      if (/Rupees/i.test(c1)) {
        const m = c1.match(/\(([^)]+)\)/);
        if (m) unit = m[1].trim();
      }

      // Header row: col[1] matches /Year/i AND col[2] matches /Currency/i
      if (/Year/i.test(c1) && /Currency/i.test(cellStr(row, 2).trim())) {
        // The column-number row immediately follows the header row.
        // Look ahead: skip to first row where col[1] = "1", col[2] = "2".
        for (let j = i + 1; j <= i + 2 && j < rows.length; j++) {
          const nr = rows[j] || [];
          if (cellStr(nr, 1).trim() === '1' && cellStr(nr, 2).trim() === '2') {
            dataStartRow = j + 1;
            break;
          }
        }
        if (dataStartRow < 0) {
          // Fallback: data immediately follows the header row
          dataStartRow = i + 1;
        }
        break;
      }
    }

    if (dataStartRow < 0) continue; // not the right sheet

    const data = [];
    for (let i = dataStartRow; i < rows.length; i++) {
      const row  = rows[i] || [];
      const year = cellStr(row, 1).trim();
      if (year === '') continue;
      if (/^Note/i.test(year) || /^Source/i.test(year)) break;
      if (yearSortKey(year) === null) continue; // skip non-fiscal-year rows

      data.push({
        year,
        currency                          : parseNum(row[2]),
        bank_deposits                     : parseNum(row[3]),
        non_banking_deposits              : parseNum(row[4]),
        life_insurance_fund               : parseNum(row[5]),
        provident_pension_fund            : parseNum(row[6]),
        claims_on_government              : parseNum(row[7]),
        shares_debentures                 : parseNum(row[8]),
        units_of_uti                      : parseNum(row[9]),
        trade_debt_net                    : parseNum(row[10]),
        changes_in_financial_assets       : parseNum(row[11]),
        bank_advances                     : parseNum(row[12]),
        loans_other_financial_institutions: parseNum(row[13]),
        loans_government                  : parseNum(row[14]),
        loans_cooperative_societies       : parseNum(row[15]),
      });
    }

    if (data.length === 0) throw new Error('no valid data rows found in sheet');

    return {
      reportTitle : reportTitle || 'Changes in Financial Assets/Liabilities of the Household Sector (At Current Prices)',
      unit,
      data,
    };
  }

  throw new Error('could not locate the header row in any sheet');
}

// --- self-check: fail loudly (non-zero exit) if the shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 50) {
    errors.push(`expected ≥50 annual rows, got ${data ? data.length : 'n/a'}`);
  }

  // Hard-coded cell assertions (verified against the source sheet).
  const known = [
    {
      year                       : '2023-24',
      currency                   : 118026,
      bank_deposits              : 1442142,
      changes_in_financial_assets: 3430640,
    },
    {
      year         : '1970-71',
      currency     : 355,
      bank_deposits: 754,
      changes_in_financial_assets: 2110,
    },
    {
      year              : '2008-09',
      shares_debentures : -2333,
      units_of_uti      : -2737,
    },
  ];

  for (const exp of known) {
    const row = data.find((r) => r.year === exp.year);
    if (!row) { errors.push(`known year missing: ${exp.year}`); continue; }
    for (const [field, val] of Object.entries(exp)) {
      if (field === 'year') continue;
      if (val == null) continue;
      if (Math.abs((row[field] ?? NaN) - val) > 0.5) {
        errors.push(`${exp.year} ${field}: expected ${val}, got ${row[field]}`);
      }
    }
  }

  // Years must be unique.
  const keys = data.map((r) => r.year);
  const uniq = new Set(keys);
  if (uniq.size !== keys.length) errors.push(`years not unique: ${keys.length} rows, ${uniq.size} distinct`);

  // Ordered newest-first (strictly descending by the 4-digit start year).
  for (let i = 1; i < keys.length; i++) {
    const prev = yearSortKey(keys[i - 1]);
    const curr = yearSortKey(keys[i]);
    if (prev !== null && curr !== null && prev <= curr) {
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
    console.error('changes-in-financial-assets-liabilities-of-the-household-sector self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'changes-in-financial-assets-liabilities-of-the-household-sector.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} annual rows ` +
    `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}); self-check passed`,
  );
}

main();

// Processor: average-price-of-gold-and-silver-in-domestic-and-foreign-markets (annual) — RBI Handbook Table.
//
// Source xlsx carries one sheet ("Report 1") with annual average prices of gold and
// silver in domestic (Mumbai) and foreign (London/New York) markets, newest-first
// from "2024-25" back to "1970-71". Layout:
//   row 1  title
//   row 3  top header: "Year | Gold (cols 2-5) | Silver (cols 6-9)"
//   row 4  mid header: "Mumbai | London | (₹ equiv) | Spread ₹ | Mumbai | New York | (₹ equiv) | Spread ₹"
//   row 5  units row
//   row 6  column numbers "1" … "9"
//   rows 7… data (col 1 = "YYYY-YY", cols 2-9 = values)
//   trailing blank row + "Notes" footer
//
// Emits (newest-first):
//   out/average-price-of-gold-and-silver-in-domestic-and-foreign-markets.json
//     {
//       reportTitle,
//       units: { goldMumbai, goldLondon, goldMumbaiRupees, goldSpread,
//                silverMumbai, silverNY, silverNYRupees, silverSpread },
//       data: [{ year, gold_mumbai, gold_london, gold_mumbai_rupees, gold_spread,
//                silver_mumbai, silver_ny, silver_ny_rupees, silver_spread } …]
//     }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/output-and-prices/Average Price of Gold and Silver in Domestic and Foreign Markets.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "75,841.87" -> 75841.87. Returns null for blank/dash so gaps stay distinct from real zeros.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// "2024-25" -> "2024-25" (already canonical; used for ordering + uniqueness checks).
// Returns null if the string does not look like a financial-year label.
function yearKey(label) {
  const m = label.match(/^(\d{4})-(\d{2})$/);
  return m ? label : null;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  // The table lives on a single sheet ("Report 1"), but scan every sheet defensively
  // and take the one that yields the data we expect.
  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
      header: 1,
      raw: false,
      defval: null,
      blankrows: true,
    });

    let reportTitle = '';
    let dataStartRow = -1;

    // Units are read from the known unit row (row index 4, 0-based).
    let goldMumbaiUnit    = '₹ per 10 gms.';
    let goldLondonUnit    = '$ per troy oz.';
    let goldMumbaiRupeesUnit = '₹ per 10 gms.';
    let goldSpreadUnit    = '₹';
    let silverMumbaiUnit  = '₹ per kg.';
    let silverNYUnit      = 'Cents per troy oz.';
    let silverNYRupeesUnit = '₹ per kg.';
    let silverSpreadUnit  = '₹';

    for (let i = 0; i < Math.min(rows.length, 12); i++) {
      const row = rows[i] || [];
      const c1 = cellStr(row, 1).trim();

      // Row 0 (index 0) holds the report title.
      if (i === 0 && c1) {
        reportTitle = c1;
      }

      // Units row: col 1 = "₹ per 10 gms." (gold Mumbai), col 2 = "$ per troy oz." …
      // These are in row index 4 (0-based), detected by the ₹ symbol.
      if (/₹\s*per\s*10/.test(c1)) {
        goldMumbaiUnit      = c1 || goldMumbaiUnit;
        goldLondonUnit      = cellStr(row, 2).trim() || goldLondonUnit;
        goldMumbaiRupeesUnit = cellStr(row, 3).trim() || goldMumbaiRupeesUnit;
        silverMumbaiUnit    = cellStr(row, 5).trim() || silverMumbaiUnit;
        silverNYUnit        = cellStr(row, 6).trim() || silverNYUnit;
        silverNYRupeesUnit  = cellStr(row, 7).trim() || silverNYRupeesUnit;
      }

      // Column-number row "1","2",…,"9" immediately precedes the data rows.
      if (c1 === '1' && cellStr(row, 2).trim() === '2') {
        dataStartRow = i + 1;
        break;
      }
    }

    if (dataStartRow < 0) continue; // not the data sheet — try the next one

    const data = [];
    for (let i = dataStartRow; i < rows.length; i++) {
      const row = rows[i] || [];
      const year = cellStr(row, 1).trim();
      if (year === '') continue;
      if (/^Note/i.test(year) || /^Source/i.test(year)) continue;
      if (!yearKey(year)) continue; // skip anything that isn't a "YYYY-YY" data row

      data.push({
        year,
        gold_mumbai       : parseNum(row[2]),
        gold_london       : parseNum(row[3]),
        gold_mumbai_rupees: parseNum(row[4]),
        gold_spread       : parseNum(row[5]),
        silver_mumbai     : parseNum(row[6]),
        silver_ny         : parseNum(row[7]),
        silver_ny_rupees  : parseNum(row[8]),
        silver_spread     : parseNum(row[9]),
      });
    }

    if (data.length === 0) throw new Error('no valid data rows found in sheet');

    return {
      reportTitle: reportTitle || 'Average Price of Gold and Silver in Domestic and Foreign Markets',
      units: {
        goldMumbai       : goldMumbaiUnit,
        goldLondon       : goldLondonUnit,
        goldMumbaiRupees : goldMumbaiRupeesUnit,
        goldSpread       : goldSpreadUnit,
        silverMumbai     : silverMumbaiUnit,
        silverNY         : silverNYUnit,
        silverNYRupees   : silverNYRupeesUnit,
        silverSpread     : silverSpreadUnit,
      },
      data,
    };
  }

  throw new Error('could not locate the data header row in any sheet');
}

// --- self-check: fail loudly (non-zero exit) if the shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 50) {
    errors.push(`expected ≥50 annual rows, got ${data ? data.length : 'n/a'}`);
  }

  // Known cells (verified against the source sheet).
  const known = [
    {
      year        : '2024-25',
      gold_mumbai : 75841.87,
      gold_london : 2584.53,
      gold_mumbai_rupees : 70315.41,
      gold_spread : 5526.46,
      silver_mumbai : 89130.53,
      silver_ny   : 3039.22,
      silver_ny_rupees : 82685.10,
      silver_spread : 11700.17,
    },
    {
      year        : '1970-71',
      gold_mumbai : 184.96,
    },
    {
      year          : '1973-74',
      silver_mumbai : 799.01,
    },
  ];

  for (const exp of known) {
    const row = data.find((r) => r.year === exp.year);
    if (!row) { errors.push(`known year missing: ${exp.year}`); continue; }
    for (const [field, val] of Object.entries(exp)) {
      if (field === 'year') continue;
      if (val == null) continue;
      if (Math.abs((row[field] ?? NaN) - val) > 0.005) {
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
    const prev = parseInt(keys[i - 1], 10);
    const curr = parseInt(keys[i], 10);
    if (!Number.isNaN(prev) && !Number.isNaN(curr) && prev <= curr) {
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
    console.error('average-price-of-gold-and-silver self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'average-price-of-gold-and-silver-in-domestic-and-foreign-markets.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} annual rows ` +
    `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}); self-check passed`,
  );
}

main();

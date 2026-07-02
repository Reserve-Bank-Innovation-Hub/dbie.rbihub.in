// Processor: foreign-investment-inflows
//
// Ports backend/internal/parser/foreign_investment_inflows_parser.go +
// service/indicators_service.go (GetForeignInvestmentInflows / ...Recent)
// to JS, matching the excelize-based Go parser exactly.
//
// Emits:
//   out/foreign-investment-inflows.json         (full)
//   out/foreign-investment-inflows-recent.json  (first 12 of .data)
import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '..', 'sources',
  'RBIB Table No. 34 _ Foreign Investment Inflows.xlsx');
const OUT_DIR = path.join(__dirname, 'out');

// excelize renders unformatted numeric cells with round-half-away-from-zero,
// e.g. -36.5 -> -37 (JS Math.round rounds half toward +Inf, so it differs on .5).
function excelizeRound(x) {
  return x < 0 ? -Math.round(-x) : Math.round(x);
}

// Mirror Go's parseFloat: strip commas, empty/"-"/"N/A" -> 0, else parse.
function parseFloat_(v) {
  const s = String(v ?? '').trim().replaceAll(',', '');
  if (s === '' || s === '-' || s === 'N/A') return 0;
  const n = Number(s);
  return Number.isNaN(n) ? 0 : n;
}

// excelize GetRows trims trailing empty cells; this returns that trimmed length.
function trimmedLen(row) {
  let last = -1;
  for (let c = 0; c < row.length; c++) {
    if (String(row[c] ?? '') !== '') last = c;
  }
  return last + 1;
}

function parseForeignInvestmentInflows() {
  const wb = XLSX.read(fs.readFileSync(SRC), { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];

  // The file's !ref understates the used range (A1:Y182), dropping column Z
  // which holds "Total Investment Inflows". Widen it so sheet_to_json keeps col Z.
  const range = XLSX.utils.decode_range(ws['!ref']);
  range.e.c = Math.max(range.e.c, 25);
  ws['!ref'] = XLSX.utils.encode_range(range);

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });

  // Title from row 1 col 1, unit from row 3 col 1.
  const reportTitle = String(rows[1]?.[1] ?? '').trim();
  const unit = String(rows[3]?.[1] ?? '').trim();

  const data = [];
  for (let i = 6; i < rows.length; i++) {
    const row = rows[i];
    if (trimmedLen(row) < 26) continue;

    const month = String(row[1] ?? '').trim();
    if (month === '') continue;

    data.push({
      month,
      netFdi: excelizeRound(parseFloat_(row[2])),
      netPortfolioInvestment: excelizeRound(parseFloat_(row[20])),
      totalInvestmentInflows: excelizeRound(parseFloat_(row[25])),
    });
  }

  return { data, reportTitle, unit };
}

const full = parseForeignInvestmentInflows();
const recent = {
  data: full.data.slice(0, 12),
  reportTitle: full.reportTitle,
  unit: full.unit,
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'foreign-investment-inflows.json'),
  JSON.stringify(full));
fs.writeFileSync(path.join(OUT_DIR, 'foreign-investment-inflows-recent.json'),
  JSON.stringify(recent));

console.log(`wrote ${full.data.length} records (recent: ${recent.data.length})`);

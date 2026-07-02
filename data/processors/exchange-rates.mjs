// exchange-rates processor
// Ports backend/internal/parser/exchange_rate_parser.go to ESM.
// Reads the RBI daily exchange-rate text file (tab-separated, 6 header lines,
// newest-first), reverses to oldest-first, and writes the same JSON shape the
// Go service serialises: { data: [...], currencies: [...] }.
//
// The `date` field mirrors Go's time.Time JSON marshalling of a UTC midnight
// date: RFC3339 "YYYY-MM-DDT00:00:00Z".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(
  __dirname,
  '..', 'sources',
  'Daily Exchange Rate of the Indian Rupee.txt',
);
const OUT = path.join(__dirname, 'out', 'exchange-rates.json');

// Month name -> 1-based month number (matches Go's monthMap).
const monthMap = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

const pad2 = (n) => String(n).padStart(2, '0');

function parseExchangeRate(rawData) {
  const lines = rawData.split('\n');
  const data = [];

  let lineNum = 0;
  for (const rawLine of lines) {
    lineNum++;

    // Skip first 6 lines (headers) — matches Go's `lineNum <= 6`.
    if (lineNum <= 6) continue;

    const line = rawLine.trim();
    if (line === '') continue;

    // Split by tab.
    const columns = line.split('\t');
    if (columns.length < 5) continue;

    // Parse date (format: DD-MMM-YYYY).
    const dateParts = columns[0].split('-');
    if (dateParts.length !== 3) continue;

    const day = parseInt(dateParts[0], 10);
    if (!Number.isInteger(day) || !/^\d+$/.test(dateParts[0].trim())) continue;

    const month = monthMap[dateParts[1]];
    if (month === undefined) continue;

    const year = parseInt(dateParts[2], 10);
    if (!Number.isInteger(year) || !/^\d+$/.test(dateParts[2].trim())) continue;

    // strconv.ParseFloat: reject non-numeric strings (parseFloat is lenient).
    const usDollar = parseStrictFloat(columns[1]);
    const poundSterling = parseStrictFloat(columns[2]);
    const euro = parseStrictFloat(columns[3]);
    const japaneseYen = parseStrictFloat(columns[4]);

    if (usDollar === null || poundSterling === null || euro === null || japaneseYen === null) {
      continue;
    }

    // Go: time.Date(year, month, day, 0,0,0,0, UTC) -> RFC3339 with Z.
    const dateStr = `${year}-${pad2(month)}-${pad2(day)}T00:00:00Z`;

    data.push({
      // Numeric key for sorting; dropped before output.
      _sortKey: Date.UTC(year, month - 1, day),
      date: dateStr,
      dateString: columns[0],
      usDollar,
      poundSterling,
      euro,
      japaneseYen,
    });
  }

  if (data.length === 0) {
    throw new Error('no valid data found in file');
  }

  // Go reverses the file order (newest-first -> oldest-first). The file is
  // strictly newest-first, so a stable sort by date ascending is equivalent
  // and robust to any stray ordering.
  data.sort((a, b) => a._sortKey - b._sortKey);
  for (const row of data) delete row._sortKey;

  const currencies = [
    { name: 'usDollar', key: 'usDollar', displayName: 'US Dollar' },
    { name: 'poundSterling', key: 'poundSterling', displayName: 'Pound Sterling' },
    { name: 'euro', key: 'euro', displayName: 'Euro' },
    { name: 'japaneseYen', key: 'japaneseYen', displayName: 'Japanese Yen' },
  ];

  return { data, currencies };
}

// Mirror Go's strconv.ParseFloat(s, 64): the whole trimmed string must be a
// valid float, else treat as invalid (null). JS parseFloat would accept
// "88.6 foo" — we reject that.
function parseStrictFloat(s) {
  const t = s.trim();
  if (t === '') return null;
  const n = Number(t);
  if (Number.isNaN(n)) return null;
  return n;
}

const raw = fs.readFileSync(SRC, 'utf8');
const result = parseExchangeRate(raw);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result));
console.error(`wrote ${result.data.length} rows -> ${OUT}`);

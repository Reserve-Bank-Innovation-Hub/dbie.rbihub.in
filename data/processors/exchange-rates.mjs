// exchange-rates processor (hybrid)
//
// Ports backend/internal/parser/exchange_rate_parser.go to ESM, then extends it
// with fresh daily data scraped from DBIE's SDMX wizard.
//
// BASE (unchanged): the RBI daily exchange-rate text file (tab-separated,
//   6 header lines, newest-first) covering 1999-01-04 → 2025-11-17. Parsing is
//   byte-identical to the Go service output and to oracles/exchange-rates.json.
//
// EXTENSION (new): rows from the committed SDMX daily CSV
//   (exchange-rate-of-the-indian-rupee-daily.csv, element FOREX_RATE_D_RN) for
//   dates AFTER the base's newest date. Each date's four CURRENCY rows
//   (USD/GBP/EUR/JPY) are pivoted into one { usDollar, poundSterling, euro,
//   japaneseYen } record. A date missing any of the four is skipped.
//
// RECONCILIATION GATE: the daily CSV carries a Jan-2011 stub that overlaps the
//   .txt base (same portal source). Before trusting the CSV we compare ≥10
//   overlapping (date, currency) values; any mismatch aborts the run.
//
// Output shape is identical to the Go service: { data: [...oldest-first],
// currencies: [4 fixed entries] }. The `date` field mirrors Go's time.Time JSON
// marshalling of a UTC-midnight date: RFC3339 "YYYY-MM-DDT00:00:00Z", built by
// string (not Date.toISOString) to avoid any local-timezone drift.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(
  __dirname,
  '..', 'sources',
  'Daily Exchange Rate of the Indian Rupee.txt',
);
const DAILY_CSV = path.join(
  __dirname,
  '..', 'sdmx', 'financial-markets', 'forex-market',
  'exchange-rate-of-the-indian-rupee-daily.csv',
);
const OUT = path.join(__dirname, 'out', 'exchange-rates.json');

// Month name -> 1-based month number (matches Go's monthMap).
const monthMap = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};
const monthName = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad2 = (n) => String(n).padStart(2, '0');

// Mirror Go's strconv.ParseFloat(s, 64): the whole trimmed string must be a
// valid float, else treat as invalid (null). JS parseFloat would accept
// "88.6 foo" — we reject that.
function parseStrictFloat(s) {
  const t = String(s).trim();
  if (t === '') return null;
  const n = Number(t);
  if (Number.isNaN(n)) return null;
  return n;
}

// --------- BASE: parse the .txt (identical to the original processor)
function parseTxtBase(rawData) {
  const lines = rawData.split('\n');
  const data = [];

  let lineNum = 0;
  for (const rawLine of lines) {
    lineNum++;
    // Skip first 6 lines (headers) — matches Go's `lineNum <= 6`.
    if (lineNum <= 6) continue;

    const line = rawLine.trim();
    if (line === '') continue;

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

    const usDollar = parseStrictFloat(columns[1]);
    const poundSterling = parseStrictFloat(columns[2]);
    const euro = parseStrictFloat(columns[3]);
    const japaneseYen = parseStrictFloat(columns[4]);

    if (usDollar === null || poundSterling === null || euro === null || japaneseYen === null) {
      continue;
    }

    const dateStr = `${year}-${pad2(month)}-${pad2(day)}T00:00:00Z`;

    data.push({
      _sortKey: Date.UTC(year, month - 1, day),
      _iso: `${year}-${pad2(month)}-${pad2(day)}`,
      date: dateStr,
      dateString: columns[0],
      usDollar,
      poundSterling,
      euro,
      japaneseYen,
    });
  }

  if (data.length === 0) {
    throw new Error('no valid data found in base .txt file');
  }
  return data;
}

// --------- EXTENSION: parse the committed SDMX daily CSV into per-date records.
// Returns a Map keyed by ISO date "YYYY-MM-DD" -> { usDollar, poundSterling,
// euro, japaneseYen } for dates that have all four currencies. Also returns the
// raw per-(date,currency) values for the reconciliation gate.
const CURRENCY_TO_FIELD = {
  USD: 'usDollar',
  GBP: 'poundSterling',
  EUR: 'euro',
  JPY: 'japaneseYen',
};

function parseDailyCsv(rawData) {
  const lines = rawData.split(/\r?\n/);
  if (lines.length < 2) return { byDate: new Map(), rawValues: new Map() };
  const header = lines[0].split(',').map(s => s.trim());
  const iCurrency = header.indexOf('CURRENCY');
  const iTime = header.indexOf('TIME_PERIOD');
  const iValue = header.indexOf('OBS_VALUE');
  if (iCurrency < 0 || iTime < 0 || iValue < 0) {
    throw new Error(`daily CSV missing required columns (CURRENCY/TIME_PERIOD/OBS_VALUE): ${lines[0]}`);
  }

  // date -> { field -> Number }
  const perDate = new Map();
  // "date|currency" -> Number, for reconciliation
  const rawValues = new Map();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const parts = line.split(',');
    const currency = parts[iCurrency];
    const time = parts[iTime]; // YYYY-MM-DD
    const value = parseStrictFloat(parts[iValue]);
    if (value === null) continue;
    const field = CURRENCY_TO_FIELD[currency];
    rawValues.set(`${time}|${currency}`, value);
    if (!field) continue; // ignore SDR or any non-target currency
    if (!perDate.has(time)) perDate.set(time, {});
    perDate.get(time)[field] = value;
  }

  // Keep only dates that have all four target currencies.
  const byDate = new Map();
  for (const [date, fields] of perDate) {
    if (fields.usDollar !== undefined && fields.poundSterling !== undefined
      && fields.euro !== undefined && fields.japaneseYen !== undefined) {
      byDate.set(date, fields);
    }
  }
  return { byDate, rawValues };
}

// --------- RECONCILIATION GATE
// Compare overlapping (date, currency) values between the .txt base and the
// daily CSV. They come from the same portal, so they must match exactly. We
// require at least MIN_OVERLAP comparisons to succeed; any value mismatch, or
// too few overlaps, aborts the run.
const MIN_OVERLAP = 10;

function reconcile(baseByIso, csvRawValues) {
  const fieldToCurrency = { usDollar: 'USD', poundSterling: 'GBP', euro: 'EUR', japaneseYen: 'JPY' };
  let compared = 0;
  const mismatches = [];
  for (const [iso, row] of baseByIso) {
    for (const [field, currency] of Object.entries(fieldToCurrency)) {
      const csvVal = csvRawValues.get(`${iso}|${currency}`);
      if (csvVal === undefined) continue;
      compared++;
      if (csvVal !== row[field]) {
        mismatches.push({ iso, currency, base: row[field], csv: csvVal });
      }
    }
  }
  return { compared, mismatches };
}

// --------- MAIN
function main() {
  const rawTxt = fs.readFileSync(SRC, 'utf8');
  const baseData = parseTxtBase(rawTxt);

  // Base index by ISO date, and the base's newest ISO date.
  const baseByIso = new Map();
  let baseMaxIso = '';
  for (const row of baseData) {
    baseByIso.set(row._iso, row);
    if (row._iso > baseMaxIso) baseMaxIso = row._iso;
  }

  // Parse the committed daily CSV (if present).
  let byDate = new Map();
  let rawValues = new Map();
  if (fs.existsSync(DAILY_CSV)) {
    const parsed = parseDailyCsv(fs.readFileSync(DAILY_CSV, 'utf8'));
    byDate = parsed.byDate;
    rawValues = parsed.rawValues;
  } else {
    console.error(`WARNING: daily CSV not found (${DAILY_CSV}) — emitting base only.`);
  }

  // Reconciliation gate against the overlapping (Jan-2011) region.
  if (rawValues.size > 0) {
    const { compared, mismatches } = reconcile(baseByIso, rawValues);
    if (mismatches.length > 0) {
      console.error(`RECONCILIATION FAILED: ${mismatches.length} mismatch(es) of ${compared} overlapping values.`);
      for (const m of mismatches.slice(0, 10)) {
        console.error(`  ${m.iso} ${m.currency}: base=${m.base} csv=${m.csv}`);
      }
      process.exit(1);
    }
    if (compared < MIN_OVERLAP) {
      console.error(`RECONCILIATION FAILED: only ${compared} overlapping (date,currency) values found; need ≥${MIN_OVERLAP}.`);
      process.exit(1);
    }
    console.error(`Reconciliation OK: ${compared} overlapping values match exactly.`);
  }

  // Append CSV rows strictly AFTER the base's newest date.
  const appended = [];
  for (const [iso, fields] of byDate) {
    if (iso <= baseMaxIso) continue; // overlap/older handled by the base
    const [year, month, day] = iso.split('-').map(Number);
    appended.push({
      _sortKey: Date.UTC(year, month - 1, day),
      date: `${iso}T00:00:00Z`,
      // dd-MMM-yyyy, matching the .txt dateString style (e.g. "18-Nov-2025").
      dateString: `${pad2(day)}-${monthName[month]}-${year}`,
      usDollar: fields.usDollar,
      poundSterling: fields.poundSterling,
      euro: fields.euro,
      japaneseYen: fields.japaneseYen,
    });
  }

  // Merge: base rows (drop scratch fields) + appended rows, sort oldest-first.
  const data = [];
  for (const row of baseData) {
    data.push({
      _sortKey: row._sortKey,
      date: row.date,
      dateString: row.dateString,
      usDollar: row.usDollar,
      poundSterling: row.poundSterling,
      euro: row.euro,
      japaneseYen: row.japaneseYen,
    });
  }
  for (const row of appended) data.push(row);

  data.sort((a, b) => a._sortKey - b._sortKey);
  for (const row of data) delete row._sortKey;

  const currencies = [
    { name: 'usDollar', key: 'usDollar', displayName: 'US Dollar' },
    { name: 'poundSterling', key: 'poundSterling', displayName: 'Pound Sterling' },
    { name: 'euro', key: 'euro', displayName: 'Euro' },
    { name: 'japaneseYen', key: 'japaneseYen', displayName: 'Japanese Yen' },
  ];

  const result = { data, currencies };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(result));
  console.error(`wrote ${result.data.length} rows (${baseData.length} base + ${appended.length} appended) -> ${OUT}`);
}

main();

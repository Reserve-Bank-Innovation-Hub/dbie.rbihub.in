// Processor: treasury-bill-auctions — Monthly RBI Bulletin Table 26.
//
// Source xlsx carries three sheets, one per T-bill tenor:
//   Sheet 0 "Auctions of Government of India"         → 91-day
//   Sheet 1 "Action of Government of India 1"         → 182-day
//   Sheet 2 "Action of Government of India 3"         → 364-day
//
// Layout (same across all three sheets):
//   row 0  blank
//   row 1  title "Auctions of Government of India <N>- Day Treasury Bills"
//   row 2  blank
//   row 3  stacked column headers (top level: date/notified/bids received/bids accepted/total/cutoff/yield/wavg)
//   row 4  sub-headers ("Number", "Total Face Value …")
//   row 5  sub-sub-headers ("Competitive", "Non-Competitive")
//   row 6  column numbers 1–13
//   rows 7…  data — col[1] matches /^\d{2}-[A-Z][a-z]{2}-\d{4}$/
//   blank row then Note: lines at bottom
//
// Column mapping (1-indexed per sheet numbering, 0-indexed in row array):
//   col[1]  = auction date   col[2]  = issue date
//   col[3]  = notified amt   col[4]  = bids recd num
//   col[5]  = bids recd competitive FV
//   col[6]  = bids recd non-competitive FV
//   col[7]  = bids accepted num
//   col[8]  = bids accepted competitive FV
//   col[9]  = bids accepted non-competitive FV
//   col[10] = total issue    col[11] = cut-off price
//   col[12] = implicit yield col[13] = wtd avg price
//
// "-" cells → null. "0.0000" on cut-off = devolved/cancelled auction (kept as-is).
// Footnotes ("Note :…") collected from sheet 0 only.
//
// Emits (newest-first, ties ordered 91→182→364):
//   out/treasury-bill-auctions.json
//     { reportTitle, notes: string[], data: [ TreasuryBillAuctionRow… ] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/government-accounts-and-treasury-bills/table-26-auctions-of-government-of-india-treasury-bills.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Month name → 0-indexed month number for date sorting.
const MONTH_MAP = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

// "08-Apr-2026" → sortable numeric value (milliseconds since epoch).
// Does NOT rely on Date.parse() which may parse differently across environments.
function parseDateMs(s) {
  const m = /^(\d{2})-([A-Z][a-z]{2})-(\d{4})$/.exec(s.trim());
  if (!m) return NaN;
  const day   = parseInt(m[1], 10);
  const month = MONTH_MAP[m[2]];
  const year  = parseInt(m[3], 10);
  if (month == null) return NaN;
  return Date.UTC(year, month, day);
}

// "1,23,456.7" → 123456.7. Returns null for blank/dash so gaps stay distinct from real zeros.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

const DATA_DATE_RE = /^\d{2}-[A-Z][a-z]{2}-\d{4}$/;

function parseSheet(sheet, tenor) {
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header    : 1,
    raw       : false,
    defval    : null,
    blankrows : true,
  });

  const data = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const cell1 = String(row[1] == null ? '' : row[1]).trim();
    if (!DATA_DATE_RE.test(cell1)) continue;

    data.push({
      tenor,
      auction_date        : cell1,
      issue_date          : String(row[2] == null ? '' : row[2]).trim(),
      notified            : parseNum(row[3]),
      bids_recd_num       : parseNum(row[4]),
      bids_recd_comp      : parseNum(row[5]),
      bids_recd_noncomp   : parseNum(row[6]),
      bids_acc_num        : parseNum(row[7]),
      bids_acc_comp       : parseNum(row[8]),
      bids_acc_noncomp    : parseNum(row[9]),
      total_issue         : parseNum(row[10]),
      cutoff_price        : parseNum(row[11]),
      implicit_yield      : parseNum(row[12]),
      wavg_price          : parseNum(row[13]),
    });
  }

  return data;
}

// Extract "Note :…" footnote lines from a sheet (bottom rows only).
function extractNotes(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header    : 1,
    raw       : false,
    defval    : null,
    blankrows : true,
  });

  const notes = [];
  for (let i = rows.length - 1; i >= Math.max(0, rows.length - 15); i--) {
    const row = rows[i] || [];
    for (let ci = 0; ci < row.length; ci++) {
      const v = String(row[ci] == null ? '' : row[ci]).trim();
      if (v.startsWith('Note') && v.length > 6) {
        // Normalise leading spaces and collapse internal whitespace.
        notes.unshift(v.replace(/\s+/g, ' ').trim());
        break;
      }
    }
  }
  return notes;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length < 3) throw new Error(`expected 3 sheets, found ${wb.SheetNames.length}`);

  const tenors  = ['91-day', '182-day', '364-day'];
  const allRows = [];
  const counts  = [];

  for (let idx = 0; idx < 3; idx++) {
    const rows = parseSheet(wb.Sheets[wb.SheetNames[idx]], tenors[idx]);
    allRows.push(...rows);
    counts.push(rows.length);
  }

  // Extract notes from the first sheet only.
  const notes = extractNotes(wb.Sheets[wb.SheetNames[0]]);

  // Tenor sort order for tie-breaking.
  const tenorOrder = { '91-day': 0, '182-day': 1, '364-day': 2 };

  // Sort newest-first; ties → 91 before 182 before 364.
  allRows.sort((a, b) => {
    const ta = parseDateMs(a.auction_date);
    const tb = parseDateMs(b.auction_date);
    if (tb !== ta) return tb - ta;                            // descending by date
    return tenorOrder[a.tenor] - tenorOrder[b.tenor];        // ascending by tenor
  });

  return {
    reportTitle : 'Auctions of Government of India Treasury Bills',
    notes,
    data        : allRows,
    _counts     : counts,  // internal; stripped before write
  };
}

// --- self-check: fail loudly (non-zero exit) if known anchors drift ---
function selfCheck(out) {
  const { data, _counts } = out;
  const errors = [];

  // Total row count.
  const total = data.length;
  if (total < 1900) {
    errors.push(`expected ≥1,900 rows total, got ${total}`);
  }

  // Per-sheet counts (allows ±5 rows for future additions).
  const [c91, c182, c364] = _counts;
  if (c91 < 770)  errors.push(`91-day: expected ≥770 rows, got ${c91}`);
  if (c182 < 600) errors.push(`182-day: expected ≥600 rows, got ${c182}`);
  if (c364 < 600) errors.push(`364-day: expected ≥600 rows, got ${c364}`);

  // Newest-first ordering.
  for (let i = 1; i < data.length; i++) {
    const ta = parseDateMs(data[i - 1].auction_date);
    const tb = parseDateMs(data[i].auction_date);
    if (ta < tb) {
      errors.push(`not newest-first at row ${i}: ${data[i - 1].auction_date} then ${data[i].auction_date}`);
      break;
    }
  }

  // First element should be 91-day (newest date, first tenor).
  if (data[0]?.tenor !== '91-day') {
    errors.push(`first row should be 91-day, got ${data[0]?.tenor}`);
  }

  // Known anchor: 91-day, 08-Apr-2026.
  const a91 = data.find(r => r.tenor === '91-day' && r.auction_date === '08-Apr-2026');
  if (!a91) {
    errors.push('anchor missing: 91-day 08-Apr-2026');
  } else {
    if (a91.notified !== 12000)   errors.push(`91-day 08-Apr-2026 notified: expected 12000, got ${a91.notified}`);
    if (a91.bids_recd_num !== 159) errors.push(`91-day 08-Apr-2026 bids_recd_num: expected 159, got ${a91.bids_recd_num}`);
    if (a91.total_issue !== 19500) errors.push(`91-day 08-Apr-2026 total_issue: expected 19500, got ${a91.total_issue}`);
    if (Math.abs((a91.cutoff_price ?? NaN) - 98.6943) > 0.0001)
      errors.push(`91-day 08-Apr-2026 cutoff_price: expected 98.6943, got ${a91.cutoff_price}`);
  }

  // Known anchor: 182-day, 08-Apr-2026.
  const a182 = data.find(r => r.tenor === '182-day' && r.auction_date === '08-Apr-2026');
  if (!a182) {
    errors.push('anchor missing: 182-day 08-Apr-2026');
  } else {
    if (a182.notified !== 6000)   errors.push(`182-day 08-Apr-2026 notified: expected 6000, got ${a182.notified}`);
    if (Math.abs((a182.cutoff_price ?? NaN) - 97.3166) > 0.0001)
      errors.push(`182-day 08-Apr-2026 cutoff_price: expected 97.3166, got ${a182.cutoff_price}`);
    if (Math.abs((a182.implicit_yield ?? NaN) - 5.5299) > 0.0001)
      errors.push(`182-day 08-Apr-2026 implicit_yield: expected 5.5299, got ${a182.implicit_yield}`);
    if (Math.abs((a182.wavg_price ?? NaN) - 97.3266) > 0.0001)
      errors.push(`182-day 08-Apr-2026 wavg_price: expected 97.3266, got ${a182.wavg_price}`);
  }

  // Known anchor: 364-day, 08-Apr-2026.
  const a364 = data.find(r => r.tenor === '364-day' && r.auction_date === '08-Apr-2026');
  if (!a364) {
    errors.push('anchor missing: 364-day 08-Apr-2026');
  } else {
    if (Math.abs((a364.cutoff_price ?? NaN) - 94.6859) > 0.0001)
      errors.push(`364-day 08-Apr-2026 cutoff_price: expected 94.6859, got ${a364.cutoff_price}`);
    if (Math.abs((a364.implicit_yield ?? NaN) - 5.6278) > 0.0001)
      errors.push(`364-day 08-Apr-2026 implicit_yield: expected 5.6278, got ${a364.implicit_yield}`);
  }

  return errors;
}

function main() {
  const raw = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(raw);
  if (errors.length > 0) {
    console.error('treasury-bill-auctions self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  const [c91, c182, c364] = raw._counts;
  const out = {
    reportTitle : raw.reportTitle,
    notes       : raw.notes,
    data        : raw.data,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'treasury-bill-auctions.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} rows total ` +
    `(91-day: ${c91}, 182-day: ${c182}, 364-day: ${c364}); ` +
    `newest ${out.data[0].auction_date} (${out.data[0].tenor}); ` +
    `notes: ${out.notes.length}; self-check passed`,
  );
}

main();

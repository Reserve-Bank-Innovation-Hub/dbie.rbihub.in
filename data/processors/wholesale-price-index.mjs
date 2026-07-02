// Wholesale price index processor — Table 22 of the Monthly RBI Bulletin
// (prices-and-production). The workbook carries one sheet per base year, each a
// hierarchical commodity taxonomy across the columns and month rows down the
// side. We emit out/wholesale-price-index.json with every base year included in
// full (the whole workbook is ~0.65 MB of JSON, well under budget), so the
// current base (2011-12) and the historical bases back to 1947 are all present.
//
// Sheet layout (consistent across all five sheets):
//   row 0            blank
//   row 1 (col 1)    report title, e.g. "Wholesale Price Index (Base Year : 2011-12)"
//   row 2            blank
//   row 3            headers — col 1 is "Month", col 2+ are hierarchical
//                    commodity labels prefixed with a numeric code
//                    ("1 ALL COMMODITIES", "1.1 PRIMARY ARTICLES",
//                     "1.1.1 Food articles", …)
//   row 4            weights — col 1 label ("Weights"/"WPI-1970-71"), col 2+ the
//                    commodity weights (all commodities = 100)
//   row 5..          month rows, newest first; col 1 is the month
//                    ("Mar-2026" in newer bases, "Apr 1986" in older ones),
//                    col 2+ the index values. Trailing "Note :"/"Source :"
//                    footer rows are skipped.
//
// Missing cells and "-" become null. The commodity hierarchy is preserved via
// the numeric code: a code's parent is its code with the last dotted segment
// removed (e.g. "1.1.1" -> "1.1"), so the frontend can indent/group without a
// separate tree structure.
import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(
    __dirname,
    '..', 'publications', 'monthly-rbi-bulletin', 'prices-and-production',
    'table-22-wholesale-price-index-base-year-2011-12.xlsx',
);
const OUT = path.join(__dirname, 'out', 'wholesale-price-index.json');

const REPORT_TITLE = 'Wholesale price index (Table 22)';

// A month cell is "Mon-YYYY" (newer bases) or "Mon YYYY" (older bases). Anything
// else on a data row (blank, "Note :", "Source :") is not a month and is skipped.
const MONTH_RE = /^[A-Za-z]{3}[ -]\d{4}$/;

// Split a header like "1.1.1 Food articles" into its numeric code and label.
// A handful of leaf labels contain their own numbers, so we only treat the first
// whitespace-delimited token as the code when it is a pure dotted-number.
function splitCommodityHeader(raw) {
    const text = String(raw).trim();
    const firstSpace = text.indexOf(' ');
    if (firstSpace === -1) return { code: text, label: text };
    const code = text.slice(0, firstSpace);
    if (!/^\d+(\.\d+)*$/.test(code)) return { code: text, label: text };
    return { code, label: text.slice(firstSpace + 1).trim() };
}

// Parent code = drop the last dotted segment ("1.1.1" -> "1.1"); top level -> null.
function parentCode(code) {
    const idx = code.lastIndexOf('.');
    return idx === -1 ? null : code.slice(0, idx);
}

// Numeric parse mirroring the sibling processors: strip commas, treat "", "-",
// "N/A" and nullish as null (a genuine gap, not a zero), otherwise Number().
function parseValue(raw) {
    if (raw == null) return null;
    const s = String(raw).trim().replaceAll(',', '');
    if (s === '' || s === '-' || s === 'N/A') return null;
    const val = Number(s);
    return Number.isNaN(val) ? null : val;
}

function parseSheet(ws, sheetName) {
    // raw:false so date-formatted month cells come through as their display
    // string ("Mar-2026") rather than an Excel serial.
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

    // Locate the header row by its "Month" label in column 1 (always row 3, but
    // find it defensively rather than hard-coding).
    let hdrIdx = -1;
    for (let r = 0; r < 8 && r < rows.length; r++) {
        if (String((rows[r] || [])[1] || '').trim() === 'Month') { hdrIdx = r; break; }
    }
    if (hdrIdx === -1) throw new Error(`no "Month" header row found in sheet "${sheetName}"`);

    const header = rows[hdrIdx];
    const weightRow = rows[hdrIdx + 1] || [];
    const nCols = header.length;

    // Commodities live in columns 2..nCols-1.
    const commodities = [];
    for (let c = 2; c < nCols; c++) {
        const label = header[c];
        if (label == null || String(label).trim() === '') continue;
        const { code, label: name } = splitCommodityHeader(label);
        commodities.push({
            col   : c, // retained only for value extraction below; stripped from output
            code,
            label : name,
            parent: parentCode(code),
            weight: parseValue(weightRow[c]),
        });
    }

    const months = [];
    const values = [];
    for (let r = hdrIdx + 2; r < rows.length; r++) {
        const monthCell = String((rows[r] || [])[1] || '').trim();
        if (!MONTH_RE.test(monthCell)) continue; // skip blanks + footer rows
        months.push(monthCell);
        values.push(commodities.map((cm) => parseValue((rows[r] || [])[cm.col])));
    }

    // Base year, e.g. "2011-12", extracted from the sheet name.
    const baseMatch = sheetName.match(/(\d{4}-\d{2})/);
    const base = baseMatch ? baseMatch[1] : sheetName;

    return {
        base,
        sheetName,
        commodities: commodities.map(({ col, ...rest }) => rest),
        months,
        values,
    };
}

function main() {
    const wb = XLSX.read(fs.readFileSync(SRC), { type: 'buffer' });
    const bases = wb.SheetNames.map((name) => parseSheet(wb.Sheets[name], name));

    // Order bases newest-first so the current base (2011-12) leads.
    bases.sort((a, b) => b.base.localeCompare(a.base));

    const result = { reportTitle: REPORT_TITLE, bases };
    fs.writeFileSync(OUT, JSON.stringify(result));

    const sizeMB = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
    console.log(`wrote ${bases.length} base years -> ${OUT} (${sizeMB} MB)`);
    for (const b of bases) {
        console.log(`  base ${b.base}: ${b.commodities.length} commodities × ${b.months.length} months`);
    }

    selfCheck(result);
    console.log('self-check passed');
}

// ---------------------------------------------------------------------------
// Self-check: fail loudly (non-zero exit) if the parse drifts from the source.
// Verifies, per base: months are unique and ordered newest-first; the ALL
// COMMODITIES weight is 100; and at least three known cells match values read
// straight from the workbook at inspection time.
// ---------------------------------------------------------------------------

// Known cells sampled directly from the workbook, keyed by base year:
//   [ monthLabel, commodityCode, expectedValue ]
const KNOWN_CELLS = {
    '2011-12': [
        ['Mar-2026', '1', 160.8],       // ALL COMMODITIES, latest month
        ['Mar-2026', '1.1', 197.3],     // PRIMARY ARTICLES
        ['Feb-2026', '1.1.1', 200.2],   // FOOD ARTICLES
    ],
    '2004-05': [
        ['Mar 2017', '1', 185.8],
        ['Mar 2017', '1.1', 259.2],
    ],
    '1993-94': [
        ['Aug 2010', '1', 264.2],
        ['Aug 2010', '1.1', 312.0],
    ],
    '1981-82': [
        ['Mar 2000', '1', 366.9],
        ['Apr 1982', '1', 101.2],
    ],
    '1970-71': [
        ['Apr 1986', '1', 363.0],
        ['Apr 1947', '1', 33.6],
    ],
};

function fail(msg) {
    console.error(`SELF-CHECK FAILED: ${msg}`);
    process.exit(1);
}

function selfCheck(result) {
    if (!result.bases || result.bases.length < 5) {
        fail(`expected 5 base years, got ${result.bases ? result.bases.length : 0}`);
    }

    for (const b of result.bases) {
        // Months unique.
        const seen = new Set();
        for (const m of b.months) {
            if (seen.has(m)) fail(`base ${b.base}: duplicate month "${m}"`);
            seen.add(m);
        }

        // Months ordered newest-first (strictly descending by parsed date).
        const toDate = (m) => {
            const [mon, yr] = m.split(/[ -]/);
            const monthNum = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                .indexOf(mon);
            return Number(yr) * 12 + monthNum;
        };
        for (let i = 1; i < b.months.length; i++) {
            if (toDate(b.months[i]) >= toDate(b.months[i - 1])) {
                fail(`base ${b.base}: months not strictly newest-first at "${b.months[i - 1]}" -> "${b.months[i]}"`);
            }
        }

        // ALL COMMODITIES (code "1") weight is 100.
        const allComm = b.commodities.find((c) => c.code === '1');
        if (!allComm) fail(`base ${b.base}: missing ALL COMMODITIES (code "1")`);
        if (allComm.weight !== 100) fail(`base ${b.base}: ALL COMMODITIES weight ${allComm.weight} !== 100`);

        // Known-cell spot checks.
        const codeIdx = new Map(b.commodities.map((c, i) => [c.code, i]));
        const monthIdx = new Map(b.months.map((m, i) => [m, i]));
        for (const [month, code, expected] of (KNOWN_CELLS[b.base] || [])) {
            const mi = monthIdx.get(month);
            const ci = codeIdx.get(code);
            if (mi == null) fail(`base ${b.base}: month "${month}" not found`);
            if (ci == null) fail(`base ${b.base}: commodity code "${code}" not found`);
            const got = b.values[mi][ci];
            if (got !== expected) {
                fail(`base ${b.base}: [${month}, ${code}] expected ${expected}, got ${got}`);
            }
        }
    }
}

main();

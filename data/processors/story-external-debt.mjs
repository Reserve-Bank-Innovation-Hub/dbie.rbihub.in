// Processor: story-external-debt — derives external-debt story series from committed sources.
//
// Sources:
//   1. data/sources/India External Debt - Rupees.xlsx  (sheet 'Report 1')
//      col 41 (AP) — V. Commercial Borrowing (₹ crore)
//      col 62 (BK) — Concessional Debt as % of Total Debt
//      col 64 (BM) — Debt to GDP Ratio (%) [external debt only]
//   2. data/sdmx/public-finance/cental-state-govt-finance-combined/
//        debt-indicators-of-government-as-percentage-to-gdp.csv
//      Filter LIB_TYP_RN === 'LT4' — combined total liabilities of Centre + states as % of GDP.
//
// Emits:
//   out/story-external-debt.json
//   src/app/stories/concessional-share-of-total-debt-vs-commercial-borrowings/data.gen.ts
//   src/app/stories/debt-to-service-ratio/data.gen.ts

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '../..');
const OUT_DIR   = path.join(__dirname, 'out');

// ── helpers (mirror external-debt.mjs parseCell logic) ───────────────────────

function decimalsFromFormat(z) {
    if (!z) return 0;
    const pos = String(z).split(';')[0]; // positive section only
    const dot = pos.indexOf('.');
    if (dot === -1) return 0;
    let n = 0;
    for (let i = dot + 1; i < pos.length; i++) {
        const ch = pos[i];
        if (ch === '0' || ch === '#' || ch === '?') n++;
        else break;
    }
    return n;
}

// Replicates excelize's displayed-string → Go parseFloat() transform.
function parseCell(cell) {
    if (!cell) return 0;
    if (cell.t === 'n' && typeof cell.v === 'number') {
        const dp = decimalsFromFormat(cell.z);
        return Number(cell.v.toFixed(dp));
    }
    const s = String(cell.v ?? '').trim().replace(/,/g, '');
    if (s === '' || s === '-' || s === 'N/A') return 0;
    const val = Number.parseFloat(s);
    return Number.isNaN(val) ? 0 : val;
}

// ── parse xlsx ────────────────────────────────────────────────────────────────

const XLSX_SRC = path.join(__dirname, '../sources/India External Debt - Rupees.xlsx');
const EXPECTED_HEADERS = {
    41 : 'V. Commercial Borrowing',
    62 : 'Concessional Debt as % of Total Debt',
    64 : 'Debt to GDP Ratio (%)',
};

const errors = [];
const check  = (cond, msg) => { if (!cond) errors.push(msg); };

const xlBuf = fs.readFileSync(XLSX_SRC);
const wb    = XLSX.read(xlBuf, { type: 'buffer', cellNF: true });

check(wb.SheetNames.includes('Report 1'), `xlsx: no sheet named 'Report 1' (found: ${wb.SheetNames.join(', ')})`);

const ws      = wb.Sheets['Report 1'];
const cell    = (r, c) => ws[XLSX.utils.encode_cell({ r, c })];
const rawStr  = (r, c) => { const cl = cell(r, c); if (!cl) return ''; return String(cl.v ?? '').trim(); };
const parseAt = (r, c) => parseCell(cell(r, c));

// Verify column headers (row index 5 holds the human-readable labels in this workbook).
for (const [colStr, expected] of Object.entries(EXPECTED_HEADERS)) {
    const col    = Number(colStr);
    const actual = rawStr(5, col);
    check(actual === expected,
        `xlsx: expected col ${col} header "${expected}", got "${actual}"`);
}

// Bail early if header checks failed — no point computing against the wrong columns.
if (errors.length > 0) {
    console.error('story-external-debt: FATAL — xlsx header checks failed:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
}

const range   = XLSX.utils.decode_range(ws['!ref']);
const lastRow = range.e.r;

const xlRows = [];
for (let r = 7; r <= lastRow; r++) {
    const yearStr = rawStr(r, 1);
    if (yearStr === '' || !/^[+-]?\d+$/.test(yearStr)) continue;
    const p = (c) => parseAt(r, c);
    xlRows.push({
        year               : parseInt(yearStr, 10),
        commercialBorrowing: p(41),
        concessionalShare  : p(62),
        debtToGdpRatio     : p(64),   // external debt only
    });
}

// Rows come out newest-first from the workbook; sort ascending for convenience.
xlRows.sort((a, b) => a.year - b.year);

// ── parse SDMX CSV ─────────────────────────────────────────────────────────────

const CSV_SRC = path.join(REPO_ROOT,
    'data/sdmx/public-finance/cental-state-govt-finance-combined/' +
    'debt-indicators-of-government-as-percentage-to-gdp.csv');

const csvText = fs.readFileSync(CSV_SRC, 'utf8');
const csvLines = csvText.trim().split('\n');

// header: DATAFLOW,AUDST,FREQ,LIB_TYP_RN,REPYEAREND,REPYEARSTART,UNIT_MULT,TIME_PERIOD,UNIT_MEASURE,OBS_VALUE
const csvHeader = csvLines[0].split(',');
const colIdx = (name) => {
    const i = csvHeader.indexOf(name);
    check(i >= 0, `CSV: column '${name}' not found in header`);
    return i;
};

const LIB_COL   = colIdx('LIB_TYP_RN');
const TP_COL    = colIdx('TIME_PERIOD');
const VAL_COL   = colIdx('OBS_VALUE');

const lt4Rows = [];
for (let i = 1; i < csvLines.length; i++) {
    const parts = csvLines[i].split(',');
    if (parts[LIB_COL] !== 'LT4') continue;
    // TIME_PERIOD is YYYY-03-31; fiscal year = YYYY.
    const year   = parseInt(parts[TP_COL].slice(0, 4), 10);
    const value  = parseFloat(parts[VAL_COL]);
    if (!Number.isFinite(value)) continue;
    lt4Rows.push({ year, value });
}

lt4Rows.sort((a, b) => a.year - b.year);

// ── build derived series ──────────────────────────────────────────────────────

// CONCESSIONAL series: 1991-2025 from xlsx cols 41 + 62.
const CONCESSIONAL = xlRows
    .filter((r) => r.year >= 1991 && r.year <= 2025)
    .map((r) => ({ year: r.year, concessionalShare: r.concessionalShare, commercialBorrowing: r.commercialBorrowing }));

// EXT_DEBT_TO_GDP series: 1991-2025 from xlsx col 64.
const EXT_DEBT_TO_GDP = xlRows
    .filter((r) => r.year >= 1991 && r.year <= 2025)
    .map((r) => ({ year: r.year, value: r.debtToGdpRatio }));

// GG_DEBT_TO_GDP series: 1986-2026 from LT4, rounded to 2dp.
const GG_DEBT_TO_GDP = lt4Rows
    .map((r) => ({ year: r.year, value: parseFloat(r.value.toFixed(2)) }));

// ── self-checks ───────────────────────────────────────────────────────────────

// Count checks.
check(CONCESSIONAL.length === 35,
    `CONCESSIONAL: expected 35 years (1991-2025), got ${CONCESSIONAL.length}`);
check(EXT_DEBT_TO_GDP.length === 35,
    `EXT_DEBT_TO_GDP: expected 35 years (1991-2025), got ${EXT_DEBT_TO_GDP.length}`);
check(GG_DEBT_TO_GDP.length === 41,
    `GG_DEBT_TO_GDP: expected 41 years (1986-2026), got ${GG_DEBT_TO_GDP.length}`);

// Anchor checks.
const concFind = (yr) => CONCESSIONAL.find((r) => r.year === yr);
const extFind  = (yr) => EXT_DEBT_TO_GDP.find((r) => r.year === yr);
const ggFind   = (yr) => GG_DEBT_TO_GDP.find((r) => r.year === yr);

check(concFind(1991)?.concessionalShare   === 45.9,  `anchor: concessionalShare 1991 should be 45.9, got ${concFind(1991)?.concessionalShare}`);
check(concFind(1991)?.commercialBorrowing === 19727,  `anchor: commercialBorrowing 1991 should be 19727, got ${concFind(1991)?.commercialBorrowing}`);
check(extFind(1992)?.value                === 38.7,  `anchor: extDebtToGdp 1992 should be 38.7, got ${extFind(1992)?.value}`);
check(ggFind(2021)?.value                 === 89.24, `anchor: LT4 2021 should be 89.24, got ${ggFind(2021)?.value}`);

// Range checks.
for (const r of CONCESSIONAL) {
    check(r.concessionalShare   >= 0  && r.concessionalShare   <= 100,  `CONCESSIONAL ${r.year}: concessionalShare out of range`);
    check(r.commercialBorrowing >= 0  && r.commercialBorrowing <= 1e8,  `CONCESSIONAL ${r.year}: commercialBorrowing out of range`);
}
for (const r of EXT_DEBT_TO_GDP) {
    check(r.value >= 5 && r.value <= 50, `EXT_DEBT_TO_GDP ${r.year}: value ${r.value} out of expected range 5–50`);
}
for (const r of GG_DEBT_TO_GDP) {
    check(r.value >= 40 && r.value <= 120, `GG_DEBT_TO_GDP ${r.year}: value ${r.value} out of expected range 40–120`);
}

// Ascending + contiguous year checks.
for (let i = 1; i < CONCESSIONAL.length; i++) {
    check(CONCESSIONAL[i].year === CONCESSIONAL[i - 1].year + 1,
        `CONCESSIONAL: year gap at ${CONCESSIONAL[i].year}`);
}
for (let i = 1; i < EXT_DEBT_TO_GDP.length; i++) {
    check(EXT_DEBT_TO_GDP[i].year === EXT_DEBT_TO_GDP[i - 1].year + 1,
        `EXT_DEBT_TO_GDP: year gap at ${EXT_DEBT_TO_GDP[i].year}`);
}
for (let i = 1; i < GG_DEBT_TO_GDP.length; i++) {
    check(GG_DEBT_TO_GDP[i].year === GG_DEBT_TO_GDP[i - 1].year + 1,
        `GG_DEBT_TO_GDP: year gap at ${GG_DEBT_TO_GDP[i].year}`);
}

if (errors.length > 0) {
    console.error('story-external-debt: self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
}

// ── warn on any residual mismatches vs committed hand-typed data ──────────────
// (these are transcription errors in the original; derived value wins)

// Committed DEBT_MIX_SERIES values for cross-reference.
const COMMITTED_MIX = [
    { year: 1991, concessionalShare: 45.9, commercialBorrowing: 19727 },
    { year: 1992, concessionalShare: 44.8, commercialBorrowing: 35711 },
    { year: 1993, concessionalShare: 44.5, commercialBorrowing: 36367 },
    { year: 1994, concessionalShare: 44.4, commercialBorrowing: 38782 },
    { year: 1995, concessionalShare: 45.3, commercialBorrowing: 40915 },
    { year: 1996, concessionalShare: 44.7, commercialBorrowing: 47642 },
    { year: 1997, concessionalShare: 42.2, commercialBorrowing: 51454 },
    { year: 1998, concessionalShare: 39.5, commercialBorrowing: 67086 },
    { year: 1999, concessionalShare: 38.5, commercialBorrowing: 89019 },
    { year: 2000, concessionalShare: 38.9, commercialBorrowing: 86963 },
    { year: 2001, concessionalShare: 35.4, commercialBorrowing: 113839 },
    { year: 2002, concessionalShare: 35.9, commercialBorrowing: 113908 },
    { year: 2003, concessionalShare: 36.8, commercialBorrowing: 106843 },
    { year: 2004, concessionalShare: 35.8, commercialBorrowing: 95611 },
    { year: 2005, concessionalShare: 30.7, commercialBorrowing: 115533 },
    { year: 2006, concessionalShare: 28.4, commercialBorrowing: 117991 },
    { year: 2007, concessionalShare: 23.0, commercialBorrowing: 180669 },
    { year: 2008, concessionalShare: 19.7, commercialBorrowing: 249243 },
    { year: 2009, concessionalShare: 18.7, commercialBorrowing: 318209 },
    { year: 2010, concessionalShare: 16.8, commercialBorrowing: 319221 },
    { year: 2011, concessionalShare: 14.9, commercialBorrowing: 448448 },
    { year: 2012, concessionalShare: 13.3, commercialBorrowing: 614623 },
    { year: 2013, concessionalShare: 11.1, commercialBorrowing: 762128 },
    { year: 2014, concessionalShare: 10.4, commercialBorrowing: 897744 },
    { year: 2015, concessionalShare:  8.8, commercialBorrowing: 1128501 },
    { year: 2016, concessionalShare:  9.0, commercialBorrowing: 1197176 },
    { year: 2017, concessionalShare:  9.4, commercialBorrowing: 1115514 },
    { year: 2018, concessionalShare:  9.1, commercialBorrowing: 1312723 },
    { year: 2019, concessionalShare:  8.7, commercialBorrowing: 1423574 },
    { year: 2020, concessionalShare:  8.8, commercialBorrowing: 1653677 },
    { year: 2021, concessionalShare:  9.0, commercialBorrowing: 1590938 },
    { year: 2022, concessionalShare:  8.3, commercialBorrowing: 1710032 },
    { year: 2023, concessionalShare:  8.2, commercialBorrowing: 1817207 },
    { year: 2024, concessionalShare:  7.4, commercialBorrowing: 2088095 },
    { year: 2025, concessionalShare:  6.9, commercialBorrowing: 2495778 },
];

const COMMITTED_EXT = [
    { year: 1991, value: 28.7 }, { year: 1992, value: 38.7 }, { year: 1993, value: 37.5 },
    { year: 1994, value: 33.8 }, { year: 1995, value: 30.8 }, { year: 1996, value: 27.0 },
    { year: 1997, value: 24.6 }, { year: 1998, value: 24.3 }, { year: 1999, value: 23.6 },
    { year: 2000, value: 22.0 }, { year: 2001, value: 22.1 }, { year: 2002, value: 20.8 },
    { year: 2003, value: 20.0 }, { year: 2004, value: 17.7 }, { year: 2005, value: 18.4 },
    { year: 2006, value: 17.1 }, { year: 2007, value: 17.7 }, { year: 2008, value: 18.3 },
    { year: 2009, value: 20.7 }, { year: 2010, value: 18.5 }, { year: 2011, value: 18.6 },
    { year: 2012, value: 21.1 }, { year: 2013, value: 22.4 }, { year: 2014, value: 23.9 },
    { year: 2015, value: 23.8 }, { year: 2016, value: 23.4 }, { year: 2017, value: 19.8 },
    { year: 2018, value: 20.1 }, { year: 2019, value: 19.9 }, { year: 2020, value: 20.9 },
    { year: 2021, value: 21.1 }, { year: 2022, value: 19.9 }, { year: 2023, value: 19.1 },
    { year: 2024, value: 18.5 }, { year: 2025, value: 19.1 },
];

let mixMismatches  = 0;
let extMismatches  = 0;

for (const committed of COMMITTED_MIX) {
    const derived = concFind(committed.year);
    if (!derived) { console.warn(`  mismatch: year ${committed.year} missing from derived CONCESSIONAL`); mixMismatches++; continue; }
    const csDiff = Math.abs(derived.concessionalShare   - committed.concessionalShare);
    const cbDiff = Math.abs(derived.commercialBorrowing - committed.commercialBorrowing);
    if (csDiff > 0.05 || cbDiff > 0.5) {
        console.warn(`  CONCESSIONAL mismatch ${committed.year}: derived conc=${derived.concessionalShare} comm=${derived.commercialBorrowing}  committed conc=${committed.concessionalShare} comm=${committed.commercialBorrowing}`);
        mixMismatches++;
    }
}
for (const committed of COMMITTED_EXT) {
    const derived = extFind(committed.year);
    if (!derived) { console.warn(`  mismatch: year ${committed.year} missing from derived EXT_DEBT_TO_GDP`); extMismatches++; continue; }
    if (Math.abs(derived.value - committed.value) > 0.05) {
        console.warn(`  EXT_DEBT_TO_GDP mismatch ${committed.year}: derived=${derived.value}  committed=${committed.value}`);
        extMismatches++;
    }
}

if (mixMismatches === 0 && extMismatches === 0) {
    console.log('  reproduced: CONCESSIONAL and EXT_DEBT_TO_GDP match committed values exactly');
} else {
    console.warn(`  ${mixMismatches} CONCESSIONAL and ${extMismatches} EXT_DEBT_TO_GDP mismatch(es) — derived values used, committed values treated as transcription errors`);
}

// ── write out/story-external-debt.json ───────────────────────────────────────

const outObj = { CONCESSIONAL, EXT_DEBT_TO_GDP, GG_DEBT_TO_GDP };
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'story-external-debt.json'), JSON.stringify(outObj, null, 2));

// ── emit TypeScript generated modules ────────────────────────────────────────

const HEADER = '// GENERATED by data/processors/story-external-debt.mjs — do not edit by hand; regenerate via pnpm data:build\n';

// Helper: format a series as a TypeScript array literal with consistent column alignment.
// Each field descriptor: { key, dp } where dp=undefined means integer, dp=N means N decimal places.
function formatSeries(rows, fields) {
    const lines = rows.map((r) => {
        const parts = fields.map(({ key, dp }) => {
            const v    = r[key];
            const vStr = (dp == null) ? String(v) : v.toFixed(dp);
            return `${key} : ${vStr}`;
        });
        return `    { ${parts.join(', ')} },`;
    });
    return '[\n' + lines.join('\n') + '\n]';
}

// ── concessional story data.gen.ts ────────────────────────────────────────────

const concFields = [
    { key: 'year',                dp: null },
    { key: 'concessionalShare',   dp: 1    },
    { key: 'commercialBorrowing', dp: null },
];

const concGenPath = path.join(REPO_ROOT,
    'src/app/stories/concessional-share-of-total-debt-vs-commercial-borrowings/data.gen.ts');

const concGenContent = [
    HEADER,
    "import type { DebtMixDatum } from './data';",
    '',
    `export const DEBT_MIX_SERIES : DebtMixDatum[] = ${formatSeries(CONCESSIONAL, concFields)};`,
    '',
].join('\n');

fs.writeFileSync(concGenPath, concGenContent);

// ── debt-to-service-ratio story data.gen.ts ───────────────────────────────────

// Build a year-keyed lookup for GG values that covers 1991-2025.
const ggMap = new Map(GG_DEBT_TO_GDP.map((r) => [r.year, r.value]));

const extFields = [
    { key: 'year',  dp: null },
    { key: 'value', dp: 1    },
];

// GG_DEBT_TO_GDP as full 41-year series (1986-2026) for the generated module.
const ggFields = [
    { key: 'year',  dp: null },
    { key: 'value', dp: 2    },
];

const dsrGenPath = path.join(REPO_ROOT,
    'src/app/stories/debt-to-service-ratio/data.gen.ts');

const dsrGenContent = [
    HEADER,
    '',
    'export interface YearValue {',
    '    year  : number;',
    '    value : number;',
    '}',
    '',
    `export const EXT_DEBT_TO_GDP : YearValue[] = ${formatSeries(EXT_DEBT_TO_GDP, extFields)};`,
    '',
    `export const GG_DEBT_TO_GDP : YearValue[] = ${formatSeries(GG_DEBT_TO_GDP, ggFields)};`,
    '',
].join('\n');

fs.writeFileSync(dsrGenPath, dsrGenContent);

// ── public CSV download ───────────────────────────────────────────────────────

const csvOutDir = path.join(REPO_ROOT, 'public/stories/debt-to-service-ratio');
fs.mkdirSync(csvOutDir, { recursive: true });

const csvLines2 = [
    '# Combined total liabilities of Centre and state governments, % of GDP — RBI, Database on Indian Economy (fiscal years ending March)',
    'year,combined_liabilities_pct_gdp',
    ...GG_DEBT_TO_GDP.map((r) => `${r.year},${r.value}`),
];
fs.writeFileSync(path.join(csvOutDir, 'govt-debt-to-gdp-rbi.csv'), csvLines2.join('\n') + '\n');

// ── summary ───────────────────────────────────────────────────────────────────

console.log(
    `story-external-debt: CONCESSIONAL=${CONCESSIONAL.length} rows, ` +
    `EXT_DEBT_TO_GDP=${EXT_DEBT_TO_GDP.length} rows, ` +
    `GG_DEBT_TO_GDP=${GG_DEBT_TO_GDP.length} rows; self-check passed`
);
console.log(`  wrote out/story-external-debt.json`);
console.log(`  wrote ${path.relative(REPO_ROOT, concGenPath)}`);
console.log(`  wrote ${path.relative(REPO_ROOT, dsrGenPath)}`);
console.log(`  wrote public/stories/debt-to-service-ratio/govt-debt-to-gdp-rbi.csv`);

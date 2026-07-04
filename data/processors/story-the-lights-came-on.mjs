// Processor: story-the-lights-came-on — derives every series for the BSR Table 3.2 story
// from the committed workbook, so future refreshes are verified rather than hand-typed.
//
// Source: public/stories/the-lights-came-on/rbi-bsr-table-3-2-occupation-credit.xlsx
//   Single sheet 'Report 1', ~1090 rows.
//   Row 5 (0-indexed) = organisation headers; row 6 = per-org sub-headers.
//   Data rows start at row 7.
//   Col 1 = Excel date serial (carried forward within a quarter block).
//   Col 2 = occupation string.
//   Organisation column bases (0-indexed, each a {Accounts, Credit Limit, Amount Outstanding} triplet):
//     PRIVATE CORPORATE SECTOR → 27; INDIVIDUALS → 39; Male → 42; Female → 45; TOTAL CREDIT → 66.
//   TOTAL CREDIT Amount Outstanding lives in col 68 (BQ), outside the sheet's !ref — read via raw cells.
//
// Emits:
//   src/app/stories/the-lights-came-on/data.gen.ts   — TypeScript module imported by data.ts
//   out/story-the-lights-came-on.json                — same data as a JSON oracle

import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO      = path.join(__dirname, '../..');
const OUT_DIR   = path.join(__dirname, 'out');

// ── workbook ──────────────────────────────────────────────────────────────────

const wbPath = path.join(REPO, 'public/stories/the-lights-came-on/rbi-bsr-table-3-2-occupation-credit.xlsx');
const wb     = XLSX.read(fs.readFileSync(wbPath), { type: 'buffer' });
const ws     = wb.Sheets['Report 1'];

if (!ws) throw new Error('Expected sheet "Report 1" not found');

const raw = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

// Helper: read a cell value directly (handles columns outside !ref, e.g. BQ).
function cell(rowIdx, colIdx) {
    const addr = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
    const c = ws[addr];
    return c ? c.v : null;
}

// ── header assertions ─────────────────────────────────────────────────────────

const row5 = raw[5];
const row6 = raw[6];

const EXPECTED_ORGS = {
    27 : '3.   PRIVATE CORPORATE SECTOR',
    39 : '  4.1  INDIVIDUALS',
    42 : '    a)    Male',
    45 : '    b)    Female',
    66 : 'TOTAL CREDIT',
};

for (const [col, expected] of Object.entries(EXPECTED_ORGS)) {
    const actual = (row5[+col] ?? '').toString().trim();
    if (actual !== expected.trim()) {
        throw new Error(`Header mismatch at col ${col}: expected "${expected.trim()}", got "${actual}"`);
    }
}

// Sub-header: col 66 should be "No. of Accounts", col 67 "Credit Limit", col 68 (BQ) "Amount Outstanding".
const subCols = { 66: 'No. of Accounts', 67: 'Credit Limit' };
for (const [col, expected] of Object.entries(subCols)) {
    const actual = (row6[+col] ?? '').toString().trim();
    if (actual !== expected) {
        throw new Error(`Sub-header mismatch at col ${col}: expected "${expected}", got "${actual}"`);
    }
}
const bqSub = cell(6, 68);
if (!bqSub || bqSub.toString().trim() !== 'Amount Outstanding') {
    throw new Error(`Sub-header at BQ (row 6, col 68) expected "Amount Outstanding", got "${bqSub}"`);
}

// ── parse data rows ───────────────────────────────────────────────────────────

// Top-level occupations we care about (exact match after trim).
const TOP_LEVEL_OCCS = new Set([
    'I. AGRICULTURE',
    'II. INDUSTRY',
    'III. TRANSPORT OPERATORS',
    'IV. PROFESSIONAL AND OTHER SERVICES',
    'V. PERSONAL LOANS',
    'VI. TRADE',
    'VII. FINANCE',
    'VIII. ALL OTHERS',
    'TOTAL CREDIT',
]);

// Excel serial → { month, year } label e.g. "Mar 2014".
function serialToLabel(serial) {
    const d = new Date(Date.UTC(1899, 11, 30) + serial * 86400 * 1000);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// serialToYear: fiscal year = calendar year of the March date (serial ends in March).
function serialToYear(serial) {
    const d = new Date(Date.UTC(1899, 11, 30) + serial * 86400 * 1000);
    return d.getUTCFullYear();
}

// Check if date serial represents a March end-point.
function isMarch(serial) {
    const d = new Date(Date.UTC(1899, 11, 30) + serial * 86400 * 1000);
    return d.getUTCMonth() === 2; // 0-indexed
}

// Data structure: Map<serial, Map<occupation, {acc, lim, out, mAcc, mLim, mOut, fAcc, fLim, fOut, pcAcc, pcLim, pcOut, tcAcc, tcLim, tcOut}>>
const quarters = new Map();

let currentSerial = null;
for (let i = 7; i < raw.length; i++) {
    const r = raw[i];
    if (!r || !r[2]) continue;
    const occ = r[2].toString().trim();
    if (!occ) continue;

    // Carry forward serial within a quarter block.
    if (r[1] != null && typeof r[1] === 'number' && r[1] > 1000) {
        currentSerial = r[1];
    }
    if (currentSerial === null) continue;
    if (!TOP_LEVEL_OCCS.has(occ)) continue;

    if (!quarters.has(currentSerial)) quarters.set(currentSerial, new Map());
    const qMap = quarters.get(currentSerial);

    qMap.set(occ, {
        // INDIVIDUALS
        acc  : r[39] ?? 0,
        lim  : r[40] ?? 0,
        out  : r[41] ?? 0,
        // Male
        mAcc : r[42] ?? 0,
        mLim : r[43] ?? 0,
        mOut : r[44] ?? 0,
        // Female
        fAcc : r[45] ?? 0,
        fLim : r[46] ?? 0,
        fOut : r[47] ?? 0,
        // Private Corporate
        pcAcc : r[27] ?? 0,
        pcLim : r[28] ?? 0,
        pcOut : r[29] ?? 0,
        // TOTAL CREDIT
        tcAcc : r[66] ?? 0,
        tcLim : r[67] ?? 0,
        tcOut : cell(i, 68) ?? 0,
    });
}

// ── derive series ─────────────────────────────────────────────────────────────

// Sort serials oldest-first.
const sortedSerials = [...quarters.keys()].sort((a, b) => a - b);

if (sortedSerials.length !== 47) {
    throw new Error(`Expected 47 distinct quarters, got ${sortedSerials.length}`);
}

const r2dp  = (v) => Math.round(v * 100) / 100;
const r1dp  = (v) => Math.round(v * 10)  / 10;
const round0 = (v) => Math.round(v);

// YEARS — March-end only, 2014..2026.
const marchSerials = sortedSerials.filter(isMarch);
if (marchSerials.length !== 13) {
    throw new Error(`Expected 13 March-end serials, got ${marchSerials.length}`);
}

const YEARS = marchSerials.map((serial) => {
    const qm     = quarters.get(serial);
    const tc     = qm.get('TOTAL CREDIT');
    const agri   = qm.get('I. AGRICULTURE');
    if (!tc || !agri) throw new Error(`Missing TOTAL CREDIT or AGRICULTURE for serial ${serial}`);

    // faV: Female Agricultural Amount Outstanding / INDIVIDUALS Agricultural Amount Outstanding * 100
    const faV = r2dp(agri.fOut / agri.out * 100);

    return {
        y    : serialToYear(serial),
        acc  : round0(tc.acc),
        accM : round0(tc.mAcc),
        accF : round0(tc.fAcc),
        out  : round0(tc.out),
        outM : round0(tc.mOut),
        outF : round0(tc.fOut),
        faV,
    };
});

// QUARTERS — all 47.
const QUARTERS = sortedSerials.map((serial) => {
    const qm  = quarters.get(serial);
    const tc  = qm.get('TOTAL CREDIT');
    if (!tc) throw new Error(`Missing TOTAL CREDIT for serial ${serial}`);

    return {
        d  : serialToLabel(serial),
        pc : r2dp(tc.pcOut / tc.tcOut * 100),
        hi : r2dp(tc.out   / tc.tcOut * 100),
    };
});

// BOOK_MIX — March years only, 2015..2026 (YEARS index 1 onwards).
const BOOK_MIX = marchSerials.filter((s) => serialToYear(s) >= 2015).map((serial) => {
    const qm  = quarters.get(serial);
    const tc  = qm.get('TOTAL CREDIT');
    const pl  = qm.get('V. PERSONAL LOANS');
    if (!tc || !pl) throw new Error(`Missing data for BOOK_MIX serial ${serial}`);

    const tot    = tc.tcOut;
    const plFrac = pl.out  / tot * 100;
    const oiFrac = (tc.out - pl.out) / tot * 100;
    const pcFrac = tc.pcOut / tot * 100;
    const rest   = 100 - plFrac - oiFrac - pcFrac;

    return {
        y    : serialToYear(serial),
        pl   : r1dp(plFrac),
        oi   : r1dp(oiFrac),
        pc   : r1dp(pcFrac),
        rest : r1dp(rest),
    };
});

// WOMEN_BY_SECTOR — per top-level occupation (excluding TOTAL CREDIT), sorted as in committed data.
// Values are Female / INDIVIDUALS outstanding * 100, 1dp, for Mar-2026 and Mar-2015.
const serial2026 = marchSerials.find((s) => serialToYear(s) === 2026);
const serial2015 = marchSerials.find((s) => serialToYear(s) === 2015);
if (!serial2026 || !serial2015) throw new Error('Could not locate Mar 2026 or Mar 2015 serial');

const SECTOR_ORDER = [
    { occ: 'I. AGRICULTURE',                      name: 'Agriculture'           },
    { occ: 'VI. TRADE',                            name: 'Trade'                 },
    { occ: 'V. PERSONAL LOANS',                   name: 'Personal loans'        },
    { occ: 'II. INDUSTRY',                         name: 'Industry'              },
    { occ: 'VIII. ALL OTHERS',                     name: 'All others'            },
    { occ: 'IV. PROFESSIONAL AND OTHER SERVICES',  name: 'Professional services' },
    { occ: 'III. TRANSPORT OPERATORS',             name: 'Transport'             },
    { occ: 'VII. FINANCE',                         name: 'Finance'               },
];

const WOMEN_BY_SECTOR = SECTOR_ORDER.map(({ occ, name }) => {
    const q26 = quarters.get(serial2026).get(occ);
    const q15 = quarters.get(serial2015).get(occ);
    if (!q26 || !q15) throw new Error(`Missing sector data for "${occ}"`);
    return {
        name,
        y2015 : r1dp(q15.fOut / q15.out * 100),
        y2026 : r1dp(q26.fOut / q26.out * 100),
    };
});

// WOMEN_OVERALL — Female / INDIVIDUALS total outstanding * 100, 1dp.
const tc26 = quarters.get(serial2026).get('TOTAL CREDIT');
const tc15 = quarters.get(serial2015).get('TOTAL CREDIT');
const WOMEN_OVERALL_2026 = r1dp(tc26.fOut / tc26.out * 100);
const WOMEN_OVERALL_2015 = r1dp(tc15.fOut / tc15.out * 100);

// ── self-checks ───────────────────────────────────────────────────────────────

const errors = [];
const check  = (cond, msg) => { if (!cond) errors.push(msg); };

check(YEARS.length === 13, `Expected 13 YEARS, got ${YEARS.length}`);
check(QUARTERS.length === 47, `Expected 47 QUARTERS, got ${QUARTERS.length}`);

// Anchor values.
const y15 = YEARS.find((p) => p.y === 2015);
const y14 = YEARS.find((p) => p.y === 2014);
const q15 = QUARTERS.find((q) => q.d === 'Mar 2015');
check(y15 && y15.acc === 115682833, `Anchor: YEARS 2015 acc should be 115682833, got ${y15?.acc}`);
check(q15 && q15.pc === 40.02, `Anchor: QUARTERS 'Mar 2015' pc should be 40.02, got ${q15?.pc}`);
check(y14 && y14.faV === 19.42, `Anchor: YEARS 2014 faV should be 19.42, got ${y14?.faV}`);

// Shares within 0..100.
for (const q of QUARTERS) {
    check(q.pc >= 0 && q.pc <= 100, `QUARTERS ${q.d}: pc out of range (${q.pc})`);
    check(q.hi >= 0 && q.hi <= 100, `QUARTERS ${q.d}: hi out of range (${q.hi})`);
}

// BOOK_MIX rows sum to ~100 (±0.1).
for (const b of BOOK_MIX) {
    const sum = b.pl + b.oi + b.pc + b.rest;
    // 1dp rounding on four addends can accumulate ±0.2 in extreme cases.
    check(Math.abs(sum - 100) <= 0.2, `BOOK_MIX ${b.y}: sum = ${sum.toFixed(2)}, expected 100±0.2`);
}

// Dates strictly ascending.
for (let i = 1; i < QUARTERS.length; i++) {
    const a = sortedSerials[i - 1];
    const b = sortedSerials[i];
    check(b > a, `QUARTERS not ascending at index ${i}: ${QUARTERS[i - 1].d} -> ${QUARTERS[i].d}`);
}
check(YEARS[0].y === 2014 && YEARS[12].y === 2026, `YEARS span should be 2014..2026`);

if (errors.length > 0) {
    console.error('story-the-lights-came-on self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
}

// ── emit TypeScript ───────────────────────────────────────────────────────────

const pad = (v, w) => String(v).padEnd(w);

function fmtYears(arr) {
    const lines = arr.map((p) => {
        return `    { y : ${pad(p.y + ',', 6)} acc : ${pad(p.acc + ',', 13)} accM : ${pad(p.accM + ',', 13)} accF : ${pad(p.accF + ',', 13)} out : ${pad(p.out + ',', 9)} outM : ${pad(p.outM + ',', 9)} outF : ${pad(p.outF + ',', 9)} faV : ${p.faV} }`;
    });
    return lines.join(',\n');
}

function fmtQuarters(arr) {
    const lines = arr.map((q) => {
        return `    { d : ${JSON.stringify(q.d).padEnd(14)}, pc : ${String(q.pc).padEnd(7)}, hi : ${q.hi} }`;
    });
    return lines.join(',\n');
}

function fmtBookMix(arr) {
    const lines = arr.map((b) => {
        return `    { y : ${b.y}, pl : ${String(b.pl).padEnd(5)}, oi : ${String(b.oi).padEnd(5)}, pc : ${String(b.pc).padEnd(5)}, rest : ${b.rest} }`;
    });
    return lines.join(',\n');
}

function fmtWomenBySector(arr) {
    const maxName = Math.max(...arr.map((r) => r.name.length));
    const lines = arr.map((r) => {
        return `    { name : ${JSON.stringify(r.name).padEnd(maxName + 2)}, y2015 : ${String(r.y2015).padEnd(5)}, y2026 : ${r.y2026} }`;
    });
    return lines.join(',\n');
}

const ts = `// GENERATED by data/processors/story-the-lights-came-on.mjs — do not edit by hand; regenerate via pnpm data:build
// Source: RBI Basic Statistical Returns, Table 3.2 — organisation-wise classification of outstanding credit
// by occupation (quarterly, March 2014 – March 2026).

// March-end points, "Individuals" columns.
// acc/accM/accF — number of borrower accounts; out/outM/outF — amount outstanding, ₹ crore;
// faV — women's share (%) of individuals' agricultural credit, by value.
export interface YearPoint {
    y    : number;
    acc  : number;
    accM : number;
    accF : number;
    out  : number;
    outM : number;
    outF : number;
    faV  : number;
}

export const YEARS : YearPoint[] = [
${fmtYears(YEARS)},
];

// Quarterly shares (%) of total outstanding bank credit, all organisations.
// pc — private corporate sector; hi — household sector: individuals.
export interface QuarterPoint {
    d  : string;
    pc : number;
    hi : number;
}

export const QUARTERS : QuarterPoint[] = [
${fmtQuarters(QUARTERS)},
];

// Composition of the whole bank book (% of total outstanding credit), March years.
// pl — personal loans to individuals; oi — other loans to individuals; pc — private corporates;
// rest — everyone else. pl + oi = the individuals' share from Acts I and III.
export interface BookMixPoint {
    y    : number;
    pl   : number;
    oi   : number;
    pc   : number;
    rest : number;
}

export const BOOK_MIX : BookMixPoint[] = [
${fmtBookMix(BOOK_MIX)},
];

// Women's share (%) of each occupation's individual credit, by value.
export interface SlopeRow {
    name  : string;
    y2015 : number;
    y2026 : number;
}

export const WOMEN_BY_SECTOR : SlopeRow[] = [
${fmtWomenBySector(WOMEN_BY_SECTOR)},
];

export const WOMEN_OVERALL_2026 = ${WOMEN_OVERALL_2026};   // women's share of all individuals' credit, by value
export const WOMEN_OVERALL_2015 = ${WOMEN_OVERALL_2015};
`;

const genPath = path.join(REPO, 'src/app/stories/the-lights-came-on/data.gen.ts');
fs.writeFileSync(genPath, ts);

// ── emit JSON oracle ──────────────────────────────────────────────────────────

const jsonOut = { YEARS, QUARTERS, BOOK_MIX, WOMEN_BY_SECTOR, WOMEN_OVERALL_2026, WOMEN_OVERALL_2015 };
fs.mkdirSync(OUT_DIR, { recursive: true });
const jsonPath = path.join(OUT_DIR, 'story-the-lights-came-on.json');
fs.writeFileSync(jsonPath, JSON.stringify(jsonOut, null, 2));

console.log(`wrote data.gen.ts (${YEARS.length} YEARS, ${QUARTERS.length} QUARTERS, ${BOOK_MIX.length} BOOK_MIX rows, ${WOMEN_BY_SECTOR.length} sector rows); self-check passed`);
console.log(`wrote out/story-the-lights-came-on.json`);
console.log(`anchors: YEARS[2015].acc=${y15.acc}, QUARTERS['Mar 2015'].pc=${q15.pc}, YEARS[2014].faV=${y14.faV}`);

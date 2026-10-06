// Processor: story-the-two-lakh-line — derives every series for the story from the scrape's report exports
// (data/reports/**, restored by `pnpm data:fetch`) and two SDMX CSVs, read with the parser the database loader
// uses, so each grid is the one loaded into Postgres as financial_sector.r<id>_… . Nothing is typed by hand.
//
// Sources (DBIE report id → table):
//   1085  Table 1.8   outstanding credit by size of credit limit, March 2026            annual BSR-1 (incl. RRBs)
//   1123  Table 2.1   size of credit limit × interest-rate range, March 2026            annual BSR-1
//   1127  Table 3.3   interest-rate range × occupation, March 2026                      annual BSR-1
//   1087  Table 1.13  small borrowal accounts by population group and occupation        annual BSR-1
//   1144  Table 2.13  state and population group, total and small borrowal accounts     annual BSR-1
//   1220  district-wise credit, summary tabs (year-wise 2010–2026; district-wise 2010–2026) annual BSR-1
//   1145  Table 2.14  district and population group, credit by place of sanction, March 2026 annual BSR-1
//   950   Table 2.1   population group and bank group, total and small borrowal, Jun 2017 – Jun 2026  quarterly BSR-1 (excl. RRBs)
//   947   Table 1.7   size of credit limit, Mar 2014 – Jun 2026                          quarterly BSR-1
//   949   Table 1.9   weighted average lending rate by occupation, Sep 2014 – Jun 2026      quarterly BSR-1
//   968   Table 2.5   size of credit limit × interest-rate range, Mar 2014 – Dec 2020 (ranges to 20% and above) quarterly BSR-1
//   943   Table 1.3   state, Mar 2014 – Jun 2026                                         quarterly BSR-1
//   1555  Table 1.10  district and gender, credit to individuals, Mar 2014 – Jun 2026    quarterly BSR-1
//   114   deposits and credit by population group, 1980–2026                            Handbook of Statistics
//   SDMX  NET_SDP_FAC_CST_RN, PER_CAP_NET_SDP_RN (current prices, base 2011-12): a state's population is its
//         NSDP divided by its per-capita NSDP, for the latest year both are published.
//
// A small borrowal account is one with a sanctioned credit limit of ₹2 lakh or less: DBIE's own line, drawn
// through Tables 1.7, 1.8, 2.1 and 2.13 alike.
//
// Emits:
//   out/story-the-two-lakh-line.json                     the oracle (data/processors/oracles/ holds the snapshot)
//   src/app/stories/the-two-lakh-line/data.gen.ts        the module the page imports
//   public/stories/the-two-lakh-line/*.csv               the downloads the page offers

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { csvRows, readSdmxCsv } from '../../scripts/db/lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO      = path.join(__dirname, '../..');
const OUT_DIR   = path.join(__dirname, 'out');
const NAME      = 'story-the-two-lakh-line';

const PUB = path.join(REPO, 'data/reports/publication/time-series-publications');
const ANNUAL    = path.join(PUB, 'annual-basic-statistical-return-bsr-1-on-credit-by-scheduled-commercial-banks-including-regional-rural-banks');
const QUARTERLY = path.join(PUB, 'quarterly-basic-statistical-return-bsr-1-on-credit-by-scheduled-commercial-banks-excluding-regional-rural-banks');
const HANDBOOK  = path.join(PUB, 'handbook-of-statistics-on-the-indian-economy');
const SDMX_NI   = path.join(REPO, 'data/sdmx/real-sector/national-income');

// The one file in a publication folder that starts with a report id.
function reportFile(dir, id, suffix = '') {
    const hits = fs.readdirSync(dir).filter(f => f.startsWith(`${id}--`) && f.endsWith(`${suffix}.csv`));
    if (hits.length !== 1) throw new Error(`${NAME}: expected one CSV for report ${id}${suffix} in ${path.basename(dir)}, found ${hits.length}`);
    return path.join(dir, hits[0]);
}

async function grid(file) {
    const rows = [];
    await csvRows(file, { onRow : cells => rows.push(cells.map(c => c.trim())) });
    return rows;
}

// A cell to a number: Indian or plain digit grouping, '-' and '' as null, "(13.6)" (a percentage row) as null too.
const num = s => {
    if (s == null) return null;
    const t = String(s).replace(/,/g, '').trim();
    if (t === '' || t === '-' || t.startsWith('(')) return null;
    const v = Number(t);
    return Number.isFinite(v) ? v : null;
};
const r1 = v => Math.round(v * 10) / 10;
const r2 = v => Math.round(v * 100) / 100;

const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };
const fatal = () => { if (errors.length) { console.error(`${NAME}: self-check FAILED:`); errors.forEach(e => console.error('  ' + e)); process.exit(1); } };

// State names differ across DBIE's tables (Delhi, NCT OF DELHI; Odisha, Orissa; Uttarakhand, Uttaranchal…): one
// key per state, and the name the page shows.
const stateKey = s => {
    const k = String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '');
    return ({
        nctofdelhi : 'delhi', orissa : 'odisha', uttaranchal : 'uttarakhand', pondicherry : 'puducherry',
        andamanandnicobar : 'andamanandnicobarislands',
        dadraandnagarhavelianddamananddiu : 'dnhdd', dadraandnagarhaveli : 'dnhdd', damananddiu : 'dnhdd',
    })[k] ?? k;
};
const STATE_NAMES = {
    andhrapradesh : 'Andhra Pradesh', arunachalpradesh : 'Arunachal Pradesh', assam : 'Assam', bihar : 'Bihar',
    chhattisgarh : 'Chhattisgarh', goa : 'Goa', gujarat : 'Gujarat', haryana : 'Haryana', himachalpradesh : 'Himachal Pradesh',
    jharkhand : 'Jharkhand', karnataka : 'Karnataka', kerala : 'Kerala', madhyapradesh : 'Madhya Pradesh',
    maharashtra : 'Maharashtra', manipur : 'Manipur', meghalaya : 'Meghalaya', mizoram : 'Mizoram', nagaland : 'Nagaland',
    odisha : 'Odisha', punjab : 'Punjab', rajasthan : 'Rajasthan', sikkim : 'Sikkim', tamilnadu : 'Tamil Nadu',
    telangana : 'Telangana', tripura : 'Tripura', uttarpradesh : 'Uttar Pradesh', uttarakhand : 'Uttarakhand',
    westbengal : 'West Bengal', delhi : 'Delhi', jammuandkashmir : 'Jammu & Kashmir', ladakh : 'Ladakh',
    chandigarh : 'Chandigarh', puducherry : 'Puducherry', andamanandnicobarislands : 'Andaman & Nicobar Islands',
    lakshadweep : 'Lakshadweep', dnhdd : 'Dadra & Nagar Haveli and Daman & Diu',
};
const stateName = s => STATE_NAMES[stateKey(s)] ?? null;
// SDMX STATE_CODE → the same keys.
const SDMX_STATES = {
    ANP : 'andhrapradesh', ARP : 'arunachalpradesh', ASM : 'assam', BIH : 'bihar', CHHT : 'chhattisgarh', GOA : 'goa',
    GUJ : 'gujarat', HAR : 'haryana', HP : 'himachalpradesh', JHK : 'jharkhand', KAR : 'karnataka', KER : 'kerala',
    MP : 'madhyapradesh', MAH : 'maharashtra', MANI : 'manipur', MEG : 'meghalaya', MIZO : 'mizoram', NAGA : 'nagaland',
    OD : 'odisha', ORI : 'odisha', PUN : 'punjab', RAJA : 'rajasthan', SIKK : 'sikkim', TN : 'tamilnadu', TEL : 'telangana', TRI : 'tripura',
    UP : 'uttarpradesh', UK : 'uttarakhand', WB : 'westbengal', DEL : 'delhi', JNK : 'jammuandkashmir', CHD : 'chandigarh',
    PY : 'puducherry', ANN : 'andamanandnicobarislands',
};

// ── 1. Table 1.8: the bands ───────────────────────────────────────────────────────────────────────────────────────

// "0.0025 and Less", "Above 0.0025 and upto 0.02", "Above  100.0": limits in ₹ crore, read into rupees.
function bandLimits(label) {
    const nums = label.match(/[\d.]+/g).map(Number);
    if (/and less/i.test(label)) return { lo : 0, hi : nums[0] * 1e7 };
    if (nums.length === 1) return { lo : nums[0] * 1e7, hi : null };
    return { lo : nums[0] * 1e7, hi : nums[1] * 1e7 };
}
const isBand = s => /^(0\.0025 and Less|Above\s+[\d.]+)/i.test(s || '');

const t18 = await grid(reportFile(ANNUAL, 1085));
const BANDS = [];
let t18Total = null;
for (const r of t18) {
    if (isBand(r[0])) BANDS.push({ label : r[0].replace(/\s+/g, ' '), ...bandLimits(r[0]), accounts : num(r[1]), limit : num(r[2]), outstanding : num(r[3]) });
    else if (r[0] === 'TOTAL') t18Total = { accounts : num(r[1]), limit : num(r[2]), outstanding : num(r[3]) };
}
check(BANDS.length === 13, `Table 1.8: expected 13 bands, got ${BANDS.length}`);
check(t18Total?.accounts === 403103508, `Table 1.8: total accounts should be 403103508, got ${t18Total?.accounts}`);
check(t18Total?.outstanding === 21434586, `Table 1.8: total outstanding should be 21434586, got ${t18Total?.outstanding}`);
check(BANDS.reduce((s, b) => s + b.accounts, 0) === t18Total?.accounts, 'Table 1.8: bands do not sum to the total accounts');
check(BANDS.reduce((s, b) => s + b.outstanding, 0) === t18Total?.outstanding, 'Table 1.8: bands do not sum to the total outstanding');
check(BANDS.at(-1).accounts === 20475 && BANDS.at(-1).outstanding === 5768695, 'Table 1.8: the above-₹100-crore band should be 20475 accounts / 5768695');
for (let i = 1; i < BANDS.length; i++) check(BANDS[i].lo === BANDS[i - 1].hi, `Table 1.8: band ${i} does not start where band ${i - 1} ends`);

// ── 2. Table 2.1 (annual): what each band pays ────────────────────────────────────────────────────────────────────

// Ten rate bands, three cells each (accounts, limit, outstanding). The weighted rate uses band midpoints, 14% for
// "13% and above": an indication of the slope, not a measured average.
const RATE_MIDPOINTS = [ 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 14 ];
const t21 = await grid(reportFile(ANNUAL, 1123));
const hdr21 = t21.find(r => /LESS THAN 5%/i.test(r[1] || ''));
check(hdr21 && /13% AND ABOVE/i.test(hdr21[28] || ''), 'Table 2.1: the ten rate bands are not where expected (cells 1 and 28)');
const rateByBand = new Map();
let t21Total = null;
for (const r of t21) {
    const band = isBand(r[0]) ? r[0].replace(/\s+/g, ' ') : (/^TOTAL LOANS/i.test(r[0] || '') ? 'TOTAL' : null);
    if (!band) continue;
    const acc = [], amt = [];
    for (let i = 0; i < 10; i++) { acc.push(num(r[1 + 3 * i]) ?? 0); amt.push(num(r[3 + 3 * i]) ?? 0); }
    const A = acc.reduce((s, v) => s + v, 0), M = amt.reduce((s, v) => s + v, 0);
    const row = {
        accounts        : A,
        outstanding     : M,
        rateAccounts    : acc,
        rateOutstanding : amt,
        weightedRate    : r2(amt.reduce((s, v, i) => s + v * RATE_MIDPOINTS[i], 0) / M),
        amtAtLeast13    : r1(100 * amt[9] / M),
        amtAtLeast10    : r1(100 * (amt[6] + amt[7] + amt[8] + amt[9]) / M),
        amtBelow8       : r1(100 * (amt[0] + amt[1] + amt[2] + amt[3]) / M),
        accAtLeast13    : r1(100 * acc[9] / A),
    };
    if (band === 'TOTAL') t21Total = row; else rateByBand.set(band, row);
}
check(t21Total?.accounts === 402389393, `Table 2.1: total loans and advances accounts should be 402389393, got ${t21Total?.accounts}`);
check(rateByBand.size === 13, `Table 2.1: expected 13 bands, got ${rateByBand.size}`);
for (const b of BANDS) {
    const p = rateByBand.get(b.label);
    check(p, `Table 2.1: no rate row for band "${b.label}"`);
    Object.assign(b, { weightedRate : p?.weightedRate ?? null, amtAtLeast13 : p?.amtAtLeast13 ?? null, amtBelow8 : p?.amtBelow8 ?? null, accAtLeast13 : p?.accAtLeast13 ?? null, rateAccounts : p?.rateAccounts ?? [], rateOutstanding : p?.rateOutstanding ?? [] });
    check(p && p.rateAccounts.length === 10 && p.rateOutstanding.length === 10, `Table 2.1: band "${b.label}" should carry ten rate ranges`);
}
check(BANDS[0].weightedRate > BANDS.at(-1).weightedRate, 'Table 2.1: the smallest band should pay more than the largest');

// ── 2b. Table 3.3 (annual): interest-rate ranges by occupation, for the rows the page quotes ─────────────────────

const t33 = await grid(reportFile(ANNUAL, 1127));
const RATE_RANGES = [ 'under 5%', '5–6%', '6–7%', '7–8%', '8–9%', '9–10%', '10–11%', '11–12%', '12–13%', '13% or more' ];
const hdr33 = t33.find(r => r.some(c => /13% AND ABOVE/i.test(c)));
check(hdr33 && /LESS THAN 5%/i.test(hdr33[1] || '') && /13% AND ABOVE/i.test(hdr33[28] || ''), 'Table 3.3: the ten rate ranges are not where expected (cells 1 and 28)');
const RATE_ROWS = { 'I. AGRICULTURE' : 'agriculture', '5. Personal Credit Cards' : 'creditCards', 'TOTAL LOANS AND ADVANCES' : 'total' };
const RATE_OCCUPATIONS = {};
for (const r of t33) {
    const key = RATE_ROWS[(r[0] || '').replace(/\s+/g, ' ').trim()];
    if (!key || RATE_OCCUPATIONS[key]) continue;
    const accounts = [], outstanding = [];
    for (let i = 0; i < 10; i++) { accounts.push(num(r[1 + 3 * i]) ?? 0); outstanding.push(num(r[3 + 3 * i]) ?? 0); }
    RATE_OCCUPATIONS[key] = { accounts, outstanding };
}
check(Object.keys(RATE_OCCUPATIONS).length === 3, `Table 3.3: expected agriculture, credit cards and the total, got ${Object.keys(RATE_OCCUPATIONS).join(', ')}`);
const sumOf = a => a.reduce((t, v) => t + v, 0);
check(sumOf(RATE_OCCUPATIONS.total?.accounts ?? []) === t21Total.accounts, `Table 3.3: the total's accounts should equal Table 2.1's ${t21Total.accounts}, got ${sumOf(RATE_OCCUPATIONS.total?.accounts ?? [])}`);
check(sumOf(RATE_OCCUPATIONS.creditCards?.accounts ?? []) > 9e7, 'Table 3.3: credit cards should be over 9 crore accounts');

// ── 3. Table 1.13: what small borrowers borrow for ────────────────────────────────────────────────────────────────

const t113 = await grid(reportFile(ANNUAL, 1087));
const SMALL_PURPOSE = [];
for (const r of t113) {
    const m = /^(I|II|III|IV|V|VI|VII|VIII)\.\s+(.+)$|^(TOTAL BANK CREDIT)$/.exec(r[0] || '');
    if (!m) continue;
    const name = m[3] ? 'Total' : m[2].toLowerCase().replace(/^./, c => c.toUpperCase());
    SMALL_PURPOSE.push({
        occupation : name,
        rural      : { accounts : num(r[1]), outstanding : num(r[3]) },
        semiUrban  : { accounts : num(r[4]), outstanding : num(r[6]) },
        urban      : { accounts : num(r[7]), outstanding : num(r[9]) },   // urban and metropolitan together
    });
}
check(SMALL_PURPOSE.length === 9, `Table 1.13: expected 8 occupations and a total, got ${SMALL_PURPOSE.length}`);
const spTotal = SMALL_PURPOSE.find(p => p.occupation === 'Total');
check(spTotal?.rural.accounts === 65455002, `Table 1.13: rural small borrowal accounts should be 65455002, got ${spTotal?.rural.accounts}`);

// ── 4. Table 2.13: small borrowers by state ───────────────────────────────────────────────────────────────────────

const t213 = await grid(reportFile(ANNUAL, 1144));
const POP_GROUPS_213 = new Set([ 'RURAL', 'SEMI-URBAN', 'URBAN', 'METROPOLITAN' ]);
const stateSmall = new Map();
let group213 = null;
for (const r of t213) {
    if (POP_GROUPS_213.has((r[0] || '').toUpperCase())) group213 = r[0].toUpperCase();
    else if (r[0]) group213 = null;                        // "Dimension 1" (a region's total), ALL-INDIA, blanks
    if (!group213 || !r[1] || num(r[3]) == null) continue;
    const key = stateKey(r[1]);
    if (!STATE_NAMES[key]) continue;                       // a region row inside the group
    const s = stateSmall.get(key) ?? { key, name : STATE_NAMES[key], offices : 0, accounts : 0, outstanding : 0, smallAccounts : 0, smallOutstanding : 0, rural : { accounts : 0, outstanding : 0, smallAccounts : 0, smallOutstanding : 0 } };
    s.offices += num(r[2]) ?? 0; s.accounts += num(r[3]); s.outstanding += num(r[4]); s.smallAccounts += num(r[5]) ?? 0; s.smallOutstanding += num(r[6]) ?? 0;
    if (group213 === 'RURAL') { s.rural.accounts += num(r[3]); s.rural.outstanding += num(r[4]); s.rural.smallAccounts += num(r[5]) ?? 0; s.rural.smallOutstanding += num(r[6]) ?? 0; }
    stateSmall.set(key, s);
}
const STATE_SMALL = [ ...stateSmall.values() ].sort((a, b) => b.smallAccounts / b.accounts - a.smallAccounts / a.accounts);
check(STATE_SMALL.length === 36, `Table 2.13: expected 36 states and union territories, got ${STATE_SMALL.length}`);
const sum213 = STATE_SMALL.reduce((s, x) => s + x.accounts, 0);
check(Math.abs(sum213 * 1e3 - t18Total.accounts) / t18Total.accounts < 0.002, `Table 2.13: states sum to ${sum213} thousand accounts, Table 1.8 has ${t18Total.accounts}`);

// ── 5. District-wise credit (annual BSR-1): the whole country, one row a year and one a district ──────────────────

const yearWise = await grid(reportFile(ANNUAL, 1220, '--summary-year-wise'));
const TOTALS = yearWise.filter(r => /^\d{4}$/.test(r[0] || '')).map(r => ({ year : +r[0], accounts : num(r[1]), outstanding : r2(num(r[3])) })).sort((a, b) => a.year - b.year);
check(TOTALS.length === 17 && TOTALS[0].year === 2010 && TOTALS.at(-1).year === 2026, `year-wise: expected 2010–2026, got ${TOTALS.length} rows`);
check(TOTALS.at(-1).accounts === 403103508, `year-wise 2026 accounts should be 403103508, got ${TOTALS.at(-1).accounts}`);

const districtWise = await grid(reportFile(ANNUAL, 1220, '--summary-district-wise'));
const yrHdr = districtWise.find(r => r[2] === '2026');
check(yrHdr && yrHdr[5] === '2025', 'district-wise: the 2026 block should be cells 2–4');
const DISTRICTS = [];
for (const r of districtWise) {
    if (!r[1] || num(r[2]) == null || num(r[4]) == null) continue;
    const name = stateName(r[0]);
    if (!name) { check(false, `district-wise: unknown state "${r[0]}"`); continue; }
    DISTRICTS.push({ state : name, district : r[1], accounts : num(r[2]), outstanding : r2(num(r[4])) });
}
DISTRICTS.sort((a, b) => b.outstanding - a.outstanding);
check(DISTRICTS.length === 777, `district-wise: expected 777 districts with 2026 data, got ${DISTRICTS.length}`);
check(DISTRICTS[0].district === 'MUMBAI' && DISTRICTS[0].outstanding === 2613569.68, `district-wise: Mumbai should lead with 2613569.68, got ${DISTRICTS[0].district} ${DISTRICTS[0].outstanding}`);
const distOut = DISTRICTS.reduce((s, d) => s + d.outstanding, 0);
const distAcc = DISTRICTS.reduce((s, d) => s + d.accounts, 0);
check(Math.abs(distOut - TOTALS.at(-1).outstanding) < 1, `district-wise: districts sum to ${distOut}, the year-wise total is ${TOTALS.at(-1).outstanding}`);
check(distAcc === TOTALS.at(-1).accounts, `district-wise: districts sum to ${distAcc} accounts, the year-wise total is ${TOTALS.at(-1).accounts}`);
// Title case for the page ("MUMBAI SUBURBAN" → "Mumbai Suburban"; "SOUTH 24 PARGANAS" keeps its number).
const titleCase = s => s.toLowerCase().replace(/(^|[\s(\-])([a-z])/g, (m, p, c) => p + c.toUpperCase());
for (const d of DISTRICTS) d.district = titleCase(d.district);

// The same summary carries every year from 2010: the ten largest districts' share of credit, and Mumbai's, by year.
const yearCols = []; yrHdr.forEach((v, j) => { if (/^\d{4}$/.test(v || '')) yearCols.push({ year : +v, col : j }); });
check(yearCols.length === 17 && yearCols.at(-1).year === 2010, `district-wise: expected year blocks 2026 back to 2010, got ${yearCols.length}`);
const DISTRICT_HISTORY = yearCols.map(({ year, col }) => {
    const rows = districtWise.filter(r => r[1] && num(r[col]) != null && num(r[col + 2]) != null).map(r => ({ state : r[0], district : r[1], outstanding : num(r[col + 2]) })).sort((a, b) => b.outstanding - a.outstanding);
    const total = rows.reduce((s, d) => s + d.outstanding, 0);
    const mumbai = rows.filter(d => /^MUMBAI( SUBURBAN)?$/i.test(d.district)).reduce((s, d) => s + d.outstanding, 0);
    return { year, districts : rows.length, top10Share : r2(100 * rows.slice(0, 10).reduce((s, d) => s + d.outstanding, 0) / total), mumbaiShare : r2(100 * (rows.find(d => /^MUMBAI$/i.test(d.district))?.outstanding ?? 0) / total), mumbaiTwoShare : r2(100 * mumbai / total) };
}).sort((a, b) => a.year - b.year);
check(Math.abs(DISTRICT_HISTORY.at(-1).top10Share - 100 * DISTRICTS.slice(0, 10).reduce((s, d) => s + d.outstanding, 0) / distOut) < 0.05, 'district-wise: the 2026 top-ten share should match the district list');
check(DISTRICT_HISTORY[0].year === 2010 && DISTRICT_HISTORY[0].top10Share > DISTRICT_HISTORY.at(-1).top10Share, `district-wise: the ten largest districts' share should have fallen since 2010, got ${DISTRICT_HISTORY[0].top10Share} → ${DISTRICT_HISTORY.at(-1).top10Share}`);

// ── 5b. Table 2.14: the same districts by place of sanction, March 2026 ──────────────────────────────────────
const t214 = await grid(reportFile(ANNUAL, 1145));
const sanctionByDistrict = new Map();
for (const r of t214) {
    if (r[0] !== '2026' || !r[3] || !r[4] || /TOTAL/i.test(r[4]) || num(r[6]) == null) continue;
    const k = `${stateKey(r[2])}|${r[3].toUpperCase()}`;
    const d = sanctionByDistrict.get(k) ?? { state : stateName(r[2]), district : titleCase(r[3]), accounts : 0, outstanding : 0 };
    d.accounts += num(r[6]); d.outstanding += num(r[7]) ?? 0;
    sanctionByDistrict.set(k, d);
}
const sanctionRows = [ ...sanctionByDistrict.values() ].sort((a, b) => b.outstanding - a.outstanding);
const sanctionOut = sanctionRows.reduce((s, d) => s + d.outstanding, 0);
check(Math.abs(sanctionOut - distOut) / distOut < 0.001, `Table 2.14: by sanction the districts sum to ${sanctionOut}, by use to ${distOut}`);
const sanctionOf = (state, district) => sanctionByDistrict.get(`${stateKey(state)}|${district.toUpperCase()}`)?.outstanding ?? 0;
const SANCTION = {
    top10Share : r2(100 * sanctionRows.slice(0, 10).reduce((s, d) => s + d.outstanding, 0) / sanctionOut),
    useTop10Share : r2(100 * DISTRICTS.slice(0, 10).reduce((s, d) => s + sanctionOf(d.state, d.district), 0) / sanctionOut),   // the ten largest by use, counted by sanction
    mumbaiTwoShare : r2(100 * (sanctionOf('Maharashtra', 'Mumbai') + sanctionOf('Maharashtra', 'Mumbai Suburban')) / sanctionOut),
    useMumbaiTwoShare : DISTRICT_HISTORY.at(-1).mumbaiTwoShare,
};
SANCTION.top10 = sanctionRows.slice(0, 10).map(d => ({ state : d.state, district : d.district, share : r2(100 * d.outstanding / sanctionOut) }));
check(SANCTION.top10Share > 30 && SANCTION.top10Share < 60, `Table 2.14: the ten largest districts by sanction should hold between 30 and 60% of credit, got ${SANCTION.top10Share}`);

// ── 6. Quarterly Table 2.1: small borrowal accounts, Jun 2017 – Jun 2026, by population group ────────────────────

const isQuarter = s => /^[A-Z][a-z]{2}[ -]\d{4}$/i.test(s || '') || /^[A-Z][a-z]{2}-\d{2}$/.test(s || '');
const quarterKey = s => {                                   // "Jun 2026" / "Jun-2026" / "Jun-26" → "2026-06"
    const [ m0, yr ] = s.split(/[ -]/);
    const mon = m0[0].toUpperCase() + m0.slice(1).toLowerCase();
    const m = { Jan : '01', Feb : '02', Mar : '03', Apr : '04', May : '05', Jun : '06', Jul : '07', Aug : '08', Sep : '09', Oct : '10', Nov : '11', Dec : '12' }[mon];
    return `${yr.length === 2 ? '20' + yr : yr}-${m}`;
};
const quarterLabel = k => { const [ y, m ] = k.split('-'); return `${[ '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ][+m]} ${y}`; };

// The columns of a quarterly grid: the header row whose cells are quarter labels, each starting a block of `span`.
function quarterColumns(rows) {
    const hdr = rows.find(r => r.filter(isQuarter).length >= 4);
    const cols = []; hdr.forEach((v, j) => { if (isQuarter(v)) cols.push({ key : quarterKey(v), col : j }); });
    const span = cols[1].col - cols[0].col;
    return { cols, span };
}

const q21 = await grid(reportFile(QUARTERLY, 950));
const { cols : q21Cols, span : q21Span } = quarterColumns(q21);
check(q21Span === 4 && q21Cols.length === 37, `quarterly Table 2.1: expected 37 quarters of 4 cells, got ${q21Cols.length} × ${q21Span}`);
const GROUPS = { RURAL : 'rural', 'SEMI-URBAN' : 'semiUrban', URBAN : 'urban', METROPOLITAN : 'metro', TOTAL : 'total' };
const smallByQuarter = new Map(q21Cols.map(c => [ c.key, { quarter : quarterLabel(c.key), key : c.key } ]));
// The same cells for each bank group: byGroup[bank group][population group][quarter key].
const BANK_GROUP_KEYS = { 'PUBLIC SECTOR BANKS' : 'public', 'PRIVATE SECTOR BANKS' : 'private', 'FOREIGN BANKS' : 'foreign', 'SMALL FINANCE BANKS' : 'smallFinance' };
const byGroup = {};
let bankGroup = null;
for (const r of q21) {
    if (r[0]) bankGroup = r[0];
    if (!GROUPS[r[1]]) continue;
    for (const c of q21Cols) {
        const cell = { accounts : num(r[c.col]), outstanding : num(r[c.col + 1]), small : num(r[c.col + 2]), smallOutstanding : num(r[c.col + 3]) };
        if (bankGroup === 'ALL SCHEDULED COMMERCIAL BANKS') smallByQuarter.get(c.key)[GROUPS[r[1]]] = cell;
        else if (BANK_GROUP_KEYS[bankGroup]) ((byGroup[BANK_GROUP_KEYS[bankGroup]] ??= {})[GROUPS[r[1]]] ??= {})[c.key] = cell;
    }
}
const SMALL_SERIES = [ ...smallByQuarter.values() ].sort((a, b) => a.key.localeCompare(b.key));
check(SMALL_SERIES[0].key === '2017-06' && SMALL_SERIES.at(-1).key === '2026-06', 'quarterly Table 2.1: expected Jun 2017 – Jun 2026');
const sq = k => SMALL_SERIES.find(s => s.key === k);

// The bank groups at the quarters the story reads: the first two (the small finance banks have no row in June 2017
// and report from September 2017), the quarter before the December 2024 entry, the peak and the latest. A cell
// missing from the return (no small finance banks yet) is null.
const groupCell = (g, pop, key) => { const c = byGroup[g]?.[pop]?.[key]; return c && c.accounts != null ? { accounts : c.accounts, small : c.small } : null; };
const BANK_GROUP_QUARTERS = [ SMALL_SERIES[0].key, SMALL_SERIES[1].key, '2024-09', '2024-12', '2026-06' ];
const BANK_GROUPS = BANK_GROUP_QUARTERS.map(key => ({
    key, quarter : quarterLabel(key),
    ...Object.fromEntries(Object.values(BANK_GROUP_KEYS).map(g => [ g, { total : groupCell(g, 'total', key), rural : groupCell(g, 'rural', key), urban : groupCell(g, 'urban', key), metro : groupCell(g, 'metro', key) } ])),
}));
check(BANK_GROUPS[0].smallFinance.total === null && BANK_GROUPS[1].smallFinance.total?.small > 3e6, 'quarterly Table 2.1: the small finance banks should have no row in Jun 2017 and about 0.3 crore small loans in Sep 2017');
check(BANK_GROUPS.at(-1).smallFinance.total?.small > 2.9e7 && BANK_GROUPS.at(-1).smallFinance.total?.small < 3.2e7, `quarterly Table 2.1: small finance banks should hold about 3 crore small loans in Jun 2026, got ${BANK_GROUPS.at(-1).smallFinance.total?.small}`);
const sfbUrbanBefore = groupCell('smallFinance', 'urban', '2024-09')?.small, sfbUrbanAfter = groupCell('smallFinance', 'urban', '2024-12')?.small;
check(sfbUrbanAfter - sfbUrbanBefore > 6e6 && sfbUrbanAfter - sfbUrbanBefore < 8e6, `quarterly Table 2.1: the small finance banks' urban small loans should step up by about 0.7 crore in Dec 2024, got ${sfbUrbanAfter - sfbUrbanBefore}`);
check(sq('2024-03')?.total.small === 272207074 && sq('2024-03')?.total.accounts === 373160238, 'quarterly Table 2.1: Mar 2024 total should be 272207074 small of 373160238');
check(sq('2026-06')?.total.small === 230853284, `quarterly Table 2.1: Jun 2026 small accounts should be 230853284, got ${sq('2026-06')?.total.small}`);
check(sq('2017-06')?.total.small === 110529530, 'quarterly Table 2.1: Jun 2017 small accounts should be 110529530');
for (const s of SMALL_SERIES) for (const g of Object.values(GROUPS)) check(s[g]?.accounts > 0 && s[g].small <= s[g].accounts, `quarterly Table 2.1: ${s.quarter} ${g} is missing or inconsistent`);

// ── 6b. Quarterly Table 3.5a: what the small accounts were for, the peak quarter against the latest ─────────────
// Rows are a population group, then its occupations; the numbered personal-loan kinds sit under "V. PERSONAL LOANS".
// The peak is the quarter with the most accounts below the line in Table 2.1, so the two tables compare like with like.

const PEAK = SMALL_SERIES.reduce((best, s) => s.total.small > best.total.small ? s : best, SMALL_SERIES[0]);
const LAST = SMALL_SERIES.at(-1);
check(PEAK.key === '2024-12', `quarterly Table 2.1: the peak of small borrowal accounts should be Dec 2024, got ${PEAK.quarter}`);
const q35a = await grid(reportFile(QUARTERLY, 962));
const { cols : q35aCols, span : q35aSpan } = quarterColumns(q35a);
check(q35aSpan === 3 && q35aCols.length === 48, `quarterly Table 3.5a: expected 48 quarters of 3 cells, got ${q35aCols.length} × ${q35aSpan}`);
const c35a24 = q35aCols.find(c => c.key === PEAK.key), c35a26 = q35aCols.find(c => c.key === LAST.key);
check(c35a24 && c35a26, `quarterly Table 3.5a: ${PEAK.quarter} or ${LAST.quarter} is missing`);
// Credit cards among the small borrowal accounts, all population groups together, at the quarters the story reads.
const CARD_QUARTERS = [ SMALL_SERIES[0].key, '2024-03', PEAK.key, LAST.key ];
const cardsByQuarter = Object.fromEntries(CARD_QUARTERS.map(k => [ k, { accounts : 0, outstanding : 0 } ]));
const PURPOSES = {
    'I. AGRICULTURE' : 'Agriculture', 'II. INDUSTRY' : 'Industry', 'III. TRANSPORT OPERATORS' : 'Transport operators',
    'IV. PROFESSIONAL AND OTHER SERVICES' : 'Professional and other services', 'V. PERSONAL LOANS' : 'Personal loans',
    '2. Consumer Durables' : 'Consumer durables', '5. Personal Credit Cards' : 'Credit cards', '6. Other Personal Loans' : 'Other personal loans',
    'VI. TRADE' : 'Trade', 'VII. FINANCE' : 'Finance', 'VIII. ALL OTHERS' : 'All others', 'TOTAL CREDIT' : 'Total',
};
const SMALL_PURPOSE_CHANGE = [];
let g35a = null, parent35a = null;
for (const r of q35a) {
    if (GROUPS[r[0]] && r[0] !== 'TOTAL') g35a = GROUPS[r[0]];
    if (g35a && r[1] === '5. Personal Credit Cards') for (const k of CARD_QUARTERS) { const c = q35aCols.find(x => x.key === k); if (c) { cardsByQuarter[k].accounts += num(r[c.col]) ?? 0; cardsByQuarter[k].outstanding += num(r[c.col + 2]) ?? 0; } }
    if (!g35a || !r[1]) continue;
    if (/^(I|II|III|IV|V|VI|VII|VIII)\./.test(r[1]) || r[1] === 'TOTAL CREDIT') parent35a = r[1];
    const isSub = /^\d\./.test(r[1]);
    if (isSub && parent35a !== 'V. PERSONAL LOANS') continue;
    const purpose = PURPOSES[r[1]];
    if (!purpose) continue;
    SMALL_PURPOSE_CHANGE.push({ group : g35a, purpose, from : PEAK.quarter, to : LAST.quarter, accountsThen : num(r[c35a24.col]), outstandingThen : num(r[c35a24.col + 2]), accountsNow : num(r[c35a26.col]), outstandingNow : num(r[c35a26.col + 2]) });
}
check(SMALL_PURPOSE_CHANGE.length === 48, `quarterly Table 3.5a: expected 4 groups × 12 purposes, got ${SMALL_PURPOSE_CHANGE.length}`);
const spc = (g, p) => SMALL_PURPOSE_CHANGE.find(x => x.group === g && x.purpose === p);
check(spc('rural', 'Total')?.accountsThen === PEAK.rural.small && spc('rural', 'Total')?.accountsNow === LAST.rural.small, 'quarterly Table 3.5a: the rural totals should equal Table 2.1\'s rural small borrowal accounts');
check(spc('metro', 'Consumer durables')?.accountsThen > 1.5e7 && spc('metro', 'Consumer durables')?.accountsNow < 0.8e7, 'quarterly Table 3.5a: metropolitan consumer-durable small accounts should fall to under 0.8 crore');
check(spc('rural', 'Agriculture')?.accountsThen > spc('rural', 'Agriculture')?.accountsNow, 'quarterly Table 3.5a: rural agricultural small accounts should have fallen');

// ── 7. Quarterly Table 1.7: the top of the pyramid over time ─────────────────────────────────────────────────────
// This table starts at "Above Rs. 25,000": the accounts with limits up to ₹25,000 are not in it, so it is used
// for the top band only, where it is complete.

const q17 = await grid(reportFile(QUARTERLY, 947));
const { cols : q17Cols, span : q17Span } = quarterColumns(q17);
check(q17Span === 3 && q17Cols.length === 48, `quarterly Table 1.7: expected 48 quarters of 3 cells, got ${q17Cols.length} × ${q17Span}`);
const topRow = q17.find(r => /^Above Rs\. 100 Crore$/i.test(r[0] || ''));
const totRow = q17.find(r => /^Total Credit$/i.test(r[0] || ''));
check(topRow && totRow, 'quarterly Table 1.7: the above-₹100-crore and total rows are missing');
const TOP_SERIES = q17Cols.map(c => ({
    quarter : quarterLabel(c.key), key : c.key,
    topAccounts : num(topRow[c.col]), topOutstanding : num(topRow[c.col + 2]),
    accounts : num(totRow[c.col]), outstanding : num(totRow[c.col + 2]),
})).sort((a, b) => a.key.localeCompare(b.key));
const tq = k => TOP_SERIES.find(s => s.key === k);
check(tq('2026-03')?.topAccounts === 20461 && tq('2026-03')?.topOutstanding === 5767025, 'quarterly Table 1.7: Mar 2026 top band should be 20461 / 5767025');
check(tq('2015-03')?.topAccounts === 10992 && tq('2015-03')?.topOutstanding === 2167224, 'quarterly Table 1.7: Mar 2015 top band should be 10992 / 2167224');

const SMALL_CARDS = CARD_QUARTERS.map(k => ({ key : k, quarter : quarterLabel(k), accounts : cardsByQuarter[k].accounts, outstanding : r2(cardsByQuarter[k].outstanding) }));
check(SMALL_CARDS[0].accounts > 2.0e7 && SMALL_CARDS[0].accounts < 2.3e7 && SMALL_CARDS.at(-1).accounts > 7.0e7 && SMALL_CARDS.at(-1).accounts < 7.6e7, `quarterly Table 3.5a: credit cards among small loans should run from about 2.2 crore (Jun 2017) to about 7.3 crore (Jun 2026), got ${SMALL_CARDS[0].accounts} → ${SMALL_CARDS.at(-1).accounts}`);

// ── 7b. Quarterly Table 1.9: the Reserve Bank's own weighted average lending rate by occupation ─────────────────
const q19 = await grid(reportFile(QUARTERLY, 949));
const { cols : q19Cols } = quarterColumns(q19);
const walrRow = label => q19.find(r => (r[0] || '').trim() === label);
const WALR_LABELS = { creditCards : '5. Personal Credit Cards', consumerDurables : '2. Consumer Durables', personalLoans : 'V. PERSONAL LOANS', agriculture : 'I. AGRICULTURE', total : 'TOTAL CREDIT', totalExCards : 'Total Credit Excluding Personal Credit Cards' };
const WALR = [ '2026-03', LAST.key ].map(key => {
    const c = q19Cols.find(x => x.key === key);
    check(c, `quarterly Table 1.9: ${key} is missing`);
    return { key, quarter : quarterLabel(key), ...Object.fromEntries(Object.entries(WALR_LABELS).map(([ k, label ]) => { const r = walrRow(label); check(r, `quarterly Table 1.9: no row "${label}"`); return [ k, r && c ? num(r[c.col]) : null ]; })) };
});
check(WALR[0].creditCards > 35 && WALR[0].creditCards < 40, `quarterly Table 1.9: credit cards should carry about 37% in Mar 2026, got ${WALR[0].creditCards}`);

// ── 7c. Quarterly Table 2.5 in its older format (ranges to "20% and above", to December 2020): March 2014 ─────
// The same weighted-midpoint reading the annual table gets, for the smallest and the largest band, to say whether
// the slope was there a decade ago. Midpoints: 5.5 for "less than 6%", 7.5 for "6 to 9%", n + 0.5 for the
// one-point ranges, 19 for "18 to 20%", 21 for "20% and above".
const q25old = await grid(reportFile(QUARTERLY, 968));
const OLD_MIDPOINTS = [ 5.5, 7.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.5, 19, 21 ];
const oldRate = (period, band) => {
    const r = q25old.find(x => x[0] === period && x[1] === band);
    check(r, `quarterly Table 2.5 (old): no row ${period} / ${band}`);
    if (!r) return null;
    let amt = 0, w = 0;
    OLD_MIDPOINTS.forEach((m, i) => { const a = num(r[3 + 2 * i]) ?? 0; amt += a; w += a * m; });
    return amt ? r2(w / amt) : null;
};
const RATE_2014 = { key : '2014-03', quarter : 'Mar 2014', smallest : oldRate('Mar-2014', 'Rs. 25,000 and Less'), top : oldRate('Mar-2014', 'Above Rs. 100 Crore'), total : oldRate('Mar-2014', 'Total Loans and Advances'), midpoints : OLD_MIDPOINTS };
check(RATE_2014.smallest > 8 && RATE_2014.smallest < 16 && RATE_2014.top > 8 && RATE_2014.top < 16, `quarterly Table 2.5 (old): March 2014 rates look wrong: ${RATE_2014.smallest} / ${RATE_2014.top}`);

// ── 8. Quarterly Table 1.3: the states, Mar 2015 and Mar 2026 ────────────────────────────────────────────────────

const q13 = await grid(reportFile(QUARTERLY, 943));
const { cols : q13Cols, span : q13Span } = quarterColumns(q13);
check(q13Span === 4 && q13Cols.length === 48, `quarterly Table 1.3: expected 48 quarters of 4 cells, got ${q13Cols.length} × ${q13Span}`);
const c26 = q13Cols.find(c => c.key === '2026-03'), c15 = q13Cols.find(c => c.key === '2015-03');
const stateRows = new Map();
let allIndia13 = null;
for (const r of q13) {
    if (!r[0] || num(r[c26.col + 1]) == null) continue;
    const row = { offices : num(r[c26.col]), accounts : num(r[c26.col + 1]), outstanding : num(r[c26.col + 3]), accounts2015 : num(r[c15.col + 1]), outstanding2015 : num(r[c15.col + 3]) };
    if (r[0] === 'ALL-INDIA') { allIndia13 = row; continue; }
    const name = stateName(r[0]);
    if (name) stateRows.set(stateKey(r[0]), { key : stateKey(r[0]), name, ...row });
}
check(stateRows.size === 36, `quarterly Table 1.3: expected 36 states and union territories, got ${stateRows.size}`);
// Assam's loan accounts by quarter, for the December 2024 entry: a fintech's loan book, amalgamated into North East
// Small Finance Bank (Guwahati) with effect from 27 October 2024, appears in the return that quarter.
const assamRow = q13.find(r => stateKey(r[0] || '') === 'assam');
const assamAccounts = key => { const c = q13Cols.find(x => x.key === key); return c && assamRow ? num(assamRow[c.col + 1]) : null; };
const ENTRY = {
    key : '2024-12', quarter : 'Dec 2024', before : '2024-09', latest : LAST.key,
    assamBefore : assamAccounts('2024-09'), assamAfter : assamAccounts('2024-12'), assamLatest : assamAccounts(LAST.key),
    sfbUrbanSmallBefore : sfbUrbanBefore, sfbUrbanSmallAfter : sfbUrbanAfter,
};
ENTRY.assamStep = ENTRY.assamAfter - ENTRY.assamBefore;
ENTRY.assamSince = ENTRY.assamLatest - ENTRY.assamBefore;
ENTRY.sfbUrbanSmallStep = ENTRY.sfbUrbanSmallAfter - ENTRY.sfbUrbanSmallBefore;
check(ENTRY.assamStep > 6.5e6 && ENTRY.assamStep < 8e6, `quarterly Table 1.3: Assam's accounts should step up by about 0.7 crore in Dec 2024, got ${ENTRY.assamStep}`);
check(ENTRY.assamSince > 9e6 && ENTRY.assamSince < 1.1e7, `quarterly Table 1.3: Assam should carry about a crore more accounts in ${LAST.quarter} than in Sep 2024, got ${ENTRY.assamSince}`);
check(stateRows.get('maharashtra')?.accounts === 104807184 && stateRows.get('maharashtra')?.outstanding === 5940908, 'quarterly Table 1.3: Maharashtra Mar 2026 should be 104807184 / 5940908');
check(allIndia13?.accounts === 371988991, `quarterly Table 1.3: all-India Mar 2026 accounts should be 371988991, got ${allIndia13?.accounts}`);

// ── 9. Population from the SDMX income series ────────────────────────────────────────────────────────────────────

function sdmxLatest(file) {
    const { header, data } = readSdmxCsv(file);
    const col = n => header.indexOf(n);
    const out = new Map();
    for (const f of data) {
        if (f[col('BASE_PER')] !== 'BY_2011_12' || f[col('PRC_TYP_RN')] !== 'CURR_PRC') continue;
        const key = SDMX_STATES[f[col('STATE_CODE')]];
        const v = Number(f[col('OBS_VALUE')]);
        if (!key || !(v > 0)) continue;
        const year = +f[col('TIME_PERIOD')].slice(0, 4);
        const cur = out.get(key) ?? new Map();
        cur.set(year, v); out.set(key, cur);
    }
    return out;
}
const nsdp = sdmxLatest(path.join(SDMX_NI, 'net-state-domestic-product-at-factor-cost.csv'));
const perCap = sdmxLatest(path.join(SDMX_NI, 'per-capita-net-state-domestic-product-at-factor-cost.csv'));
const STATES = [];
for (const s of stateRows.values()) {
    const years = [ ...(nsdp.get(s.key)?.keys() ?? []) ].filter(y => perCap.get(s.key)?.has(y)).sort((a, b) => b - a);
    const year = years[0] ?? null;
    const pop = year ? Math.round(nsdp.get(s.key).get(year) / perCap.get(s.key).get(year)) : null;
    STATES.push({
        name : s.name, offices : s.offices, accounts : s.accounts, outstanding : s.outstanding,
        accounts2015 : s.accounts2015, outstanding2015 : s.outstanding2015,
        population : pop, populationYear : year, perCapitaIncome : year ? Math.round(perCap.get(s.key).get(year)) : null,
        accountsPer100 : pop ? r1(100 * s.accounts / pop) : null,
        creditPerHead  : pop ? Math.round(s.outstanding * 1e7 / pop) : null,
    });
}
STATES.sort((a, b) => (b.accountsPer100 ?? -1) - (a.accountsPer100 ?? -1));
const withPop = STATES.filter(s => s.population);
check(withPop.length === 33, `population: expected 33 states with an income series, got ${withPop.length}`);
check(STATES.find(s => s.name === 'Odisha')?.population > 4.3e7, 'population: Odisha should have a population (its NSDP series is filed under ORI)');
const mah = STATES.find(s => s.name === 'Maharashtra'), bih = STATES.find(s => s.name === 'Bihar');
check(mah?.population > 1.27e8 && mah?.population < 1.30e8, `population: Maharashtra should be about 12.9 crore, got ${mah?.population}`);
check(bih?.population > 1.30e8 && bih?.population < 1.33e8, `population: Bihar should be about 13.2 crore, got ${bih?.population}`);
check(mah?.accountsPer100 > 80 && bih?.accountsPer100 < 10, 'population: Maharashtra should be above 80 accounts per 100 people and Bihar below 10');

// ── 10. Quarterly Table 1.10: women, district by district ────────────────────────────────────────────────────────
// Accounts in thousands. Six cells a quarter: men (accounts, amount), women, everyone. "As per place of sanction".

const q110 = await grid(reportFile(QUARTERLY, 1555));
const { cols : q110Cols, span : q110Span } = quarterColumns(q110);
check(q110Span === 6 && q110Cols.length === 48, `quarterly Table 1.10: expected 48 quarters of 6 cells, got ${q110Cols.length} × ${q110Span}`);
const W_QUARTERS = [ '2015-03', '2020-03', '2024-03', '2025-03', '2026-03', '2026-06' ];
const wCol = Object.fromEntries(W_QUARTERS.map(k => [ k, q110Cols.find(c => c.key === k)?.col ]));
check(Object.values(wCol).every(v => v != null), 'quarterly Table 1.10: a needed quarter is missing');
// DBIE prints many districts on two rows, one carrying the older quarters and one the newer (every north-eastern
// district, and any district recoded since 2024, Kamrup Metropolitan among them), so a state's figure for a
// quarter is the sum over every row with a value in it, and a district is the sum of its rows by name. An earlier
// version kept only rows with a June 2026 value, which dropped the older rows and with them the March 2024 base
// of the north-east, Ramanagara and Ahmadnagar; that turned Karnataka's fall into a rise.
const womenStates = new Map();
const districtRows = new Map();
let wState = null;
let allIndia110 = null;
for (const r of q110) {
    if (/^ALL[- ]INDIA$/i.test((r[0] || '').trim()) || /^ALL[- ]INDIA$/i.test((r[1] || '').trim())) { allIndia110 = r; continue; }
    if (r[1]) wState = r[1];
    if (!r[2] || !wState || W_QUARTERS.every(k => num(r[wCol[k] + 4]) == null)) continue;   // headers, blank rows
    const name = stateName(wState);
    if (!name) { check(false, `quarterly Table 1.10: unknown state "${wState}"`); continue; }
    const at = (k, off) => num(r[wCol[k] + off]) ?? 0;
    const dk = `${stateKey(wState)}|${r[2].toUpperCase()}`;
    const d = districtRows.get(dk) ?? { state : name, district : titleCase(r[2]), women2015 : 0, women2024 : 0, women2026 : 0, men2026 : 0, womenOutstanding2024 : 0, womenOutstanding2026 : 0 };
    d.women2015 += at('2015-03', 2); d.women2024 += at('2024-03', 2); d.women2026 += at('2026-06', 2); d.men2026 += at('2026-06', 0); d.womenOutstanding2024 += at('2024-03', 3); d.womenOutstanding2026 += at('2026-06', 3);
    districtRows.set(dk, d);
    const s = womenStates.get(name) ?? { name, districts : new Set(), women : {}, men : {}, womenOutstanding : {} };
    s.districts.add(dk);
    for (const k of W_QUARTERS) { s.women[k] = (s.women[k] ?? 0) + at(k, 2); s.men[k] = (s.men[k] ?? 0) + at(k, 0); s.womenOutstanding[k] = (s.womenOutstanding[k] ?? 0) + at(k, 3); }
    womenStates.set(name, s);
}
// Assam is not compared with itself: the fintech's loans booked in Guwahati from December 2024 (ENTRY) mean its two
// dates do not cover the same lenders.
const NOT_COMPARED = { Assam : 'a fintech’s loans, booked in Guwahati after a merger into a small finance bank, entered its figures in December 2024' };
const WOMEN_STATES = [ ...womenStates.values() ].map(s => ({
    name : s.name, districts : s.districts.size,
    women2015 : r2(s.women['2015-03']), women2020 : r2(s.women['2020-03']), women2024 : r2(s.women['2024-03']), women2025 : r2(s.women['2025-03']), women2026Mar : r2(s.women['2026-03']), women2026 : r2(s.women['2026-06']),
    men2026 : r2(s.men['2026-06']), womenOutstanding2024 : r2(s.womenOutstanding['2024-03']), womenOutstanding2026 : r2(s.womenOutstanding['2026-06']),
    comparable : s.women['2024-03'] > 0 && !NOT_COMPARED[s.name],
    note : NOT_COMPARED[s.name] ?? (s.women['2024-03'] > 0 ? null : 'no March 2024 figure'),
})).sort((a, b) => (a.women2026 - a.women2024) - (b.women2026 - b.women2024));
check(WOMEN_STATES.length === 36, `quarterly Table 1.10: expected 36 states, got ${WOMEN_STATES.length}`);
check(WOMEN_STATES.filter(s => s.comparable).length === 35, `quarterly Table 1.10: every state but Assam should compare, got ${WOMEN_STATES.filter(s => s.comparable).length}`);
const wBihar = WOMEN_STATES.find(s => s.name === 'Bihar');
check(wBihar && wBihar.women2024 > 7300 && wBihar.women2024 < 7500 && wBihar.women2026 < 4600, `quarterly Table 1.10: Bihar's women's accounts should fall from about 74 lakh to about 45 lakh, got ${wBihar?.women2024} → ${wBihar?.women2026}`);
const wKarnataka = WOMEN_STATES.find(s => s.name === 'Karnataka');
check(wKarnataka && wKarnataka.women2024 > 9400 && wKarnataka.women2024 < 9600 && wKarnataka.women2026 < 0.85 * wKarnataka.women2024, `quarterly Table 1.10: Karnataka should fall by about a fifth once Ramanagara's rows are kept, got ${wKarnataka?.women2024} → ${wKarnataka?.women2026}`);
const allW = k => WOMEN_STATES.reduce((t, s) => t + s[{ '2024-03' : 'women2024', '2026-06' : 'women2026' }[k]], 0);
for (const k of [ '2024-03', '2026-06' ]) check(allIndia110 && Math.abs((num(allIndia110[wCol[k] + 2]) ?? 0) - allW(k)) < 2, `quarterly Table 1.10: the states sum to ${allW(k)} thousand women's accounts in ${k}, the ALL-INDIA row has ${allIndia110 ? allIndia110[wCol[k] + 2] : 'nothing'}`);
const WOMEN_TOTAL = W_QUARTERS.map(k => ({
    key : k, quarter : quarterLabel(k),
    women : r2(WOMEN_STATES.filter(s => s.comparable).reduce((t, s) => t + (s[{ '2015-03' : 'women2015', '2020-03' : 'women2020', '2024-03' : 'women2024', '2025-03' : 'women2025', '2026-03' : 'women2026Mar', '2026-06' : 'women2026' }[k]] ?? 0), 0)),
}));
const womenDistricts = [ ...districtRows.values() ].map(d => ({ ...d, women2015 : r2(d.women2015), women2024 : r2(d.women2024), women2026 : r2(d.women2026), men2026 : r2(d.men2026), womenOutstanding2024 : r2(d.womenOutstanding2024), womenOutstanding2026 : r2(d.womenOutstanding2026) }));
// Districts renamed or re-drawn between the two quarters show up as a fall to nothing and a rise from nothing
// (Ramanagara became Bengaluru South, Ahmadnagar became Ahilyanagar): only districts present in both count, and
// Assam's districts stay out for the reason its state does.
const comparable = womenDistricts.filter(d => d.women2024 > 0 && d.women2026 > 0 && !NOT_COMPARED[d.state]);
const WOMEN_DISTRICTS_FALLS = comparable.map(d => ({ ...d, change : r2(d.women2026 - d.women2024), womenShare2026 : r1(100 * d.women2026 / (d.women2026 + d.men2026)) })).sort((a, b) => a.change - b.change).slice(0, 12);
const WOMEN_DISTRICTS_RISES = comparable.map(d => ({ ...d, change : r2(d.women2026 - d.women2024), womenShare2026 : r1(100 * d.women2026 / (d.women2026 + d.men2026)) })).sort((a, b) => b.change - a.change).slice(0, 6);
const WOMEN_DISTRICT_COUNTS = { compared : comparable.length, fell : comparable.filter(d => d.women2026 < d.women2024).length, rose : comparable.filter(d => d.women2026 > d.women2024).length };
check(WOMEN_DISTRICTS_FALLS[0].district === 'Mumbai Suburban', `quarterly Table 1.10: the largest fall should be Mumbai Suburban, got ${WOMEN_DISTRICTS_FALLS[0].district}`);
check(WOMEN_DISTRICT_COUNTS.fell > WOMEN_DISTRICT_COUNTS.rose, 'quarterly Table 1.10: more districts should have lost women borrowers than gained');
check(WOMEN_DISTRICT_COUNTS.compared > 680, `quarterly Table 1.10: about 700 districts should compare once split rows are added up, got ${WOMEN_DISTRICT_COUNTS.compared}`);

// ── 11. Handbook: deposits and credit by population group, 1980–2026 ─────────────────────────────────────────────
// Accounts in thousands, amounts in ₹ crore. Two blocks, deposits then credit, each a year a row.

const hb = await grid(reportFile(HANDBOOK, 114));
const byYear = new Map();
let side = null;
for (const r of hb) {
    if (/^Deposits$/i.test(r[1] || '')) side = 'deposit';
    if (/^Credit$/i.test(r[1] || '')) side = 'credit';
    if (!side || !/^(19|20)\d\d$/.test(r[0] || '')) continue;
    const y = byYear.get(+r[0]) ?? { year : +r[0] };
    const groups = [ 'rural', 'semiUrban', 'urban', 'metro' ];
    groups.forEach((g, i) => { y[g] ??= {}; y[g][`${side}Accounts`] = num(r[1 + 2 * i]); y[g][`${side}Outstanding`] = num(r[2 + 2 * i]); });
    byYear.set(+r[0], y);
}
const POP_GROUPS = [ ...byYear.values() ].sort((a, b) => a.year - b.year);
check(POP_GROUPS.length === 47 && POP_GROUPS[0].year === 1980 && POP_GROUPS.at(-1).year === 2026, `Handbook 114: expected 1980–2026, got ${POP_GROUPS.length} years`);
const pg26 = POP_GROUPS.at(-1);
check(pg26.rural.depositAccounts === 858407 && pg26.rural.creditAccounts === 94885, `Handbook 114: rural 2026 should be 858407 deposit and 94885 credit accounts (thousands)`);
check(pg26.metro.creditOutstanding === 12018428, 'Handbook 114: metropolitan credit 2026 should be 12018428');
// DBIE prints urban deposit accounts for 2021 as 3,55,51,492 (a hundred times its neighbours); the page does not
// use 2021, and the value is kept as published.
for (const y of POP_GROUPS) for (const g of [ 'rural', 'semiUrban', 'urban', 'metro' ]) check(y[g].depositAccounts > 0 && y[g].creditAccounts > 0 && y[g].depositOutstanding > 0 && y[g].creditOutstanding > 0, `Handbook 114: ${y.year} ${g} has a missing value`);

fatal();

// ── the oracle ────────────────────────────────────────────────────────────────────────────────────────────────────

const TOTAL_RATE = { accounts : t21Total.accounts, outstanding : t21Total.outstanding, weightedRate : t21Total.weightedRate, amtAtLeast13 : t21Total.amtAtLeast13, amtAtLeast10 : t21Total.amtAtLeast10, amtBelow8 : t21Total.amtBelow8, accAtLeast13 : t21Total.accAtLeast13, rateAccounts : t21Total.rateAccounts, rateOutstanding : t21Total.rateOutstanding };
check(TOTAL_RATE.accAtLeast13 > 45 && TOTAL_RATE.accAtLeast13 < 52, `Table 2.1: about 48 in 100 accounts should pay 13% or more, got ${TOTAL_RATE.accAtLeast13}`);
fatal();

const out = { BANDS, TOTAL_RATE, RATE_RANGES, RATE_OCCUPATIONS, SMALL_PURPOSE, SMALL_PURPOSE_CHANGE, STATE_SMALL, TOTALS, DISTRICTS, DISTRICT_HISTORY, SANCTION, SMALL_SERIES, BANK_GROUPS, SMALL_CARDS, ENTRY, WALR, RATE_2014, TOP_SERIES, STATES, WOMEN_STATES, WOMEN_TOTAL, WOMEN_DISTRICTS_FALLS, WOMEN_DISTRICTS_RISES, WOMEN_DISTRICT_COUNTS, POP_GROUPS };
fs.mkdirSync(OUT_DIR, { recursive : true });
fs.writeFileSync(path.join(OUT_DIR, `${NAME}.json`), JSON.stringify(out, null, 2));

// ── the module ────────────────────────────────────────────────────────────────────────────────────────────────────

const ts = (v, indent = '') => {
    if (Array.isArray(v)) return v.length && typeof v[0] === 'object'
        ? '[\n' + v.map(x => indent + '    ' + ts(x, indent + '    ') + ',').join('\n') + '\n' + indent + ']'
        : JSON.stringify(v);
    if (v && typeof v === 'object') return '{ ' + Object.entries(v).map(([ k, x ]) => `${k} : ${ts(x, indent)}`).join(', ') + ' }';
    return JSON.stringify(v);
};
const GEN = [
    `// GENERATED by data/processors/${NAME}.mjs — do not edit by hand; regenerate via pnpm data:build`,
    '// Sources: RBI, Basic Statistical Returns of scheduled commercial banks (annual BSR-1 March 2026, including regional',
    '// rural banks; quarterly BSR-1 March 2014 – June 2026, excluding them), the Handbook of Statistics on the Indian',
    '// Economy and the state income series, all as scraped from DBIE. Counts are of accounts, amounts in ₹ crore.',
    '',
    '// A band of Table 1.8 (March 2026): limits in rupees, `hi` null for the open top band; the rate columns come from',
    '// Table 2.1, the weighted rate from band midpoints (14% for "13% and above"), an indication of the slope only.',
    '// rateAccounts and rateOutstanding: the band\'s accounts and amount in each of Table 2.1\'s ten interest-rate ranges, from',
    '// "less than 5%" to "13% and above" (RATE_RANGES).',
    'export interface Band { label : string; lo : number; hi : number | null; accounts : number; limit : number; outstanding : number; weightedRate : number | null; amtAtLeast13 : number | null; amtBelow8 : number | null; accAtLeast13 : number | null; rateAccounts : number[]; rateOutstanding : number[]; }',
    '',
    'export interface Cell { accounts : number; outstanding : number; }',
    '// Table 1.13: small borrowal accounts by purpose; urban holds urban and metropolitan together.',
    'export interface SmallPurpose { occupation : string; rural : Cell; semiUrban : Cell; urban : Cell; }',
    '// Quarterly Table 3.5a: small borrowal accounts by purpose and population group, the peak quarter against the latest.',
    'export interface SmallPurposeChange { group : string; purpose : string; from : string; to : string; accountsThen : number; outstandingThen : number; accountsNow : number; outstandingNow : number; }',
    '',
    '// Table 2.13: a state, all its population groups summed, accounts in thousands.',
    'export interface SmallCell { accounts : number; outstanding : number; smallAccounts : number; smallOutstanding : number; }',
    'export interface StateSmall extends SmallCell { key : string; name : string; offices : number; rural : SmallCell; }',
    '',
    'export interface YearTotal { year : number; accounts : number; outstanding : number; }',
    'export interface District { state : string; district : string; accounts : number; outstanding : number; }',
    '',
    '// Quarterly Table 2.1: `small` is the accounts with limits up to ₹2 lakh and `smallOutstanding` their credit.',
    'export interface GroupQuarter { accounts : number; outstanding : number; small : number; smallOutstanding : number; }',
    'export interface SmallQuarter { quarter : string; key : string; rural : GroupQuarter; semiUrban : GroupQuarter; urban : GroupQuarter; metro : GroupQuarter; total : GroupQuarter; }',
    '',
    '// Quarterly Table 1.7: the accounts with limits above ₹100 crore, against the table\'s total (which leaves out',
    '// the accounts with limits up to ₹25,000).',
    'export interface TopQuarter { quarter : string; key : string; topAccounts : number; topOutstanding : number; accounts : number; outstanding : number; }',
    '',
    '// Quarterly Table 1.3 joined to a population derived from the state income series (NSDP over per-capita NSDP,',
    '// the latest year both exist); null where a state publishes no income series, and for March 2015 where the',
    '// union territory did not yet exist.',
    'export interface StateRow { name : string; offices : number; accounts : number; outstanding : number; accounts2015 : number | null; outstanding2015 : number | null; population : number | null; populationYear : number | null; perCapitaIncome : number | null; accountsPer100 : number | null; creditPerHead : number | null; }',
    '',
    '// Quarterly Table 1.10 summed over districts: accounts in thousands. `comparable` is false for the states that',
    '// enter the table only in 2025 (the north-east), which have no March 2024 to compare with.',
    'export interface WomenState { name : string; districts : number; women2015 : number; women2020 : number; women2024 : number; women2025 : number; women2026Mar : number; women2026 : number; men2026 : number; womenOutstanding2024 : number; womenOutstanding2026 : number; comparable : boolean; note : string | null; }',
    'export interface WomenQuarter { key : string; quarter : string; women : number; }',
    'export interface WomenDistrict { state : string; district : string; women2015 : number; women2024 : number; women2026 : number; men2026 : number; womenOutstanding2024 : number; womenOutstanding2026 : number; change : number; womenShare2026 : number; }',
    '',
    '// Handbook table 114: a year, four population groups, accounts in thousands.',
    'export interface PopGroup { depositAccounts : number; depositOutstanding : number; creditAccounts : number; creditOutstanding : number; }',
    'export interface PopGroupYear { year : number; rural : PopGroup; semiUrban : PopGroup; urban : PopGroup; metro : PopGroup; }',
    '',
    `export const BANDS : Band[] = ${ts(BANDS)};`,
    '',
    '// Table 2.1\'s total row: the whole book of loans and advances by interest-rate band.',
    `export const TOTAL_RATE = ${ts(TOTAL_RATE)};`,
    '',
    '// Table 2.1\'s ten interest-rate ranges, lowest first, the order of every rate array here.',
    `export const RATE_RANGES = ${ts(RATE_RANGES)};`,
    '',
    '// Table 3.3: accounts and amount in each rate range, for agriculture, credit cards and all loans and advances.',
    'export interface RateRow { accounts : number[]; outstanding : number[]; }',
    `export const RATE_OCCUPATIONS : { agriculture : RateRow; creditCards : RateRow; total : RateRow } = { agriculture : ${ts(RATE_OCCUPATIONS.agriculture)}, creditCards : ${ts(RATE_OCCUPATIONS.creditCards)}, total : ${ts(RATE_OCCUPATIONS.total)} };`,
    '',
    `export const SMALL_PURPOSE : SmallPurpose[] = ${ts(SMALL_PURPOSE)};`,
    '',
    `export const SMALL_PURPOSE_CHANGE : SmallPurposeChange[] = ${ts(SMALL_PURPOSE_CHANGE)};`,
    '',
    `export const STATE_SMALL : StateSmall[] = ${ts(STATE_SMALL)};`,
    '',
    `export const TOTALS : YearTotal[] = ${ts(TOTALS)};`,
    '',
    `export const DISTRICTS : District[] = ${ts(DISTRICTS)};`,
    '',
    '// The same district return year by year: the ten largest districts\' share of credit and Mumbai\'s (the island city, and',
    '// with Mumbai Suburban), by place of utilisation.',
    'export interface DistrictYear { year : number; districts : number; top10Share : number; mumbaiShare : number; mumbaiTwoShare : number; }',
    `export const DISTRICT_HISTORY : DistrictYear[] = ${ts(DISTRICT_HISTORY)};`,
    '// Table 2.14, March 2026: the districts by place of sanction. useTop10Share is the share of the ten largest districts',
    '// by use when each is counted by sanction; top10Share the ten largest by sanction.',
    `export const SANCTION = ${ts(SANCTION)};`,
    '',
    `export const SMALL_SERIES : SmallQuarter[] = ${ts(SMALL_SERIES)};`,
    '',
    '// The same table by bank group at the quarters the story reads; a null cell is a group with no row that quarter',
    '// (the small finance banks before September 2017).',
    'export interface GroupCell { accounts : number; small : number; }',
    'export interface BankGroupCells { total : GroupCell | null; rural : GroupCell | null; urban : GroupCell | null; metro : GroupCell | null; }',
    'export interface BankGroupQuarter { key : string; quarter : string; public : BankGroupCells; private : BankGroupCells; foreign : BankGroupCells; smallFinance : BankGroupCells; }',
    `export const BANK_GROUPS : BankGroupQuarter[] = ${ts(BANK_GROUPS)};`,
    '// Quarterly Table 3.5a: credit cards among the small borrowal accounts, all population groups, amounts in ₹ crore.',
    'export interface CardsQuarter { key : string; quarter : string; accounts : number; outstanding : number; }',
    `export const SMALL_CARDS : CardsQuarter[] = ${ts(SMALL_CARDS)};`,
    '// The December 2024 entry: a fintech\'s loan book amalgamated into North East Small Finance Bank (Guwahati) with',
    '// effect from 27 October 2024. Assam\'s loan accounts (quarterly Table 1.3) and the small finance banks\' urban small',
    '// loans (Table 2.1) step up by the same amount that quarter; assamSince is Assam\'s rise from September 2024 to the',
    '// latest quarter.',
    `export const ENTRY = ${ts(ENTRY)};`,
    '// Quarterly Table 1.9: the Reserve Bank\'s weighted average lending rate by occupation, per cent.',
    'export interface Walr { key : string; quarter : string; creditCards : number; consumerDurables : number; personalLoans : number; agriculture : number; total : number; totalExCards : number; }',
    `export const WALR : Walr[] = ${ts(WALR)};`,
    '// Quarterly Table 2.5 in its older format (ranges to "20% and above"), March 2014: weighted-midpoint rates for the',
    '// smallest and the largest band, read the way the annual table is.',
    `export const RATE_2014 = ${ts(RATE_2014)};`,
    '',
    `export const TOP_SERIES : TopQuarter[] = ${ts(TOP_SERIES)};`,
    '',
    `export const STATES : StateRow[] = ${ts(STATES)};`,
    '',
    `export const WOMEN_STATES : WomenState[] = ${ts(WOMEN_STATES)};`,
    '',
    `export const WOMEN_TOTAL : WomenQuarter[] = ${ts(WOMEN_TOTAL)};`,
    '',
    `export const WOMEN_DISTRICTS_FALLS : WomenDistrict[] = ${ts(WOMEN_DISTRICTS_FALLS)};`,
    '',
    `export const WOMEN_DISTRICTS_RISES : WomenDistrict[] = ${ts(WOMEN_DISTRICTS_RISES)};`,
    '',
    `export const WOMEN_DISTRICT_COUNTS = ${ts(WOMEN_DISTRICT_COUNTS)};`,
    '',
    `export const POP_GROUPS : PopGroupYear[] = ${ts(POP_GROUPS)};`,
    '',
].join('\n');
const genPath = path.join(REPO, 'src/app/stories/the-two-lakh-line/data.gen.ts');
fs.mkdirSync(path.dirname(genPath), { recursive : true });
fs.writeFileSync(genPath, GEN);

// ── the downloads ─────────────────────────────────────────────────────────────────────────────────────────────────

const pubDir = path.join(REPO, 'public/stories/the-two-lakh-line');
fs.mkdirSync(pubDir, { recursive : true });
const csv = (header, rows) => header.join(',') + '\n' + rows.map(r => r.map(v => (typeof v === 'string' && /[",\n]/.test(v)) ? `"${v.replace(/"/g, '""')}"` : v).join(',')).join('\n') + '\n';
fs.writeFileSync(path.join(pubDir, 'credit-by-size-of-limit-march-2026.csv'), '# RBI, BSR-1 annual Tables 1.8 and 2.1, March 2026; limits in rupees, amounts in ₹ crore\n' + csv(
    [ 'band', 'limit_from_inr', 'limit_to_inr', 'accounts', 'credit_limit_cr', 'amount_outstanding_cr', 'weighted_rate_pct', 'amount_at_13pct_or_more_pct', 'amount_below_8pct_pct' ],
    BANDS.map(b => [ b.label, b.lo, b.hi ?? '', b.accounts, b.limit, b.outstanding, b.weightedRate, b.amtAtLeast13, b.amtBelow8 ])));
fs.writeFileSync(path.join(pubDir, 'small-borrowal-accounts-quarterly.csv'), '# RBI, BSR-1 quarterly Table 2.1, all scheduled commercial banks excluding regional rural banks; small = credit limit up to ₹2 lakh; amounts in ₹ crore\n' + csv(
    [ 'quarter', 'population_group', 'accounts', 'amount_outstanding_cr', 'small_accounts', 'small_amount_outstanding_cr' ],
    SMALL_SERIES.flatMap(s => Object.values(GROUPS).map(g => [ s.quarter, g, s[g].accounts, s[g].outstanding, s[g].small, s[g].smallOutstanding ]))));
fs.writeFileSync(path.join(pubDir, 'women-borrowers-by-state.csv'), '# RBI, BSR-1 quarterly Table 1.10 summed over districts, credit to individuals by place of sanction; accounts in thousands, amounts in ₹ crore\n' + csv(
    [ 'state', 'districts', 'women_accounts_mar_2015', 'women_accounts_mar_2024', 'women_accounts_mar_2026', 'women_accounts_jun_2026', 'men_accounts_jun_2026', 'women_amount_mar_2024_cr', 'women_amount_jun_2026_cr', 'comparable_with_2024', 'note' ],
    WOMEN_STATES.map(s => [ s.name, s.districts, s.women2015, s.women2024, s.women2026Mar, s.women2026, s.men2026, s.womenOutstanding2024, s.womenOutstanding2026, s.comparable, s.note ?? '' ])));
fs.writeFileSync(path.join(pubDir, 'credit-by-district-march-2026.csv'), '# RBI, BSR-1 annual, district-wise credit by place of utilisation, March 2026; amounts in ₹ crore\n' + csv(
    [ 'state', 'district', 'accounts', 'amount_outstanding_cr' ], DISTRICTS.map(d => [ d.state, d.district, d.accounts, d.outstanding ])));
fs.writeFileSync(path.join(pubDir, 'credit-by-state-march-2026.csv'), '# RBI, BSR-1 quarterly Table 1.3 (March 2026 and March 2015) with population derived from the state income series; amounts in ₹ crore\n' + csv(
    [ 'state', 'offices', 'accounts_mar_2026', 'amount_outstanding_mar_2026_cr', 'accounts_mar_2015', 'amount_outstanding_mar_2015_cr', 'population', 'population_year', 'per_capita_income_inr', 'accounts_per_100_people', 'credit_per_head_inr' ],
    STATES.map(s => [ s.name, s.offices, s.accounts, s.outstanding, s.accounts2015, s.outstanding2015, s.population ?? '', s.populationYear ?? '', s.perCapitaIncome ?? '', s.accountsPer100 ?? '', s.creditPerHead ?? '' ])));

console.log(`${NAME}: ${BANDS.length} bands, ${SMALL_SERIES.length} quarters of small borrowal accounts, ${DISTRICTS.length} districts, ${STATES.length} states, ${WOMEN_STATES.length} states of women borrowers; self-check passed`);
console.log(`  wrote out/${NAME}.json, src/app/stories/the-two-lakh-line/data.gen.ts and 5 CSVs under public/stories/the-two-lakh-line/`);

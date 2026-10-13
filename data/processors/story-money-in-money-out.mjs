// The figures for the story "Money in, money out" (src/app/stories/money-in-money-out), from the scraped DBIE files
// (data/sdmx/**, restored by `pnpm data:fetch`), read with the parsers the database loader uses.
//
//   INVI_CAT_TRANS_RN       invisibles by category, yearly    private transfers received (IC_PVT_TRNSF_RCPTS), US$, from
//                                                              1950-51; compensation of employees (IC_INCM_COMP_EMPL_RCPTS)
//                                                              for the method note
//   FR_INV_INFLW_A_RN       foreign investment inflows, yearly gross FDI inflows (INV_CAT_NFDI_DII_GROSS_INF_INV), US$
//   OUTW_REMIT_RN           outward remittances under the LRS, monthly, by purpose, US$, from April 2008
//   NRI_DEPOSITS_OUTS_RN    NRI deposits outstanding, monthly, by account (NRE, FCNR(B), NRO), US$
//
// Two inputs are not on DBIE: data/sources/remittance-survey.json, the RBI remittances survey's shares by source
// country and destination state (RBI Bulletin, 19-03-2025); and data/sources/mimo-events.json, the official record of
// what changed around each series (RBI and Government of India documents), marked on the story's steps.
//
// DBIE's NRI deposits total (NRI_DEP) is not used: for March 2026 its annual table reads five times the sum of the three
// accounts. The story sums NRE, FCNR(B) and NRO itself, and checks the monthly total against that sum where it agrees.
//
// Writes data/processors/out/story-money-in-money-out.json (the oracle), src/app/stories/money-in-money-out/data.gen.ts
// and the downloads under public/stories/money-in-money-out/. It fails, writing nothing, if a check does not hold.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSdmxCsv } from '../../scripts/db/lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO      = path.join(__dirname, '../..');
const OUT_DIR   = path.join(__dirname, 'out');
const NAME      = 'story-money-in-money-out';
const SLUG      = 'money-in-money-out';

const EXT        = path.join(REPO, 'data/sdmx/external-sector');
const INVISIBLES = path.join(EXT, 'international-trade/invisibles-by-category-of-transactions.csv');
const FDI_FILE   = path.join(EXT, 'international-finance/foreign-investment-inflows-annually.csv');
const LRS_FILE   = path.join(EXT, 'international-finance/outward-remittance.csv');
const NRI_FILE   = path.join(EXT, 'international-finance/nri-deposits-outstanding-monthly.csv');
const SURVEY_SRC = path.join(REPO, 'data/sources/remittance-survey.json');
const EVENTS_SRC = path.join(REPO, 'data/sources/mimo-events.json');

const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };
const fatal = () => { if (errors.length) { console.error(`${NAME}: self-check FAILED:`); errors.forEach(e => console.error('  ' + e)); process.exit(1); } };
const num = s => { const t = String(s ?? '').replace(/,/g, '').trim(); if (t === '' || t === '-') return null; const v = Number(t); return Number.isFinite(v) ? v : null; };
const r2 = v => Math.round(v * 100) / 100, r3 = v => Math.round(v * 1000) / 1000;
const objects = file => { const { header, data } = readSdmxCsv(file); return data.map(f => Object.fromEntries(header.map((h, i) => [ h, f[i] ]))); };
const ym = d => d.slice(0, 7);
const fyOf = d => { const y = +d.slice(0, 4), m = +d.slice(5, 7); const s = m >= 4 ? y : y - 1; return `${s}-${String(s + 1).slice(2)}`; };
const bn = v => v / 1e9;

// ── money in: private transfers, and gross FDI ────────────────────────────────────────────────────────────────────
// Both tables date a financial year by its last day (31 March).

const invis = objects(INVISIBLES).filter(r => r.UNIT_MEASURE === 'USD');
const yearly = code => {
    const m = new Map();
    for (const r of invis.filter(r => r.INVS_CAT_RN === code)) m.set(fyOf(r.TIME_PERIOD), r3(bn(num(r.OBS_VALUE))));
    return m;
};
const privBy = yearly('IC_PVT_TRNSF_RCPTS'), compBy = yearly('IC_INCM_COMP_EMPL_RCPTS');
const PRIVATE_FYS = [ ...privBy.keys() ].sort();
const PRIVATE = PRIVATE_FYS.map(fy => privBy.get(fy));
check(PRIVATE_FYS[0] === '1950-51', `private transfers: first year ${PRIVATE_FYS[0]}, expected 1950-51`);
check(PRIVATE.every(v => Number.isFinite(v) && v > 0), 'private transfers: a missing year');
for (let i = 1; i < PRIVATE_FYS.length; i++) check(+PRIVATE_FYS[i].slice(0, 4) - +PRIVATE_FYS[i - 1].slice(0, 4) === 1, `private transfers: a gap after ${PRIVATE_FYS[i - 1]}`);

const fdiBy = new Map(objects(FDI_FILE).filter(r => r.INVT_CAT_RN === 'INV_CAT_NFDI_DII_GROSS_INF_INV' && r.UNIT_MEASURE === 'USD')
    .map(r => [ fyOf(r.TIME_PERIOD), r3(bn(num(r.OBS_VALUE))) ]));
const FDI_FYS = [ ...fdiBy.keys() ].sort();
const FDI = FDI_FYS.map(fy => fdiBy.get(fy));
check(FDI_FYS.length >= 15 && FDI.every(v => v > 0), `gross FDI: ${FDI_FYS.length} years`);
fatal();

// ── money out: LRS, monthly by purpose ────────────────────────────────────────────────────────────────────────────
// Before June 2015 the table misses purposes that had their own limits until they were folded into the LRS on
// 26-05-2015, so the monthly series is shown from June 2015 and the purposes from 2015-16.

const PURPOSES = {
    OUTW_REMT_TRV : 'travel', OUTW_REMT_MANT_CLS_RELV : 'relatives', OUTW_REMT_GFT : 'gifts', OUTW_REMT_STD_ABD : 'study',
    OUTW_REMT_INV_EQT_DEB : 'investment', OUTW_REMT_DEP : 'deposits', OUTW_REMT_PUR_IMV_PROP : 'property',
    OUTW_REMT_MED_TRT : 'medical', OUTW_REMT_DON : 'donations', OUTW_REMT_OTH : 'other', OUTW_REMT_LRS_TTL : 'total',
};
const lrsBy = new Map();      // month → { purpose: $ bn }
for (const r of objects(LRS_FILE)) {
    const k = PURPOSES[r.MOD_OUTW_REMT_RN];
    if (!k || r.UNIT_MEASURE !== 'USD') continue;
    const m = ym(r.TIME_PERIOD);
    if (!lrsBy.has(m)) lrsBy.set(m, {});
    lrsBy.get(m)[k] = bn(num(r.OBS_VALUE));
}
const LRS_MONTHS = [ ...lrsBy.keys() ].filter(m => m >= '2015-06').sort();
const LRS_M = LRS_MONTHS.map(m => r3(lrsBy.get(m).total));
check(LRS_M.every(v => Number.isFinite(v) && v > 0), 'LRS: a month without a total');
for (let i = 1; i < LRS_MONTHS.length; i++) {
    const [ y0, m0 ] = LRS_MONTHS[i - 1].split('-').map(Number), [ y1, m1 ] = LRS_MONTHS[i].split('-').map(Number);
    check((y1 - y0) * 12 + (m1 - m0) === 1, `LRS: a gap between ${LRS_MONTHS[i - 1]} and ${LRS_MONTHS[i]}`);
}
// the purposes, summed by financial year, for the years DBIE carries all twelve months of (2015-16 onwards)
const fyMonths = new Map();
for (const m of lrsBy.keys()) { const fy = fyOf(m + '-01'); if (!fyMonths.has(fy)) fyMonths.set(fy, []); fyMonths.get(fy).push(m); }
const LRS_FYS = [ ...fyMonths.keys() ].filter(fy => fy >= '2015-16' && fyMonths.get(fy).length === 12).sort();
const LRS_FY = LRS_FYS.map(fy => {
    const o = {};
    for (const k of Object.values(PURPOSES)) o[k] = r3(fyMonths.get(fy).reduce((a, m) => a + (lrsBy.get(m)[k] ?? 0), 0));
    return o;
});
// the purposes add up to the total, to within rounding
LRS_FY.forEach((o, i) => {
    const parts = Object.entries(o).filter(([ k ]) => k !== 'total').reduce((a, [ , v ]) => a + v, 0);
    check(Math.abs(parts - o.total) < 0.05 * o.total, `LRS ${LRS_FYS[i]}: purposes ${parts.toFixed(2)} against total ${o.total}`);
});
fatal();

// ── money kept: NRI deposits, monthly by account ──────────────────────────────────────────────────────────────────

const ACC = { FXD_DEP_OVRS_NRERA_NRI : 'nre', FXD_DEP_OVRS_FCNRB_NRI : 'fcnr', FXD_DEP_OVRS_NRO_NRI : 'nro', FXD_DEP_OVRS_NRI_DEP : 'total' };
const nriBy = new Map();
for (const r of objects(NRI_FILE)) {
    const k = ACC[r.TYP_FD_OVRS_RN];
    if (!k || r.UNIT_MEASURE !== 'USD') continue;
    const m = ym(r.TIME_PERIOD);
    if (!nriBy.has(m)) nriBy.set(m, {});
    nriBy.get(m)[k] = r2(bn(num(r.OBS_VALUE)));
}
const NRI_MONTHS = [ ...nriBy.keys() ].filter(m => m >= '2010-01').sort();
const NRI = { nre : [], fcnr : [], nro : [] };
let totalAgree = 0;
for (const m of NRI_MONTHS) {
    const o = nriBy.get(m);
    check([ 'nre', 'fcnr', 'nro' ].every(k => Number.isFinite(o[k])), `NRI deposits: ${m} misses an account`);
    for (const k of [ 'nre', 'fcnr', 'nro' ]) NRI[k].push(o[k]);
    if (Number.isFinite(o.total) && Math.abs(o.total - (o.nre + o.fcnr + o.nro)) < 0.2) totalAgree++;
}
for (let i = 1; i < NRI_MONTHS.length; i++) {
    const [ y0, m0 ] = NRI_MONTHS[i - 1].split('-').map(Number), [ y1, m1 ] = NRI_MONTHS[i].split('-').map(Number);
    check((y1 - y0) * 12 + (m1 - m0) === 1, `NRI deposits: a gap between ${NRI_MONTHS[i - 1]} and ${NRI_MONTHS[i]}`);
}
check(totalAgree >= NRI_MONTHS.length * 0.95, `NRI deposits: DBIE's total agrees with the sum of the accounts in only ${totalAgree} of ${NRI_MONTHS.length} months`);
fatal();

// ── the survey and the record ─────────────────────────────────────────────────────────────────────────────────────

const SURVEY = JSON.parse(fs.readFileSync(SURVEY_SRC, 'utf8'));
check(SURVEY.rounds.length === 3 && SURVEY.countries.every(c => c.shares.length === 3) && SURVEY.states.every(s => s.shares.length === 3), 'survey: three rounds for every row');
const gcc = SURVEY.countries.filter(c => c.gcc).reduce((a, c) => a + (c.shares[2] ?? 0), 0);
check(Math.abs(gcc - SURVEY.gcc_2023_24.share) < 0.6, `survey: the GCC countries sum to ${gcc.toFixed(1)}%, the article says ${SURVEY.gcc_2023_24.share}%`);
const countrySum = SURVEY.countries.reduce((a, c) => a + (c.shares[2] ?? 0), 0);
check(countrySum < 100, `survey: 2023-24 country shares sum to ${countrySum}`);

const EVENTS_RAW = JSON.parse(fs.readFileSync(EVENTS_SRC, 'utf8')).events;
for (const e of EVENTS_RAW) {
    check(/^\d{4}-\d{2}-\d{2}$/.test(e.day) && !isNaN(new Date(e.day)), `events: bad date ${e.day}`);
    check(e.url === null || /^https:\/\/([a-z0-9-]+\.)*(rbi\.org\.in|pib\.gov\.in|incometaxindia\.gov\.in|mea\.gov\.in)\//.test(e.url), `events: not an official link: ${e.url}`);
    check(e.url === null || (e.source_title && e.quote), `events: ${e.label} has a link but no source or quote`);
}
const EVENTS = EVENTS_RAW.filter(e => e.url).map(e => ({ slide : e.slide, day : e.day, label : e.label, note : e.note, source : e.source_title, url : e.url }));
fatal();

// ── the figures the headers state, checked against the values the concept was reviewed with ───────────────────────

const at = fy => privBy.get(fy), fdiAt = fy => fdiBy.get(fy);
const LAST_FY = PRIVATE_FYS.at(-1), BOTH_FY = FDI_FYS.filter(fy => privBy.has(fy)).at(-1);
const lrsAt = fy => LRS_FY[LRS_FYS.indexOf(fy)];
const changes = (by, fys) => fys.map(fy => { const p = `${+fy.slice(0, 4) - 1}-${fy.slice(2, 4)}`; return by.get(fy) / by.get(p) - 1; });
const sd = xs => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length); };
const STEADY_FYS = FDI_FYS.filter(fy => fy >= '2005-06' && privBy.has(fy) && fdiBy.has(`${+fy.slice(0, 4) - 1}-${fy.slice(2, 4)}`));
const nriSum = m => { const i = NRI_MONTHS.indexOf(m); return NRI.nre[i] + NRI.fcnr[i] + NRI.nro[i]; };
const fcnrAt = m => NRI.fcnr[NRI_MONTHS.indexOf(m)];
const lastMarch = NRI_MONTHS.filter(m => m.endsWith('-03')).at(-1);

const HEADLINE = {
    lastFy : LAST_FY, bothFy : BOTH_FY,
    privateLast : at(LAST_FY), privateBoth : at(BOTH_FY), fdiBoth : fdiAt(BOTH_FY),
    times : r2(at(BOTH_FY) / fdiAt(BOTH_FY)),
    steady : { from : STEADY_FYS[0], to : STEADY_FYS.at(-1), private : +(100 * sd(changes(privBy, STEADY_FYS))).toFixed(1), fdi : +(100 * sd(changes(fdiBy, STEADY_FYS))).toFixed(1),
        privateFalls : changes(privBy, STEADY_FYS).filter(c => c < 0).length, fdiFalls : changes(fdiBy, STEADY_FYS).filter(c => c < 0).length, years : STEADY_FYS.length },
    pandemic : { private : +(100 * (at('2020-21') / at('2019-20') - 1)).toFixed(1), lrs : +(100 * (lrsAt('2020-21').total / lrsAt('2019-20').total - 1)).toFixed(1) },
    record : { fy : '2022-23', value : at('2022-23'), rise : +(100 * (at('2022-23') / at('2021-22') - 1)).toFixed(1) },
    seventies : { from : at('1973-74'), to : at('1980-81') },
    nri : { month : lastMarch, total : r2(nriSum(lastMarch)), times : r2(nriSum(lastMarch) / at(LAST_FY)) },
    window2013 : { from : '2013-08', to : '2014-02', rise : r2(fcnrAt('2014-02') - fcnrAt('2013-08')) },
    unwind2016 : { from : '2016-08', to : '2016-12', fall : r2(fcnrAt('2016-08') - fcnrAt('2016-12')) },
    lrsLast : lrsAt(LAST_FY).total, lrsFirst : LRS_FY[0].total, lrsFirstFy : LRS_FYS[0],
    travelShare : +(100 * lrsAt(LAST_FY).travel / lrsAt(LAST_FY).total).toFixed(1),
    balance : Math.round(100 * lrsAt(LAST_FY).total / at(LAST_FY)),
    comp : compBy.get(LAST_FY) ?? null,
};
const tcsDrop = m => { const i = LRS_MONTHS.indexOf(m); return +(100 * (1 - LRS_M[i] / LRS_M[i - 1])).toFixed(1); };
HEADLINE.tcs = { y2020 : tcsDrop('2020-10'), y2023 : tcsDrop('2023-10') };

// the values the concept of 13-10-2026 was reviewed with; a later scrape that moves them should be looked at
const EXPECT = [
    [ 'private 2024-25', HEADLINE.privateLast, 135.426 ], [ 'private 2023-24', HEADLINE.privateBoth, 118.712 ], [ 'FDI 2023-24', HEADLINE.fdiBoth, 70.954 ],
    [ 'times', HEADLINE.times, 1.67 ], [ 'steady private', HEADLINE.steady.private, 11.6 ], [ 'steady FDI', HEADLINE.steady.fdi, 34.8 ],
    [ 'pandemic private', HEADLINE.pandemic.private, -3.6 ], [ 'pandemic LRS', HEADLINE.pandemic.lrs, -32.4 ],
    [ 'NRI March 2026', HEADLINE.nri.total, 165.65 ], [ '2013 window', HEADLINE.window2013.rise, 25.84 ], [ '2016 unwind', HEADLINE.unwind2016.fall, 24.6 ],
    [ 'LRS 2024-25', HEADLINE.lrsLast, 29.563 ], [ 'travel share', HEADLINE.travelShare, 57.4 ], [ 'balance', HEADLINE.balance, 22 ],
    [ 'TCS 2020', HEADLINE.tcs.y2020, 43.1 ], [ 'TCS 2023', HEADLINE.tcs.y2023, 37.7 ],
];
for (const [ k, got, want ] of EXPECT) check(Math.abs(got - want) <= Math.max(0.051, Math.abs(want) * 0.002), `headline ${k}: ${got}, reviewed as ${want}`);
fatal();

// ── write ─────────────────────────────────────────────────────────────────────────────────────────────────────────

fs.mkdirSync(OUT_DIR, { recursive : true });
fs.writeFileSync(path.join(OUT_DIR, `${NAME}.json`), JSON.stringify({ HEADLINE, PRIVATE_FYS, PRIVATE, FDI_FYS, FDI, LRS_FYS, LRS_FY, LRS_MONTHS, LRS_M, NRI_MONTHS, NRI }, null, 1));

const ts = v => JSON.stringify(v);
const GEN = [
    `// GENERATED by data/processors/${NAME}.mjs — do not edit. Every number on the page comes from here, and here from the`,
    '// scraped DBIE series (INVI_CAT_TRANS_RN, FR_INV_INFLW_A_RN, OUTW_REMIT_RN, NRI_DEPOSITS_OUTS_RN) and two official sources',
    '// not on DBIE (the RBI remittances survey; the record of events); the processor\'s header says how.',
    '',
    `export const HEADLINE = ${ts(HEADLINE)};`,
    '',
    '// Private transfers received (mostly money sent home), US$ billion, by financial year.',
    `export const PRIVATE_FYS : string[] = ${ts(PRIVATE_FYS)};`,
    `export const PRIVATE : number[] = ${ts(PRIVATE)};`,
    '// Gross FDI inflows, US$ billion, by financial year.',
    `export const FDI_FYS : string[] = ${ts(FDI_FYS)};`,
    `export const FDI : number[] = ${ts(FDI)};`,
    '',
    '// Remittances out under the LRS: by purpose for each full financial year, US$ billion; and the monthly total.',
    `export const LRS_FYS : string[] = ${ts(LRS_FYS)};`,
    `export const LRS_FY : Record<"travel" | "relatives" | "gifts" | "study" | "investment" | "deposits" | "property" | "medical" | "donations" | "other" | "total", number>[] = ${ts(LRS_FY)};`,
    `export const LRS_MONTHS : string[] = ${ts(LRS_MONTHS)};`,
    `export const LRS_M : number[] = ${ts(LRS_M)};`,
    '',
    '// NRI deposits outstanding at the end of each month, US$ billion, by account.',
    `export const NRI_MONTHS : string[] = ${ts(NRI_MONTHS)};`,
    `export const NRI : Record<"nre" | "fcnr" | "nro", number[]> = ${ts(NRI)};`,
    '',
    '// The RBI remittances survey (data/sources/remittance-survey.json): shares %, by source country and destination state.',
    `export const SURVEY : { rounds : string[]; url : string; source : string; gcc : number; countries : { name : string; short : string; gcc : boolean; shares : (number | null)[] }[]; states : { name : string; shares : (number | null)[] }[] } = ${ts({ rounds : SURVEY.rounds, url : SURVEY.url, source : SURVEY.source_title, gcc : SURVEY.gcc_2023_24.share, countries : SURVEY.countries, states : SURVEY.states })};`,
    '',
    '// What changed around each series, from official documents (data/sources/mimo-events.json), by the step they are shown on.',
    `export const EVENTS : { slide : string; day : string; label : string; note : string; source : string; url : string }[] = ${ts(EVENTS)};`,
    '',
].join('\n');
const genPath = path.join(REPO, `src/app/stories/${SLUG}/data.gen.ts`);
fs.mkdirSync(path.dirname(genPath), { recursive : true });
fs.writeFileSync(genPath, GEN);

const pubDir = path.join(REPO, `public/stories/${SLUG}`);
fs.mkdirSync(pubDir, { recursive : true });
const csv = (header, rows) => header.join(',') + '\n' + rows.map(r => r.join(',')).join('\n') + '\n';
fs.writeFileSync(path.join(pubDir, 'money-in-yearly.csv'), '# Reserve Bank of India, as published on DBIE: private transfers received (invisibles by category) and gross FDI inflows, US$ billion\n' + csv(
    [ 'financial_year', 'private_transfers_usd_bn', 'gross_fdi_usd_bn' ],
    PRIVATE_FYS.map((fy, i) => [ fy, PRIVATE[i], fdiBy.get(fy) ?? '' ])));
const P = Object.values(PURPOSES);
fs.writeFileSync(path.join(pubDir, 'lrs-by-purpose-yearly.csv'), '# Reserve Bank of India, outward remittances under the Liberalised Remittance Scheme, as published on DBIE; US$ billion, summed by financial year\n' + csv(
    [ 'financial_year', ...P.map(k => `${k}_usd_bn`) ], LRS_FYS.map((fy, i) => [ fy, ...P.map(k => LRS_FY[i][k]) ])));
fs.writeFileSync(path.join(pubDir, 'lrs-monthly.csv'), '# Reserve Bank of India, outward remittances under the Liberalised Remittance Scheme, total, as published on DBIE; US$ billion\n' + csv(
    [ 'month', 'lrs_total_usd_bn' ], LRS_MONTHS.map((m, i) => [ m, LRS_M[i] ])));
fs.writeFileSync(path.join(pubDir, 'nri-deposits-monthly.csv'), '# Reserve Bank of India, NRI deposits outstanding at end of month, as published on DBIE; US$ billion; total is the sum of the three accounts\n' + csv(
    [ 'month', 'nre_usd_bn', 'fcnr_b_usd_bn', 'nro_usd_bn', 'total_usd_bn' ], NRI_MONTHS.map((m, i) => [ m, NRI.nre[i], NRI.fcnr[i], NRI.nro[i], r2(NRI.nre[i] + NRI.fcnr[i] + NRI.nro[i]) ])));
fs.writeFileSync(path.join(pubDir, 'remittance-survey-shares.csv'), `# ${SURVEY.source_title} (not on DBIE): shares of inward remittances, per cent; ${SURVEY.url}\n` + csv(
    [ 'kind', 'name', ...SURVEY.rounds.map(r => `share_${r.replace('-', '_')}`) ],
    [ ...SURVEY.countries.map(c => [ 'country', `"${c.name}"`, ...c.shares.map(v => v ?? '') ]), ...SURVEY.states.map(s => [ 'state', `"${s.name}"`, ...s.shares.map(v => v ?? '') ]) ]));

console.log(`${NAME}: private transfers ${PRIVATE_FYS[0]}–${LAST_FY}, $${HEADLINE.privateLast} bn last; ${BOTH_FY} ${HEADLINE.privateBoth} against FDI ${HEADLINE.fdiBoth} (${HEADLINE.times}x); swings ${HEADLINE.steady.private}% against ${HEADLINE.steady.fdi}%; LRS ${LRS_FYS[0]}–${LRS_FYS.at(-1)} (${LRS_MONTHS.length} months to ${LRS_MONTHS.at(-1)}), $${HEADLINE.lrsLast} bn last; NRI ${NRI_MONTHS[0]}–${NRI_MONTHS.at(-1)}, $${HEADLINE.nri.total} bn at ${lastMarch} (DBIE total agrees ${totalAgree}/${NRI_MONTHS.length} months); balance $${HEADLINE.balance} per $100; ${EVENTS.length} of ${EVENTS_RAW.length} events linked; self-check passed`);

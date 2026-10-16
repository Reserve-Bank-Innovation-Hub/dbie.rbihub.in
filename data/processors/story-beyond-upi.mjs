// The figures for the story "Beyond UPI: everything else India pays with" (src/app/stories/beyond-upi), from the scraped
// DBIE reports (data/reports/**, restored by `pnpm data:fetch`), read with the CSV reader the database loader uses.
//
//   payment system indicators, annual, new format (report 907, "new-format-2020")  2015-16 to 2025-26, volume in lakh,
//       value in ₹ crore: 1 RTGS; 2.4 IMPS; 2.6 NEFT; 2.7 UPI; 3.4 NETC (tolls linked to a bank account);
//       4.1 credit cards; 4.2 debit cards; 5 prepaid payment instruments; 6 paper-based instruments; total payments
//   payment system indicators, annual, old format (report 907, "old-format")  cheque clearances, all India, 1970-71 to
//       2015-16, number in million, amount in ₹ billion
//   payment system indicators, monthly, new format (report 778)  November 2019 onwards: cards outstanding (credit,
//       debit), PoS terminals and UPI QR codes (end-of-month stocks, lakh); payments a month by method (RTGS, NEFT,
//       IMPS, UPI, NETC, credit and debit cards, prepaid instruments, paper, total); paper cleared through CTS
//
// The two cheque tables meet in 2015-16, where both report the same count (1,096.45 million against 10,964 lakh): the
// old table runs to 2014-15 and the new from 2015-16, and the processor checks the overlap. Month rows can repeat in the
// scrape; repeats are dropped, keeping the first. Stocks (cards, terminals, QR codes) are read at a month's end and never
// summed. Uses per card divide a year's card payments by the mean of that year's twelve month-end card counts.
//
// Writes data/processors/out/story-beyond-upi.json (the oracle), src/app/stories/beyond-upi/data.gen.ts and the
// downloads under public/stories/beyond-upi/. It fails, writing nothing, if a check does not hold.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { csvRows } from '../../scripts/db/lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO      = path.join(__dirname, '../..');
const OUT_DIR   = path.join(__dirname, 'out');
const NAME      = 'story-beyond-upi';
const SLUG      = 'beyond-upi';
const PS        = path.join(REPO, 'data/reports/statistics/financial-sector/payment-systems');
const ANNUAL    = path.join(PS, '907--payment-system-indicators--new-format-2020.csv');
const CHEQUES   = path.join(PS, '907--payment-system-indicators--old-format.csv');
const MONTHLY   = path.join(PS, '778--payment-system-indicators--new-format.csv');

const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };
const fatal = () => { if (errors.length) { console.error(`${NAME}: self-check FAILED:`); errors.forEach(e => console.error('  ' + e)); process.exit(1); } };
const num = s => { const t = String(s ?? '').replace(/,/g, '').trim(); if (t === '' || t === '-') return null; const v = Number(t); return Number.isFinite(v) ? v : null; };
const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
const grid = async file => { const g = []; await csvRows(file, { onRow : cells => g.push(cells.map(c => c.trim())) }); return g; };
// the label row's text carried right across its empty cells, so each column knows the item it belongs to
const carry = row => { let cur = ''; return row.map(x => (x ? (cur = x) : cur)); };

// ── annual payments, 2015-16 onwards ─────────────────────────────────────────────────────────────────────────────

const A = await grid(ANNUAL);
const aLabels = carry(A.find(r => r.some(c => /Large Value Credit Transfers - RTGS/.test(c))) ?? []);
const aCol = re => { const j = aLabels.findIndex((x, i) => i > 0 && re.test(x)); if (j < 0) errors.push(`annual: no column for ${re}`); return j; };
const METHODS = {
    rtgs   : { re : /^1\. Large Value Credit Transfers - RTGS/, label : 'RTGS' },
    neft   : { re : /^2\.6 NEFT/, label : 'NEFT' },
    imps   : { re : /^2\.4 IMPS/, label : 'IMPS' },
    paper  : { re : /^6\. Paper-based Instruments/, label : 'Cheques and other paper instruments' },
    credit : { re : /^4\.1 Credit Cards/, label : 'Credit cards' },
    debit  : { re : /^4\.2 Debit Cards/, label : 'Debit cards' },
    upi    : { re : /^2\.7 UPI/, label : 'UPI' },
    ppi    : { re : /^5\. Prepaid Payment Instruments/, label : 'Prepaid Payment Instruments (PPI)' },
    netc   : { re : /^3\.4 NETC/, label : 'Tolls (NETC, bank-linked)' },
    total  : { re : /^Total Payments/, label : 'All payments' },
};
const cols = Object.fromEntries(Object.entries(METHODS).map(([ k, m ]) => [ k, aCol(m.re) ]));
fatal();
const aRows = A.filter(r => /^\d{4}-\d{2}$/.test(r[0]));
const FYS = aRows.map(r => r[0]);
check(FYS[0] === '2015-16' && FYS.length >= 10, `annual: years ${FYS[0]} to ${FYS.at(-1)}`);
// volume in lakh, value in ₹ crore, for each method and year
const PAY = Object.fromEntries(Object.entries(cols).map(([ k, j ]) => [ k, { volume : aRows.map(r => num(r[j])), value : aRows.map(r => num(r[j + 1])) } ]));
for (const [ k, s ] of Object.entries(PAY)) {
    const from = k === 'netc' ? FYS.indexOf('2017-18') : k === 'upi' ? FYS.indexOf('2016-17') : 0;
    check(s.volume.slice(from).every(v => Number.isFinite(v) && v >= 0) && s.value.slice(from).every(v => Number.isFinite(v)), `annual: ${k} has a missing year`);
}
fatal();
const LAST = FYS.length - 1, LAST_FY = FYS[LAST];
// average payment, ₹: value (crore) × 10^7 over volume (lakh) × 10^5
const avg = (k, i = LAST) => PAY[k].value[i] * 1e7 / (PAY[k].volume[i] * 1e5);

// ── cheques since 1970-71 ────────────────────────────────────────────────────────────────────────────────────────

const C = await grid(CHEQUES);
const cRows = C.filter(r => /^\d{4}-\d{2}$/.test(r[0])).map(r => ({ fy : r[0], number : num(r[1]), amount : num(r[2]) })).sort((a, b) => a.fy.localeCompare(b.fy));
check(cRows[0]?.fy === '1970-71', `cheques: first year ${cRows[0]?.fy}`);
const overlap = cRows.find(r => r.fy === '2015-16'), newFirst = PAY.paper.volume[0];
check(overlap && Math.abs(overlap.number * 10 - newFirst) / newFirst < 0.002, `cheques: the tables disagree in 2015-16 (${overlap?.number} million against ${newFirst} lakh)`);
// one series in crore instruments and ₹ lakh crore: the old table to 2014-15, the new from 2015-16
const CHEQUE_FYS = [ ...cRows.filter(r => r.fy < '2015-16').map(r => r.fy), ...FYS ];
const CHEQUE_N = [ ...cRows.filter(r => r.fy < '2015-16').map(r => r2(r.number / 10)), ...PAY.paper.volume.map(v => r2(v / 100)) ];
const CHEQUE_V = [ ...cRows.filter(r => r.fy < '2015-16').map(r => r2(r.amount / 1000)), ...PAY.paper.value.map(v => r2(v / 1e5)) ];
check(CHEQUE_N.every(v => Number.isFinite(v) && v > 0), 'cheques: a missing year');
fatal();

// ── monthly: cards, terminals, QR codes, card payments, CTS ──────────────────────────────────────────────────────

const M = await grid(MONTHLY);
const mHead = M.slice(0, 8).map(carry);
const mLabel = j => mHead.map(r => r[j] ?? '').join(' | ');
const mCol = (re, from = 1) => { for (let j = from; j < (mHead[3]?.length ?? 0); j++) if (re.test(mLabel(j))) return j; errors.push(`monthly: no column for ${re}`); return -1; };
const MC = {
    cardsCredit : mCol(/Payment System Infrastructures.*1\.1 Credit Cards/),
    cardsDebit  : mCol(/Payment System Infrastructures.*1\.2 Debit Cards/),
    pos         : mCol(/Number of PoS Terminals/),
    upiQr       : mCol(/7 UPI QR/),
    payCredit   : mCol(/II Retail.*4\.1 Credit Cards \(4\.1\.1/),
    payDebit    : mCol(/II Retail.*4\.2 Debit Cards \(4\.2\.1/),
    paper       : mCol(/6 Paper-based Instruments/),
    cts         : mCol(/6\.1 CTS/),
    ppiAll      : mCol(/Payment System Infrastructures.*2 Number of PPIs/),
    ppiCards    : mCol(/Payment System Infrastructures.*2\.2 Cards/),
};
// payments a month by method: the volume column (lakh); the value (₹ crore) is the next one
const MP = {
    rtgs   : mCol(/Credit Transfers - RTGS \(1\.1/),
    neft   : mCol(/II Retail.*2\.6 NEFT/),
    imps   : mCol(/II Retail.*2\.4 IMPS/),
    upi    : mCol(/II Retail.*2\.7 UPI/),
    netc   : mCol(/3\.4 NETC/),
    credit : MC.payCredit,
    debit  : MC.payDebit,
    ppi    : mCol(/II Retail.*5 Prepaid Payment Instruments \(5\.1/),
    paper  : MC.paper,
    total  : mCol(/Total Payments/),
};
fatal();
const MON = { Jan : 1, Feb : 2, Mar : 3, Apr : 4, May : 5, Jun : 6, Jul : 7, Aug : 8, Sep : 9, Oct : 10, Nov : 11, Dec : 12 };
const seen = new Set();
const mRows = M.filter(r => /^[A-Z][a-z]{2}-\d{4}$/.test(r[0])).map(r => ({ m : `${r[0].slice(4)}-${String(MON[r[0].slice(0, 3)]).padStart(2, '0')}`, r }))
    .filter(x => (seen.has(x.m) ? false : (seen.add(x.m), true))).sort((a, b) => a.m.localeCompare(b.m));
const MONTHS = mRows.map(x => x.m);
const fyMonths = fy => { const y = +fy.slice(0, 4); return [ ...[ 4, 5, 6, 7, 8, 9, 10, 11, 12 ].map(m => `${y}-${String(m).padStart(2, '0')}`), ...[ 1, 2, 3 ].map(m => `${y + 1}-${String(m).padStart(2, '0')}`) ]; };
check(MONTHS[0] === '2019-11', `monthly: first month ${MONTHS[0]}`);
const mSeries = j => mRows.map(x => num(x.r[j]));
const CARDS = { credit : mSeries(MC.cardsCredit), debit : mSeries(MC.cardsDebit) };     // lakh cards, month end
const POS = mSeries(MC.pos), UPI_QR = mSeries(MC.upiQr);                                 // lakh, month end
const MPAY = Object.fromEntries(Object.entries(MP).map(([ k, j ]) => [ k, { volume : mSeries(j), value : mSeries(j + 1) } ]));
// DBIE prints "-" for prepaid-instrument volume in September 2023 (the value is there); that month's prepaid tiles count as other
const gaps = Object.entries(MPAY).flatMap(([ k, s ]) => MONTHS.filter((m, i) => !Number.isFinite(s.volume[i]) || !Number.isFinite(s.value[i])).map(m => `${k} ${m}`));
check(gaps.join() === 'ppi 2023-09', `monthly: missing months ${gaps.join(', ')}`);
check(/Volume/.test(mLabel(MP.rtgs)) && /Value/.test(mLabel(MP.rtgs + 1)), 'monthly: RTGS volume and value columns out of place');
// each month's twelve financial-year months summed should give the annual table's figure
for (const k of [ 'rtgs', 'neft', 'credit', 'total' ]) {
    const ms = fyMonths('2024-25').map(m => MONTHS.indexOf(m));
    if (ms.every(i => i >= 0)) { const sum = ms.reduce((a, i) => a + MPAY[k].volume[i], 0); check(Math.abs(sum - PAY[k].volume[FYS.indexOf('2024-25')]) / PAY[k].volume[FYS.indexOf('2024-25')] < 0.01, `monthly ${k} 2024-25 sums to ${sum.toFixed(0)} lakh, annual ${PAY[k].volume[FYS.indexOf('2024-25')]}`); }
}
// the month credit-card payments first passed debit-card payments, and whether every later month stayed so
const crossAt = MPAY.credit.volume.findIndex((v, i) => v > MPAY.debit.volume[i]);
const crossHeld = crossAt >= 0 && MPAY.credit.volume.slice(crossAt).every((v, i) => v > MPAY.debit.volume[crossAt + i]);
const at = (s, m) => s[MONTHS.indexOf(m)];
check(Number.isFinite(at(CARDS.debit, '2026-03')) && Number.isFinite(at(POS, '2021-03')), 'monthly: missing March stocks');
// uses a year per card in the latest year: the year's payments over the mean of its twelve month-end card counts
const meanStock = (s, fy) => { const v = fyMonths(fy).map(m => at(s, m)); check(v.every(Number.isFinite), `monthly: ${fy} misses a month`); return v.reduce((a, b) => a + b, 0) / v.length; };
const USES = { credit : r1(PAY.credit.volume[LAST] / meanStock(CARDS.credit, LAST_FY)), debit : r1(PAY.debit.volume[LAST] / meanStock(CARDS.debit, LAST_FY)) };
// the share of paper instruments cleared through CTS, each financial year with all twelve months
const ctsShare = fy => { const ms = fyMonths(fy); const p = ms.map(m => num(mRows.find(x => x.m === m)?.r[MC.paper])), c = ms.map(m => num(mRows.find(x => x.m === m)?.r[MC.cts])); if (!p.every(Number.isFinite) || !c.every(Number.isFinite)) return null; return r1(100 * c.reduce((a, b) => a + b, 0) / p.reduce((a, b) => a + b, 0)); };
const CTS = Object.fromEntries([ '2020-21', '2021-22', '2022-23', '2023-24', '2024-25', '2025-26' ].map(fy => [ fy, ctsShare(fy) ]));
fatal();

// ── the headline figures ─────────────────────────────────────────────────────────────────────────────────────────

const iFy = fy => FYS.indexOf(fy);
const peakCheque = CHEQUE_N.indexOf(Math.max(...CHEQUE_N));
const impsPeak = PAY.imps.volume.indexOf(Math.max(...PAY.imps.volume));
const ladderKeys = [ 'rtgs', 'paper', 'neft', 'imps', 'credit', 'debit', 'upi', 'ppi', 'netc' ];
const HEADLINE = {
    fy : LAST_FY,
    ladder : ladderKeys.map(k => ({ key : k, label : METHODS[k].label, avg : Math.round(avg(k)), volume : PAY[k].volume[LAST], value : PAY[k].value[LAST] })).sort((a, b) => b.avg - a.avg),
    rtgs : {
        avgLakh : r1(avg('rtgs') / 1e5), shareValue : r1(100 * PAY.rtgs.value[LAST] / PAY.total.value[LAST]), shareNumber : r2(100 * PAY.rtgs.volume[LAST] / PAY.total.volume[LAST]),
        from : '2020-21', volFrom : PAY.rtgs.volume[iFy('2020-21')], volTo : PAY.rtgs.volume[LAST], valFrom : r1(PAY.rtgs.value[iFy('2020-21')] / 1e5), valTo : r1(PAY.rtgs.value[LAST] / 1e5),
        times : r1(PAY.rtgs.volume[LAST] / PAY.rtgs.volume[iFy('2020-21')]),
    },
    neft : { avg : Math.round(avg('neft')), volume : PAY.neft.volume[LAST], valueLakhCrore : r1(PAY.neft.value[LAST] / 1e5) },
    imps : { avg : Math.round(avg('imps')), volume : PAY.imps.volume[LAST], valueLakhCrore : r1(PAY.imps.value[LAST] / 1e5), peakFy : FYS[impsPeak], peakVolume : PAY.imps.volume[impsPeak] },
    cheque : {
        firstFy : CHEQUE_FYS[0], first : CHEQUE_N[0], peakFy : CHEQUE_FYS[peakCheque], peak : CHEQUE_N[peakCheque], last : CHEQUE_N.at(-1),
        y2223 : CHEQUE_N[CHEQUE_FYS.indexOf('2022-23')], v2223 : CHEQUE_V[CHEQUE_FYS.indexOf('2022-23')], vLast : CHEQUE_V.at(-1),
        avg2021 : Math.round(avg('paper', iFy('2020-21'))), avgLast : Math.round(avg('paper')),
    },
    cards : { month : '2026-03', debitCrore : r2(at(CARDS.debit, '2026-03') / 100), creditCrore : r2(at(CARDS.credit, '2026-03') / 100), uses : USES,
        avgCredit : Math.round(avg('credit')), avgDebit : Math.round(avg('debit')) },
    pos : { from : '2021-03', to : '2026-03', fromLakh : at(POS, '2021-03'), toLakh : at(POS, '2026-03'), times : r1(at(POS, '2026-03') / at(POS, '2021-03')), upiQrCrore : r2(at(UPI_QR, '2026-03') / 100) },
    small : { ppiVolume : PAY.ppi.volume[LAST], ppiAvg : Math.round(avg('ppi')), netcVolume : PAY.netc.volume[LAST], netcAvg : Math.round(avg('netc')) },
    upiAvg : Math.round(avg('upi')),
    cts : CTS,
    // the averages as ₹500 notes, and 100-note bundles of ₹50,000
    notes : Object.fromEntries(ladderKeys.map(k => [ k, r2(avg(k) / 500) ])),
    bundles : { rtgs : r1(avg('rtgs') / 50000), paper : r2(avg('paper') / 50000), neft : r2(avg('neft') / 50000) },
    times : r1(avg('rtgs') / avg('upi')),
    // an average day of the latest year: the year's totals over 365 days
    day : { rtgsValueLakhCrore : r2(PAY.rtgs.value[LAST] / 365 / 1e5), rtgsLakh : r1(PAY.rtgs.volume[LAST] / 365), neftCrore : r2(PAY.neft.volume[LAST] / 365 / 100),
        neftBatchLakh : r1(PAY.neft.volume[LAST] / 365 / 48), tollLakh : r2(PAY.netc.volume[LAST] / 365), chequeLakh : r1(PAY.paper.volume[LAST] / 365), impsLakh : r1(PAY.imps.volume[LAST] / 365) },
    all : { timesNumber : r1(PAY.total.volume[LAST] / PAY.total.volume[0]), avgFrom : Math.round(avg('total', 0)), avgTo : Math.round(avg('total')),
        rtgsShareFrom : r1(100 * PAY.rtgs.value[0] / PAY.total.value[0]), paperShareFrom : r1(100 * PAY.paper.volume[0] / PAY.total.volume[0]), paperShareTo : r2(100 * PAY.paper.volume[LAST] / PAY.total.volume[LAST]),
        upiShareNumber : r1(100 * PAY.upi.volume[LAST] / PAY.total.volume[LAST]), upiShareValue : r1(100 * PAY.upi.value[LAST] / PAY.total.value[LAST]) },
    impsAvg : { from : Math.round(avg('imps', 0)), to : Math.round(avg('imps')), times : r1(avg('imps') / avg('imps', 0)) },
    neftAvg : (() => { const a = FYS.map((f, i) => avg('neft', i)), p = a.indexOf(Math.max(...a)); return { peakFy : FYS[p], peak : Math.round(a[p]), to : Math.round(avg('neft')) }; })(),
    chequeAvg : (() => { const a = FYS.map((f, i) => avg('paper', i)), low = a.indexOf(Math.min(...a)); return { lowFy : FYS[low], low : Math.round(a[low]), from : Math.round(a[0]), to : Math.round(a[LAST]),
        risingSince : FYS[low], rising : a.slice(low).every((v, i, x) => !i || v > x[i - 1]), times : r1(a[LAST] / a[0]) }; })(),
    debitAvg : { from : Math.round(avg('debit', 0)), to : Math.round(avg('debit')), times : r1(avg('debit') / avg('debit', 0)) },
    cardRatio : { held : r1(at(CARDS.debit, '2026-03') / at(CARDS.credit, '2026-03')), payments : r1(PAY.credit.volume[LAST] / PAY.debit.volume[LAST]),
        debitPeakFy : FYS[PAY.debit.volume.indexOf(Math.max(...PAY.debit.volume))], debitPeak : Math.max(...PAY.debit.volume), debitLast : PAY.debit.volume[LAST], creditLast : PAY.credit.volume[LAST],
        creditTimes : r1(PAY.credit.volume[LAST] / PAY.credit.volume[0]),
        crossFy : FYS[PAY.credit.volume.findIndex((v, i) => v > PAY.debit.volume[i])], crossMonth : MONTHS[crossAt], crossHeld },
    qrPerPos : r1(at(UPI_QR, '2026-03') / at(POS, '2026-03')),
    // prepaid instruments in issue at the end of March 2026 (wallets and cards), and the year's prepaid payments a day
    ppi : { month : '2026-03', allCrore : r2(at(mSeries(MC.ppiAll), '2026-03') / 100), cardsCrore : r2(at(mSeries(MC.ppiCards), '2026-03') / 100), dayCrore : r2(PAY.ppi.volume[LAST] / 365 / 100) },
    posLatest : { month : MONTHS.at(-1), lakh : POS.at(-1) },
};
check(HEADLINE.cardRatio.crossMonth && HEADLINE.cardRatio.crossHeld, `cards: credit first passed debit in ${HEADLINE.cardRatio.crossMonth}, held after: ${HEADLINE.cardRatio.crossHeld}`);
check(HEADLINE.chequeAvg.rising, `cheques: the average has not risen every year since ${HEADLINE.chequeAvg.lowFy}`);
// the two walls: one tile per 10 crore payments and per ₹1 lakh crore, a month; the grid holds 24 × 16
const tilesN = MPAY.total.volume.map(v => v / 1000), tilesV = MPAY.total.value.map(v => v / 1e5);
check(Math.max(...tilesN, ...tilesV) < 24 * 16, `walls: ${Math.max(...tilesN, ...tilesV).toFixed(0)} tiles in a month, more than the grid holds`);

// the brief's figures (docs/story-tracker/stories.json, S26), checked; a later scrape that moves them should be looked at
const near = (a, b, tol = 0.01) => Math.abs(a - b) <= Math.abs(b) * tol;
// the brief gives ₹6.5 crore, ten times too much: ₹2,27,372,648 crore over 3,500 lakh payments is ₹65.0 lakh each
check(near(HEADLINE.rtgs.avgLakh, 65.0, 0.01), `RTGS average ₹${HEADLINE.rtgs.avgLakh} lakh, worked out as ₹65.0 lakh`);
check(near(HEADLINE.rtgs.shareValue, 68.4, 0.003), `RTGS value share ${HEADLINE.rtgs.shareValue}%, brief 68.4%`);
check(near(HEADLINE.cheque.avgLast, 128000, 0.01), `cheque average ₹${HEADLINE.cheque.avgLast}, brief ₹1.28 lakh`);
check(near(HEADLINE.upiAvg, 1300, 0.02), `UPI average ₹${HEADLINE.upiAvg}, brief ₹1,300`);
check(near(HEADLINE.cheque.last, 55.9, 0.005) && near(HEADLINE.cheque.first, 15.1, 0.01) && near(HEADLINE.cheque.peak, 146, 0.01), `cheques ${HEADLINE.cheque.first} / ${HEADLINE.cheque.peak} / ${HEADLINE.cheque.last} crore, brief 15.1 / 146 / 55.9`);
check(near(HEADLINE.pos.fromLakh, 47.2, 0.005) && near(HEADLINE.pos.toLakh, 117.7, 0.005), `PoS ${HEADLINE.pos.fromLakh} → ${HEADLINE.pos.toLakh} lakh, brief 47.2 → 117.7`);
check(near(USES.credit, 53, 0.04) && USES.debit < 2, `uses per card ${USES.credit} and ${USES.debit}, brief ≈53 and ≈1.3`);
check(near(HEADLINE.cheque.avg2021, 83900, 0.01), `cheque average 2020-21 ₹${HEADLINE.cheque.avg2021}, brief ₹83,900`);
fatal();

// ── the dated record (data/sources/beyond-upi-events.json): each date real, each link official ────────────────────

const EVENTS = JSON.parse(fs.readFileSync(path.join(REPO, 'data/sources/beyond-upi-events.json'), 'utf8')).events;
for (const e of EVENTS) {
    for (const d of [ e.day, e.issued ]) check(/^\d{4}-\d{2}-\d{2}$/.test(d) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d, `events: ${e.label} has a bad date ${d}`);
    check(/^https:\/\/(www\.rbi\.org\.in|pib\.gov\.in)\//.test(e.url ?? ''), `events: ${e.label} has no official link`);
    check(e.quote && e.note && e.slide, `events: ${e.label} is missing a field`);
}
fatal();

// ── write ────────────────────────────────────────────────────────────────────────────────────────────────────────

fs.mkdirSync(OUT_DIR, { recursive : true });
fs.writeFileSync(path.join(OUT_DIR, `${NAME}.json`), JSON.stringify({ HEADLINE, FYS, PAY, CHEQUE_FYS, CHEQUE_N, CHEQUE_V, MONTHS, CARDS, POS, UPI_QR, MPAY, EVENTS }, null, 1));
const ts = v => JSON.stringify(v);
const GEN = [
    `// GENERATED by data/processors/${NAME}.mjs — do not edit. Every number on the page comes from here, and here from the`,
    '// scraped DBIE payment system indicators (reports 907 and 778); the processor\'s header says how.',
    '',
    '// The headline figures, worked out by the processor and checked against the brief.',
    `export const HEADLINE = ${ts(HEADLINE)};`,
    '',
    '// Payments by method, each financial year 2015-16 onwards: volume in lakh payments, value in ₹ crore.',
    `export const FYS : string[] = ${ts(FYS)};`,
    `export const PAY : Record<${Object.keys(PAY).map(k => `"${k}"`).join(' | ')}, { volume : (number | null)[]; value : (number | null)[] }> = ${ts(PAY)};`,
    '',
    '// Cheques and other paper instruments, each financial year 1970-71 onwards: number in crore, amount in ₹ lakh crore.',
    `export const CHEQUE_FYS : string[] = ${ts(CHEQUE_FYS)};`,
    `export const CHEQUE_N : number[] = ${ts(CHEQUE_N)};`,
    `export const CHEQUE_V : number[] = ${ts(CHEQUE_V)};`,
    '',
    '// Month-end stocks from November 2019: credit and debit cards, PoS terminals and UPI QR codes, in lakh.',
    `export const MONTHS : string[] = ${ts(MONTHS)};`,
    `export const CARDS : Record<"credit" | "debit", (number | null)[]> = ${ts(CARDS)};`,
    `export const POS : (number | null)[] = ${ts(POS)};`,
    `export const UPI_QR : (number | null)[] = ${ts(UPI_QR)};`,
    '',
    '// The dated record shown on the steps (data/sources/beyond-upi-events.json), each with its official link.',
    `export const EVENTS : { slide : string; day : string; issued : string; label : string; note : string; source_title : string; url : string; quote : string }[] = ${ts(EVENTS)};`,
    '',
    '// Payments a month by method from November 2019 (report 778): volume in lakh payments, value in ₹ crore.',
    `export const MPAY : Record<${Object.keys(MPAY).map(k => `"${k}"`).join(' | ')}, { volume : (number | null)[]; value : (number | null)[] }> = ${ts(MPAY)};`,
    '',
].join('\n');
const genPath = path.join(REPO, `src/app/stories/${SLUG}/data.gen.ts`);
fs.mkdirSync(path.dirname(genPath), { recursive : true });
fs.writeFileSync(genPath, GEN);

const pubDir = path.join(REPO, `public/stories/${SLUG}`);
fs.mkdirSync(pubDir, { recursive : true });
const csv = (header, rows) => header.join(',') + '\n' + rows.map(r => r.join(',')).join('\n') + '\n';
const mk = Object.keys(PAY);
fs.writeFileSync(path.join(pubDir, 'payments-by-method-yearly.csv'), '# Reserve Bank of India, payment system indicators (report 907), as published on DBIE; volume in lakh payments, value in rupees crore\n' + csv(
    [ 'financial_year', ...mk.flatMap(k => [ `${k}_volume_lakh`, `${k}_value_crore` ]) ], FYS.map((fy, i) => [ fy, ...mk.flatMap(k => [ PAY[k].volume[i] ?? '', PAY[k].value[i] ?? '' ]) ])));
fs.writeFileSync(path.join(pubDir, 'cheques-yearly.csv'), '# Reserve Bank of India, cheque clearances (report 907, old format, to 2014-15) and paper-based instruments (new format, from 2015-16), as published on DBIE\n' + csv(
    [ 'financial_year', 'number_crore', 'amount_lakh_crore' ], CHEQUE_FYS.map((fy, i) => [ fy, CHEQUE_N[i], CHEQUE_V[i] ])));
fs.writeFileSync(path.join(pubDir, 'cards-and-terminals-monthly.csv'), '# Reserve Bank of India, payment system indicators (report 778), as published on DBIE; month-end stocks in lakh\n' + csv(
    [ 'month', 'credit_cards_lakh', 'debit_cards_lakh', 'pos_terminals_lakh', 'upi_qr_lakh' ], MONTHS.map((m, i) => [ m, CARDS.credit[i] ?? '', CARDS.debit[i] ?? '', POS[i] ?? '', UPI_QR[i] ?? '' ])));
const mm = Object.keys(MPAY);
fs.writeFileSync(path.join(pubDir, 'payments-by-method-monthly.csv'), '# Reserve Bank of India, payment system indicators (report 778), as published on DBIE; volume in lakh payments, value in rupees crore\n' + csv(
    [ 'month', ...mm.flatMap(k => [ `${k}_volume_lakh`, `${k}_value_crore` ]) ], MONTHS.map((m, i) => [ m, ...mm.flatMap(k => [ MPAY[k].volume[i] ?? '', MPAY[k].value[i] ?? '' ]) ])));

console.log(`${NAME}: ${FYS[0]}–${LAST_FY}; RTGS ₹${HEADLINE.rtgs.avgLakh} lakh a payment, ${HEADLINE.rtgs.shareValue}% of value in ${HEADLINE.rtgs.shareNumber}% of payments; cheques ${HEADLINE.cheque.first} → ${HEADLINE.cheque.peak} (${HEADLINE.cheque.peakFy}) → ${HEADLINE.cheque.last} crore, ₹${HEADLINE.cheque.avgLast} each; cards ${HEADLINE.cards.debitCrore} crore debit, ${HEADLINE.cards.creditCrore} crore credit, uses ${USES.credit} / ${USES.debit}; PoS ${HEADLINE.pos.fromLakh} → ${HEADLINE.pos.toLakh} lakh; CTS ${JSON.stringify(CTS)}; self-check passed`);

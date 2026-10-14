// Processor: story-the-women-who-stayed — derives every figure for the story from the scrape's DBIE files (data/reports/**
// and data/sdmx/**, restored by `pnpm data:fetch`), read with the parsers the database loader uses. Nothing is typed by
// hand and nothing comes from outside DBIE.
//
// Sources (DBIE report id or SDMX series → what the story takes from it):
//   134          Handbook: per 1000 usually employed by broad industry group, rural and urban, men and women
//   WAGE_RATES_RN  average daily wage rates in rural India for men, all-India, monthly
//   CPI_AG_RN      consumer price index for agricultural labourers, general index, base 1986-87, monthly
//
// Emits:
//   out/story-the-women-who-stayed.json                  the oracle (data/processors/oracles/ holds the snapshot)
//   src/app/stories/the-women-who-stayed/data.gen.ts     the module the page imports
//   public/stories/the-women-who-stayed/*.csv            the downloads the page offers

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { csvRows, readSdmxCsv } from '../../scripts/db/lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO      = path.join(__dirname, '../..');
const OUT_DIR   = path.join(__dirname, 'out');
const NAME      = 'story-the-women-who-stayed';
const SLUG      = 'the-women-who-stayed';

const PUB      = path.join(REPO, 'data/reports/publication/time-series-publications');
const HANDBOOK = path.join(PUB, 'handbook-of-statistics-on-the-indian-economy');
const PRICES   = path.join(REPO, 'data/sdmx/real-sector/prices-wages');

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
const num = s => {
    if (s == null) return null;
    const t = String(s).replace(/,/g, '').trim();
    if (t === '' || t === '-') return null;
    const v = Number(t);
    return Number.isFinite(v) ? v : null;
};
const r1 = v => Math.round(v * 10) / 10;

const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };
const fatal = () => { if (errors.length) { console.error(`${NAME}: self-check FAILED:`); errors.forEach(e => console.error('  ' + e)); process.exit(1); } };

// ── 1. Who works where (report 134) ───────────────────────────────────────────────────────────────────────────────

// Two blocks, Rural then Urban; per 1000 usually employed, men then women, primary, secondary, tertiary, each as
// principal status (PS) and principal plus subsidiary (ALL). Only ALL is printed for the PLFS rounds, so ALL is used.
const t134 = await grid(reportFile(HANDBOOK, 134));
const iRural = t134.findIndex(r => r[0] === 'Rural'), iUrban = t134.findIndex(r => r[0] === 'Urban');
check(iRural >= 0 && iUrban > iRural, 'Report 134: the Rural and Urban blocks were not found');
const sub134 = t134.slice(iRural, iUrban).find(r => r[2] === 'PS');
check(sub134 && sub134.slice(2, 14).join(',') === 'PS,ALL,PS,ALL,PS,ALL,PS,ALL,PS,ALL,PS,ALL', 'Report 134: the PS/ALL columns have moved');
const rounds = (from, to) => t134.slice(from, to).filter(r => /\d{4}/.test(r[1] || '') && num(r[3]) != null).map(r => ({
    round  : r[0].replace(/\s+/g, ' ').replace(/^PLFS(\d)/, 'PLFS $1'),
    period : r[1].replace(/\s+/g, ' ').replace(/\s*-\s*/g, '-'),
    m      : [ num(r[3]), num(r[5]), num(r[7]) ],
    w      : [ num(r[9]), num(r[11]), num(r[13]) ],
}));
const RURAL = rounds(iRural, iUrban), URBAN = rounds(iUrban, t134.length);
check(RURAL.length === 19 && URBAN.length === 19, `Report 134: expected 19 rounds in each block, got ${RURAL.length} and ${URBAN.length}`);
check(RURAL[0].m[0] === 690 && RURAL[0].w[0] === 818, 'Report 134: round 56 should be 690 men and 818 women in agriculture');
check(RURAL.at(-1).m[0] === 478 && RURAL.at(-1).w[0] === 727, 'Report 134: the latest round should be 478 men and 727 women');
for (const r of [ ...RURAL, ...URBAN ]) for (const k of [ 'm', 'w' ]) check(Math.abs(r[k][0] + r[k][1] + r[k][2] - 1000) <= 3, `Report 134: ${r.round} ${k} does not add to 1000`);
const URBAN_WOMEN_FARM = Object.fromEntries(URBAN.map(r => [ r.round, r.w[0] ]));

// ── 2. Wages (WAGE_RATES_RN) and farm workers' prices (CPI_AG_RN) ─────────────────────────────────────────────────

const JOBS = [ [ 'farm', 'WR13', 'General farm labourer' ], [ 'nonfarm', 'WR24', 'Non-farm labourer' ], [ 'constr', 'WR09', 'Construction worker' ], [ 'carp', 'WR07', 'Carpenter' ], [ 'mason', 'WR23', 'Mason' ] ];
const wr = readSdmxCsv(path.join(PRICES, 'wage-rates.csv'));
const wi = n => wr.header.indexOf(n);
const genders = new Set(wr.data.map(f => f[wi('GENDER_RN')]));
check(genders.size === 1 && genders.has('MALE'), `WAGE_RATES_RN: expected one gender, MALE, got ${[ ...genders ].join(',')}`);
const fyOf = d => { const y = +d.slice(0, 4), m = +d.slice(5, 7); const s = m >= 4 ? y : y - 1; return `${s}-${String(s + 1).slice(2)}`; };
const byJob = {};
for (const f of wr.data) {
    if (f[wi('STATE_CODE')] !== 'ALL_INDIA') continue;
    const job = JOBS.find(j => j[1] === f[wi('TYP_AAA_RN')]); if (!job) continue;
    ((byJob[job[0]] ??= {})[fyOf(f[wi('TIME_PERIOD')])] ??= []).push(num(f[wi('OBS_VALUE')]));
}
const fullYears = Object.keys(byJob.farm).filter(y => y >= '2014-15' && byJob.farm[y].length >= 10).sort();
const WAGES = fullYears.map(year => ({ year, months : byJob.farm[year].length, ...Object.fromEntries(JOBS.map(([ k ]) => [ k, r1(byJob[k][year].reduce((a, b) => a + b, 0) / byJob[k][year].length) ])) }));
const allIndiaMonths = Object.values(byJob.farm).flat().length;
const farmMonths = wr.data.filter(f => f[wi('STATE_CODE')] === 'ALL_INDIA' && f[wi('TYP_AAA_RN')] === 'WR13').map(f => [ f[wi('TIME_PERIOD')], num(f[wi('OBS_VALUE')]) ]).sort();
const WAGE_RANGE = { first : { month : farmMonths[0][0].slice(0, 7), rs : farmMonths[0][1] }, last : { month : farmMonths.at(-1)[0].slice(0, 7), rs : farmMonths.at(-1)[1] }, readings : allIndiaMonths };
check(WAGES[0]?.year === '2014-15' && WAGES.at(-1)?.year === '2024-25', `WAGE_RATES_RN: the full years should run 2014-15 to 2024-25, got ${WAGES[0]?.year} to ${WAGES.at(-1)?.year}`);
check(WAGES.at(-1).farm === 398 && WAGES.at(-1).mason === 637.5, `WAGE_RATES_RN: 2024-25 farm 398.0 and mason 637.5, got ${WAGES.at(-1).farm}, ${WAGES.at(-1).mason}`);
const cpi = readSdmxCsv(path.join(PRICES, 'cpi-agricultural-labourer.csv'));
const ci = n => cpi.header.indexOf(n);
const cpiFy = {};
for (const f of cpi.data) if (f[ci('BASE_PER')] === 'BY_1986-87' && f[ci('COMD_ITEM')] === 'CO_GIAG') (cpiFy[fyOf(f[ci('TIME_PERIOD')])] ??= []).push(num(f[ci('OBS_VALUE')]));
const CPI_AL = Object.fromEntries([ WAGES[0].year, WAGES.at(-1).year ].map(y => [ y, r1(cpiFy[y].reduce((a, b) => a + b, 0) / cpiFy[y].length) ]));
check(CPI_AL['2014-15'] === 799.5 && CPI_AL['2024-25'] === 1299.1, `CPI_AG_RN: 2014-15 799.5 and 2024-25 1299.1, got ${CPI_AL['2014-15']}, ${CPI_AL['2024-25']}`);

// ── 3. Wages and farm workers' prices by state (WAGE_RATES_RN, CPI_ALRL_ST_RN) ────────────────────────────────────

// For each state with all three jobs: the daily wage of a farm labourer, a construction worker and a mason, averaged
// over 2024-25 and 2014-15; and the state's price index for agricultural labourers over the same two years, which
// says how much prices rose there, not how dear the state is (every state's index has its own base).
const STATE_JOBS = [ [ 'farm', 'WR13' ], [ 'constr', 'WR09' ], [ 'mason', 'WR23' ] ];
const Y0 = WAGES[0].year, Y1 = WAGES.at(-1).year;
const sw = {};
for (const f of wr.data) {
    const job = STATE_JOBS.find(j => j[1] === f[wi('TYP_AAA_RN')]); if (!job) continue;
    const y = fyOf(f[wi('TIME_PERIOD')]); if (y !== Y0 && y !== Y1) continue;
    const v = num(f[wi('OBS_VALUE')]); if (v == null) continue;
    (((sw[f[wi('STATE_CODE')]] ??= {})[job[0]] ??= {})[y] ??= []).push(v);
}
const cs = readSdmxCsv(path.join(PRICES, 'consumer-price-index-agriculture-and-rural-labourer-state-wise.csv'));
const si = n => cs.header.indexOf(n);
const scpi = {};
for (const f of cs.data) {
    if (f[si('TYPE_LABOU_RN')] !== 'AL') continue;
    const y = fyOf(f[si('TIME_PERIOD')]); if (y !== Y0 && y !== Y1) continue;
    const v = num(f[si('OBS_VALUE')]); if (v == null) continue;
    ((scpi[f[si('STATE_CODE')]] ??= {})[y] ??= []).push(v);
}
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
const codelist = JSON.parse(fs.readFileSync(path.join(REPO, 'data/sdmx-codelists/WAGE_RATES_RN.json'), 'utf8'));
const NAMES = {};
(function names(o) { if (Array.isArray(o)) o.forEach(names); else if (o && typeof o === 'object') { if (o.code && o.label) NAMES[o.code] = o.label; Object.values(o).forEach(names); } })(codelist);
// Every state DBIE carries: a job's wage is given where the state has at least ten months of it in the year (Manipur
// has a farm-labourer wage for only five months, in 2016-17, so its farm wage is null).
const yearOf_ = (code, k, y) => (sw[code][k]?.[y]?.length ?? 0) >= 10 ? Math.round(avg(sw[code][k][y])) : null;
const STATE_WAGES = Object.keys(sw).filter(c => [ 'constr', 'mason' ].every(k => yearOf_(c, k, Y1) != null) && scpi[c]?.[Y0] && scpi[c]?.[Y1])
    .map(code => ({
        code, name : NAMES[code] ?? code,
        ...Object.fromEntries(STATE_JOBS.map(([ k ]) => [ k, yearOf_(code, k, Y1) ])),
        farmThen : yearOf_(code, 'farm', Y0), constrThen : yearOf_(code, 'constr', Y0),
        cpiThen : r1(avg(scpi[code][Y0])), cpiNow : r1(avg(scpi[code][Y1])),
    }))
    .sort((a, b) => (b.farm ?? -1) - (a.farm ?? -1));
const STATE_YEARS = { then : Y0, now : Y1, cpiLast : cs.data.filter(f => f[si('TYPE_LABOU_RN')] === 'AL').map(f => f[si('TIME_PERIOD')]).sort().at(-1).slice(0, 7) };
const sv = c => STATE_WAGES.find(s => s.code === c);
check(STATE_WAGES.length === 21 && sv('MANI')?.farm === null && sv('KER')?.farm === 869 && sv('MP')?.farm === 256, `WAGE_RATES_RN by state: 20 states (Manipur without a farm wage) and all-India; Kerala ₹869 and Madhya Pradesh ₹256 for farm work in ${Y1}, got ${STATE_WAGES.length}, ${sv('KER')?.farm}, ${sv('MP')?.farm}`);

// ── 4. Every rural job, everyday costs each year, and how much farm pay moves within the year ───────────────────

// All-India daily wage for each of the jobs DBIE tracks, averaged over the first and last full years.
const jw = {};
for (const f of wr.data) {
    if (f[wi('STATE_CODE')] !== 'ALL_INDIA') continue;
    const y = fyOf(f[wi('TIME_PERIOD')]); if (y !== Y0 && y !== Y1) continue;
    const v = num(f[wi('OBS_VALUE')]); if (v == null) continue;
    ((jw[f[wi('TYP_AAA_RN')]] ??= {})[y] ??= []).push(v);
}
const ALL_JOBS = Object.entries(jw).filter(([ , y ]) => (y[Y1]?.length ?? 0) >= 10)
    .map(([ code, y ]) => ({ code, label : NAMES[code] ?? code, wage : Math.round(avg(y[Y1])), wageThen : (y[Y0]?.length ?? 0) >= 10 ? Math.round(avg(y[Y0])) : null }))
    .sort((a, b) => b.wage - a.wage);
check(ALL_JOBS.length === 25 && ALL_JOBS[0].code === 'WR23' && ALL_JOBS.find(j => j.code === 'WR13')?.wage === 398, `WAGE_RATES_RN jobs: 25 jobs, the mason highest and the farm labourer at ₹398, got ${ALL_JOBS.length}, ${ALL_JOBS[0]?.code}`);
// Everyday costs (CPI_AG_RN) for every full wage year, to plot a day's farm wage against them year by year.
const CPI_YEARS = Object.fromEntries(WAGES.map(w => [ w.year, r1(avg(cpiFy[w.year])) ]));
// How far the all-India farm wage moves within the year once its steady rise is taken out: each month against the
// average of the thirteen months around it, averaged by calendar month over the full years; and the largest such
// swing in any state.
const swing = code => {
    const ser = wr.data.filter(f => f[wi('STATE_CODE')] === code && f[wi('TYP_AAA_RN')] === 'WR13' && num(f[wi('OBS_VALUE')]) != null)
        .map(f => [ f[wi('TIME_PERIOD')].slice(0, 7), num(f[wi('OBS_VALUE')]) ]).filter(([ m ]) => m >= `${Y0.slice(0, 4)}-04` && m <= `20${Y1.slice(5)}-03`).sort();
    const dev = {};
    for (let j = 6; j < ser.length - 6; j++) (dev[+ser[j][0].slice(5)] ??= []).push(100 * (ser[j][1] / avg(ser.slice(j - 6, j + 7).map(x => x[1])) - 1));
    const by = Object.values(dev).map(avg);
    return r1(Math.max(...by) - Math.min(...by));
};
const SEASON = { allIndia : swing('ALL_INDIA'), ...STATE_WAGES.filter(x => x.code !== 'ALL_INDIA' && x.farm != null).map(x => ({ state : x.name, swing : swing(x.code) })).sort((a, b) => b.swing - a.swing)[0] };
check(SEASON.allIndia < 1.5, `WAGE_RATES_RN: the all-India farm wage should move less than 1.5% within the year, got ${SEASON.allIndia}`);

fatal();

// ── the oracle, the module, the downloads ─────────────────────────────────────────────────────────────────────────

const DATA = { RURAL, URBAN, URBAN_WOMEN_FARM, WAGES, WAGE_RANGE, CPI_AL, CPI_YEARS, STATE_WAGES, STATE_YEARS, ALL_JOBS, SEASON, JOBS : JOBS.map(([ k, , label ]) => [ k, label ]) };
fs.mkdirSync(OUT_DIR, { recursive : true });
fs.writeFileSync(path.join(OUT_DIR, `${NAME}.json`), JSON.stringify(DATA, null, 2));

const ts = v => JSON.stringify(v);
const GEN = [
    `// GENERATED by data/processors/${NAME}.mjs — do not edit by hand; regenerate via pnpm data:build`,
    '// Sources: DBIE, as scraped — Handbook report 134; SDMX series WAGE_RATES_RN, CPI_AG_RN and CPI_ALRL_ST_RN.',
    '',
    '// Report 134, rural: per 1000 usually employed (principal and subsidiary status) in agriculture, industry, services.',
    'export interface Round { round : string; period : string; m : number[]; w : number[]; }',
    `export const RURAL : Round[] = ${ts(RURAL)};`,
    '// Report 134, urban: women in agriculture per 1000, by round.',
    `export const URBAN_WOMEN_FARM : Record<string, number> = ${ts(URBAN_WOMEN_FARM)};`,
    '// WAGE_RATES_RN, all-India, men (the series\' only gender): financial-year averages of the monthly wage, ₹ a day.',
    'export interface WageYear { year : string; months : number; farm : number; nonfarm : number; constr : number; carp : number; mason : number; }',
    `export const WAGES : WageYear[] = ${ts(WAGES)};`,
    `export const WAGE_RANGE = ${ts(WAGE_RANGE)};`,
    '// WAGE_RATES_RN by state (men; farm labourer, construction worker, mason, ₹ a day, averaged over the year) and',
    '// CPI_ALRL_ST_RN (agricultural labourers, base 1986-87): how much prices rose in each state, not how dear it is.',
    'export interface StateWage { code : string; name : string; farm : number | null; constr : number; mason : number; farmThen : number | null; constrThen : number | null; cpiThen : number; cpiNow : number; }',
    `export const STATE_WAGES : StateWage[] = ${ts(STATE_WAGES)};`,
    `export const STATE_YEARS = ${ts(STATE_YEARS)};`,
    '// Report 134, urban: per 1000 usually employed, as RURAL.',
    `export const URBAN : Round[] = ${ts(URBAN)};`,
    '// WAGE_RATES_RN, all-India: every rural job DBIE tracks (men), ₹ a day, averaged over the last and first full years.',
    'export interface JobWage { code : string; label : string; wage : number; wageThen : number | null; }',
    `export const ALL_JOBS : JobWage[] = ${ts(ALL_JOBS)};`,
    '// CPI_AG_RN, general index, base 1986-87: the average of every full wage year.',
    `export const CPI_YEARS : Record<string, number> = ${ts(CPI_YEARS)};`,
    '// How much the farm wage moves within the year, in per cent, once its steady rise is taken out: all-India, and the',
    '// state where it moves most.',
    `export const SEASON = ${ts(SEASON)};`,
    `export const JOBS = ${ts(DATA.JOBS)} as const;`,
    '// CPI_AG_RN, general index, base 1986-87: financial-year averages.',
    `export const CPI_AL : Record<string, number> = ${ts(CPI_AL)};`,
    '',
].join('\n');
const genPath = path.join(REPO, `src/app/stories/${SLUG}/data.gen.ts`);
fs.mkdirSync(path.dirname(genPath), { recursive : true });
fs.writeFileSync(genPath, GEN);

const pubDir = path.join(REPO, `public/stories/${SLUG}`);
fs.mkdirSync(pubDir, { recursive : true });
const csv = (header, rows) => header.join(',') + '\n' + rows.map(r => r.map(v => v == null ? '' : (typeof v === 'string' && /[",\n]/.test(v)) ? `"${v.replace(/"/g, '""')}"` : v).join(',')).join('\n') + '\n';
fs.writeFileSync(path.join(pubDir, 'rural-workers-by-sector.csv'), '# DBIE, Handbook of Statistics, report 134, rural, per 1000 usually employed, principal and subsidiary status\n' + csv(
    [ 'round', 'period', 'men_agriculture', 'men_industry', 'men_services', 'women_agriculture', 'women_industry', 'women_services' ], RURAL.map(r => [ r.round, r.period, ...r.m, ...r.w ])));
fs.writeFileSync(path.join(pubDir, 'rural-wages-men.csv'), '# DBIE, WAGE_RATES_RN, average daily wage rates in rural India for men, all-India, financial-year averages, rupees a day\n' + csv(
    [ 'year', 'months', ...JOBS.map(j => j[0]) ], WAGES.map(w => [ w.year, w.months, ...JOBS.map(j => w[j[0]]) ])));

fs.writeFileSync(path.join(pubDir, 'state-wages.csv'), `# DBIE, WAGE_RATES_RN by state (men, ₹ a day, averaged over each financial year) and CPI_ALRL_ST_RN (agricultural labourers, base 1986-87)\n` + csv(
    [ 'state', `farm_labourer_${Y1}`, `construction_worker_${Y1}`, `mason_${Y1}`, `farm_labourer_${Y0}`, `cpi_al_${Y0}`, `cpi_al_${Y1}` ],
    STATE_WAGES.map(s => [ s.name, s.farm, s.constr, s.mason, s.farmThen, s.cpiThen, s.cpiNow ])));
console.log(`${NAME}: ${RURAL.length} survey rounds, ${WAGES.length} wage years, ${STATE_WAGES.length - 1} states; self-check passed`);
console.log(`  wrote out/${NAME}.json, src/app/stories/${SLUG}/data.gen.ts and 3 CSVs under public/stories/${SLUG}/`);

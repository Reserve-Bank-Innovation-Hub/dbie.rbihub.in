// Scrape BSE indices history via the BSE public Index Archive API.
//
// Three CSVs per index (frequency = D, M, Y) into ./data-bse/<freq>/<INDX_CD>.csv
//
// Endpoints (api.bseindia.com/BseIndiaAPI/api/...):
//   FillddlIndex/w                           -> [{Indx_cd, shortalias}]
//   ProduceCSVForDate/w?strIndex&dtFromDate&dtToDate   -> daily OHLC CSV
//   ProduceCSVForMonth/w?strIndex&dtFromDate&dtToDate  -> monthly OHLC CSV
//   ProduceCSVForYear/w?strIndex&dtFromDate&dtToDate   -> yearly OHLC CSV
//
// Dates use DD/MM/YYYY.

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { argv } from 'node:process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, 'data', 'bse-raw');
const API = 'https://api.bseindia.com/BseIndiaAPI/api';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const HEADERS = {
    'User-Agent': UA,
    'Referer': 'https://www.bseindia.com/Indices/IndexArchiveData.html',
    'Origin': 'https://www.bseindia.com',
    'Accept': 'application/json,text/csv,*/*',
};

const args = new Set(argv.slice(2));
const ONLY = (() => {
    const i = argv.indexOf('--only');
    return i > -1 ? argv[i + 1].split(',') : null;
})();
const FREQS = (() => {
    const i = argv.indexOf('--freq');
    return i > -1 ? argv[i + 1].split(',') : ['M', 'Y']; // default: monthly + yearly. Daily is large.
})();
const DELAY_MS = 250;
const FROM = '01/01/1979';
const TO = (() => { const d = new Date(); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; })();

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Use curl rather than Node fetch: BSE returns HTTP headers with leading
// whitespace, which Node 22+ undici rejects as malformed.
async function curlGet(url) {
    const headerArgs = Object.entries(HEADERS).flatMap(([k, v]) => ['-H', `${k}: ${v}`]);
    const { stdout } = await exec('curl', [
        '-sS', '--compressed', '--max-time', '60',
        '-w', '\n%{http_code}',
        ...headerArgs,
        url,
    ], { maxBuffer: 50 * 1024 * 1024 });
    const idx = stdout.lastIndexOf('\n');
    const body = stdout.slice(0, idx);
    const code = parseInt(stdout.slice(idx + 1), 10);
    if (code >= 400) throw new Error(`HTTP ${code} for ${url}`);
    return body;
}

async function fetchIndices() {
    const t = await curlGet(`${API}/FillddlIndex/w`);
    return JSON.parse(t).Table || [];
}

const URLS = {
    D: code => `${API}/ProduceCSVForDate/w?strIndex=${encodeURIComponent(code.trim())}&dtFromDate=${FROM}&dtToDate=${TO}`,
    M: code => `${API}/ProduceCSVForMonth/w?strIndex=${encodeURIComponent(code.trim())}&dtFromDate=${FROM}&dtToDate=${TO}`,
    Y: code => `${API}/ProduceCSVForYear/w?strIndex=${encodeURIComponent(code.trim())}&dtFromDate=${FROM}&dtToDate=${TO}`,
};

async function scrapeOne(idx, freq) {
    const out = join(OUT, freq, `${idx.Indx_cd}.csv`);
    if (existsSync(out) && !args.has('--force')) {
        const sz = statSync(out).size;
        if (sz > 100) return { code: idx.Indx_cd, freq, status: 'skip', bytes: sz };
    }
    try {
        const csv = await curlGet(URLS[freq](idx.Indx_cd));
        if (!csv || csv.trim().length < 30) return { code: idx.Indx_cd, freq, status: 'empty', bytes: csv?.length || 0 };
        await writeFile(out, csv);
        return { code: idx.Indx_cd, freq, status: 'ok', bytes: csv.length, rows: csv.split('\n').length - 1 };
    } catch (e) {
        return { code: idx.Indx_cd, freq, status: 'error', error: e.message };
    }
}

async function main() {
    const indices = await fetchIndices();
    console.log(`BSE indices available: ${indices.length}`);
    const targets = ONLY ? indices.filter(x => ONLY.includes(x.Indx_cd)) : indices;
    console.log(`Scraping: ${targets.length} indices × frequencies [${FREQS.join(',')}]\n`);

    for (const f of FREQS) await mkdir(join(OUT, f), { recursive: true });

    const summary = { ok: 0, empty: 0, skip: 0, error: 0, total: 0 };
    const errors = [];

    for (const idx of targets) {
        for (const freq of FREQS) {
            const r = await scrapeOne(idx, freq);
            summary[r.status]++;
            summary.total++;
            const tag = { ok: '✓', skip: '·', empty: '∅', error: '✗' }[r.status];
            const detail = r.rows ? ` ${r.rows} rows` : r.error ? ` ${r.error.slice(0, 60)}` : '';
            console.log(`  ${tag} ${freq}/${idx.Indx_cd.padEnd(10)} ${(idx.shortalias || '').padEnd(40)}${detail}`);
            if (r.status === 'error') errors.push(r);
            if (r.status !== 'skip') await sleep(DELAY_MS);
        }
    }

    console.log(`\nSummary: ok=${summary.ok}  skip=${summary.skip}  empty=${summary.empty}  error=${summary.error}  total=${summary.total}`);
    if (errors.length) {
        console.log(`\nErrors (${errors.length}):`);
        errors.forEach(e => console.log(`  ${e.freq}/${e.code}: ${e.error}`));
    }
}

main().catch(e => { console.error(e); process.exit(1); });

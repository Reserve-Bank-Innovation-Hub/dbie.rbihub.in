// Shared pieces for the database loaders (scripts/db/*.mjs): connection settings, a psql runner that streams
// COPY data over stdin, CSV parsing, identifier and COPY-text escaping, and the exact arithmetic used to verify
// what landed in Postgres against what the files contain. No npm dependencies: psql does the talking.
import { spawn, execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DATA = path.join(ROOT, 'data');

// DBIE's eight Statistics headings are the data schemas; meta holds the catalogue and load bookkeeping.
export const DATA_SCHEMAS = ['real_sector', 'financial_sector', 'financial_markets', 'external_sector', 'public_finance', 'corporate_sector', 'socio_economic', 'surveys'];
const SECTOR_SCHEMA = {
    'real sector': 'real_sector', 'financial sector': 'financial_sector', 'financial markets': 'financial_markets',
    'financial market': 'financial_markets', 'external sector': 'external_sector', 'public finance': 'public_finance',
    'corporate sector': 'corporate_sector', 'socio-economic indicators': 'socio_economic',
    'surveys – aggregated data': 'surveys', 'surveys - aggregated data': 'surveys',
};
export const schemaForSector = s => SECTOR_SCHEMA[String(s || '').trim().toLowerCase()] || null;

// Settings come from .env.common at the repo root (gitignored; copy .env.common.example), Pratirupa's convention:
// pointers only, with the AWS profile and the name of the secret that carries host, port, dbname, username and
// password. Variables already in the environment win over the file.
export function loadEnvFile(file = path.join(ROOT, '.env.common')) {
    if (!fs.existsSync(file)) return false;
    for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
        const line = raw.replace(/\s#.*$/, '').trim();
        const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
        if (!m) continue;
        const value = m[2].replace(/^(['"])(.*)\1$/, '$2');
        if (value !== '' && process.env[m[1]] === undefined) process.env[m[1]] = value;
    }
    return true;
}

export function aws(...args) {
    loadEnvFile();
    const extra = ['--region', process.env.AWS_REGION || 'ap-south-1', '--output', 'text'];
    if (process.env.AWS_PROFILE) extra.push('--profile', process.env.AWS_PROFILE);
    return execFileSync('aws', [...args, ...extra], { stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim();
}

// A database secret in Pratirupa's shape, by name.
export function readDbSecret(name) {
    return JSON.parse(aws('secretsmanager', 'get-secret-value', '--secret-id', name, '--query', 'SecretString'));
}

// Connection: the standard PG* variables, filled from DB_SECRET_NAME when they are not set.
let cachedEnv = null;
export function pgEnv() {
    if (cachedEnv) return cachedEnv;
    loadEnvFile();
    const env = { ...process.env };
    env.PGSSLMODE ??= 'require';
    env.PGCONNECT_TIMEOUT ??= '15';
    if (!env.PGHOST || !env.PGPASSWORD) {
        if (!env.DB_SECRET_NAME) throw new Error('set DB_SECRET_NAME in .env.common (see .env.common.example) or PGHOST/PGUSER/PGPASSWORD');
        const s = readDbSecret(env.DB_SECRET_NAME);
        env.PGHOST ??= s.host;
        env.PGPORT ??= String(s.port ?? 5432);
        env.PGDATABASE ??= s.dbname;
        env.PGUSER ??= s.username;
        env.PGPASSWORD ??= s.password;
    }
    return (cachedEnv = env);
}

// Runs SQL through psql. `sql` is a string, or an async function (write) => {} that streams a script, including
// inline COPY data terminated by a "\." line; `write` applies backpressure. Resolves with stdout as bare
// tab-separated values (-A -t); rejects on the first error (ON_ERROR_STOP).
export function psql(sql) {
    return new Promise((resolve, reject) => {
        const p = spawn('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-A', '-t', '-F', '\t'], { env: pgEnv(), stdio: ['pipe', 'pipe', 'pipe'] });
        let out = '', err = '';
        p.stdout.on('data', d => { out += d; });
        p.stderr.on('data', d => { err += d; });
        p.on('error', reject);
        p.on('close', code => code === 0 ? resolve(out) : reject(new Error(`psql exit ${code}: ${err.trim().slice(0, 3000)}`)));
        const write = chunk => new Promise(res => { if (p.stdin.write(chunk)) res(); else p.stdin.once('drain', res); });
        (async () => {
            try { if (typeof sql === 'function') await sql(write); else await write(sql); p.stdin.end(); }
            catch (e) { p.kill(); reject(e); }
        })();
    });
}
export const tsvRows = out => out.split('\n').filter(Boolean).map(l => l.split('\t'));

// Identifiers and literals.
export const qi = s => '"' + String(s).replace(/"/g, '""') + '"';
export const ql = s => s == null ? 'NULL' : "'" + String(s).replace(/'/g, "''") + "'";
export const ident = s => String(s).toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').replace(/^(\d)/, '_$1');
export const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
// Postgres identifiers are at most 63 bytes.
export function fitIdent(s, max = 63) { let out = s; while (Buffer.byteLength(out) > max) out = out.slice(0, -1); return out.replace(/_+$/, ''); }
export const sqlArray = a => a.length ? `ARRAY[${a.map(ql).join(',')}]::text[]` : 'ARRAY[]::text[]';

// COPY text format: tab-separated, backslash escapes, \N for NULL.
export function copyCell(v) {
    if (v == null) return '\\N';
    return String(v).replace(/\\/g, '\\\\').replace(/\t/g, '\\t').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}
export const copyLine = cells => cells.map(copyCell).join('\t') + '\n';

// One CSV line into fields (RFC 4180 quoting). For files that never quote newlines, such as the SDMX exports.
export function splitCsvLine(line, delimiter = ',') {
    const out = []; let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
        else if (ch === '"') q = true;
        else if (ch === delimiter) { out.push(cur); cur = ''; }
        else cur += ch;
    }
    out.push(cur);
    return out;
}

// An SDMX-CSV export (data/sdmx/*.csv) as header and rows. FOOTNOTE is free text exported without quoting, so
// its commas split the line; the extra fields are folded back into it.
export function readSdmxCsv(file) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    if (lines.at(-1) === '') lines.pop();
    const header = splitCsvLine(lines[0]);
    const fi = header.indexOf('FOOTNOTE');
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        let f = splitCsvLine(lines[i]);
        if (f.length > header.length && fi >= 0) {
            const extra = f.length - header.length;
            f = [...f.slice(0, fi), f.slice(fi, fi + 1 + extra).join(','), ...f.slice(fi + 1 + extra)];
        }
        if (f.length !== header.length) throw new Error(`${path.basename(file)} line ${i + 1}: ${f.length} fields, header has ${header.length}`);
        data.push(f);
    }
    return { header, data };
}

// Incremental CSV parser for the report exports (semicolon-delimited, quoted cells that may contain newlines,
// CR LF line ends, hundreds of megabytes). Calls onRow(cells, rowNo) per row; awaits afterChunk() between file
// chunks so the caller can flush what it has buffered before more rows arrive.
export function csvRows(file, { delimiter = ';', onRow, afterChunk = null }) {
    return new Promise((resolve, reject) => {
        let row = [], cell = '', quoted = false, afterQuote = false, n = 0, first = true;
        const flushCell = () => { row.push(cell); cell = ''; afterQuote = false; };
        const flushRow = () => { flushCell(); onRow(row, ++n); row = []; };
        const stream = fs.createReadStream(file, { encoding: 'utf8', highWaterMark: 1 << 20 });
        stream.on('data', chunk => {
            if (first) { first = false; if (chunk.charCodeAt(0) === 0xFEFF) chunk = chunk.slice(1); }
            for (let i = 0; i < chunk.length; i++) {
                const ch = chunk[i];
                if (quoted) { if (ch === '"') { quoted = false; afterQuote = true; } else cell += ch; continue; }
                if (ch === '"') { if (afterQuote) { cell += '"'; afterQuote = false; } quoted = true; }
                else if (ch === delimiter) flushCell();
                else if (ch === '\n') flushRow();
                else if (ch === '\r') { /* CR LF: the LF ends the row */ }
                else cell += ch;
            }
            if (afterChunk) { stream.pause(); afterChunk().then(() => stream.resume(), reject); }
        });
        stream.on('error', reject);
        stream.on('end', () => { if (row.length || cell !== '') flushRow(); resolve(n); });
    });
}

// Exact decimal sum, matching the text Postgres prints for sum(numeric): the scale is the largest input scale.
export class DecimalSum {
    constructor() { this.scale = 0; this.sum = 0n; this.n = 0; }
    add(str) {
        const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(str);
        if (!m || (m[2] === '' && !(m[3] ?? ''))) throw new Error(`not a plain decimal: ${str}`);
        const frac = m[3] ?? '';
        if (frac.length > this.scale) { this.sum *= 10n ** BigInt(frac.length - this.scale); this.scale = frac.length; }
        let v = BigInt((m[2] || '0') + frac.padEnd(this.scale, '0'));
        if (m[1] === '-') v = -v;
        this.sum += v; this.n++;
    }
    toString() {
        const neg = this.sum < 0n; let s = (neg ? -this.sum : this.sum).toString();
        if (this.scale) { s = s.padStart(this.scale + 1, '0'); s = s.slice(0, -this.scale) + '.' + s.slice(-this.scale); }
        return (neg ? '-' : '') + s;
    }
}

// Row fingerprint shared with SQL: md5 of the cells joined by chr(31) with NULL as the two characters \N, first
// 32 bits as a signed integer, summed per table. SQL: sum(('x' || left(md5(<rowtext>), 8))::bit(32)::int).
export const textJoin = cells => cells.map(c => c == null ? '\\N' : c).join('\x1f');
export const rowHash = text => crypto.createHash('md5').update(text, 'utf8').digest().readInt32BE(0);
export const rowTextSql = cols => `array_to_string(ARRAY[${cols.map(qi).join(',')}]::text[], chr(31), '\\N')`;
export const hashSumSql = rowText => `coalesce(sum(('x' || left(md5(${rowText}), 8))::bit(32)::int), 0)`;

export const sha256File = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

// Load history.
export async function startRun(loader) {
    let commit = null;
    try { commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch {}
    const out = await psql(`INSERT INTO meta.load_run (loader, git_commit, host) VALUES (${ql(loader)}, ${ql(commit)}, ${ql(os.hostname())}) RETURNING id;`);
    return Number(out.trim());
}
export async function finishRun(id, summary) {
    await psql(`UPDATE meta.load_run SET finished_at = now(), summary = ${ql(JSON.stringify(summary))}::jsonb WHERE id = ${Number(id)};`);
}

export const stamp = () => new Date().toISOString().slice(11, 19);

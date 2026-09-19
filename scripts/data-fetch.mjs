#!/usr/bin/env node
// Restores the raw files of a scrape from the S3 archive into data/, so a fresh clone can run the processors and the
// loaders. The bucket is public, so no credentials are needed. Every file is checked against the archive's
// MANIFEST.json (size and SHA-256) after download.
//   pnpm data:fetch [--version YYYY-MM-DD | latest]
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, DATA, loadEnvFile } from './db/lib.mjs';

loadEnvFile();
const argv = process.argv.slice(2);
const opt = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const BUCKET = process.env.SCRAPES_BUCKET || 'dbie-common-scrapes';
const REGION = process.env.AWS_REGION || 'ap-south-1';
const base = `https://${BUCKET}.s3.${REGION}.amazonaws.com`;

async function getJson(key) { const r = await fetch(`${base}/${key}`, { cache: 'no-store' }); if (!r.ok) throw new Error(`${key}: HTTP ${r.status}`); return r.json(); }
let version = opt('--version') || 'latest';
if (version === 'latest') version = (await getJson('scrapes/latest.json')).version;
const manifest = await getJson(`scrapes/${version}/MANIFEST.json`);
console.log(`scrape ${version}: ${manifest.files} files, ${(manifest.bytes / 1048576).toFixed(0)} MB, scraped ${manifest.scraped_at?.slice(0, 10) ?? '?'}`);

// Directories arrive by sync (parallel, resumable); single files by copy. Anonymous: the bucket is public.
const cli = ['--region', REGION, '--no-sign-request', '--only-show-errors'];
const run = args => execFileSync('aws', [...args, ...cli], { stdio: ['ignore', 'inherit', 'inherit'], cwd: ROOT });
const dirs = [...new Set(manifest.entries.map(e => e.path.split('/').slice(0, 2).join('/')).filter(d => d !== 'data'))];
const topDirs = [...new Set(manifest.entries.filter(e => e.path.split('/').length > 2).map(e => e.path.split('/').slice(0, e.path.startsWith('data/sdmx-raw/') ? 3 : 2).join('/')))];
for (const d of topDirs) run(['s3', 'sync', `s3://${BUCKET}/scrapes/${version}/${d}`, d]);
for (const e of manifest.entries.filter(e => e.path.split('/').length === 2)) run(['s3', 'cp', `s3://${BUCKET}/scrapes/${version}/${e.path}`, e.path]);

let bad = 0;
for (const e of manifest.entries) {
    const f = path.join(ROOT, e.path);
    if (!fs.existsSync(f) || fs.statSync(f).size !== e.bytes || crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex') !== e.sha256) { bad++; if (bad <= 10) console.error(`mismatch: ${e.path}`); }
}
if (bad) { console.error(`${bad} files differ from the archive`); process.exit(1); }
fs.writeFileSync(path.join(DATA, '.scrape-version'), version + '\n');
console.log(`data/ matches scrape ${version} (${manifest.entries.length} files verified)`);

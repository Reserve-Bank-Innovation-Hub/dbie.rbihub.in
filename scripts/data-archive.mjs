#!/usr/bin/env node
// Archives the raw files of a scrape to S3, the paper trail behind the database: everything the loaders and the
// site processors read from a scrape, under s3://<SCRAPES_BUCKET>/scrapes/<version>/ with a MANIFEST.json of every
// file's size and SHA-256, plus scrapes/latest.json. A version is immutable: an existing one is refused unless
// --force. The version defaults to the scrape date recorded in data/scrape-manifest.json.
//   pnpm data:archive [--version YYYY-MM-DD] [--force] [--dry-run]
// Needs AWS credentials (AWS_PROFILE in .env.common) and the AWS CLI; uploads run through `aws s3 sync`.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, DATA, loadEnvFile, aws } from './db/lib.mjs';

loadEnvFile();
const argv = process.argv.slice(2);
const opt = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const force = argv.includes('--force'), dryRun = argv.includes('--dry-run');
const BUCKET = process.env.SCRAPES_BUCKET || 'dbie-common-scrapes';

// What a scrape consists of. Directories are synced whole; files are copied one by one.
const DIRS = ['data/sdmx', 'data/reports', 'data/sdmx-raw/json', 'data/sdmx-codelists'];
const FILES = ['data/scrape-manifest.json', 'data/reports-manifest.json', 'data/reports-catalogue.json', 'data/reports-cuid-cache.json', 'data/catalogue.json', 'data/catalogue-summary.md', 'data/sdmx-tree.json', 'data/sdmx-tree-raw.json', 'data/coverage-report.md', 'data/coverage-report.csv'];

const manifest = JSON.parse(fs.readFileSync(path.join(DATA, 'scrape-manifest.json'), 'utf8'));
const scrapedAt = Object.values(manifest.results || {}).map(r => r.at).filter(Boolean).sort().at(-1);
const version = opt('--version') || (scrapedAt || new Date().toISOString()).slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(version)) throw new Error(`version must be a date (YYYY-MM-DD), got ${version}`);
const prefix = `scrapes/${version}`;

function walk(dir, out = []) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); e.isDirectory() ? walk(p, out) : out.push(p); } return out; }
const files = [...DIRS.flatMap(d => fs.existsSync(path.join(ROOT, d)) ? walk(path.join(ROOT, d)) : []), ...FILES.map(f => path.join(ROOT, f)).filter(f => fs.existsSync(f))];
let bytes = 0;
const entries = files.map(f => { const st = fs.statSync(f); bytes += st.size; return { path: path.relative(ROOT, f), bytes: st.size, sha256: crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex') }; });
let commit = null;
try { commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch {}
const record = { version, scraped_at: scrapedAt || null, archived_at: new Date().toISOString(), git_commit: commit, files: entries.length, bytes, entries };
console.log(`scrape ${version}: ${entries.length} files, ${(bytes / 1048576).toFixed(0)} MB → s3://${BUCKET}/${prefix}/`);
if (dryRun) process.exit(0);

// Immutable versions.
try { aws('s3api', 'head-object', '--bucket', BUCKET, '--key', `${prefix}/MANIFEST.json`); if (!force) { console.error(`s3://${BUCKET}/${prefix}/ already exists; use --force to overwrite`); process.exit(1); } } catch {}

const cli = ['--region', process.env.AWS_REGION || 'ap-south-1', ...(process.env.AWS_PROFILE ? ['--profile', process.env.AWS_PROFILE] : [])];
const run = args => execFileSync('aws', [...args, ...cli], { stdio: ['ignore', 'inherit', 'inherit'], cwd: ROOT });
for (const d of DIRS) if (fs.existsSync(path.join(ROOT, d))) run(['s3', 'sync', d, `s3://${BUCKET}/${prefix}/${d}`, '--only-show-errors']);
for (const f of FILES) if (fs.existsSync(path.join(ROOT, f))) run(['s3', 'cp', f, `s3://${BUCKET}/${prefix}/${f}`, '--only-show-errors']);
const tmp = path.join(ROOT, 'data', '.archive-manifest.json');
fs.writeFileSync(tmp, JSON.stringify(record, null, 1));
run(['s3', 'cp', tmp, `s3://${BUCKET}/${prefix}/MANIFEST.json`, '--only-show-errors', '--content-type', 'application/json']);
fs.writeFileSync(tmp, JSON.stringify({ version, scraped_at: record.scraped_at, archived_at: record.archived_at, files: record.files, bytes }, null, 1));
run(['s3', 'cp', tmp, `s3://${BUCKET}/scrapes/latest.json`, '--only-show-errors', '--content-type', 'application/json', '--cache-control', 'no-cache']);
fs.unlinkSync(tmp);
fs.writeFileSync(path.join(DATA, '.scrape-version'), version + '\n');
console.log(`archived ${version}; scrapes/latest.json → ${version}`);

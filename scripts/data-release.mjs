#!/usr/bin/env node
// Builds the site's data bundle and publishes it as a release: runs the processors (pnpm data:build), checks their
// output byte-exact against the committed oracles (pnpm data:verify), then uploads data/processors/out/*.json to
// s3://<SITE_DATA_BUCKET>/releases/<version>/ with a MANIFEST.json, and points releases/latest.json at it. The
// Amplify build downloads the current release with `pnpm data:pull`. With AMPLIFY_WEBHOOK_URL set, the site is
// rebuilt at once. Version = <date>-<git commit>.
//   pnpm data:release [--no-build] [--dry-run]
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, DATA, loadEnvFile } from './db/lib.mjs';

loadEnvFile();
const argv = process.argv.slice(2);
const noBuild = argv.includes('--no-build'), dryRun = argv.includes('--dry-run');
const BUCKET = process.env.SITE_DATA_BUCKET || 'dbie-common-site-data';
const OUT = path.join(DATA, 'processors', 'out');

const pnpm = script => execFileSync('pnpm', [script], { cwd: ROOT, stdio: 'inherit' });
if (!noBuild) { pnpm('data:build'); pnpm('data:verify'); }

let commit = 'nogit';
try { commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch {}
const version = `${new Date().toISOString().slice(0, 10)}-${commit}`;
const scrapeVersion = fs.existsSync(path.join(DATA, '.scrape-version')) ? fs.readFileSync(path.join(DATA, '.scrape-version'), 'utf8').trim() : null;
const files = fs.readdirSync(OUT).filter(f => f.endsWith('.json')).sort();
let bytes = 0;
const entries = files.map(f => { const b = fs.readFileSync(path.join(OUT, f)); bytes += b.length; return { path: f, bytes: b.length, sha256: crypto.createHash('sha256').update(b).digest('hex') }; });
const record = { version, built_at: new Date().toISOString(), git_commit: commit, scrape_version: scrapeVersion, files: entries.length, bytes, entries };
console.log(`release ${version}: ${entries.length} files, ${(bytes / 1048576).toFixed(0)} MB, from scrape ${scrapeVersion ?? '?'} → s3://${BUCKET}/releases/${version}/`);
if (dryRun) process.exit(0);

const cli = ['--region', process.env.AWS_REGION || 'ap-south-1', ...(process.env.AWS_PROFILE ? ['--profile', process.env.AWS_PROFILE] : [])];
const run = args => execFileSync('aws', [...args, ...cli], { stdio: ['ignore', 'inherit', 'inherit'], cwd: ROOT });
run(['s3', 'sync', OUT, `s3://${BUCKET}/releases/${version}`, '--exclude', '*', '--include', '*.json', '--only-show-errors', '--content-type', 'application/json']);
const tmp = path.join(OUT, '.release-manifest.json');
fs.writeFileSync(tmp, JSON.stringify(record, null, 1));
run(['s3', 'cp', tmp, `s3://${BUCKET}/releases/${version}/MANIFEST.json`, '--only-show-errors', '--content-type', 'application/json']);
fs.writeFileSync(tmp, JSON.stringify({ version, built_at: record.built_at, git_commit: commit, scrape_version: scrapeVersion, files: entries.length, bytes }, null, 1));
run(['s3', 'cp', tmp, `s3://${BUCKET}/releases/latest.json`, '--only-show-errors', '--content-type', 'application/json', '--cache-control', 'no-cache']);
fs.unlinkSync(tmp);
console.log(`published; releases/latest.json → ${version}`);

if (process.env.AMPLIFY_WEBHOOK_URL) {
    const r = await fetch(process.env.AMPLIFY_WEBHOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    console.log(`site rebuild requested: HTTP ${r.status}`);
} else {
    console.log('no AMPLIFY_WEBHOOK_URL set: trigger a site rebuild in Amplify to pick up the release');
}

#!/usr/bin/env node
// Downloads the current site data release (or a given version) from the public releases bucket into public/data/,
// checking every file against the release's MANIFEST.json. Plain HTTPS, no AWS CLI and no credentials: this is what
// the Amplify build runs before `next build`, and what a developer runs to work on the site without the processors.
//   pnpm data:pull [--version <version> | latest] [--dir public/data]
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadEnvFile } from './db/lib.mjs';

loadEnvFile();
const argv = process.argv.slice(2);
const opt = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const BUCKET = process.env.SITE_DATA_BUCKET || 'dbie-common-site-data';
const REGION = process.env.AWS_REGION || 'ap-south-1';
const base = `https://${BUCKET}.s3.${REGION}.amazonaws.com/releases`;
const dir = path.resolve(ROOT, opt('--dir') || 'public/data');

async function get(key) { const r = await fetch(`${base}/${key}`, { cache: 'no-store' }); if (!r.ok) throw new Error(`${key}: HTTP ${r.status}`); return r; }
let version = opt('--version') || 'latest';
if (version === 'latest') version = (await (await get('latest.json')).json()).version;
const manifest = await (await get(`${version}/MANIFEST.json`)).json();
console.log(`release ${version}: ${manifest.files} files, ${(manifest.bytes / 1048576).toFixed(0)} MB, built ${manifest.built_at?.slice(0, 16)} from scrape ${manifest.scrape_version ?? '?'}`);

fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
const queue = [...manifest.entries];
let done = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
    for (let e; (e = queue.shift());) {
        const buf = Buffer.from(await (await get(`${version}/${e.path}`)).arrayBuffer());
        if (buf.length !== e.bytes || crypto.createHash('sha256').update(buf).digest('hex') !== e.sha256) throw new Error(`${e.path}: download does not match the manifest`);
        fs.writeFileSync(path.join(dir, e.path), buf);
        done++;
    }
}));
fs.writeFileSync(path.join(dir, '.release-version'), version + '\n');
console.log(`${done} files in ${path.relative(ROOT, dir)}/ verified against release ${version}`);

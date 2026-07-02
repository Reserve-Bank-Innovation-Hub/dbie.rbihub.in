// Verify a processor's output against the captured live-API oracle.
// Usage: node verify.mjs <name>   (e.g. node verify.mjs forex-reserves)
// Semantic deep-equal: key-order-insensitive, small numeric tolerance.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];
if (!name) { console.error('usage: node verify.mjs <name>'); process.exit(2); }

const got = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', name + '.json'), 'utf8'));
const want = JSON.parse(fs.readFileSync(path.join(__dirname, 'oracles', name + '.json'), 'utf8'));

const diffs = [];
const EPS = 1e-6;
function cmp(a, b, p) {
  if (diffs.length > 40) return;
  if (typeof a === 'number' && typeof b === 'number') {
    if (Math.abs(a - b) > EPS + Math.abs(b) * 1e-9) diffs.push(`${p}: ${a} != ${b}`);
    return;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) { diffs.push(`${p}: array/non-array mismatch`); return; }
    if (a.length !== b.length) diffs.push(`${p}: length ${a.length} != ${b.length}`);
    for (let i = 0; i < Math.min(a.length, b.length); i++) cmp(a[i], b[i], `${p}[${i}]`);
    return;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(k in a)) { diffs.push(`${p}.${k}: missing in output`); continue; }
      if (!(k in b)) { diffs.push(`${p}.${k}: extra in output`); continue; }
      cmp(a[k], b[k], `${p}.${k}`);
    }
    return;
  }
  if (a !== b) diffs.push(`${p}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
}
cmp(got, want, name);

if (diffs.length === 0) { console.log(`PASS ${name}: output matches oracle exactly`); process.exit(0); }
console.log(`FAIL ${name}: ${diffs.length}+ diffs (first 40):`);
diffs.slice(0, 40).forEach(d => console.log('  ' + d));
process.exit(1);

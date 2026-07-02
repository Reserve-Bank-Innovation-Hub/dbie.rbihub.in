// Verify every output in out/ against its captured oracle.
// Usage: node verify-all.mjs
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const names = [
  'exchange-rates',
  'forex-reserves', 'forex-reserves-recent',
  'foreign-investment-inflows', 'foreign-investment-inflows-recent',
  'credit-classification',
  'external-debt', 'external-debt-recent',
];

let failed = 0;
for (const n of names) {
  try {
    const out = execFileSync('node', [path.join(__dirname, 'verify.mjs'), n], { encoding: 'utf8' });
    process.stdout.write(out.split('\n')[0] + '\n');
  } catch (e) {
    failed++;
    process.stdout.write((e.stdout || String(e)).toString().trim() + '\n');
  }
}
console.log(failed === 0 ? 'ALL PASS' : `${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);

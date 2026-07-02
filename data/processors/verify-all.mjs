// Verify every output in out/ against its captured oracle.
// Usage: node verify-all.mjs
//
// Per-dataset mode:
//   exact — source frozen, output must match the oracle byte-for-byte (semantic).
//   fresh — refreshed from a live SDMX source; the oracle is a SHAPE + HISTORY
//           reference only (see verify.mjs fresh-mode checks). A fresh-mode check
//           still passes trivially if the output happens to be byte-equal to the
//           oracle, so datasets not yet re-sourced verify cleanly under `fresh`.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const datasets = [
  { name: 'exchange-rates', mode: 'fresh' },
  { name: 'forex-reserves', mode: 'fresh' },
  { name: 'forex-reserves-recent', mode: 'fresh' },
  { name: 'foreign-investment-inflows', mode: 'fresh' },
  { name: 'foreign-investment-inflows-recent', mode: 'fresh' },
  { name: 'credit-classification', mode: 'exact' },
  { name: 'external-debt', mode: 'exact' },
  { name: 'external-debt-recent', mode: 'exact' },
];

let failed = 0;
for (const { name, mode } of datasets) {
  try {
    const out = execFileSync('node', [path.join(__dirname, 'verify.mjs'), name, mode], { encoding: 'utf8' });
    process.stdout.write(out.split('\n')[0] + '\n');
  } catch (e) {
    failed++;
    process.stdout.write((e.stdout || String(e)).toString().trim() + '\n');
  }
}
console.log(failed === 0 ? 'ALL PASS' : `${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);

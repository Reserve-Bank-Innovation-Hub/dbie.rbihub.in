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
  { name: 'consumer-price-index', mode: 'exact' },
  { name: 'other-consumer-price-indices', mode: 'exact' },
  { name: 'gold-and-silver-prices', mode: 'exact' },
  { name: 'wholesale-price-index', mode: 'exact' },
  { name: 'index-of-industrial-production', mode: 'exact' },
  { name: 'daily-call-money-rates', mode: 'exact' },
  { name: 'certificates-of-deposit', mode: 'exact' },
  { name: 'commercial-paper', mode: 'exact' },
  { name: 'financial-markets-turnover', mode: 'exact' },
  { name: 'new-capital-issues', mode: 'exact' },
  { name: 'money-stock-measures', mode: 'exact' },
  { name: 'sources-of-money-stock', mode: 'exact' },
  { name: 'monetary-survey', mode: 'exact' },
  { name: 'liquidity-aggregates', mode: 'exact' },
  { name: 'rbi-survey', mode: 'exact' },
  { name: 'reserve-money', mode: 'exact' },
  { name: 'commercial-bank-survey', mode: 'exact' },
  { name: 'scb-investments', mode: 'exact' },
  { name: 'business-of-scheduled-banks', mode: 'exact' },
  { name: 'bank-credit-by-sector', mode: 'exact' },
  { name: 'bank-credit-by-industry', mode: 'exact' },
  { name: 'state-cooperative-banks', mode: 'exact' },
  { name: 'foreign-trade', mode: 'exact' },
  { name: 'forex-reserves-weekly', mode: 'exact' },
  { name: 'nri-deposits', mode: 'exact' },
  { name: 'foreign-investment-inflows-bulletin', mode: 'exact' },
  { name: 'outward-remittances-lrs', mode: 'exact' },
  { name: 'reer-and-neer', mode: 'exact' },
  { name: 'external-commercial-borrowings', mode: 'exact' },
  { name: 'balance-of-payments-usd', mode: 'exact' },
  { name: 'balance-of-payments-inr', mode: 'exact' },
  { name: 'bop-bpm6-usd', mode: 'exact' },
  { name: 'bop-bpm6-inr', mode: 'exact' },
  { name: 'international-investment-position', mode: 'exact' },
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

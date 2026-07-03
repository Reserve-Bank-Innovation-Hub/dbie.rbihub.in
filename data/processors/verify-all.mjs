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
  { name: 'agricultural-production-foodgrains', mode: 'exact' },
  { name: 'agricultural-production-major-commercial-crops', mode: 'exact' },
  { name: 'annual-production-indices-of-select-items', mode: 'exact' },
  { name: 'annual-survey-of-industries-principal-characteristics', mode: 'exact' },
  { name: 'area-under-cultivation-foodgrains', mode: 'exact' },
  { name: 'area-under-cultivation-major-commercial-crops', mode: 'exact' },
  { name: 'average-price-of-gold-and-silver-in-domestic-and-foreign-markets', mode: 'exact' },
  { name: 'balance-of-payments-inr', mode: 'exact' },
  { name: 'balance-of-payments-usd', mode: 'exact' },
  { name: 'bank-credit-by-industry', mode: 'exact' },
  { name: 'bank-credit-by-sector', mode: 'exact' },
  { name: 'bop-bpm6-inr', mode: 'exact' },
  { name: 'bop-bpm6-usd', mode: 'exact' },
  { name: 'business-of-scheduled-banks', mode: 'exact' },
  { name: 'certificates-of-deposit', mode: 'exact' },
  { name: 'changes-in-financial-assets-liabilities-of-the-household-sector', mode: 'exact' },
  { name: 'combined-receipts-disbursements', mode: 'exact' },
  { name: 'commercial-bank-survey', mode: 'exact' },
  { name: 'commercial-paper', mode: 'exact' },
  { name: 'components-of-gross-domestic-product', mode: 'exact' },
  { name: 'components-of-gross-value-added-at-basic-prices', mode: 'exact' },
  { name: 'consumer-price-index', mode: 'exact' },
  { name: 'consumer-price-index-annual-average', mode: 'exact' },
  { name: 'credit-classification', mode: 'exact' },
  { name: 'daily-call-money-rates', mode: 'exact' },
  { name: 'dated-securities-ownership', mode: 'exact' },
  { name: 'employment-in-public-and-organised-private-sectors', mode: 'exact' },
  { name: 'exchange-rates', mode: 'fresh' },
  { name: 'external-commercial-borrowings', mode: 'exact' },
  { name: 'external-debt', mode: 'exact' },
  { name: 'external-debt-recent', mode: 'exact' },
  { name: 'financial-markets-turnover', mode: 'exact' },
  { name: 'foreign-investment-inflows', mode: 'fresh' },
  { name: 'foreign-investment-inflows-bulletin', mode: 'exact' },
  { name: 'foreign-investment-inflows-recent', mode: 'fresh' },
  { name: 'foreign-trade', mode: 'exact' },
  { name: 'forex-reserves', mode: 'fresh' },
  { name: 'forex-reserves-recent', mode: 'fresh' },
  { name: 'forex-reserves-weekly', mode: 'exact' },
  { name: 'gold-and-silver-prices', mode: 'exact' },
  { name: 'household-financial-flows', mode: 'exact' },
  { name: 'household-financial-stocks', mode: 'exact' },
  { name: 'implementation-of-central-sector-projects-status-end-march', mode: 'exact' },
  { name: 'index-numbers-of-agricultural-production-major-crops', mode: 'exact' },
  { name: 'index-numbers-of-area-production-and-yield-of-foodgrains-non-foodgrains', mode: 'exact' },
  { name: 'index-numbers-of-industrial-production', mode: 'exact' },
  { name: 'index-numbers-of-industrial-production-use-based-classification', mode: 'exact' },
  { name: 'index-numbers-of-infrastructure-industries', mode: 'exact' },
  { name: 'index-numbers-of-twenty-three-major-industry-groups-of-manufacturing', mode: 'exact' },
  { name: 'index-of-industrial-production', mode: 'exact' },
  { name: 'institutional-sector-wise-gross-capital-formation-at-current-prices', mode: 'exact' },
  { name: 'international-investment-position', mode: 'exact' },
  { name: 'liquidity-aggregates', mode: 'exact' },
  { name: 'liquidity-operations', mode: 'exact' },
  { name: 'macro-economic-aggregates-at-constant-prices', mode: 'exact' },
  { name: 'macro-economic-aggregates-at-current-prices', mode: 'exact' },
  { name: 'minimum-support-price-for-foodgrains-according-to-crop-year-fair-average', mode: 'exact' },
  { name: 'minimum-support-price-for-non-foodgrains-according-to-crop-year-fair', mode: 'exact' },
  { name: 'monetary-survey', mode: 'exact' },
  { name: 'money-stock-measures', mode: 'exact' },
  { name: 'net-state-domestic-product-state-wise-at-constant-prices', mode: 'exact' },
  { name: 'net-state-domestic-product-state-wise-at-current-prices', mode: 'exact' },
  { name: 'net-state-value-added-by-economic-activity-at-constant-prices', mode: 'exact' },
  { name: 'net-state-value-added-by-economic-activity-at-current-prices', mode: 'exact' },
  { name: 'new-capital-issues', mode: 'exact' },
  { name: 'nri-deposits', mode: 'exact' },
  { name: 'other-consumer-price-indices', mode: 'exact' },
  { name: 'outward-remittances-lrs', mode: 'exact' },
  { name: 'pattern-of-land-use-and-select-inputs-for-agricultural-production', mode: 'exact' },
  { name: 'payment-system-indicators', mode: 'exact' },
  { name: 'per-capita-net-state-domestic-product-state-wise-at-constant-prices', mode: 'exact' },
  { name: 'per-capita-net-state-domestic-product-state-wise-at-current-prices', mode: 'exact' },
  { name: 'production-and-imports-of-crude-oil-and-petroleum-products', mode: 'exact' },
  { name: 'public-distribution-system-procurement-off-take-and-stocks', mode: 'exact' },
  { name: 'rbi-liabilities-and-assets', mode: 'exact' },
  { name: 'rbi-standing-facilities', mode: 'exact' },
  { name: 'rbi-survey', mode: 'exact' },
  { name: 'reer-and-neer', mode: 'exact' },
  { name: 'reserve-money', mode: 'exact' },
  { name: 'scb-investments', mode: 'exact' },
  { name: 'sector-wise-cost-overrun-of-delayed-central-sector-projects-end-march', mode: 'exact' },
  { name: 'sector-wise-domestic-savings-at-current-prices', mode: 'exact' },
  { name: 'select-economic-indicators', mode: 'exact' },
  { name: 'small-savings', mode: 'exact' },
  { name: 'sources-of-money-stock', mode: 'exact' },
  { name: 'state-cooperative-banks', mode: 'exact' },
  { name: 'state-financial-accommodation', mode: 'exact' },
  { name: 'state-government-investments', mode: 'exact' },
  { name: 'state-market-borrowings', mode: 'exact' },
  { name: 'treasury-bill-auctions', mode: 'exact' },
  { name: 'treasury-bills-ownership', mode: 'exact' },
  { name: 'union-government-accounts', mode: 'exact' },
  { name: 'usd-sale-purchase', mode: 'exact' },
  { name: 'wholesale-price-index', mode: 'exact' },
  { name: 'wholesale-price-index-annual-average', mode: 'exact' },
  { name: 'yield-per-hectare-foodgrains', mode: 'exact' },
  { name: 'yield-per-hectare-major-commercial-crops', mode: 'exact' },
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

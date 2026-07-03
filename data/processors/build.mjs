// Runs all dataset processors -> data/processors/out/*.json
// out/ is the payload uploaded to s3://dbie-data/site/ (see README.md).
const processors = [
  'exchange-rates',
  'forex-reserves',
  'foreign-investment-inflows',
  'credit-classification',
  'external-debt',
  'consumer-price-index',
  'other-consumer-price-indices',
  'gold-and-silver-prices',
  'wholesale-price-index',
  'index-of-industrial-production',
  'daily-call-money-rates',
  'certificates-of-deposit',
  'commercial-paper',
  'financial-markets-turnover',
  'new-capital-issues',
  'money-stock-measures',
  'sources-of-money-stock',
  'monetary-survey',
  'liquidity-aggregates',
  'rbi-survey',
  'reserve-money',
  'commercial-bank-survey',
  'scb-investments',
  'business-of-scheduled-banks',
  'bank-credit-by-sector',
  'bank-credit-by-industry',
  'state-cooperative-banks',
  'foreign-trade',
  'forex-reserves-weekly',
  'nri-deposits',
  'foreign-investment-inflows-bulletin',
  'outward-remittances-lrs',
  'reer-and-neer',
  'external-commercial-borrowings',
  'balance-of-payments-usd',
  'balance-of-payments-inr',
  'bop-bpm6-usd',
  'bop-bpm6-inr',
  'international-investment-position',
];

for (const name of processors) {
  process.stdout.write(`  running ${name} ... `);
  await import('./' + name + '.mjs');
  console.log('ok');
}
console.log('done -> out/ (42 JSON files)');

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
];

for (const name of processors) {
  process.stdout.write(`  running ${name} ... `);
  await import('./' + name + '.mjs');
  console.log('ok');
}
console.log('done -> out/ (18 JSON files)');

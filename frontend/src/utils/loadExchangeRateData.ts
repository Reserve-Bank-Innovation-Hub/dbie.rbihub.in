import { readFileSync } from 'fs';
import { join } from 'path';
import { parseExchangeRateData, ParsedExchangeRates } from './exchangeRateParser';

/**
 * Server-side function to load and parse exchange rate data
 * Call this in Server Components or getStaticProps
 */
export function loadExchangeRateData(): ParsedExchangeRates {
    const filePath = join(process.cwd(), '../data/sources/Daily Exchange Rate of the Indian Rupee.txt');
    const rawData = readFileSync(filePath, 'utf-8');
    return parseExchangeRateData(rawData);
}

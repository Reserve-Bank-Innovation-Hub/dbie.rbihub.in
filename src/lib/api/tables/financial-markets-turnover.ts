// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Average daily turnover in select financial markets (RBI Bulletin Table 30).
export interface FinancialMarket {
    key   : string;   // e.g. "call_money"
    label : string;   // e.g. "1. Call Money"
}

export interface FinancialMarketsTurnoverRow {
    period : string;                      // "Jan 30, 2026" (newest-first)
    values : Record<string, number | null>;
}

export interface FinancialMarketsTurnover {
    reportTitle : string;
    unit        : string;
    markets     : FinancialMarket[];
    data        : FinancialMarketsTurnoverRow[];
}

/**
 * Fetch average daily turnover data from the build-synced JSON.
 */
export async function getFinancialMarketsTurnover() : Promise<FinancialMarketsTurnover> {
    return loadData<FinancialMarketsTurnover>("financial-markets-turnover");
}

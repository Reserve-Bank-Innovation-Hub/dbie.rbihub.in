// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Daily weighted average call/notice money rates (RBI Bulletin Table 27).
export interface DailyCallMoneyRateRow {
    date    : string;         // "2026-04-06" ISO date, newest-first
    fy      : string;         // "2026-27" financial year
    minRate : number | null;  // minimum rate (% per annum)
    maxRate : number | null;  // maximum rate (% per annum)
}

export interface DailyCallMoneyRates {
    reportTitle : string;
    data        : DailyCallMoneyRateRow[];
}

/**
 * Fetch daily call money rates from the build-synced JSON.
 */
export async function getDailyCallMoneyRates() : Promise<DailyCallMoneyRates> {
    return loadData<DailyCallMoneyRates>("daily-call-money-rates");
}

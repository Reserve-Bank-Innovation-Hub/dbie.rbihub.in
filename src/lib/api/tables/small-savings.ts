// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Small savings: receipts and outstanding balances across all schemes (RBI Bulletin Table 46).
// 48 dynamic data columns (scheme × measure), newest-first in both sheets.

export interface SmallSavingsColumn {
    group   : string;  // e.g. "1 Small Savings", "1.1.7.1 1 year Time Deposits"
    measure : string;  // "Receipts" or "Outstanding"
}

export interface SmallSavingsMonthlyRow {
    fiscal_year : string;          // "2025-26"
    month       : string;          // "August"
    values      : (number | null)[];  // 48 values aligned to columns[]
}

export interface SmallSavingsAnnualRow {
    fiscal_year : string;          // "2024-25"
    values      : (number | null)[];  // 48 values aligned to columns[]
}

export interface SmallSavingsSheet<T> {
    columns : SmallSavingsColumn[];
    data    : T[];
}

export interface SmallSavings {
    reportTitle : string;
    unit        : string;
    monthly     : SmallSavingsSheet<SmallSavingsMonthlyRow>;
    annual      : SmallSavingsSheet<SmallSavingsAnnualRow>;
}

/**
 * Fetch small savings data from the build-synced JSON.
 */
export function getSmallSavings() : SmallSavings {
    return loadData<SmallSavings>("small-savings");
}

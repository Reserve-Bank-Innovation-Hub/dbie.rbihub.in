// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Monthly liquidity aggregates — L1, L2, NM3 and sub-components (RBI Bulletin Table 09).
export interface LiquidityAggregateColumn {
    code  : string;  // "1", "1 (Excl.)", "2", "3", "3 (Excl.)", "4", "4.1", "4.2", "4.3", "5", "5 (Excl.)", "6"
    label : string;  // human-readable series name
}

export interface LiquidityAggregateRow {
    period : string;              // "2026:01 (JAN)" (newest-first)
    values : (number | null)[];   // 12 values aligned to columns[]
}

export interface LiquidityAggregates {
    reportTitle : string;
    unit        : string;
    columns     : LiquidityAggregateColumn[];
    data        : LiquidityAggregateRow[];
}

/**
 * Fetch monthly liquidity aggregates from the build-synced JSON.
 */
export async function getLiquidityAggregates() : Promise<LiquidityAggregates> {
    return loadData<LiquidityAggregates>("liquidity-aggregates");
}

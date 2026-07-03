// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Fortnightly sources of money stock (M3) — RBI Bulletin Table 7.
// Columns span the four source categories: net bank credit to government,
// bank credit to commercial sector, net foreign exchange assets, government
// currency liabilities, and net non-monetary liabilities of the banking sector.
// The final columns carry the derived M3 aggregate.

export interface SourcesOfMoneyStockColumn {
    key             : string;
    label           : string;
    excludingMerger : boolean;
}

export interface SourcesOfMoneyStockDataRow {
    date   : string;             // "YYYY-MM-DD" (newest-first)
    values : Record<string, number | null>;
}

export interface SourcesOfMoneyStock {
    reportTitle : string;
    units       : string;
    columns     : SourcesOfMoneyStockColumn[];
    data        : SourcesOfMoneyStockDataRow[];
}

/**
 * Fetch fortnightly sources of money stock (M3) from the build-synced JSON.
 */
export async function getSourcesOfMoneyStock() : Promise<SourcesOfMoneyStock> {
    return loadData<SourcesOfMoneyStock>("sources-of-money-stock");
}

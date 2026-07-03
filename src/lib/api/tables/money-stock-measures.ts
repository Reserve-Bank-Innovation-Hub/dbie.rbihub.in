// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Fortnightly money stock measures — RBI Bulletin Table 6.
// Columns span all money stock components (currency, deposits, M1-M4) plus their
// "Excluding Merger" counterparts where published.

export interface MoneyStockColumn {
    key             : string;
    label           : string;
    excludingMerger : boolean;
}

export interface MoneyStockDataRow {
    date   : string;             // "YYYY-MM-DD" (newest-first)
    values : Record<string, number | null>;
}

export interface MoneyStockMeasures {
    reportTitle : string;
    units       : string;
    columns     : MoneyStockColumn[];
    data        : MoneyStockDataRow[];
}

/**
 * Fetch fortnightly money stock measures from the build-synced JSON.
 */
export async function getMoneyStockMeasures() : Promise<MoneyStockMeasures> {
    return loadData<MoneyStockMeasures>("money-stock-measures");
}

// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Monthly indices of NEER and REER of the Indian rupee (RBI Bulletin Table 37).
export interface ReerAndNeerRow {
    month       : string;         // "Jan 2026" (newest-first)
    period      : string;         // "2026-01" (ISO year-month, for sorting/uniqueness)
    trade_neer  : number | null;  // Trade-weighted NEER (base 2015-16 = 100)
    trade_reer  : number | null;  // Trade-weighted REER (base 2015-16 = 100)
    export_neer : number | null;  // Export-weighted NEER (base 2015-16 = 100)
    export_reer : number | null;  // Export-weighted REER (base 2015-16 = 100)
}

export interface ReerAndNeer {
    reportTitle : string;
    base        : string;        // "2015-16=100"
    basketSize  : number;        // 40
    data        : ReerAndNeerRow[];
}

/**
 * Fetch monthly NEER and REER indices from the build-synced JSON.
 */
export async function getReerAndNeer() : Promise<ReerAndNeer> {
    return loadData<ReerAndNeer>("reer-and-neer");
}

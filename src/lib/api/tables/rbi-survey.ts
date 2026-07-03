// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Reserve Bank of India survey — RBI Bulletin Table 10.
// Each column is one component of the RBI's balance sheet expressed as a
// monetary aggregate (C.I…C.IV on the currency/liabilities side, S.I…S.IV
// on the assets/sources side). Reserve Money (C.IV) is the headline aggregate.
export interface RbiSurveyColumn {
    code  : string;   // e.g. "C.I", "C.IV", "S.I.1.1.3", "S.III.2"
    label : string;   // full description from the source sheet
}

export interface RbiSurvey {
    reportTitle : string;
    unit        : string;                    // "Rupees Crores"
    columns     : RbiSurveyColumn[];
    periods     : string[];                  // "YYYY-MM-DD", newest-first
    values      : (number | null)[][];       // periods × columns matrix
}

/**
 * Fetch the Reserve Bank of India survey (Table 10) data.
 *
 * Returns a matrix of 25 RBI balance-sheet components across all available
 * fortnightly periods back to 1952 (newest-first), sourced from the RBI
 * Monthly Bulletin.
 */
export async function getRbiSurvey() : Promise<RbiSurvey> {
    return loadData<RbiSurvey>("rbi-survey");
}

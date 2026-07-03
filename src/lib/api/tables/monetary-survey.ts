// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Monetary survey — RBI Bulletin Table 8.
// Each column represents one monetary aggregate or component (NM1, NM2, NM3,
// C.I…C.IV, S.I…S.IV). Columns suffixed "_excl_merger" are "Excluding Merger"
// variants present only for data points around bank merger events.
export interface MonetarySurveyColumn {
    code  : string;   // e.g. "NM1", "C.I", "S.III.2", "NM2_excl_merger"
    label : string;   // full description from the source sheet
}

export interface MonetarySurvey {
    reportTitle : string;
    unit        : string;                    // "Rupees Crores"
    columns     : MonetarySurveyColumn[];
    periods     : string[];                  // "YYYY-MM-DD", newest-first
    values      : (number | null)[][];       // periods × columns matrix
}

/**
 * Fetch the monetary survey (Table 8) data.
 *
 * Returns a matrix of 36 monetary aggregates across all available fortnightly
 * periods (newest-first), sourced from the RBI Monthly Bulletin.
 */
export async function getMonetarySurvey() : Promise<MonetarySurvey> {
    return loadData<MonetarySurvey>("monetary-survey");
}

// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual Survey of Industries — Principal Characteristics
// Source: Handbook of Statistics on Indian Economy (Annual Series → Output and Prices)

export interface ASICharacteristic {
    code  : string; // e.g. "1", "21", "27a", "28"
    label : string; // e.g. "Number of factories", "Net value added"
}

export interface ASIDataRow {
    year   : string;                        // e.g. "2023-24" (newest-first)
    values : Record<string, number | null>; // keyed by characteristic code
}

export interface AnnualSurveyOfIndustriesPrincipalCharacteristics {
    reportTitle     : string;
    units           : string;
    characteristics : ASICharacteristic[];
    data            : ASIDataRow[];
}

/**
 * Load annual survey of industries — principal characteristics data from the
 * build-synced JSON. loadData is synchronous (reads from public/data at SSR time).
 */
export function getAnnualSurveyOfIndustriesPrincipalCharacteristics() : AnnualSurveyOfIndustriesPrincipalCharacteristics {
    return loadData<AnnualSurveyOfIndustriesPrincipalCharacteristics>(
        "annual-survey-of-industries-principal-characteristics",
    );
}

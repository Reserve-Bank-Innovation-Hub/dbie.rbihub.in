// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual pattern of land use and select inputs for agricultural production (RBI Handbook).
export interface LandUseRow {
    year                   : string;        // "YYYY-YY" (newest-first)
    net_sown_area          : number | null; // lakh hectares
    gross_sown_area        : number | null; // lakh hectares
    net_irrigated_area     : number | null; // lakh hectares
    gross_irrigated_area   : number | null; // lakh hectares
    area_hyv               : number | null; // lakh hectares (area under high yielding varieties)
    fertiliser_consumption : number | null; // lakh tonnes (N+P+K)
    pesticide_consumption  : number | null; // '000 tonnes (technical grade material)
}

export interface LandUseData {
    reportTitle : string;
    note        : string;
    data        : LandUseRow[];
}

/**
 * Fetch annual land use and agricultural input data from the build-synced JSON.
 */
export async function getLandUseData() : Promise<LandUseData> {
    return loadData<LandUseData>("pattern-of-land-use-and-select-inputs-for-agricultural-production");
}

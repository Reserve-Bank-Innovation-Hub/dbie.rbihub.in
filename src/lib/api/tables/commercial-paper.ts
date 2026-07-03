// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Fortnightly commercial paper data from RBI Bulletin Table 29.
export interface CommercialPaperRow {
    fortnightEnded    : string;        // "31-Mar-26" (newest-first)
    amountOutstanding : number | null; // Rupees Crores
    amountReported    : number | null; // Rupees Crores
    minRate           : number | null; // Rate in per cent
}

export interface CommercialPaper {
    reportTitle : string;
    units       : string;
    data        : CommercialPaperRow[];
}

/**
 * Fetch fortnightly commercial paper data from the build-synced JSON.
 */
export async function getCommercialPaper() : Promise<CommercialPaper> {
    return loadData<CommercialPaper>("commercial-paper");
}

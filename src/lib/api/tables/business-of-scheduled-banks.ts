// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Business in India — all scheduled banks and all scheduled commercial banks (RBI Bulletin Table 14).
//
// The source carries two sheets with identical column structure: one for all
// scheduled banks and one for scheduled commercial banks only.  Each sheet
// contains fortnightly snapshot data, newest-first, from mid-1997 onwards.

export interface BsbItem {
    code   : string;       // numeric code from the header ("1", "1.1", "2.1.1", …)
    label  : string;       // human-readable label stripped of the code prefix
    parent : string | null; // parent code ("1.1" → "1"), null at top level
}

export interface BsbPeriod {
    date     : string;              // "Jan 31,2026"
    numBanks : number | null;       // number of reporting banks
    values   : (number | null)[];   // one value per item, aligned to BsbSheet.items
}

export interface BsbSheet {
    sheetName : string;    // original Excel sheet name
    bankGroup : string;    // e.g. "All Scheduled Banks - Business in India"
    items     : BsbItem[];
    periods   : BsbPeriod[]; // newest-first
}

export interface BusinessOfScheduledBanks {
    reportTitle : string;
    unit        : string;   // "Rupees crore"
    sheets      : BsbSheet[];
}

/**
 * Fetch business-in-India data for scheduled banks (Table 14) from the build-synced JSON.
 */
export async function getBusinessOfScheduledBanks() : Promise<BusinessOfScheduledBanks> {
    return loadData<BusinessOfScheduledBanks>("business-of-scheduled-banks");
}

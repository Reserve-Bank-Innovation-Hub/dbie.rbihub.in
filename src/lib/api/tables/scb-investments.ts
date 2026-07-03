// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Scheduled commercial banks' investments — RBI Bulletin Table 13.
// Fortnightly investment data across 10 categories, newest-first from
// 2026-03-15 back to 1997-06-06.
export interface ScbInvestmentsColumn {
    code  : string;  // e.g. "slr", "nonSlrGovt", "sharesPs"
    group : string;  // top-level category label for grouped headers
    label : string;  // full display label
}

export interface ScbInvestmentsRow {
    fortnight      : string;        // "YYYY-MM-DD"
    slr            : number | null; // 1 SLR securities
    nonSlrGovt     : number | null; // 2 Non-SLR government securities
    commercialPaper: number | null; // 3 Commercial paper
    sharesPs       : number | null; // 4.1 Shares — PSUs
    sharesPrivCorp : number | null; // 4.2 Shares — private corporate sector
    sharesOther    : number | null; // 4.3 Shares — others
    bondsPs        : number | null; // 5.1 Bonds/debentures — PSUs
    bondsPrivCorp  : number | null; // 5.2 Bonds/debentures — private corporate sector
    bondsOther     : number | null; // 5.3 Bonds/debentures — others
    mutualFunds    : number | null; // 6.1 Instruments — mutual funds
}

export interface ScbInvestments {
    reportTitle : string;
    units       : string;                  // "Rupees Crores"
    columns     : ScbInvestmentsColumn[];
    data        : ScbInvestmentsRow[];     // newest-first
}

/**
 * Fetch scheduled commercial banks' investments (Table 13) data.
 */
export async function getScbInvestments() : Promise<ScbInvestments> {
    return loadData<ScbInvestments>("scb-investments");
}

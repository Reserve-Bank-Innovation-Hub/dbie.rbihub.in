// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Quarterly international investment position of India — external assets and liabilities (BPM6).
export interface IIPItem {
    code    : string;   // composite key: "A", "A.1", "A.1.1", "B", "B.3.5", "NET"
    label   : string;   // display label in sentence case
    indent  : number;   // visual depth: 0 = section header / NET, 1 = first-level sub-item, 2 = second-level
    section : string;   // "A", "B", or "NET"
}

export interface InternationalInvestmentPosition {
    reportTitle : string;                          // "International investment position: external assets and liabilities"
    unit        : string;                          // "US$ millions"
    standard    : string;                          // "BPM6"
    quarters    : string[];                        // newest-first, e.g. "2025-26:Q3"
    items       : IIPItem[];                       // ordered list of all line items
    data        : Record<string, (number | null)[]>; // keyed by item code; values align with quarters[]
}

/**
 * Fetch the quarterly IIP matrix (Table 44) from the build-synced JSON.
 */
export async function getInternationalInvestmentPosition() : Promise<InternationalInvestmentPosition> {
    return loadData<InternationalInvestmentPosition>("international-investment-position");
}

// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// New capital issues by non-government public limited companies (RBI Bulletin Table 31).
export interface NewCapitalIssueColumn {
    code    : string;  // "1", "1.1", "1.2", "2", "3", "3.1", "3.2"
    label   : string;  // human-readable section label
    measure : "no_of_issues" | "amount";
}

export interface NewCapitalIssueRow {
    year   : string;          // FY label e.g. "2025-26" (carried from first month of each FY)
    month  : string;          // "Apr.", "May.", … "Mar."
    values : (number | null)[];  // 13 values aligned to columns[]
}

export interface NewCapitalIssues {
    reportTitle : string;
    unit        : string;
    columns     : NewCapitalIssueColumn[];
    rows        : NewCapitalIssueRow[];
}

/**
 * Fetch new capital issues matrix from the build-synced JSON.
 */
export async function getNewCapitalIssues() : Promise<NewCapitalIssues> {
    return loadData<NewCapitalIssues>("new-capital-issues");
}

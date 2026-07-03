// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// One quarter in the BoP time series.
export interface BopQuarter {
    label  : string;  // e.g. "Oct-Dec2025", "Jul-Sep 2025"
    status : string;  // P (provisional), PR (partially revised), F (final), ""
}

// One BPM6 line item.
export interface BopItem {
    code   : string;  // BPM6 code, e.g. "1", "1.A", "1.A.b.1", "3.5.4"
    label  : string;  // Item description without the code prefix
    indent : number;  // Visual indent level (0 = top-level, 1–4 = sub-items)
}

// Standard presentation of BoP in India as per BPM6, ₹ crore (Table 43).
//
// values[i][j] = [credit, debit, net] for item i and quarter j.
// Credit, debit and net are null where the source sheet shows "-".
export interface BopBpm6Inr {
    reportTitle : string;
    unit        : string;                    // "(Rupees Crores )"
    quarters    : BopQuarter[];              // 59 quarters, newest-first
    items       : BopItem[];                 // 81 BPM6 line items
    values      : (number | null)[][][];     // [items][quarters][3]
}

/**
 * Fetch the BoP BPM6 INR matrix (Table 43) from the build-synced JSON.
 */
export async function getBopBpm6Inr() : Promise<BopBpm6Inr> {
    return loadData<BopBpm6Inr>("bop-bpm6-inr");
}

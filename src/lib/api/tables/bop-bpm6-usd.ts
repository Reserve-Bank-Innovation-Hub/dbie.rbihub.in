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

// Standard presentation of BoP in India as per BPM6, US$ million (Table 42).
//
// values[i][j] = [credit, debit, net] for item i and quarter j.
// Credit, debit and net are null where the source sheet shows "-".
export interface BopBpm6Usd {
    reportTitle : string;
    unit        : string;                    // "(US$ Millions)"
    quarters    : BopQuarter[];              // 59 quarters, newest-first
    items       : BopItem[];                 // 81 BPM6 line items
    values      : (number | null)[][][];     // [items][quarters][3]
}

/**
 * Fetch the BoP BPM6 USD matrix (Table 42) from the build-synced JSON.
 */
export async function getBopBpm6Usd() : Promise<BopBpm6Usd> {
    return loadData<BopBpm6Usd>("bop-bpm6-usd");
}

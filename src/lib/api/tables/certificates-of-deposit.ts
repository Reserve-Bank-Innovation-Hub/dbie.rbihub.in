// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Certificates of deposit (RBI Bulletin Table 28).
export interface CertificatesOfDepositRow {
    fortnightEnded    : string;       // "Mar 31, 2026" (newest-first)
    amountOutstanding : number | null; // Rupees Crores
    amountIssued      : number | null; // Rupees Crores
    minRate           : number | null; // per cent per annum
}

export interface CertificatesOfDeposit {
    reportTitle : string;
    units       : string;
    data        : CertificatesOfDepositRow[];
}

/**
 * Fetch fortnightly certificates of deposit data from the build-synced JSON.
 */
export async function getCertificatesOfDeposit() : Promise<CertificatesOfDeposit> {
    return loadData<CertificatesOfDeposit>("certificates-of-deposit");
}

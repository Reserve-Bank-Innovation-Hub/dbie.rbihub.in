// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Fortnightly commercial bank survey (RBI Bulletin Table 12).
// 33 series covering liabilities (deposits, call funding) and assets (credit,
// foreign-currency assets, reserves, capital, other items).
export interface CommercialBankSurveyColumn {
    code    : string;           // camelCase series key, e.g. "ci", "si1"
    rawCode : string | null;    // original sheet code, e.g. "C.I", null for ex-merger variants
    label   : string;           // verbose display label
}

export interface CommercialBankSurveyRow {
    fortnight : string;                                 // "YYYY-MM-DD" (newest-first)
    [series: string] : number | null | string;          // all 33 series by camelCase code
}

export interface CommercialBankSurvey {
    reportTitle : string;
    units       : string;                               // "Rupees Crores"
    columns     : CommercialBankSurveyColumn[];
    data        : CommercialBankSurveyRow[];             // newest-first
}

/**
 * Fetch the Commercial Bank Survey (Table 12) dataset.
 */
export async function getCommercialBankSurvey() : Promise<CommercialBankSurvey> {
    return loadData<CommercialBankSurvey>("commercial-bank-survey");
}

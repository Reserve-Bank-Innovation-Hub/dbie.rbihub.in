// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Foreign investment inflows — monthly (RBI Bulletin Table 35).
export interface ForeignInvestmentInflowsBulletinRow {
    month                     : string;          // "2026:01(JAN)" (newest-first)
    netFDI                    : number | null;   // A. Net FDI (A.I - A.II), US $Millions
    directInvestmentToIndia   : number | null;   // A.I. Direct investment to India
    grossInflows              : number | null;   // A.I.a. Gross inflows
    equityInflows             : number | null;   // A.I.a.i. Equity (total)
    equityGovernment          : number | null;   // A.I.a.i.a. Government
    equityRBI                 : number | null;   // A.I.a.i.b. RBI
    acquisitionOfShares       : number | null;   // A.I.a.i.d. Acquisition of shares
    equityUnincorporated      : number | null;   // A.I.a.i.e. Equity capital of unincorporated bodies
    reinvestedEarnings        : number | null;   // A.I.a.ii. Reinvested earnings
    otherCapitalInflows       : number | null;   // A.I.a.iii. Other capital
    repatriationDisinvestment : number | null;   // A.I.b. Repatriation/disinvestment
    repatriationEquity        : number | null;   // A.I.b.i. Equity
    repatriationOther         : number | null;   // A.I.b.ii. Other capital
    fdiByIndia                : number | null;   // A.II. FDI by India
    fdiByIndiaEquity          : number | null;   // A.II.a. Equity capital
    fdiByIndiaReinvested      : number | null;   // A.II.b. Reinvested earnings
    fdiByIndiaOther           : number | null;   // A.II.c. Other capital
    fdiByIndiaRepatriation    : number | null;   // A.II.d. Repatriation/disinvestment
    netPortfolioInvestment    : number | null;   // B. Net portfolio investment
    gdrsAdrs                  : number | null;   // B.I.a. GDRs/ADRs
    fpis                      : number | null;   // B.I.b. FPIs
    offshoreFunds             : number | null;   // B.I.c. Offshore funds and others
    portfolioByIndia          : number | null;   // B.I.d. Portfolio investment by India
}

export interface ForeignInvestmentInflowsBulletin {
    reportTitle : string;
    unit        : string;   // "US $ Millions"
    data        : ForeignInvestmentInflowsBulletinRow[];
}

/**
 * Fetch monthly foreign investment inflows from the build-synced JSON.
 */
export async function getForeignInvestmentInflowsBulletin() : Promise<ForeignInvestmentInflowsBulletin> {
    return loadData<ForeignInvestmentInflowsBulletin>("foreign-investment-inflows-bulletin");
}

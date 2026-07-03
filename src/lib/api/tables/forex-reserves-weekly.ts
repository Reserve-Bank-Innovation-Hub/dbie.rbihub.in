// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Foreign exchange reserves — weekly (RBI Bulletin Table 33).
export interface ForexReservesWeeklyRow {
    weekEnded          : string;          // "03-Apr-2026" (newest-first)
    totalReservesINR   : number | null;   // ₹ Crores
    totalReservesUSD   : number | null;   // US $Millions
    foreignCurrencyINR : number | null;   // ₹ Crores
    foreignCurrencyUSD : number | null;   // US $Millions
    goldINR            : number | null;   // ₹ Crores
    goldUSD            : number | null;   // US $Millions
    goldVolumeMT       : number | null;   // Metric Tonnes (sparse)
    sdrsINR            : number | null;   // ₹ Crores
    sdrsMillion        : number | null;   // SDRs Millions (sparse)
    sdrsUSD            : number | null;   // US $Millions
    reserveTrancheINR  : number | null;   // ₹ Crores
}

export interface ForexReservesWeekly {
    reportTitle : string;
    data        : ForexReservesWeeklyRow[];
}

/**
 * Fetch weekly foreign exchange reserves data from the build-synced JSON.
 */
export async function getForexReservesWeekly() : Promise<ForexReservesWeekly> {
    return loadData<ForexReservesWeekly>("forex-reserves-weekly");
}

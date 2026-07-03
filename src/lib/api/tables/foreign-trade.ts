// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Foreign trade data (RBI Bulletin Table 32).
// Values are in ₹ crore (INR columns) and US$ millions (USD columns).
export interface ForeignTradeRow {
    month                    : string;       // "YYYY-MM" (newest-first)
    exports_inr              : number | null; // ₹ crore
    exports_usd              : number | null; // US$ mn
    oil_exports_inr          : number | null;
    oil_exports_usd          : number | null;
    non_oil_exports_inr      : number | null;
    non_oil_exports_usd      : number | null;
    imports_inr              : number | null;
    imports_usd              : number | null;
    oil_imports_inr          : number | null;
    oil_imports_usd          : number | null;
    non_oil_imports_inr      : number | null;
    non_oil_imports_usd      : number | null;
    trade_balance_inr        : number | null;
    trade_balance_usd        : number | null;
    oil_trade_balance_inr    : number | null;
    oil_trade_balance_usd    : number | null;
    non_oil_trade_balance_inr: number | null;
}

export interface ForeignTrade {
    reportTitle : string;
    data        : ForeignTradeRow[];
}

/**
 * Fetch monthly foreign trade data from the build-synced JSON.
 */
export async function getForeignTrade() : Promise<ForeignTrade> {
    return loadData<ForeignTrade>("foreign-trade");
}

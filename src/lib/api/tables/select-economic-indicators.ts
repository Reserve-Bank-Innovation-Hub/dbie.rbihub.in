// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Monthly select economic indicators (RBI Bulletin Table 1).
// Covers Jan 2026 back to Dec 2010, newest-first.
// Values are number | string | null: numeric where cleanly parseable,
// range strings (e.g. "8.35/10.00") for base rate / MCLR / term deposit /
// savings deposit, and null for not-available cells ("..", "-", "-/-").
export interface SelectEconomicIndicatorsRow {
    month                   : string;          // "Jan 2026"
    iip                     : number | null;   // IIP % change
    scb_deposits            : number | null;   // SCB deposits % change
    scb_credit              : number | null;   // SCB credit % change
    scb_nonfood_credit      : number | null;   // SCB non-food credit % change
    scb_invest_gsec         : number | null;   // SCB investment in G-secs % change
    m0                      : number | null;   // Reserve Money (M0) % change
    m3                      : number | null;   // Broad Money (M3) % change
    crr                     : number | null;   // Cash Reserve Ratio (%)
    slr                     : number | null;   // Statutory Liquidity Ratio (%)
    cash_deposit_ratio      : number | null;
    credit_deposit_ratio    : number | null;
    incr_credit_deposit_ratio : number | null;
    invest_deposit_ratio    : number | null;
    incr_invest_deposit_ratio : number | null;
    policy_repo_rate        : number | null;
    reverse_repo_rate       : number | null;
    sdf_rate                : number | null;   // Standing Deposit Facility Rate
    msf_rate                : number | null;   // Marginal Standing Facility Rate
    bank_rate               : number | null;
    base_rate               : number | string | null;  // range e.g. "8.35/10.00"
    mclr_overnight          : number | string | null;  // range e.g. "7.70/7.95"
    term_deposit_rate       : number | string | null;  // range e.g. "6.00/6.50"
    savings_deposit_rate    : number | string | null;  // range or number
    call_money_rate         : number | null;
    tbill_91d               : number | null;   // 91-day T-bill yield
    tbill_182d              : number | null;   // 182-day T-bill yield
    tbill_364d              : number | null;   // 364-day T-bill yield
    gsec_10y                : number | null;   // 10-year G-Sec par yield
    inr_usd                 : number | null;   // INR per USD spot rate
    inr_eur                 : number | null;   // INR per EUR spot rate
    fwd_premia_1m           : number | null;   // 1-month USD forward premia
    fwd_premia_3m           : number | null;   // 3-month USD forward premia
    fwd_premia_6m           : number | null;   // 6-month USD forward premia
    cpi_inflation           : number | null;   // All India CPI inflation
    cpi_iw_inflation        : number | null;   // CPI-IW inflation
    wpi_inflation           : number | null;   // WPI inflation
    wpi_primary             : number | null;   // WPI primary articles
    wpi_fuel                : number | null;   // WPI fuel and power
    wpi_mfg                 : number | null;   // WPI manufactured products
    imports_growth          : number | null;   // Imports % change (USD)
}

export interface SelectEconomicIndicators {
    reportTitle : string;
    notes       : string;
    data        : SelectEconomicIndicatorsRow[];
}

/**
 * Fetch the select economic indicators monthly series from the build-synced JSON.
 */
export async function getSelectEconomicIndicators() : Promise<SelectEconomicIndicators> {
    return loadData<SelectEconomicIndicators>("select-economic-indicators");
}

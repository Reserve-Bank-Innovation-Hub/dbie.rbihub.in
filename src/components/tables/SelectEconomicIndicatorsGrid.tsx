"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { SelectEconomicIndicatorsRow } from "@/lib/api/tables/select-economic-indicators";

// Register AG Grid modules
ModuleRegistry.registerModules([ AllCommunityModule ]);

// Create custom theme
const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface SelectEconomicIndicatorsGridProps {
    data : SelectEconomicIndicatorsRow[];
}

const rightAlign = { textAlign : "right" as const };

// Value formatter: numbers → 2 decimal places, strings → as-is, null → "—".
const cellFormatter = (params : { value : number | string | null }) => {
    if (params.value == null) return "—";
    if (typeof params.value === "number") return params.value.toFixed(2);
    return String(params.value);
};

// Helper to build a standard numeric child column.
function col(field : string, headerName : string, minWidth = 120) : ColDef {
    return {
        field,
        headerName,
        minWidth,
        flex           : 1,
        valueFormatter : cellFormatter,
        cellStyle      : rightAlign,
    };
}

const SelectEconomicIndicatorsGrid : React.FC<SelectEconomicIndicatorsGridProps> = ({ data }) => {
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const cols : (ColDef | ColGroupDef)[] = [
            // Month pinned left
            {
                field      : "month",
                headerName : "Month",
                pinned     : "left",
                width      : 110,
                filter     : true,
                cellStyle  : { fontWeight : "500" },
            },

            // 1 · Real sector (% change)
            {
                headerName : "Real sector (% change)",
                children   : [
                    col("iip", "IIP"),
                ],
            },

            // 2 · Money and banking (% change)
            {
                headerName : "Money and banking (% change)",
                children   : [
                    col("scb_deposits",        "SCB deposits"),
                    col("scb_credit",          "SCB credit"),
                    col("scb_nonfood_credit",  "SCB non-food credit"),
                    col("scb_invest_gsec",     "SCB invest. G-secs"),
                    col("m0",                  "M0 (reserve money)"),
                    col("m3",                  "M3 (broad money)"),
                ],
            },

            // 3 · Ratios (%)
            {
                headerName : "Ratios (%)",
                children   : [
                    col("crr",                      "CRR"),
                    col("slr",                      "SLR"),
                    col("cash_deposit_ratio",       "Cash-deposit"),
                    col("credit_deposit_ratio",     "Credit-deposit"),
                    col("incr_credit_deposit_ratio","Incr. credit-deposit"),
                    col("invest_deposit_ratio",     "Invest.-deposit"),
                    col("incr_invest_deposit_ratio","Incr. invest.-deposit"),
                ],
            },

            // 4 · Interest rates (%)
            {
                headerName : "Interest rates (%)",
                children   : [
                    col("policy_repo_rate",    "Policy repo"),
                    col("reverse_repo_rate",   "Reverse repo"),
                    col("sdf_rate",            "SDF rate"),
                    col("msf_rate",            "MSF rate"),
                    col("bank_rate",           "Bank rate"),
                    col("base_rate",           "Base rate",        145),
                    col("mclr_overnight",      "MCLR (overnight)", 145),
                    col("term_deposit_rate",   "Term deposit",     145),
                    col("savings_deposit_rate","Savings deposit"),
                    col("call_money_rate",     "Call money"),
                    col("tbill_91d",           "91-day T-bill"),
                    col("tbill_182d",          "182-day T-bill"),
                    col("tbill_364d",          "364-day T-bill"),
                    col("gsec_10y",            "10-yr G-sec"),
                ],
            },

            // 5 · Reference rate and forward premia
            {
                headerName : "Reference rate and forward premia",
                children   : [
                    col("inr_usd",       "INR/USD",          110),
                    col("inr_eur",       "INR/EUR",          110),
                    col("fwd_premia_1m", "Fwd premia 1m (%)"),
                    col("fwd_premia_3m", "Fwd premia 3m (%)"),
                    col("fwd_premia_6m", "Fwd premia 6m (%)"),
                ],
            },

            // 6 · Inflation (%)
            {
                headerName : "Inflation (%)",
                children   : [
                    col("cpi_inflation",     "CPI (combined)"),
                    col("cpi_iw_inflation",  "CPI-IW"),
                    col("wpi_inflation",     "WPI"),
                    col("wpi_primary",       "WPI primary"),
                    col("wpi_fuel",          "WPI fuel & power"),
                    col("wpi_mfg",           "WPI manufactured"),
                ],
            },

            // 7 · Foreign trade (% change)
            {
                headerName : "Foreign trade (% change)",
                children   : [
                    col("imports_growth", "Imports"),
                ],
            },
        ];
        return cols;
    }, []);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="select-economic-indicators-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[ 25, 50, 100, 200 ]}
                domLayout="normal"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default SelectEconomicIndicatorsGrid;

"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { RbiLiabilitiesAndAssetsRow } from "@/lib/api/tables/rbi-liabilities-and-assets";

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

interface RbiLiabilitiesAndAssetsGridProps {
    data : RbiLiabilitiesAndAssetsRow[];
}

const RbiLiabilitiesAndAssetsGrid : React.FC<RbiLiabilitiesAndAssetsGridProps> = ({ data }) => {
    // Format amounts: null → "—", numbers with en-IN locale commas, up to 2 decimal places.
    const numFormatter = (params : any) => {
        if (params.value == null) return "—";
        return Number(params.value).toLocaleString("en-IN", { maximumFractionDigits : 2 });
    };

    const cols : (ColDef | ColGroupDef)[] = useMemo(() => {
        // Week column pinned left.
        const weekCol : ColDef = {
            field      : "week",
            headerName : "Week ended",
            pinned     : "left",
            width      : 140,
            filter     : true,
            cellStyle  : { fontWeight : "500" },
        };

        // Leaf column factory.
        const leaf = (
            field      : string,
            headerName : string,
            isTotal    : boolean = false,
        ) : ColDef => ({
            field,
            headerName,
            flex           : 1,
            minWidth       : 140,
            type           : "numericColumn",
            valueFormatter : numFormatter,
            cellStyle      : isTotal
                ? { textAlign : "right", fontWeight : 600 }
                : { textAlign : "right" },
        });

        return [
            weekCol,

            // ISSUE DEPARTMENT ========================================================================================
            {
                headerName : "Issue department",
                children   : [
                    {
                        headerName : "Liabilities",
                        children   : [
                            leaf("notes_in_circulation",  "Notes in circulation"),
                            leaf("notes_in_banking_dept", "Notes in banking dept"),
                        ],
                    },
                    leaf("issue_dept_total",     "Total",                   true),
                    {
                        headerName : "Assets",
                        children   : [
                            leaf("gold",                 "Gold"),
                            leaf("foreign_securities",   "Foreign securities"),
                            leaf("rupee_coin",           "Rupee coin"),
                            leaf("goi_rupee_securities", "GoI rupee securities"),
                        ],
                    },
                ],
            },

            // BANKING DEPARTMENT — LIABILITIES ========================================================================
            {
                headerName : "Banking department — liabilities",
                children   : [
                    {
                        headerName : "Deposits",
                        children   : [
                            leaf("deposits",                           "Total deposits",                         true),
                            leaf("dep_central_govt",                   "Central government"),
                            leaf("dep_mss",                            "Market Stabilisation Scheme"),
                            leaf("dep_state_govts",                    "State governments"),
                            leaf("dep_scheduled_commercial_banks",     "Scheduled commercial banks"),
                            leaf("dep_scheduled_state_coop_banks",     "Scheduled state co-op. banks"),
                            leaf("dep_non_scheduled_state_coop_banks", "Non-scheduled state co-op. banks"),
                            leaf("dep_other_banks",                    "Other banks"),
                            leaf("dep_others",                         "Others"),
                            leaf("dep_fi_outside_india",               "Financial institutions outside India"),
                        ],
                    },
                    leaf("other_liabilities",  "Other liabilities"),
                    leaf("banking_dept_total", "Total",               true),
                ],
            },

            // BANKING DEPARTMENT — ASSETS =============================================================================
            {
                headerName : "Banking department — assets",
                children   : [
                    leaf("notes_and_coins",         "Notes and coins"),
                    leaf("balances_held_abroad",     "Balances held abroad"),
                    {
                        headerName : "Loans and advances",
                        children   : [
                            leaf("loans_and_advances",                "Total loans and advances",           true),
                            leaf("la_central_govt",                   "Central government"),
                            leaf("la_state_govts",                    "State governments"),
                            leaf("la_scheduled_commercial_banks",     "Scheduled commercial banks"),
                            leaf("la_scheduled_state_coop_banks",     "Scheduled state co-op. banks"),
                            leaf("la_idbi",                           "IDBI"),
                            leaf("la_nabard",                         "NABARD"),
                            leaf("la_exim_bank",                      "EXIM Bank"),
                            leaf("la_others",                         "Others"),
                            leaf("la_fi_outside_india",               "Financial institutions outside India"),
                        ],
                    },
                    {
                        headerName : "Bills purchased and discounted",
                        children   : [
                            leaf("bills_purchased_discounted", "Total bills",         true),
                            leaf("bills_internal",             "Internal"),
                            leaf("bills_govt_treasury",        "Government treasury bills"),
                        ],
                    },
                    leaf("investments",  "Investments"),
                    leaf("other_assets", "Other assets"),
                ],
            },
        ];
    }, []);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="rbi-liabilities-and-assets-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={cols}
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

export default RbiLiabilitiesAndAssetsGrid;

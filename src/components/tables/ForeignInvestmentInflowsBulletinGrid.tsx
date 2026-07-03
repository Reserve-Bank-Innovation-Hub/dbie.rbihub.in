"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { ForeignInvestmentInflowsBulletinRow } from "@/lib/api/tables/foreign-investment-inflows-bulletin";

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

interface ForeignInvestmentInflowsBulletinGridProps {
    data : ForeignInvestmentInflowsBulletinRow[];
    unit : string;
}

// Helper for a right-aligned numeric column (amounts are US $Mn with 2dp)
function numCol(field : keyof ForeignInvestmentInflowsBulletinRow, headerName : string, minWidth = 160) : ColDef {
    return {
        field,
        headerName,
        flex           : 1,
        minWidth,
        type           : "numericColumn",
        valueFormatter : (params) => {
            if (params.value == null) return "—";
            return Number(params.value).toLocaleString("en-IN", { minimumFractionDigits : 2, maximumFractionDigits : 2 });
        },
        cellStyle : { textAlign : "right" },
    };
}

const ForeignInvestmentInflowsBulletinGrid : React.FC<ForeignInvestmentInflowsBulletinGridProps> = ({ data, unit }) => {
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => [
        {
            field      : "month",
            headerName : "Month",
            pinned     : "left",
            width      : 170,
            filter     : true,
            cellStyle  : { fontWeight : "500" },
        },
        // Top-level summary columns
        numCol("netFDI", "A. Net FDI"),
        numCol("netPortfolioInvestment", "B. Net portfolio investment"),
        // A. FDI detail
        {
            headerName    : "A.I  Direct investment to India",
            marryChildren : true,
            children      : [
                numCol("directInvestmentToIndia", "A.I. Total"),
                {
                    headerName    : "A.I.a  Gross inflows",
                    marryChildren : true,
                    children      : [
                        numCol("grossInflows",         "Total"),
                        numCol("equityInflows",        "Equity total"),
                        numCol("equityGovernment",     "Government"),
                        numCol("equityRBI",            "RBI"),
                        numCol("acquisitionOfShares",  "Acquisition of shares"),
                        numCol("equityUnincorporated", "Unincorporated bodies"),
                        numCol("reinvestedEarnings",   "Reinvested earnings"),
                        numCol("otherCapitalInflows",  "Other capital"),
                    ],
                },
                {
                    headerName    : "A.I.b  Repatriation/disinvestment",
                    marryChildren : true,
                    children      : [
                        numCol("repatriationDisinvestment", "Total"),
                        numCol("repatriationEquity",        "Equity"),
                        numCol("repatriationOther",         "Other capital"),
                    ],
                },
            ],
        },
        {
            headerName    : "A.II  FDI by India",
            marryChildren : true,
            children      : [
                numCol("fdiByIndia",             "Total"),
                numCol("fdiByIndiaEquity",       "Equity capital"),
                numCol("fdiByIndiaReinvested",   "Reinvested earnings"),
                numCol("fdiByIndiaOther",        "Other capital"),
                numCol("fdiByIndiaRepatriation", "Repatriation/disinvestment"),
            ],
        },
        // B. Portfolio detail
        {
            headerName    : "B.I  Portfolio investment components",
            marryChildren : true,
            children      : [
                numCol("gdrsAdrs",       "GDRs/ADRs"),
                numCol("fpis",           "FPIs"),
                numCol("offshoreFunds",  "Offshore funds and others"),
                numCol("portfolioByIndia", "Portfolio investment by India"),
            ],
        },
    ], [ unit ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="foreign-investment-inflows-bulletin-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[ 25, 50, 100 ]}
                domLayout="normal"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default ForeignInvestmentInflowsBulletinGrid;

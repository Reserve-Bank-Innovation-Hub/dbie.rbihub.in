"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeQuartz, ColDef, ColGroupDef } from "ag-grid-community";

// LIB =================================================================================================================
import { ExternalDebtRow } from "@/lib/api/publications";

ModuleRegistry.registerModules([ AllCommunityModule ]);

const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface ExternalDebtGridProps {
    data : ExternalDebtRow[];
}

const ExternalDebtGrid : React.FC<ExternalDebtGridProps> = ({data}) => {
    const formatNumber = (params : any) => {
        if (params.value == null || params.value === 0) return "-";
        return params.value.toLocaleString("en-IN");
    };

    const formatPercent = (params : any) => {
        if (params.value == null || params.value === 0) return "-";
        return params.value.toFixed(2) + "%";
    };

    const columnDefs : (ColDef | ColGroupDef)[] = [
        {
            field      : "year",
            headerName : "Year",
            pinned     : "left",
            width      : 100,
            cellStyle  : {
                fontWeight : "bold",
                textAlign  : "center",
            },
        },
        {
            headerName : "Major categories (₹ crores)",
            children   : [
                {
                    field          : "multilateralTotal",
                    headerName     : "Multilateral",
                    valueFormatter : formatNumber,
                    width          : 140,
                },
                {
                    field          : "bilateralTotal",
                    headerName     : "Bilateral",
                    valueFormatter : formatNumber,
                    width          : 140,
                },
                {
                    field          : "imf",
                    headerName     : "IMF",
                    valueFormatter : formatNumber,
                    width          : 140,
                },
                {
                    field          : "tradeCredit",
                    headerName     : "Trade credit",
                    valueFormatter : formatNumber,
                    width          : 140,
                },
                {
                    field          : "commercialBorrowing",
                    headerName     : "Commercial borrowing",
                    valueFormatter : formatNumber,
                    width          : 160,
                },
                {
                    field          : "nonResidentDeposits",
                    headerName     : "NR deposits",
                    valueFormatter : formatNumber,
                    width          : 140,
                },
                {
                    field          : "rupeeDebt",
                    headerName     : "Rupee debt",
                    valueFormatter : formatNumber,
                    width          : 140,
                },
            ],
        },
        {
            headerName : "Totals (₹ crores)",
            children   : [
                {
                    field          : "totalLongTermDebt",
                    headerName     : "Long-term debt",
                    valueFormatter : formatNumber,
                    width          : 160,
                    cellStyle      : {fontWeight : "600"},
                },
                {
                    field          : "shortTermDebt",
                    headerName     : "Short-term debt",
                    valueFormatter : formatNumber,
                    width          : 160,
                    cellStyle      : {fontWeight : "600"},
                },
                {
                    field          : "grossExternalDebt",
                    headerName     : "Gross external debt",
                    valueFormatter : formatNumber,
                    width          : 180,
                    cellStyle      : {fontWeight : "bold", backgroundColor : "#f0f9ff"},
                },
            ],
        },
        {
            headerName : "Key ratios",
            children   : [
                {
                    field          : "concessionalDebtPercent",
                    headerName     : "Concessional %",
                    valueFormatter : formatPercent,
                    width          : 140,
                },
                {
                    field          : "shortTermDebtPercent",
                    headerName     : "Short-term %",
                    valueFormatter : formatPercent,
                    width          : 140,
                },
                {
                    field          : "debtToGDPRatio",
                    headerName     : "Debt/GDP %",
                    valueFormatter : formatPercent,
                    width          : 130,
                },
                {
                    field          : "debtServiceRatio",
                    headerName     : "Debt service %",
                    valueFormatter : formatPercent,
                    width          : 140,
                },
            ],
        },
    ];

    return (
        <div className="grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                theme={customTheme}
                pagination={true}
                paginationPageSize={50}
                defaultColDef={{
                    sortable  : true,
                    filter    : true,
                    resizable : true,
                    cellStyle : {textAlign : "right"},
                }}
            />
        </div>
    );
};

export default ExternalDebtGrid;

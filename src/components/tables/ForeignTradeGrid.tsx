"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { ForeignTradeRow } from "@/lib/api/tables/foreign-trade";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Create custom theme
const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface ForeignTradeGridProps {
    data : ForeignTradeRow[];
}

// "YYYY-MM" → "Mon YYYY" for display in the month column.
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatMonth(key : string) : string {
    const m = key.match(/^(\d{4})-(\d{2})$/);
    if (!m) return key;
    const mon = MONTH_LABELS[Number(m[2]) - 1] ?? m[2];
    return `${mon} ${m[1]}`;
}

const ForeignTradeGrid : React.FC<ForeignTradeGridProps> = ({ data }) => {
    const inrFormatter  = (params : any) => params.value == null ? "-" : params.value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    const usdFormatter  = (params : any) => params.value == null ? "-" : params.value.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

    // Augment rows with a display-friendly month label.
    const rowData = useMemo(() => data.map(r => ({ ...r, month_label: formatMonth(r.month) })), [data]);

    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => [
        {
            field      : "month_label",
            headerName : "Month",
            pinned     : "left",
            width      : 130,
            filter     : true,
            cellStyle  : { fontWeight: "500" },
        },

        // 1 Exports
        {
            headerName : "1. Exports",
            children   : [
                {
                    headerName     : "₹ crore",
                    field          : "exports_inr",
                    width          : 130,
                    type           : "numericColumn",
                    valueFormatter : inrFormatter,
                    cellStyle      : { textAlign: "right" },
                },
                {
                    headerName     : "US$ mn",
                    field          : "exports_usd",
                    width          : 120,
                    type           : "numericColumn",
                    valueFormatter : usdFormatter,
                    cellStyle      : { textAlign: "right" },
                },
            ],
        },

        // 1.1 Oil exports
        {
            headerName : "1.1 Oil exports",
            children   : [
                {
                    headerName     : "₹ crore",
                    field          : "oil_exports_inr",
                    width          : 130,
                    type           : "numericColumn",
                    valueFormatter : inrFormatter,
                    cellStyle      : { textAlign: "right" },
                },
                {
                    headerName     : "US$ mn",
                    field          : "oil_exports_usd",
                    width          : 120,
                    type           : "numericColumn",
                    valueFormatter : usdFormatter,
                    cellStyle      : { textAlign: "right" },
                },
            ],
        },

        // 1.2 Non-oil exports
        {
            headerName : "1.2 Non-oil exports",
            children   : [
                {
                    headerName     : "₹ crore",
                    field          : "non_oil_exports_inr",
                    width          : 130,
                    type           : "numericColumn",
                    valueFormatter : inrFormatter,
                    cellStyle      : { textAlign: "right" },
                },
                {
                    headerName     : "US$ mn",
                    field          : "non_oil_exports_usd",
                    width          : 120,
                    type           : "numericColumn",
                    valueFormatter : usdFormatter,
                    cellStyle      : { textAlign: "right" },
                },
            ],
        },

        // 2 Imports
        {
            headerName : "2. Imports",
            children   : [
                {
                    headerName     : "₹ crore",
                    field          : "imports_inr",
                    width          : 130,
                    type           : "numericColumn",
                    valueFormatter : inrFormatter,
                    cellStyle      : { textAlign: "right" },
                },
                {
                    headerName     : "US$ mn",
                    field          : "imports_usd",
                    width          : 120,
                    type           : "numericColumn",
                    valueFormatter : usdFormatter,
                    cellStyle      : { textAlign: "right" },
                },
            ],
        },

        // 2.1 Oil imports
        {
            headerName : "2.1 Oil imports",
            children   : [
                {
                    headerName     : "₹ crore",
                    field          : "oil_imports_inr",
                    width          : 130,
                    type           : "numericColumn",
                    valueFormatter : inrFormatter,
                    cellStyle      : { textAlign: "right" },
                },
                {
                    headerName     : "US$ mn",
                    field          : "oil_imports_usd",
                    width          : 120,
                    type           : "numericColumn",
                    valueFormatter : usdFormatter,
                    cellStyle      : { textAlign: "right" },
                },
            ],
        },

        // 2.2 Non-oil imports
        {
            headerName : "2.2 Non-oil imports",
            children   : [
                {
                    headerName     : "₹ crore",
                    field          : "non_oil_imports_inr",
                    width          : 130,
                    type           : "numericColumn",
                    valueFormatter : inrFormatter,
                    cellStyle      : { textAlign: "right" },
                },
                {
                    headerName     : "US$ mn",
                    field          : "non_oil_imports_usd",
                    width          : 120,
                    type           : "numericColumn",
                    valueFormatter : usdFormatter,
                    cellStyle      : { textAlign: "right" },
                },
            ],
        },

        // 3 Trade balance
        {
            headerName : "3. Trade balance",
            children   : [
                {
                    headerName     : "₹ crore",
                    field          : "trade_balance_inr",
                    width          : 130,
                    type           : "numericColumn",
                    valueFormatter : inrFormatter,
                    cellStyle      : (params : any) => ({
                        textAlign : "right",
                        color     : params.value != null && params.value < 0 ? "#d12d1b" : undefined,
                    }),
                },
                {
                    headerName     : "US$ mn",
                    field          : "trade_balance_usd",
                    width          : 120,
                    type           : "numericColumn",
                    valueFormatter : usdFormatter,
                    cellStyle      : (params : any) => ({
                        textAlign : "right",
                        color     : params.value != null && params.value < 0 ? "#d12d1b" : undefined,
                    }),
                },
            ],
        },

        // 3.1 Oil trade balance
        {
            headerName : "3.1 Oil trade balance",
            children   : [
                {
                    headerName     : "₹ crore",
                    field          : "oil_trade_balance_inr",
                    width          : 130,
                    type           : "numericColumn",
                    valueFormatter : inrFormatter,
                    cellStyle      : (params : any) => ({
                        textAlign : "right",
                        color     : params.value != null && params.value < 0 ? "#d12d1b" : undefined,
                    }),
                },
                {
                    headerName     : "US$ mn",
                    field          : "oil_trade_balance_usd",
                    width          : 120,
                    type           : "numericColumn",
                    valueFormatter : usdFormatter,
                    cellStyle      : (params : any) => ({
                        textAlign : "right",
                        color     : params.value != null && params.value < 0 ? "#d12d1b" : undefined,
                    }),
                },
            ],
        },

        // 3.2 Non-oil trade balance (INR only — no paired USD column in source)
        {
            headerName : "3.2 Non-oil trade balance",
            children   : [
                {
                    headerName     : "₹ crore",
                    field          : "non_oil_trade_balance_inr",
                    width          : 130,
                    type           : "numericColumn",
                    valueFormatter : inrFormatter,
                    cellStyle      : (params : any) => ({
                        textAlign : "right",
                        color     : params.value != null && params.value < 0 ? "#d12d1b" : undefined,
                    }),
                },
            ],
        },
    ], []);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="foreign-trade-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[25, 50, 100, 200]}
                domLayout="normal"
                suppressCellFocus={true}
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default ForeignTradeGrid;

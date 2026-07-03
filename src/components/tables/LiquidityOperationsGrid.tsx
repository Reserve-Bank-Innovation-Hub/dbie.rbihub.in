"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { LiquidityOperationsRow } from "@/lib/api/tables/liquidity-operations";

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

interface LiquidityOperationsGridProps {
    data : LiquidityOperationsRow[];
}

const LiquidityOperationsGrid : React.FC<LiquidityOperationsGridProps> = ({ data }) => {
    // Format rupee crore values with Indian locale; "—" for null.
    const amountFormatter = (params : any) => {
        if (params.value == null) return "—";
        return Number(params.value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
    };

    // Column definitions — flat layout, Date pinned left, 16 amount columns.
    const cols = useMemo<ColDef[]>(() => {
     const defs : ColDef[] = [
        {
            field      : "date",
            headerName : "Date",
            pinned     : "left",
            width      : 140,
            filter     : true,
            cellStyle  : { fontWeight: "500" },
        },
        {
            field          : "repo",
            headerName     : "Repo",
            flex           : 1,
            minWidth       : 110,
            type           : "numericColumn",
            valueFormatter : amountFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "reverse_repo",
            headerName     : "Reverse repo",
            flex           : 1,
            minWidth       : 130,
            type           : "numericColumn",
            valueFormatter : amountFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "variable_rate_repo",
            headerName     : "Variable rate repo",
            flex           : 1,
            minWidth       : 160,
            type           : "numericColumn",
            valueFormatter : amountFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "variable_rate_reverse_repo",
            headerName     : "Variable rate reverse repo",
            flex           : 1,
            minWidth       : 200,
            type           : "numericColumn",
            valueFormatter : amountFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "msf",
            headerName     : "MSF",
            flex           : 1,
            minWidth       : 100,
            type           : "numericColumn",
            valueFormatter : amountFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "sdf",
            headerName     : "SDF",
            flex           : 1,
            minWidth       : 100,
            type           : "numericColumn",
            valueFormatter : amountFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "standing_liquidity_facilities",
            headerName     : "Standing liquidity facilities",
            flex           : 1,
            minWidth       : 210,
            type           : "numericColumn",
            valueFormatter : amountFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "omo_sale",
            headerName     : "OMO sale",
            flex           : 1,
            minWidth       : 110,
            type           : "numericColumn",
            valueFormatter : amountFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "omo_purchase",
            headerName     : "OMO purchase",
            flex           : 1,
            minWidth       : 140,
            type           : "numericColumn",
            valueFormatter : amountFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "mss",
            headerName     : "MSS",
            flex           : 1,
            minWidth       : 100,
            type           : "numericColumn",
            valueFormatter : amountFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "ltro",
            headerName     : "LTRO",
            flex           : 1,
            minWidth       : 100,
            type           : "numericColumn",
            valueFormatter : amountFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "tltro",
            headerName     : "TLTRO",
            flex           : 1,
            minWidth       : 110,
            type           : "numericColumn",
            valueFormatter : amountFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "sltro_sfb",
            headerName     : "SLTRO (SFBs)",
            flex           : 1,
            minWidth       : 130,
            type           : "numericColumn",
            valueFormatter : amountFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "special_reverse_repo",
            headerName     : "Special reverse repo",
            flex           : 1,
            minWidth       : 170,
            type           : "numericColumn",
            valueFormatter : amountFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "slf_mutual_funds",
            headerName     : "SLF mutual funds",
            flex           : 1,
            minWidth       : 150,
            type           : "numericColumn",
            valueFormatter : amountFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "sls_nbfc_hfc",
            headerName     : "SLS NBFCs/HFCs",
            flex           : 1,
            minWidth       : 150,
            type           : "numericColumn",
            valueFormatter : amountFormatter,
            cellStyle      : { textAlign: "right" },
        },
     ];
     return defs;
    }, []);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="liquidity-operations-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={cols}
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

export default LiquidityOperationsGrid;

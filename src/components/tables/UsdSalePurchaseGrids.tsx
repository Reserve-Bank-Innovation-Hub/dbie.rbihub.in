"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import {
    UsdSalePurchaseOutrightRow,
    UsdSalePurchaseForwardsRow,
    UsdSalePurchaseForwardsMaturityRow,
} from "@/lib/api/tables/usd-sale-purchase";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Custom theme shared by all three grids
const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

// Formatter: Indian locale, up to 2 decimal places; "—" for null; negative renders as-is.
const numFormatter = (params : any) => {
    if (params.value == null) return "—";
    return Number(params.value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

const defaultColDef : ColDef = {
    sortable        : true,
    filter          : true,
    resizable       : true,
    suppressMovable : true,
};

// OUTRIGHT GRID =======================================================================================================
interface OutrightGridProps {
    data : UsdSalePurchaseOutrightRow[];
}

export const OutrightGrid : React.FC<OutrightGridProps> = ({ data }) => {
    const columnDefs = useMemo<ColDef[]>(() => {
        const cols : ColDef[] = [
            {
                field      : "month",
                headerName : "Month",
                pinned     : "left",
                width      : 150,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            {
                field          : "net_usd_mn",
                headerName     : "Net purchase/sale (US $ mn)",
                flex           : 1,
                minWidth       : 200,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "purchase_usd_mn",
                headerName     : "Purchase (US $ mn)",
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "sale_usd_mn",
                headerName     : "Sale (US $ mn)",
                flex           : 1,
                minWidth       : 140,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "inr_crore_equivalent",
                headerName     : "₹ equivalent (₹ cr.)",
                flex           : 1,
                minWidth       : 170,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "cumulative_usd_mn",
                headerName     : "Cumulative (US $ mn)",
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "cumulative_inr_crore",
                headerName     : "Cumulative (₹ cr.)",
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : { textAlign: "right" },
            },
        ];
        return cols;
    }, []);

    return (
        <div className="usd-sale-purchase-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={25}
                paginationPageSizeSelector={[10, 25, 50, 100]}
                domLayout="normal"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

// FORWARDS GRID =======================================================================================================
interface ForwardsGridProps {
    data : UsdSalePurchaseForwardsRow[];
}

export const ForwardsGrid : React.FC<ForwardsGridProps> = ({ data }) => {
    const columnDefs = useMemo<ColDef[]>(() => {
        const cols : ColDef[] = [
            {
                field      : "month",
                headerName : "Month",
                pinned     : "left",
                width      : 150,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            {
                field          : "net_usd_mn",
                headerName     : "Net purchase/sale (US $ mn)",
                flex           : 1,
                minWidth       : 200,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "purchase_usd_mn",
                headerName     : "Purchase (US $ mn)",
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "sale_usd_mn",
                headerName     : "Sale (US $ mn)",
                flex           : 1,
                minWidth       : 140,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : { textAlign: "right" },
            },
        ];
        return cols;
    }, []);

    return (
        <div className="usd-sale-purchase-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={25}
                paginationPageSizeSelector={[10, 25, 50, 100]}
                domLayout="normal"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

// FORWARDS MATURITY GRID ==============================================================================================
interface ForwardsMaturityGridProps {
    data : UsdSalePurchaseForwardsMaturityRow[];
}

export const ForwardsMaturityGrid : React.FC<ForwardsMaturityGridProps> = ({ data }) => {
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const cols : (ColDef | ColGroupDef)[] = [
            {
                field      : "month",
                headerName : "Month",
                pinned     : "left",
                width      : 150,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            {
                headerName : "Up to 1 month",
                children   : [
                    {
                        field          : "m1_long",
                        headerName     : "Long",
                        flex           : 1,
                        minWidth       : 100,
                        type           : "numericColumn",
                        valueFormatter : numFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                    {
                        field          : "m1_short",
                        headerName     : "Short",
                        flex           : 1,
                        minWidth       : 100,
                        type           : "numericColumn",
                        valueFormatter : numFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                    {
                        field          : "m1_net",
                        headerName     : "Net",
                        flex           : 1,
                        minWidth       : 100,
                        type           : "numericColumn",
                        valueFormatter : numFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                ],
            },
            {
                headerName : "1–3 months",
                children   : [
                    {
                        field          : "m3_long",
                        headerName     : "Long",
                        flex           : 1,
                        minWidth       : 100,
                        type           : "numericColumn",
                        valueFormatter : numFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                    {
                        field          : "m3_short",
                        headerName     : "Short",
                        flex           : 1,
                        minWidth       : 100,
                        type           : "numericColumn",
                        valueFormatter : numFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                    {
                        field          : "m3_net",
                        headerName     : "Net",
                        flex           : 1,
                        minWidth       : 100,
                        type           : "numericColumn",
                        valueFormatter : numFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                ],
            },
            {
                headerName : "3 months–1 year",
                children   : [
                    {
                        field          : "m12_long",
                        headerName     : "Long",
                        flex           : 1,
                        minWidth       : 100,
                        type           : "numericColumn",
                        valueFormatter : numFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                    {
                        field          : "m12_short",
                        headerName     : "Short",
                        flex           : 1,
                        minWidth       : 100,
                        type           : "numericColumn",
                        valueFormatter : numFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                    {
                        field          : "m12_net",
                        headerName     : "Net",
                        flex           : 1,
                        minWidth       : 100,
                        type           : "numericColumn",
                        valueFormatter : numFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                ],
            },
        ];
        return cols;
    }, []);

    return (
        <div className="usd-sale-purchase-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={25}
                paginationPageSizeSelector={[10, 25, 50, 100]}
                domLayout="normal"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

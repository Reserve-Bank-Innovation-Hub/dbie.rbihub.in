"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { ComponentsOfGrossDomesticProductRow } from "@/lib/api/tables/components-of-gross-domestic-product";

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

interface ComponentsOfGrossDomesticProductGridProps {
    data : ComponentsOfGrossDomesticProductRow[];
}

const ComponentsOfGrossDomesticProductGrid : React.FC<ComponentsOfGrossDomesticProductGridProps> = ({ data }) => {
    const numberFormatter = (params : any) => {
        if (params.value == null) return "–";
        return params.value.toLocaleString("en-IN");
    };

    const columnDefs = useMemo<ColDef[]>(() => {
        const cols : ColDef[] = [
        {
            field      : "year",
            headerName : "Year",
            pinned     : "left",
            width      : 120,
            filter     : true,
            cellStyle  : { fontWeight: "500" },
        },
        {
            field          : "pfce_const",
            headerName     : "PFCE — constant prices",
            flex           : 1,
            minWidth       : 200,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "pfce_curr",
            headerName     : "PFCE — current prices",
            flex           : 1,
            minWidth       : 200,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "gfce_const",
            headerName     : "GFCE — constant prices",
            flex           : 1,
            minWidth       : 200,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "gfce_curr",
            headerName     : "GFCE — current prices",
            flex           : 1,
            minWidth       : 200,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "gfcf_const",
            headerName     : "GFCF — constant prices",
            flex           : 1,
            minWidth       : 200,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "gfcf_curr",
            headerName     : "GFCF — current prices",
            flex           : 1,
            minWidth       : 200,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "changes_in_stocks_const",
            headerName     : "Changes in stocks — constant prices",
            flex           : 1,
            minWidth       : 240,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "changes_in_stocks_curr",
            headerName     : "Changes in stocks — current prices",
            flex           : 1,
            minWidth       : 240,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "valuables_const",
            headerName     : "Valuables — constant prices",
            flex           : 1,
            minWidth       : 210,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "valuables_curr",
            headerName     : "Valuables — current prices",
            flex           : 1,
            minWidth       : 210,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "exports_const",
            headerName     : "Exports — constant prices",
            flex           : 1,
            minWidth       : 200,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "exports_curr",
            headerName     : "Exports — current prices",
            flex           : 1,
            minWidth       : 200,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "imports_const",
            headerName     : "Imports — constant prices",
            flex           : 1,
            minWidth       : 200,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "imports_curr",
            headerName     : "Imports — current prices",
            flex           : 1,
            minWidth       : 200,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "discrepancies_const",
            headerName     : "Discrepancies — constant prices",
            flex           : 1,
            minWidth       : 230,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "discrepancies_curr",
            headerName     : "Discrepancies — current prices",
            flex           : 1,
            minWidth       : 230,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "gdp_const",
            headerName     : "GDP — constant prices",
            flex           : 1,
            minWidth       : 200,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
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
        <div className="components-of-gdp-grid-wrapper">
            <AgGridReact
                rowData={data}
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

export default ComponentsOfGrossDomesticProductGrid;

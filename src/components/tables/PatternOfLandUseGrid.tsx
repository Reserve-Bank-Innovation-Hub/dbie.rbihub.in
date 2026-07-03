"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { LandUseRow } from "@/lib/api/tables/pattern-of-land-use-and-select-inputs-for-agricultural-production";

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

interface PatternOfLandUseGridProps {
    data : LandUseRow[];
}

const PatternOfLandUseGrid : React.FC<PatternOfLandUseGridProps> = ({ data }) => {
    // 1-decimal formatter for area and fertiliser/pesticide values
    const decimalFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    };

    // Column definitions
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
                field          : "net_sown_area",
                headerName     : "Net sown area",
                flex           : 1,
                minWidth       : 150,
                type           : "numericColumn",
                valueFormatter : decimalFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "gross_sown_area",
                headerName     : "Gross sown area",
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : decimalFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "net_irrigated_area",
                headerName     : "Net irrigated area",
                flex           : 1,
                minWidth       : 170,
                type           : "numericColumn",
                valueFormatter : decimalFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "gross_irrigated_area",
                headerName     : "Gross irrigated area",
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : decimalFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "area_hyv",
                headerName     : "HYV area",
                flex           : 1,
                minWidth       : 140,
                type           : "numericColumn",
                valueFormatter : decimalFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "fertiliser_consumption",
                headerName     : "Fertiliser consumption (lakh t)",
                flex           : 1,
                minWidth       : 210,
                type           : "numericColumn",
                valueFormatter : decimalFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "pesticide_consumption",
                headerName     : "Pesticide consumption ('000 t)",
                flex           : 1,
                minWidth       : 210,
                type           : "numericColumn",
                valueFormatter : decimalFormatter,
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
        <div className="pattern-of-land-use-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[25, 50, 100]}
                domLayout="normal"
                suppressCellFocus={true}
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default PatternOfLandUseGrid;

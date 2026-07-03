"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { YieldPerHectareMajorCommercialCropsRow, YieldPerHectareMajorCommercialCropsColumns } from "@/lib/api/tables/yield-per-hectare-major-commercial-crops";

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

interface YieldPerHectareMajorCommercialCropsGridProps {
    data    : YieldPerHectareMajorCommercialCropsRow[];
    columns : YieldPerHectareMajorCommercialCropsColumns;
    unit    : string;
}

const YieldPerHectareMajorCommercialCropsGrid : React.FC<YieldPerHectareMajorCommercialCropsGridProps> = ({ data, columns, unit }) => {
    const numberFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN");
    };

    const columnDefs = useMemo<ColDef[]>(() => {
        const cols : ColDef[] = [
            {
                field      : "year",
                headerName : "Year",
                pinned     : "left",
                width      : 130,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            {
                field          : "groundnut",
                headerName     : `${columns.groundnut} (${unit})`,
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "rapeseedMustard",
                headerName     : `${columns.rapeseedMustard} (${unit})`,
                flex           : 1,
                minWidth       : 200,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "soyabean",
                headerName     : `${columns.soyabean} (${unit})`,
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "totalOilseeds",
                headerName     : `${columns.totalOilseeds} (${unit})`,
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "sugarcane",
                headerName     : `${columns.sugarcane} (${unit})`,
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "tea",
                headerName     : `${columns.tea} (${unit})`,
                flex           : 1,
                minWidth       : 140,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "coffee",
                headerName     : `${columns.coffee} (${unit})`,
                flex           : 1,
                minWidth       : 140,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "cottonLint",
                headerName     : `${columns.cottonLint} (${unit})`,
                flex           : 1,
                minWidth       : 170,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "rawJuteMesta",
                headerName     : `${columns.rawJuteMesta} (${unit})`,
                flex           : 1,
                minWidth       : 190,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "tobacco",
                headerName     : `${columns.tobacco} (${unit})`,
                flex           : 1,
                minWidth       : 150,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
        ];
        return cols;
    }, [ columns, unit ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="yield-per-hectare-major-commercial-crops-grid-wrapper">
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

export default YieldPerHectareMajorCommercialCropsGrid;

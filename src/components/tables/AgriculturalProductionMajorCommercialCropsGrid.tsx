"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { AgriculturalProductionMajorCommercialCropsRow } from "@/lib/api/tables/agricultural-production-major-commercial-crops";

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

interface AgriculturalProductionMajorCommercialCropsGridProps {
    data  : AgriculturalProductionMajorCommercialCropsRow[];
    units : string;
}

const AgriculturalProductionMajorCommercialCropsGrid : React.FC<AgriculturalProductionMajorCommercialCropsGridProps> = ({ data, units }) => {
    const numberFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN");
    };

    const columnDefs = useMemo<ColDef[]>(() => {
        const unitLabel = `(${units})`;
        const cols : ColDef[] = [
            {
                field      : "year",
                headerName : "Year",
                pinned     : "left",
                width      : 140,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            {
                field          : "groundnut",
                headerName     : `Groundnut ${unitLabel}`,
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "rapeseed_mustard",
                headerName     : `Rapeseed & mustard ${unitLabel}`,
                flex           : 1,
                minWidth       : 220,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "soyabean",
                headerName     : `Soyabean ${unitLabel}`,
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "total_oilseeds",
                headerName     : `Total oilseeds ${unitLabel}`,
                flex           : 1,
                minWidth       : 200,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "coffee",
                headerName     : `Coffee ${unitLabel}`,
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "cotton_lint",
                headerName     : `Cotton lint ${unitLabel}`,
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "raw_jute_mesta",
                headerName     : `Raw jute & mesta ${unitLabel}`,
                flex           : 1,
                minWidth       : 210,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "sugarcane",
                headerName     : `Sugarcane ${unitLabel}`,
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "tea",
                headerName     : `Tea ${unitLabel}`,
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
        ];
        return cols;
    }, [ units ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="agricultural-production-major-commercial-crops-grid-wrapper">
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

export default AgriculturalProductionMajorCommercialCropsGrid;

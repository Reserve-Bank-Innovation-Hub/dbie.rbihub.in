"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { AgriculturalProductionFoodgrainsRow } from "@/lib/api/tables/agricultural-production-foodgrains";

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

interface AgriculturalProductionFoodgrainsGridProps {
    data  : AgriculturalProductionFoodgrainsRow[];
    units : string;
}

const AgriculturalProductionFoodgrainsGrid : React.FC<AgriculturalProductionFoodgrainsGridProps> = ({ data, units }) => {
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
                field          : "rice",
                headerName     : `Rice ${unitLabel}`,
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "wheat",
                headerName     : `Wheat ${unitLabel}`,
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "coarse_cereals",
                headerName     : `Coarse cereals ${unitLabel}`,
                flex           : 1,
                minWidth       : 190,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "total_cereals",
                headerName     : `Total cereals ${unitLabel}`,
                flex           : 1,
                minWidth       : 190,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "pulses",
                headerName     : `Pulses ${unitLabel}`,
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
        <div className="agricultural-production-foodgrains-grid-wrapper">
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

export default AgriculturalProductionFoodgrainsGrid;

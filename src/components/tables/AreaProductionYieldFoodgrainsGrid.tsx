"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { AreaProductionYieldRow, AreaProductionYieldColumns } from "@/lib/api/tables/index-numbers-of-area-production-and-yield-of-foodgrains-non-foodgrains";

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

interface AreaProductionYieldFoodgrainsGridProps {
    data    : AreaProductionYieldRow[];
    columns : AreaProductionYieldColumns;
    base    : string;
}

const AreaProductionYieldFoodgrainsGrid : React.FC<AreaProductionYieldFoodgrainsGridProps> = ({ data, columns }) => {
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
                field          : "foodGrainsArea",
                headerName     : columns.foodGrainsArea,
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "foodGrainsProduction",
                headerName     : columns.foodGrainsProduction,
                flex           : 1,
                minWidth       : 210,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "foodGrainsYield",
                headerName     : columns.foodGrainsYield,
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "nonFoodGrainsArea",
                headerName     : columns.nonFoodGrainsArea,
                flex           : 1,
                minWidth       : 210,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "nonFoodGrainsProduction",
                headerName     : columns.nonFoodGrainsProduction,
                flex           : 1,
                minWidth       : 240,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "nonFoodGrainsYield",
                headerName     : columns.nonFoodGrainsYield,
                flex           : 1,
                minWidth       : 210,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "allCropsArea",
                headerName     : columns.allCropsArea,
                flex           : 1,
                minWidth       : 170,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "allCropsProduction",
                headerName     : columns.allCropsProduction,
                flex           : 1,
                minWidth       : 200,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "allCropsYield",
                headerName     : columns.allCropsYield,
                flex           : 1,
                minWidth       : 170,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
        ];
        return cols;
    }, [ columns ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="area-production-yield-foodgrains-grid-wrapper">
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
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default AreaProductionYieldFoodgrainsGrid;

"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { AgriProductionMajorCropsRow, AgriProductionMajorCropsColumns } from "@/lib/api/tables/index-numbers-of-agricultural-production-major-crops";

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

interface AgriProductionMajorCropsGridProps {
    data    : AgriProductionMajorCropsRow[];
    columns : AgriProductionMajorCropsColumns;
    base    : string;
}

const AgriProductionMajorCropsGrid : React.FC<AgriProductionMajorCropsGridProps> = ({ data, columns, base }) => {
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
            field          : "allCrops",
            headerName     : columns.allCrops,
            flex           : 1,
            minWidth       : 140,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "foodGrains",
            headerName     : columns.foodGrains,
            flex           : 1,
            minWidth       : 140,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "cereals",
            headerName     : columns.cereals,
            flex           : 1,
            minWidth       : 120,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "rice",
            headerName     : columns.rice,
            flex           : 1,
            minWidth       : 100,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "wheat",
            headerName     : columns.wheat,
            flex           : 1,
            minWidth       : 100,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "coarseCereals",
            headerName     : columns.coarseCereals,
            flex           : 1,
            minWidth       : 160,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "pulses",
            headerName     : columns.pulses,
            flex           : 1,
            minWidth       : 100,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "nonFoodGrains",
            headerName     : columns.nonFoodGrains,
            flex           : 1,
            minWidth       : 160,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "oilSeeds",
            headerName     : columns.oilSeeds,
            flex           : 1,
            minWidth       : 120,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "sugarcane",
            headerName     : columns.sugarcane,
            flex           : 1,
            minWidth       : 130,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "cottonLint",
            headerName     : columns.cottonLint,
            flex           : 1,
            minWidth       : 160,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "jute",
            headerName     : columns.jute,
            flex           : 1,
            minWidth       : 100,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "tea",
            headerName     : columns.tea,
            flex           : 1,
            minWidth       : 100,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "coffee",
            headerName     : columns.coffee,
            flex           : 1,
            minWidth       : 100,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "rubber",
            headerName     : columns.rubber,
            flex           : 1,
            minWidth       : 110,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "fruitsVegetables",
            headerName     : columns.fruitsVegetables,
            flex           : 1,
            minWidth       : 200,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "tobacco",
            headerName     : columns.tobacco,
            flex           : 1,
            minWidth       : 110,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "groundnut",
            headerName     : columns.groundnut,
            flex           : 1,
            minWidth       : 130,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "sesamum",
            headerName     : columns.sesamum,
            flex           : 1,
            minWidth       : 120,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "rapeseedMustard",
            headerName     : columns.rapeseedMustard,
            flex           : 1,
            minWidth       : 200,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "coconut",
            headerName     : columns.coconut,
            flex           : 1,
            minWidth       : 120,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "fibres",
            headerName     : columns.fibres,
            flex           : 1,
            minWidth       : 110,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "guarseed",
            headerName     : columns.guarseed,
            flex           : 1,
            minWidth       : 120,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "condimentsSpices",
            headerName     : columns.condimentsSpices,
            flex           : 1,
            minWidth       : 210,
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
        <div className="agri-production-major-crops-grid-wrapper">
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

export default AgriProductionMajorCropsGrid;

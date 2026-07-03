"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { MspNonFoodgrainsRow } from "@/lib/api/tables/minimum-support-price-for-non-foodgrains-according-to-crop-year-fair";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface MspNonFoodgrainsGridProps {
    data  : MspNonFoodgrainsRow[];
    units : string;
}

const MspNonFoodgrainsGrid : React.FC<MspNonFoodgrainsGridProps> = ({ data, units }) => {
    const numberFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN");
    };

    const columnDefs = useMemo<ColDef[]>(() => {
        const cols : ColDef[] = [
            {
                field      : "year",
                headerName : "Crop year",
                pinned     : "left",
                width      : 130,
                filter     : true,
                cellStyle  : { fontWeight: "500", textAlign: "left" as const },
            },
            {
                field          : "sugarcane",
                headerName     : `Sugarcane (${units})`,
                flex           : 1,
                minWidth       : 150,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "cotton",
                headerName     : `Cotton (${units})`,
                flex           : 1,
                minWidth       : 130,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "jute",
                headerName     : `Jute (${units})`,
                flex           : 1,
                minWidth       : 120,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "groundnut_in_shell",
                headerName     : `Groundnut in shell (${units})`,
                flex           : 1,
                minWidth       : 190,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "soyabean_black",
                headerName     : `Soyabean black (${units})`,
                flex           : 1,
                minWidth       : 170,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "soyabean_yellow",
                headerName     : `Soyabean yellow (${units})`,
                flex           : 1,
                minWidth       : 175,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "sunflower_seed",
                headerName     : `Sunflower seed (${units})`,
                flex           : 1,
                minWidth       : 170,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "rapeseed_mustard",
                headerName     : `Rapeseed / mustard (${units})`,
                flex           : 1,
                minWidth       : 195,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "safflower",
                headerName     : `Safflower (${units})`,
                flex           : 1,
                minWidth       : 150,
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
        <div className="msp-non-foodgrains-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={51}
                paginationPageSizeSelector={[25, 51, 100]}
                domLayout="normal"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default MspNonFoodgrainsGrid;

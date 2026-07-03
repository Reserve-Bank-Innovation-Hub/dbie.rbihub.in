"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { MspFoodgrainsRow } from "@/lib/api/tables/minimum-support-price-for-foodgrains-according-to-crop-year-fair-average";

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

interface MspFoodgrainsGridProps {
    data  : MspFoodgrainsRow[];
    units : string;
}

const MspFoodgrainsGrid : React.FC<MspFoodgrainsGridProps> = ({ data, units }) => {
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
                cellStyle  : { fontWeight: "500" },
            },
            {
                field          : "paddy_common",
                headerName     : `Paddy common (${units})`,
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "maize",
                headerName     : `Maize (${units})`,
                flex           : 1,
                minWidth       : 130,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "wheat",
                headerName     : `Wheat (${units})`,
                flex           : 1,
                minWidth       : 130,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "gram",
                headerName     : `Gram (${units})`,
                flex           : 1,
                minWidth       : 130,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "arhar_tur",
                headerName     : `Arhar / Tur (${units})`,
                flex           : 1,
                minWidth       : 150,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "moong",
                headerName     : `Moong (${units})`,
                flex           : 1,
                minWidth       : 130,
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
        <div className="msp-foodgrains-grid-wrapper">
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

export default MspFoodgrainsGrid;

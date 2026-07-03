"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { ForexReservesWeeklyRow } from "@/lib/api/tables/forex-reserves-weekly";

// Register AG Grid modules
ModuleRegistry.registerModules([ AllCommunityModule ]);

// Create custom theme
const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface ForexReservesWeeklyGridProps {
    data : ForexReservesWeeklyRow[];
}

// Helper for a right-aligned numeric column
function numCol(field : keyof ForexReservesWeeklyRow, headerName : string, minWidth = 150) : ColDef {
    return {
        field,
        headerName,
        flex           : 1,
        minWidth,
        type           : "numericColumn",
        valueFormatter : (params) => (params.value == null ? "—" : Number(params.value).toLocaleString("en-IN")),
        cellStyle      : { textAlign : "right" },
    };
}

const ForexReservesWeeklyGrid : React.FC<ForexReservesWeeklyGridProps> = ({ data }) => {
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => [
        {
            field      : "weekEnded",
            headerName : "Week ended",
            pinned     : "left",
            width      : 160,
            filter     : true,
            cellStyle  : { fontWeight : "500" },
        },
        {
            headerName    : "1  Total reserves",
            marryChildren : true,
            children      : [
                numCol("totalReservesINR", "₹ Crores"),
                numCol("totalReservesUSD", "US $Millions"),
            ],
        },
        {
            headerName    : "1.1  Foreign currency assets",
            marryChildren : true,
            children      : [
                numCol("foreignCurrencyINR", "₹ Crores"),
                numCol("foreignCurrencyUSD", "US $Millions"),
            ],
        },
        {
            headerName    : "1.2  Gold",
            marryChildren : true,
            children      : [
                numCol("goldINR", "₹ Crores"),
                numCol("goldUSD", "US $Millions"),
                numCol("goldVolumeMT", "Volume (metric tonnes)", 180),
            ],
        },
        {
            headerName    : "1.3  SDRs",
            marryChildren : true,
            children      : [
                numCol("sdrsINR", "₹ Crores"),
                numCol("sdrsMillion", "SDRs Millions"),
                numCol("sdrsUSD", "US $Millions"),
            ],
        },
        {
            headerName    : "1.4  Reserve tranche position in IMF",
            marryChildren : true,
            children      : [
                numCol("reserveTrancheINR", "₹ Crores"),
            ],
        },
    ], []);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="forex-reserves-weekly-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={52}
                paginationPageSizeSelector={[ 26, 52, 104, 260 ]}
                domLayout="normal"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default ForexReservesWeeklyGrid;

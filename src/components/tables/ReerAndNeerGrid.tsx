"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { ReerAndNeerRow } from "@/lib/api/tables/reer-and-neer";

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

interface ReerAndNeerGridProps {
    data : ReerAndNeerRow[];
}

const ReerAndNeerGrid : React.FC<ReerAndNeerGridProps> = ({ data }) => {
    // Format to 2 decimal places; null → em-dash.
    const numberFormatter = (params : any) => {
        if (params.value == null) return "—";
        return params.value.toLocaleString("en-IN", {
            minimumFractionDigits : 2,
            maximumFractionDigits : 2,
        });
    };

    // Column definitions with two column groups.
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => [
        {
            field      : "month",
            headerName : "Month",
            pinned     : "left",
            width      : 140,
            filter     : true,
            cellStyle  : { fontWeight: "500" },
        },
        {
            headerName : "Trade-weighted",
            children   : [
                {
                    field          : "trade_neer",
                    headerName     : "NEER",
                    flex           : 1,
                    minWidth       : 120,
                    type           : "numericColumn",
                    valueFormatter : numberFormatter,
                    cellStyle      : { textAlign: "right" },
                },
                {
                    field          : "trade_reer",
                    headerName     : "REER",
                    flex           : 1,
                    minWidth       : 120,
                    type           : "numericColumn",
                    valueFormatter : numberFormatter,
                    cellStyle      : { textAlign: "right" },
                },
            ],
        },
        {
            headerName : "Export-weighted",
            children   : [
                {
                    field          : "export_neer",
                    headerName     : "NEER",
                    flex           : 1,
                    minWidth       : 120,
                    type           : "numericColumn",
                    valueFormatter : numberFormatter,
                    cellStyle      : { textAlign: "right" },
                },
                {
                    field          : "export_reer",
                    headerName     : "REER",
                    flex           : 1,
                    minWidth       : 120,
                    type           : "numericColumn",
                    valueFormatter : numberFormatter,
                    cellStyle      : { textAlign: "right" },
                },
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
        <div className="reer-and-neer-grid-wrapper">
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

export default ReerAndNeerGrid;

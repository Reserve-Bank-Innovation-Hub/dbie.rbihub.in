"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { BsbItem, BsbPeriod } from "@/lib/api/tables/business-of-scheduled-banks";

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

interface BusinessOfScheduledBanksGridProps {
    items   : BsbItem[];
    periods : BsbPeriod[];
    unit    : string;
}

// One AG Grid row: the date plus one field per item index.
interface GridRow {
    date     : string;
    numBanks : number | null;
    [colId : string] : string | number | null;
}

const BusinessOfScheduledBanksGrid : React.FC<BusinessOfScheduledBanksGridProps> = ({ items, periods, unit }) => {
    // Number formatter with commas; null/undefined → "—".
    const numFormatter = (params : any) => {
        if (params.value == null) return "—";
        return Number(params.value).toLocaleString("en-IN");
    };

    // Build AG Grid rowData from periods (newest-first preserved).
    const rowData = useMemo<GridRow[]>(() => {
        return periods.map((p) => {
            const row : GridRow = { date: p.date, numBanks: p.numBanks };
            p.values.forEach((v, i) => { row[`v${i}`] = v; });
            return row;
        });
    }, [ periods ]);

    // One column per item, with a pinned date column and bank-count column.
    const columnDefs = useMemo<ColDef[]>(() => {
        const datCol : ColDef = {
            field      : "date",
            headerName : "As on date",
            pinned     : "left",
            width      : 160,
            filter     : true,
            cellStyle  : { fontWeight : "500" },
        };

        const bankCol : ColDef = {
            field          : "numBanks",
            headerName     : "No. of banks",
            width          : 120,
            type           : "numericColumn",
            valueFormatter : numFormatter,
            cellStyle      : { textAlign : "right" },
        };

        const itemCols : ColDef[] = items.map((item, i) => ({
            field          : `v${i}`,
            headerName     : `${item.code} ${item.label}`,
            headerTooltip  : unit,
            flex           : 1,
            minWidth       : 180,
            type           : "numericColumn",
            valueFormatter : numFormatter,
            cellStyle      : { textAlign : "right" },
        }));

        return [ datCol, bankCol, ...itemCols ];
    }, [ items, unit ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="business-of-scheduled-banks-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[ 25, 50, 100, 200 ]}
                domLayout="normal"
                suppressCellFocus={true}
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default BusinessOfScheduledBanksGrid;

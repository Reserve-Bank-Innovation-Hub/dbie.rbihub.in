"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { ReserveMoneyRow, ReserveMoneyColumn } from "@/lib/api/tables/reserve-money";

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

interface ReserveMoneyGridProps {
    data    : ReserveMoneyRow[];
    columns : ReserveMoneyColumn[];
}

// One AG Grid row: the date label plus one value per column index.
interface GridRow {
    date : string;
    [colIdx : string] : string | number | null;
}

const ReserveMoneyGrid : React.FC<ReserveMoneyGridProps> = ({ data, columns }) => {
    // Number formatter — up to 2 decimal places with Indian locale commas.
    const numberFormatter = (params : any) => {
        if (params.value == null) return "—";
        return Number(params.value).toLocaleString("en-IN", {
            maximumFractionDigits : 2,
        });
    };

    // Build rowData: one row per observation date.
    const rowData = useMemo<GridRow[]>(() => {
        return data.map(row => {
            const gridRow : GridRow = { date : row.date };
            columns.forEach((_col, ci) => {
                gridRow[`c${ci}`] = row.values[ci] ?? null;
            });
            return gridRow;
        });
    }, [ data, columns ]);

    // Build column groups: total / components / sources.
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const dateCol : ColDef = {
            field      : "date",
            headerName : "Date",
            pinned     : "left",
            width      : 160,
            filter     : true,
            cellStyle  : { fontWeight : "500" },
        };

        const makeCol = (col : ReserveMoneyColumn, ci : number) : ColDef => ({
            field          : `c${ci}`,
            headerName     : col.label,
            headerTooltip  : `${col.code} — ${col.label}`,
            minWidth       : col.group === "total" ? 180 : 200,
            flex           : 1,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : col.group === "total"
                ? { fontWeight : "600", textAlign : "right", backgroundColor : "#f0f9ff" }
                : { textAlign : "right" },
        });

        // Group columns by their group label.
        const groupLabels : Record<ReserveMoneyColumn["group"], string> = {
            total      : "Reserve money",
            components : "1 Components",
            sources    : "2 Sources",
        };

        const groups = new Map<string, ColGroupDef>();
        const orderedGroups : ColGroupDef[] = [];

        columns.forEach((col, ci) => {
            const label = groupLabels[col.group];
            let group = groups.get(label);
            if (!group) {
                group = { headerName : label, children : [] };
                groups.set(label, group);
                orderedGroups.push(group);
            }
            (group.children as ColDef[]).push(makeCol(col, ci));
        });

        return [ dateCol, ...orderedGroups ];
    }, [ columns ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        resizable       : true,
        suppressMovable : true,
        filter          : true,
    }), []);

    return (
        <div className="reserve-money-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[ 25, 50, 100, 200 ]}
                domLayout="autoHeight"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                enableBrowserTooltips={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default ReserveMoneyGrid;

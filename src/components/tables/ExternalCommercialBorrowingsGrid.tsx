"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { ECBColumn, ECBRow } from "@/lib/api/tables/external-commercial-borrowings";

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

interface ExternalCommercialBorrowingsGridProps {
    columns : ECBColumn[];
    rows    : ECBRow[];
    unit    : string;
}

// One AG Grid row: period + one field per column index.
interface GridRow {
    period : string;
    [key   : string] : number | null | string;
}

const ExternalCommercialBorrowingsGrid : React.FC<ExternalCommercialBorrowingsGridProps> = ({ columns, rows, unit }) => {
    const numFormatter = (params : any) => {
        if (params.value == null) return "—";
        return Number(params.value).toLocaleString("en-IN");
    };

    // Build AG Grid rowData: one row per month, period = "FY Mon".
    const rowData = useMemo<GridRow[]>(() => {
        return rows.map((row) => {
            const gr : GridRow = { period : `${row.fy}  ${row.month}` };
            row.values.forEach((v, i) => { gr[`c${i}`] = v; });
            return gr;
        });
    }, [ rows ]);

    // Build column groups: group columns by their `group` field, preserving order.
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const periodCol : ColDef = {
            field      : "period",
            headerName : "Period",
            pinned     : "left",
            width      : 165,
            filter     : true,
            cellStyle  : { fontWeight : "500" },
        };

        // Collect groups in first-seen order.
        const groupMap = new Map<string, (ColDef | ColGroupDef)[]>();
        const groupOrder : string[] = [];

        columns.forEach((col, i) => {
            if (!groupMap.has(col.group)) {
                groupMap.set(col.group, []);
                groupOrder.push(col.group);
            }

            // Column 8 (5.2 interest rate range) is a text range like "0.00–11.50", not a number.
            const isTextCol = col.code === "5.2";

            const child : ColDef = {
                field          : `c${i}`,
                headerName     : col.label,
                headerTooltip  : `${col.label} (${unit})`,
                width          : isTextCol ? 170 : (col.label.toLowerCase().includes("number") ? 120 : 140),
                type           : isTextCol ? undefined : "numericColumn",
                valueFormatter : isTextCol ? undefined : numFormatter,
                cellStyle      : isTextCol ? undefined : { textAlign : "right" },
            };

            groupMap.get(col.group)!.push(child);
        });

        const groups : ColGroupDef[] = groupOrder.map((grp) => ({
            headerName    : grp,
            children      : groupMap.get(grp)!,
            marryChildren : true,
        }));

        return [ periodCol, ...groups ];
    }, [ columns, unit ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="external-commercial-borrowings-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={24}
                paginationPageSizeSelector={[ 12, 24, 48, 84 ]}
                domLayout="normal"
                suppressCellFocus={true}
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default ExternalCommercialBorrowingsGrid;

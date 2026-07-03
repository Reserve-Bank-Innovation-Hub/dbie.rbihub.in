"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { LiquidityAggregateColumn, LiquidityAggregateRow } from "@/lib/api/tables/liquidity-aggregates";

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

interface LiquidityAggregatesGridProps {
    columns : LiquidityAggregateColumn[];
    data    : LiquidityAggregateRow[];
}

// One AG Grid row: the period label plus one field per column index.
interface GridRow {
    period : string;
    [colIdx : string] : string | number | null;
}

// Map each column code to a human-readable group header.
// Codes ending in " (Excl.)" are merged into the same group as their base code.
function groupHeaderForCode(code : string) : string {
    const base = code.replace(/\s*\(Excl\.\)\s*$/, "").trim();
    const LABELS : Record<string, string> = {
        "1"   : "1  NM3",
        "2"   : "2  Postal deposits",
        "3"   : "3  L1 (1+2)",
        "4"   : "4  Liabilities of financial institutions",
        "4.1" : "4.1  Term money borrowings",
        "4.2" : "4.2  Certificates of deposit",
        "4.3" : "4.3  Term deposits",
        "5"   : "5  L2 (3+4)",
        "6"   : "6  Public deposits with NBFCs",
    };
    return LABELS[base] ?? base;
}

const LiquidityAggregatesGrid : React.FC<LiquidityAggregatesGridProps> = ({ columns, data }) => {
    // Format numbers with commas; return "—" for null.
    const numFormatter = (params : any) => {
        if (params.value == null) return "—";
        return Number(params.value).toLocaleString("en-IN");
    };

    // Build AG Grid rowData: one row per data entry.
    const rowData = useMemo<GridRow[]>(() => {
        return data.map((row) => {
            const gr : GridRow = { period : row.period };
            row.values.forEach((v, i) => { gr[`c${i}`] = v; });
            return gr;
        });
    }, [ data ]);

    // Build column groups: one ColGroupDef per unique base code, preserving source order.
    // The "(Excl.)" variants are placed as children of the same group as their main column.
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const periodCol : ColDef = {
            field      : "period",
            headerName : "Period",
            pinned     : "left",
            width      : 170,
            filter     : true,
            cellStyle  : { fontWeight : "500" },
        };

        const groups : ColGroupDef[] = [];
        // Key = group header string so that (Excl.) variants fall under the same parent.
        const seenGroups = new Map<string, ColGroupDef>();

        columns.forEach((col, i) => {
            const groupHeader = groupHeaderForCode(col.code);
            let group = seenGroups.get(groupHeader);
            if (!group) {
                group = {
                    headerName    : groupHeader,
                    children      : [],
                    marryChildren : true,
                };
                seenGroups.set(groupHeader, group);
                groups.push(group);
            }

            const isExcl = col.code.includes("(Excl.)");
            const subCol : ColDef = {
                field          : `c${i}`,
                headerName     : isExcl ? "Excl. merger" : col.label,
                headerTooltip  : col.label,
                width          : isExcl ? 140 : 160,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : { textAlign : "right" },
            };
            (group.children as ColDef[]).push(subCol);
        });

        return [ periodCol, ...groups ];
    }, [ columns ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="liquidity-aggregates-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                domLayout="autoHeight"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={false}
            />
        </div>
    );
};

export default LiquidityAggregatesGrid;

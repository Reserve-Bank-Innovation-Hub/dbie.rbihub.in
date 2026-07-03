"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { NewCapitalIssueColumn, NewCapitalIssueRow } from "@/lib/api/tables/new-capital-issues";

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

interface NewCapitalIssuesGridProps {
    columns : NewCapitalIssueColumn[];
    rows    : NewCapitalIssueRow[];
    unit    : string;
}

// One AG Grid row: the period label plus one field per column index.
interface GridRow {
    period : string;
    [colIdx : string] : string | number | null;
}

// Section codes and their display labels (for column group headers).
const SECTION_LABELS : Record<string, string> = {
    "1"   : "1  Equity shares",
    "1.1" : "1.1 Public",
    "1.2" : "1.2 Rights",
    "2"   : "2  Public issue of bonds/debentures",
    "3"   : "3  Total (1+2)",
    "3.1" : "3.1 Public",
    "3.2" : "3.2 Rights",
};

const NewCapitalIssuesGrid : React.FC<NewCapitalIssuesGridProps> = ({ columns, rows, unit }) => {
    // Format numbers with commas; return "—" for null.
    const numFormatter = (params : any) => {
        if (params.value == null) return "—";
        return Number(params.value).toLocaleString("en-IN");
    };

    // Build AG Grid rowData: one row per data entry, period = "FY Month".
    const rowData = useMemo<GridRow[]>(() => {
        return rows.map((row) => {
            const gr : GridRow = { period : `${row.year} ${row.month}` };
            row.values.forEach((v, i) => { gr[`c${i}`] = v; });
            return gr;
        });
    }, [ rows ]);

    // Build column groups: one ColGroupDef per unique section code.
    // Within each group, one sub-column per measure (No. of issues / Amount).
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const periodCol : ColDef = {
            field      : "period",
            headerName : "Period",
            pinned     : "left",
            width      : 160,
            filter     : true,
            cellStyle  : { fontWeight : "500" },
        };

        // Group columns by code, preserving first-occurrence order.
        const groups : ColGroupDef[] = [];
        const seenCodes = new Map<string, ColGroupDef>();

        columns.forEach((col, i) => {
            let group = seenCodes.get(col.code);
            if (!group) {
                group = {
                    headerName : SECTION_LABELS[col.code] ?? col.code,
                    children   : [],
                    marryChildren : true,
                };
                seenCodes.set(col.code, group);
                groups.push(group);
            }
            const subCol : ColDef = {
                field          : `c${i}`,
                headerName     : col.measure === "no_of_issues" ? "No. of issues" : `Amount (₹ cr.)`,
                headerTooltip  : col.measure === "amount" ? unit : "Number of issues",
                width          : col.measure === "no_of_issues" ? 130 : 150,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : { textAlign : "right" },
            };
            (group.children as ColDef[]).push(subCol);
        });

        return [ periodCol, ...groups ];
    }, [ columns, unit ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="new-capital-issues-grid-wrapper">
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

export default NewCapitalIssuesGrid;

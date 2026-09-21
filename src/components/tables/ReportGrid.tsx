"use client";

// A DBIE report as the site's other tables are shown: an AG Grid in the theme every grid here uses, the row labels
// pinned on the left, DBIE's upper header rows as column groups, figures right-aligned and sorted and filtered as
// numbers while showing exactly what DBIE printed.

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { ReportGrid as ParsedReport, isNumericColumn, parseNumber } from "@/lib/tables/report-grid";

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

interface ReportGridProps {
    grid : ParsedReport;
}

interface ReportRow {
    cells : string[];
}

const joinHeading = (...parts : string[]) : string => parts.filter(Boolean).join(" · ");

const ReportGrid : React.FC<ReportGridProps> = ({ grid }) => {
    const rowData = useMemo<ReportRow[]>(() => grid.body.map(cells => ({ cells })), [ grid ]);

    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const leaf    = grid.header.length > 0 ? grid.header[grid.header.length - 1] : [];
        const upper   = grid.header.slice(0, -1);
        const numeric = Array.from({ length : grid.width }, (_, c) => c > 0 && isNumericColumn(grid.body.map(row => row[c])));

        // The row labels' column is as wide as its longest label asks, within reason; long ones wrap.
        const longest    = grid.body.reduce((n, row) => Math.max(n, row[0].length), 0);
        const labelWidth = Math.min(420, Math.max(140, longest * 7 + 48));

        // One column per cell of the leaf header row; the first holds the row labels. A column whose own header is
        // blank takes the heading above it, else DBIE's column number.
        const column = (c : number, above : string) : ColDef => {
            const headerName = joinHeading(above, leaf[c]?.text ?? "") || grid.numbering?.[c] || "";
            if (c === 0) {
                return {
                    colId       : "c0",
                    headerName,
                    pinned      : "left",
                    width       : labelWidth,
                    minWidth    : 140,
                    filter      : "agTextColumnFilter",
                    wrapText    : true,
                    autoHeight  : true,
                    valueGetter : (p : { data ? : ReportRow }) => p.data?.cells[0] ?? "",
                    cellStyle   : { fontWeight : "500" },
                };
            }
            if (numeric[c]) {
                return {
                    colId          : `c${c}`,
                    headerName,
                    type           : "numericColumn",
                    filter         : "agNumberColumnFilter",
                    minWidth       : 120,
                    flex           : 1,
                    valueGetter    : (p : { data ? : ReportRow }) => parseNumber(p.data?.cells[c] ?? ""),
                    valueFormatter : (p : { data ? : ReportRow }) => p.data?.cells[c] ?? "",
                    cellStyle      : { textAlign : "right" },
                };
            }
            return {
                colId       : `c${c}`,
                headerName,
                filter      : "agTextColumnFilter",
                minWidth    : 160,
                flex        : 1,
                valueGetter : (p : { data ? : ReportRow }) => p.data?.cells[c] ?? "",
            };
        };

        // DBIE's upper header rows become column groups: a heading covers the columns under it. A heading over one
        // column (Year, Quarter) is that column's name rather than a group of one.
        const build = (level : number, from : number, to : number, above : string) : (ColDef | ColGroupDef)[] => {
            if (level >= upper.length) return Array.from({ length : to - from }, (_, i) => column(from + i, above));
            const out : (ColDef | ColGroupDef)[] = [];
            let start = 0;
            for (const cell of upper[level]) {
                const end = start + cell.span;
                const lo  = Math.max(start, from);
                const hi  = Math.min(end, to);
                start = end;
                if (lo >= hi) continue;
                if (cell.text && hi - lo > 1) out.push({ headerName : joinHeading(above, cell.text), children : build(level + 1, lo, hi, "") });
                else out.push(...build(level + 1, lo, hi, joinHeading(above, cell.text)));
            }
            return out;
        };

        return build(0, 0, grid.width, "");
    }, [ grid ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable         : true,
        filter           : true,
        resizable        : true,
        suppressMovable  : true,
        wrapHeaderText   : true,
        autoHeaderHeight : true,
    }), []);

    return (
        <div className="report-grid-wrapper">
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
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default ReportGrid;

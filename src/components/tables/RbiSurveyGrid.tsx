"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { RbiSurveyColumn, RbiSurvey } from "@/lib/api/tables/rbi-survey";

ModuleRegistry.registerModules([ AllCommunityModule ]);

const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface RbiSurveyGridProps {
    data : RbiSurvey;
}

// One AG Grid row: the period label plus one value per column index.
interface GridRow {
    period : string;
    [colIdx : string] : string | number | null;
}

// Reserve Money (C.IV) is the headline aggregate.
const AGGREGATE_CODES = new Set([ "C.IV" ]);

// Return the group label for a column based on its code prefix.
function groupFor(code : string) : string {
    if (code === "C.I" || code === "C.II" || code === "C.II.1") return "Currency liabilities (C series)";
    if (code === "C.III")                                         return "Currency liabilities (C series)";
    if (code === "C.IV")                                          return "Reserve money";
    if (code.startsWith("S.I"))                                   return "RBI domestic credit (S.I)";
    if (code.startsWith("S.II"))                                  return "Government currency liabilities (S.II)";
    if (code.startsWith("S.III"))                                 return "Foreign assets (S.III)";
    if (code.startsWith("S.IV"))                                  return "Capital account (S.IV)";
    return "Other";
}

const RbiSurveyGrid : React.FC<RbiSurveyGridProps> = ({ data }) => {
    const numFormatter = (params : any) => {
        if (params.value == null) return "—";
        return Number(params.value).toLocaleString("en-IN", {
            minimumFractionDigits : 2,
            maximumFractionDigits : 4,
        });
    };

    // Build rowData: one row per period.
    const rowData = useMemo<GridRow[]>(() => {
        return data.periods.map((period, pi) => {
            const row : GridRow = { period };
            data.columns.forEach((col, ci) => {
                row[`c${ci}`] = data.values[pi][ci];
            });
            return row;
        });
    }, [ data ]);

    // Build column groups: C series / Reserve Money / S.I / S.II / S.III / S.IV.
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const periodCol : ColDef = {
            field      : "period",
            headerName : "Period",
            pinned     : "left",
            width      : 130,
            filter     : true,
            cellStyle  : { fontWeight : "500" },
        };

        const makeCol = (col : RbiSurveyColumn, ci : number) : ColDef => {
            const isAggregate = AGGREGATE_CODES.has(col.code);
            // Indent sub-items by dotted depth (e.g. S.I.1.1.1 → 3 dots beyond S = depth 4)
            const depth  = col.code.split(".").length - 1;
            const indent = "  ".repeat(Math.max(0, depth - 1));
            return {
                field          : `c${ci}`,
                headerName     : `${indent}${col.code}`,
                headerTooltip  : col.label,
                width          : 140,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : isAggregate
                    ? { fontWeight : "700", textAlign : "right", backgroundColor : "#f0f9ff" }
                    : { textAlign : "right" },
            };
        };

        // Group columns by series, preserving source order.
        const groups : ColGroupDef[] = [];
        const groupByLabel = new Map<string, ColGroupDef>();

        data.columns.forEach((col, ci) => {
            const label = groupFor(col.code);
            let group = groupByLabel.get(label);
            if (!group) {
                group = { headerName : label, children : [] };
                groupByLabel.set(label, group);
                groups.push(group);
            }
            (group.children as ColDef[]).push(makeCol(col, ci));
        });

        return [ periodCol, ...groups ];
    }, [ data ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="rbi-survey-grid-wrapper">
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
                enableBrowserTooltips={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default RbiSurveyGrid;

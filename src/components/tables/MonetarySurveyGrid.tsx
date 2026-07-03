"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { MonetarySurveyColumn, MonetarySurvey } from "@/lib/api/tables/monetary-survey";

ModuleRegistry.registerModules([ AllCommunityModule ]);

const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface MonetarySurveyGridProps {
    data : MonetarySurvey;
}

// One AG Grid row: the period label plus one value per column index.
interface GridRow {
    period : string;
    [colIdx : string] : string | number | null;
}

// Codes whose column should appear with a highlighted background — the top-level
// money stock aggregates.
const AGGREGATE_CODES = new Set([ "NM1", "NM2", "NM3" ]);

// Return the group label for a column based on its code prefix.
function groupFor(code : string) : string {
    if (code.startsWith("NM"))                 return "Money stock (NM series)";
    if (code.startsWith("C."))                 return "Components (C series)";
    if (code.startsWith("S."))                 return "Sources (S series)";
    return "Other";
}

const MonetarySurveyGrid : React.FC<MonetarySurveyGridProps> = ({ data }) => {
    const numFormatter = (params : any) => {
        if (params.value == null) return "—";
        return Number(params.value).toLocaleString("en-IN", {
            minimumFractionDigits : 2,
            maximumFractionDigits : 3,
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

    // Build column groups: NM series / C series / S series.
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const periodCol : ColDef = {
            field      : "period",
            headerName : "Period",
            pinned     : "left",
            width      : 130,
            filter     : true,
            cellStyle  : { fontWeight : "500" },
        };

        const makeCol = (col : MonetarySurveyColumn, ci : number) : ColDef => {
            const isAggregate = AGGREGATE_CODES.has(col.code);
            const isExclMerger = col.code.endsWith("_excl_merger");
            return {
                field          : `c${ci}`,
                headerName     : col.code,
                headerTooltip  : col.label,
                width          : isAggregate ? 160 : 140,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : isAggregate
                    ? { fontWeight : "600", textAlign : "right", backgroundColor : "#f0f9ff" }
                    : isExclMerger
                        ? { textAlign : "right", opacity : "0.7" }
                        : { textAlign : "right" },
            };
        };

        // Group columns by their top-level series (NM, C, S).
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
        <div className="monetary-survey-grid-wrapper">
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

export default MonetarySurveyGrid;

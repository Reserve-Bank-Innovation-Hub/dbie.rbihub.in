"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import {
    StateGovernmentInvestmentsColumn,
    StateGovernmentInvestmentsRow,
} from "@/lib/api/tables/state-government-investments";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Custom theme
const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface StateGovernmentInvestmentsGridProps {
    columns : StateGovernmentInvestmentsColumn[];
    data    : StateGovernmentInvestmentsRow[];
    unit    : string;
    notes   : string[];
}

// Format a number in Indian locale; "—" for null.
const numFormatter = (params : { value : number | null }) => {
    if (params.value == null) return "—";
    return params.value.toLocaleString("en-IN");
};

const rightAlign = { textAlign : "right" as const };

// Shorten a fund name to its abbreviation when one is present in parentheses.
// "Consolidated Sinking Fund (CSF)" → "CSF"
// "Government Securities" → "Govt. Securities"
function shortFundName(fund : string) : string {
    const m = fund.match(/\(([^)]+)\)\s*$/);
    if (m) return m[1];
    if (fund === "Government Securities") return "Govt. Securities";
    return fund;
}

const StateGovernmentInvestmentsGrid : React.FC<StateGovernmentInvestmentsGridProps> = ({
    columns,
    data,
    notes,
}) => {
    // Build AG Grid row objects: { state, col_0: v, col_1: v, … }
    const rowData = useMemo(() => {
        return data.map(row => {
            const obj : Record<string, string | number | null> = { state : row.state };
            columns.forEach((_col, i) => {
                obj[`col_${i}`] = row.values[i] ?? null;
            });
            return obj;
        });
    }, [ columns, data ]);

    // Build grouped column definitions: one ColGroupDef per distinct month.
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        // State pinned left
        const stateDef : ColDef = {
            field      : "state",
            headerName : "State / UT",
            pinned     : "left",
            width      : 200,
            filter     : true,
            cellStyle  : { fontWeight : "500" },
        };

        // Group columns by month (preserve order).
        const monthOrder   : string[]   = [];
        const monthColumns : Record<string, { fund : string; index : number }[]> = {};
        columns.forEach(({ month, fund }, i) => {
            if (!monthColumns[month]) {
                monthColumns[month] = [];
                monthOrder.push(month);
            }
            monthColumns[month].push({ fund, index : i });
        });

        const groups : ColGroupDef[] = monthOrder.map(month => ({
            headerName : month,
            children   : monthColumns[month].map(({ fund, index }) => ({
                field          : `col_${index}`,
                headerName     : shortFundName(fund),
                headerTooltip  : fund,
                flex           : 1,
                minWidth       : 110,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : rightAlign,
            } as ColDef)),
        }));

        return [ stateDef, ...groups ];
    }, [ columns ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : false,
        filter          : false,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="state-government-investments-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={false}
                domLayout="autoHeight"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={false}
            />

            {notes.length > 0 && (
                <div className="state-government-investments-notes">
                    {notes.map((note, i) => (
                        <p key={i}>{note}</p>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StateGovernmentInvestmentsGrid;

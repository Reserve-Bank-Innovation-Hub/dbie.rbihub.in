"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { StateMarketBorrowingsColumn, StateMarketBorrowingsRow } from "@/lib/api/tables/state-market-borrowings";

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

// Format a value in Indian numbering system; "—" for null.
const numFormatter = (params : { value : number | null }) => {
    if (params.value == null) return "—";
    return params.value.toLocaleString("en-IN", { maximumFractionDigits : 2 });
};

const rightAlign = { textAlign : "right" as const };

interface GridProps {
    columns : StateMarketBorrowingsColumn[];
    data    : StateMarketBorrowingsRow[];
}

// Build AG Grid column definitions from the dynamic column list.
// Groups columns by period; each group has Gross and Net children.
function buildColDefs(columns : StateMarketBorrowingsColumn[], data : StateMarketBorrowingsRow[]) : (ColDef | ColGroupDef)[] {
    // Pin state name left.
    const statePinned : ColDef = {
        headerName     : "State / Union territory",
        field          : "state",
        pinned         : "left",
        width          : 220,
        filter         : true,
        cellStyle      : { fontWeight : "500", textAlign : "left" },
        suppressMovable : true,
    };

    // Group columns by period (preserving order, each period = one ColGroupDef).
    const periodsSeen = new Set<string>();
    const groups : Map<string, { gross : number; net : number | null }> = new Map();
    for (let i = 0; i < columns.length; i++) {
        const { period, measure } = columns[i];
        if (!periodsSeen.has(period)) {
            periodsSeen.add(period);
            groups.set(period, { gross : i, net : null });
        }
        if (measure === "net") {
            const g = groups.get(period)!;
            g.net = i;
        }
    }

    const colGroups : ColGroupDef[] = [];
    for (const [period, { gross, net }] of groups) {
        const children : ColDef[] = [
            {
                headerName      : "Gross",
                valueGetter     : (params) => {
                    const row = params.data as { values : (number | null)[] };
                    return row?.values[gross] ?? null;
                },
                flex            : 1,
                minWidth        : 110,
                type            : "numericColumn",
                valueFormatter  : numFormatter,
                cellStyle       : rightAlign,
                suppressMovable : true,
            },
        ];
        if (net !== null) {
            children.push({
                headerName      : "Net",
                valueGetter     : (params) => {
                    const row = params.data as { values : (number | null)[] };
                    return row?.values[net] ?? null;
                },
                flex            : 1,
                minWidth        : 110,
                type            : "numericColumn",
                valueFormatter  : numFormatter,
                cellStyle       : rightAlign,
                suppressMovable : true,
            });
        }
        colGroups.push({ headerName : period, children });
    }

    return [statePinned, ...colGroups];
}

// =====================================================================================================================
// ANNUAL GRID
// =====================================================================================================================
interface AnnualGridProps {
    columns : StateMarketBorrowingsColumn[];
    data    : StateMarketBorrowingsRow[];
}

export const AnnualGrid : React.FC<AnnualGridProps> = ({ columns, data }) => {
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(
        () => buildColDefs(columns, data),
        [ columns, data ],
    );

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="state-market-borrowings-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={false}
                domLayout="autoHeight"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

// =====================================================================================================================
// MONTHLY GRID
// =====================================================================================================================
interface MonthlyGridProps {
    columns : StateMarketBorrowingsColumn[];
    data    : StateMarketBorrowingsRow[];
}

export const MonthlyGrid : React.FC<MonthlyGridProps> = ({ columns, data }) => {
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(
        () => buildColDefs(columns, data),
        [ columns, data ],
    );

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="state-market-borrowings-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={false}
                domLayout="autoHeight"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

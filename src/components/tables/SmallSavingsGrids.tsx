"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { SmallSavingsColumn, SmallSavingsMonthlyRow, SmallSavingsAnnualRow } from "@/lib/api/tables/small-savings";

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

// Format a number in Indian numbering system; "—" for null.
const numFormatter = (params : { value : number | null }) => {
    if (params.value == null) return "—";
    return params.value.toLocaleString("en-IN");
};

// Build column groups dynamically from the columns descriptor.
// Consecutive columns sharing the same group name are merged into one ColGroupDef.
function buildColumnGroups(columns : SmallSavingsColumn[]) : ColGroupDef[] {
    const groups : ColGroupDef[] = [];
    let lastGroup : ColGroupDef | null = null;
    let lastGroupName = '';

    columns.forEach((col, i) => {
        const child : ColDef = {
            headerName     : col.measure,
            valueGetter    : (p) => p.data?.values?.[i] ?? null,
            valueFormatter : numFormatter,
            width          : 140,
            type           : "numericColumn",
            cellStyle      : { textAlign : "right" as const },
        };

        if (col.group !== lastGroupName || !lastGroup) {
            lastGroup = {
                headerName    : col.group,
                children      : [ child ],
                marryChildren : true,
            };
            groups.push(lastGroup);
            lastGroupName = col.group;
        } else {
            (lastGroup.children as ColDef[]).push(child);
        }
    });

    return groups;
}

// =====================================================================================================================
// Monthly grid
// =====================================================================================================================

interface MonthlyGridProps {
    columns : SmallSavingsColumn[];
    data    : SmallSavingsMonthlyRow[];
}

export const MonthlyGrid : React.FC<MonthlyGridProps> = ({ columns, data }) => {
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const pinned : (ColDef | ColGroupDef)[] = [
            {
                field      : "fiscal_year",
                headerName : "Fiscal year",
                pinned     : "left",
                width      : 120,
                filter     : true,
                cellStyle  : { fontWeight : "500" },
            },
            {
                field      : "month",
                headerName : "Month",
                pinned     : "left",
                width      : 110,
                filter     : true,
            },
        ];
        return [ ...pinned, ...buildColumnGroups(columns) ];
    }, [ columns ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="small-savings-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={25}
                paginationPageSizeSelector={[ 10, 25, 50, 100 ]}
                domLayout="normal"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

// =====================================================================================================================
// Annual grid
// =====================================================================================================================

interface AnnualGridProps {
    columns : SmallSavingsColumn[];
    data    : SmallSavingsAnnualRow[];
}

export const AnnualGrid : React.FC<AnnualGridProps> = ({ columns, data }) => {
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const pinned : ColDef = {
            field      : "fiscal_year",
            headerName : "Fiscal year",
            pinned     : "left",
            width      : 120,
            filter     : true,
            cellStyle  : { fontWeight : "500" },
        };
        return [ pinned, ...buildColumnGroups(columns) ];
    }, [ columns ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="small-savings-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={25}
                paginationPageSizeSelector={[ 10, 25, 50, 100 ]}
                domLayout="normal"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

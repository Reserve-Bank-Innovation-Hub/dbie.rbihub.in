"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { HouseholdFinancialFlowsColumn, HouseholdFinancialFlowsRow } from "@/lib/api/tables/household-financial-flows";

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

interface HouseholdFinancialFlowsGridProps {
    columns : HouseholdFinancialFlowsColumn[];
    data    : HouseholdFinancialFlowsRow[];
}

// One AG Grid row: item label plus one field per column index.
interface GridRow {
    item : string;
    [colKey : string] : number | null | string;
}

// Format a value in Indian numbering with up to 1 decimal place; "—" for null.
const numFormatter = (params : { value : number | null }) => {
    if (params.value == null) return "—";
    return params.value.toLocaleString("en-IN", { maximumFractionDigits: 1 });
};

const rightAlign  = { textAlign : "right"  as const };
const rightAlignB = { textAlign : "right"  as const, fontWeight : 600 };

const HouseholdFinancialFlowsGrid : React.FC<HouseholdFinancialFlowsGridProps> = ({ columns, data }) => {
    // Transform data rows into AG Grid rowData.
    const rowData = useMemo<GridRow[]>(() => {
        return data.map(row => {
            const gr : GridRow = { item : row.item };
            row.values.forEach((v, i) => { gr[`c${i}`] = v; });
            return gr;
        });
    }, [ data ]);

    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        // Item column pinned left.
        const itemCol : ColDef = {
            field      : "item",
            headerName : "Item",
            pinned     : "left",
            width      : 320,
            filter     : true,
            cellStyle  : (params : { value : string }) => {
                // Indent "Per cent of GDP" rows.
                const indent = params.value?.startsWith("Per cent") ? "24px" : "4px";
                return { paddingLeft : indent };
            },
        };

        // Group columns by fiscal year; one child per period.
        const groups : ColGroupDef[] = [];
        const seenYears = new Map<string, ColGroupDef>();

        columns.forEach((col, i) => {
            let group = seenYears.get(col.year);
            if (!group) {
                group = {
                    headerName    : col.year,
                    children      : [],
                    marryChildren : true,
                };
                seenYears.set(col.year, group);
                groups.push(group);
            }

            const isAnnual = col.period === "Annual";

            const child : ColDef = {
                field          : `c${i}`,
                headerName     : col.period,
                width          : isAnnual ? 120 : 100,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : isAnnual ? rightAlignB : rightAlign,
                headerClass    : isAnnual ? "ag-header-cell-annual" : undefined,
            };
            (group.children as ColDef[]).push(child);
        });

        return [ itemCol, ...groups ];
    }, [ columns ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : false,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="household-financial-flows-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={false}
                domLayout="autoHeight"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={false}
            />
        </div>
    );
};

export default HouseholdFinancialFlowsGrid;

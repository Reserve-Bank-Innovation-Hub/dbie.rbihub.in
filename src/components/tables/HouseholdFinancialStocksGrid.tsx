"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeQuartz, ColDef } from "ag-grid-community";

// UI ==================================================================================================================
import { Div } from "fictoan-react";

// LIB =================================================================================================================
import { HouseholdFinancialStocks, HouseholdFinancialStocksRow } from "@/lib/api/tables/household-financial-stocks";

ModuleRegistry.registerModules([ AllCommunityModule ]);

const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface HouseholdFinancialStocksGridProps {
    data : HouseholdFinancialStocks;
}

// One row per item: the source row plus one numeric field per period string
// (null for gaps). An index signature covers both fixed and dynamic columns.
interface GridRow {
    _row   : HouseholdFinancialStocksRow;
    [period : string] : HouseholdFinancialStocksRow | number | null;
}

const HouseholdFinancialStocksGrid : React.FC<HouseholdFinancialStocksGridProps> = ({ data }) => {
    const { columns, data : items } = data;

    // Formatter: Indian locale with up to 1 decimal place; null → em-dash.
    const formatAmount = (params : any) => {
        if (params.value == null) return "—";
        return (params.value as number).toLocaleString("en-IN", {
            maximumFractionDigits : 1,
        });
    };

    // Rows: one per indicator item, values keyed by period label.
    const rowData = useMemo<GridRow[]>(() => {
        return items.map((item) => {
            const row : GridRow = { _row : item };
            columns.forEach((col, ci) => {
                row[col] = item.values[ci];
            });
            return row;
        });
    }, [ items, columns ]);

    // Columns: item label pinned left (indented), then one column per quarter-end period.
    const columnDefs = useMemo<ColDef[]>(() => {
        const cols : ColDef[] = [
            {
                field      : "_row",
                headerName : "Item",
                pinned     : "left",
                width      : 320,
                filter     : true,
                resizable  : true,
                valueGetter : (p) => (p.data as GridRow)._row.item,
                cellStyle   : (params) => {
                    const row    = params.data as GridRow;
                    const depth  = row._row.indent;
                    const isTop  = depth === 0;
                    return {
                        textAlign   : "left",
                        paddingLeft : `${8 + depth * 16}px`,
                        fontWeight  : isTop ? "700" : depth === 1 ? "600" : "normal",
                        ...(isTop && { background : "#f0f9ff" }),
                    };
                },
            },
            ...columns.map((col, ci) => ({
                field          : col,
                headerName     : col,
                width          : 140,
                valueGetter    : (p : any) => (p.data as GridRow)[col],
                valueFormatter : formatAmount,
                cellStyle      : (params : any) => {
                    const row   = params.data as GridRow;
                    const isTop = row._row.indent === 0;
                    return {
                        textAlign  : "right",
                        fontWeight : isTop ? "600" : "normal",
                        ...(isTop && { background : "#f0f9ff" }),
                    };
                },
            } as ColDef)),
        ];
        return cols;
    }, [ columns ]);

    return (
        <Div className="household-financial-stocks-grid-wrapper" style={{ display : "flex", flexDirection : "column", flex : 1 }}>
            <div style={{ flex : 1 }}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    theme={customTheme}
                    enableBrowserTooltips={true}
                    defaultColDef={{
                        sortable  : false,
                        resizable : true,
                    }}
                    suppressCellFocus={true}
                    enableCellTextSelection={true}
                    alwaysShowVerticalScroll={true}
                    domLayout="autoHeight"
                />
            </div>
        </Div>
    );
};

export default HouseholdFinancialStocksGrid;

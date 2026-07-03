"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { SdmxSeriesColumn } from "@/lib/api/tables/sdmx-series";

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

// =====================================================================================================================
// WIDE MODE GRID
// Rows are passed in already transposed (col-major → row-major) and newest-first.
// =====================================================================================================================

interface SdmxWideRow {
    period : string;
    values : (number | null)[];
}

interface SdmxSeriesGridProps {
    columns : SdmxSeriesColumn[];
    rows    : SdmxWideRow[];   // newest-first display order
}

const SdmxSeriesGrid : React.FC<SdmxSeriesGridProps> = ({ columns, rows }) => {
    // Build column defs once — Period pinned left, one col per series.
    const columnDefs = useMemo<ColDef[]>(() => {
        const periodCol : ColDef = {
            field      : "period",
            headerName : "Period",
            pinned     : "left",
            width      : 130,
            filter     : true,
            cellStyle  : { fontWeight : "500" },
        };

        const seriesCols : ColDef[] = columns.map((col, i) => {
            const unitSuffix = col.unit && col.unit !== "N_A" ? ` (${col.unit})` : "";
            return {
                headerName     : `${col.label}${unitSuffix}`,
                flex           : 1,
                minWidth       : 140,
                type           : "numericColumn",
                cellStyle      : { textAlign : "right" },
                valueGetter    : (p : { data : SdmxWideRow }) => p.data.values[i],
                valueFormatter : (p : { value : number | null }) => {
                    if (p.value == null) return "—";
                    return p.value.toLocaleString("en-IN", { maximumFractionDigits : 4 });
                },
            };
        });

        return [periodCol, ...seriesCols];
    }, [columns]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="sdmx-series-grid-wrapper">
            <AgGridReact
                rowData={rows}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[25, 50, 100, 200]}
                domLayout="normal"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default SdmxSeriesGrid;

// =====================================================================================================================
// LONG MODE GRID
// Each row is [dim0, dim1, …, unit, date, value] — dimensions first, then unit, date, value.
// Filtering is the main affordance: every dimension column is filterable.
// =====================================================================================================================

// Materialised row object for AG Grid — keyed by dimension name + fixed "unit", "period", "value".
interface SdmxLongRow {
    [key : string] : string | number | null;
}

interface SdmxLongGridProps {
    dimensions : string[];                         // ordered dimension names
    rows       : (string | number | null)[][];     // raw rows from payload (date-descending)
}

export const SdmxLongGrid : React.FC<SdmxLongGridProps> = ({ dimensions, rows }) => {
    // Map raw arrays to objects once.
    // Row layout: [dim0, …, dimN-1, unit, date, value]
    const rowData = useMemo<SdmxLongRow[]>(() => {
        const unitIdx  = dimensions.length;
        const dateIdx  = dimensions.length + 1;
        const valueIdx = dimensions.length + 2;

        return rows.map(raw => {
            const obj : SdmxLongRow = {};
            dimensions.forEach((dim, i) => {
                obj[dim] = raw[i] as string | null;
            });
            obj["unit"]   = raw[unitIdx]  as string | null;
            obj["period"] = raw[dateIdx]  as string | null;
            obj["value"]  = raw[valueIdx] as number | null;
            return obj;
        });
    }, [dimensions, rows]);

    const columnDefs = useMemo<ColDef[]>(() => {
        // One filterable column per dimension, left-aligned.
        const dimCols : ColDef[] = dimensions.map((dim, i) => ({
            field      : dim,
            headerName : dim,
            filter     : true,
            minWidth   : 160,
            flex       : 1,
            ...(i === 0 ? { pinned : "left" } : {}),
        }));

        const unitCol : ColDef = {
            field      : "unit",
            headerName : "Unit",
            filter     : true,
            width      : 100,
        };

        const periodCol : ColDef = {
            field     : "period",
            headerName : "Period",
            filter    : true,
            width     : 130,
            cellStyle : { fontWeight : "500" },
        };

        const valueCol : ColDef = {
            field          : "value",
            headerName     : "Value",
            type           : "numericColumn",
            cellStyle      : { textAlign : "right" },
            minWidth       : 140,
            valueFormatter : (p : { value : number | null }) => {
                if (p.value == null) return "—";
                return p.value.toLocaleString("en-IN", { maximumFractionDigits : 4 });
            },
        };

        return [...dimCols, unitCol, periodCol, valueCol];
    }, [dimensions]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="sdmx-series-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[25, 50, 100, 200]}
                domLayout="normal"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

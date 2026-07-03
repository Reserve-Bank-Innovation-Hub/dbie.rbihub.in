"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { IIPSeries } from "@/lib/api/tables/index-numbers-of-industrial-production";

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

interface IndexNumbersOfIndustrialProductionGridProps {
    series : IIPSeries[];
}

const IndexNumbersOfIndustrialProductionGrid : React.FC<IndexNumbersOfIndustrialProductionGridProps> = ({ series }) => {
    // Display only the most recent series (base 2011-12 = series[0]).
    const currentSeries = series[0];

    // Flatten series data into row objects keyed by column name.
    const rowData = useMemo(() => {
        if (!currentSeries) return [];
        return currentSeries.data.map(row => {
            const obj : Record<string, string | number | null> = { year: row.year };
            currentSeries.columns.forEach((col, i) => {
                obj[col] = row.values[i] ?? null;
            });
            return obj;
        });
    }, [currentSeries]);

    const numberFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN");
    };

    const columnDefs = useMemo<ColDef[]>(() => {
        if (!currentSeries) return [];
        const cols : ColDef[] = [
            {
                field      : "year",
                headerName : "Year",
                pinned     : "left",
                width      : 120,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            ...currentSeries.columns.map<ColDef>(col => ({
                field          : col,
                headerName     : col,
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            })),
        ];
        return cols;
    }, [currentSeries]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    if (!currentSeries) return null;

    return (
        <div className="index-numbers-of-industrial-production-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={25}
                paginationPageSizeSelector={[25, 50, 100]}
                domLayout="normal"
                suppressCellFocus={true}
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default IndexNumbersOfIndustrialProductionGrid;

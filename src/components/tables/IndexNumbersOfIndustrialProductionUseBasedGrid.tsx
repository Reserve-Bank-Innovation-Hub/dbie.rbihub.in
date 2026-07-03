"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { IIPUseBasedSeries } from "@/lib/api/tables/index-numbers-of-industrial-production-use-based-classification";

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

interface IndexNumbersOfIndustrialProductionUseBasedGridProps {
    series : IIPUseBasedSeries[];
}

const IndexNumbersOfIndustrialProductionUseBasedGrid : React.FC<IndexNumbersOfIndustrialProductionUseBasedGridProps> = ({ series }) => {
    // Display the first series (base 2011-12) in the grid.
    const activeSeries = series[0];

    const numberFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN");
    };

    // Build row data: flatten values array into named fields keyed by column index.
    const rowData = useMemo(() => {
        if (!activeSeries) return [];
        return activeSeries.data.map(row => {
            const obj : Record<string, string | number | null> = { year: row.year };
            activeSeries.columns.forEach((col, i) => {
                obj[`col_${i}`] = row.values[i] ?? null;
            });
            return obj;
        });
    }, [ activeSeries ]);

    const columnDefs = useMemo<ColDef[]>(() => {
        if (!activeSeries) return [];

        const cols : ColDef[] = [
            {
                field      : "year",
                headerName : "Year",
                pinned     : "left",
                width      : 120,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
        ];

        activeSeries.columns.forEach((col, i) => {
            cols.push({
                field          : `col_${i}`,
                headerName     : col,
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            });
        });

        return cols;
    }, [ activeSeries ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    if (!activeSeries) return null;

    return (
        <div className="iip-use-based-grid-wrapper">
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

export default IndexNumbersOfIndustrialProductionUseBasedGrid;

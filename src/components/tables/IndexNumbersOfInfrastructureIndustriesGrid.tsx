"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { InfrastructureIndustriesSeries } from "@/lib/api/tables/index-numbers-of-infrastructure-industries";

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

interface IndexNumbersOfInfrastructureIndustriesGridProps {
    series : InfrastructureIndustriesSeries[];
}

const IndexNumbersOfInfrastructureIndustriesGrid : React.FC<IndexNumbersOfInfrastructureIndustriesGridProps> = ({ series }) => {
    // Display series[0] — base 2011-12.
    const activeSeries = series[0];

    const numberFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
    };

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
            ...activeSeries.columns.map((colName, idx) => ({
                headerName     : colName,
                colId          : `col_${idx}`,
                valueGetter    : (p : any) => (p.data ? p.data.values[idx] : null),
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            } satisfies ColDef)),
        ];

        return cols;
    }, [ activeSeries ]);

    const rowData = useMemo(() => {
        if (!activeSeries) return [];
        return activeSeries.data.map((row) => ({ year: row.year, values: row.values }));
    }, [ activeSeries ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="infrastructure-industries-grid-wrapper">
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

export default IndexNumbersOfInfrastructureIndustriesGrid;

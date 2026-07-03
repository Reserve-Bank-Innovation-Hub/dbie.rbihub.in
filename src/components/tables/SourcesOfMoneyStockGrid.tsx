"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { SourcesOfMoneyStockColumn, SourcesOfMoneyStockDataRow } from "@/lib/api/tables/sources-of-money-stock";

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

interface SourcesOfMoneyStockGridProps {
    data    : SourcesOfMoneyStockDataRow[];
    columns : SourcesOfMoneyStockColumn[];
}

const SourcesOfMoneyStockGrid : React.FC<SourcesOfMoneyStockGridProps> = ({ data, columns }) => {
    // Values are in Rupees crores; format with commas.
    const numberFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    };

    const columnDefs = useMemo<ColDef[]>(() => {
        const valueCols : ColDef[] = columns.map(col => ({
            headerName     : col.label,
            colId          : col.key,
            valueGetter    : (p : any) => (p.data ? p.data.values[col.key] : null),
            minWidth       : 200,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        }));

        return [
            {
                field      : "date",
                headerName : "Date",
                pinned     : "left",
                width      : 130,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            ...valueCols,
        ];
    }, [ columns ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="sources-of-money-stock-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[25, 50, 100, 200]}
                domLayout="normal"
                suppressCellFocus={true}
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default SourcesOfMoneyStockGrid;

"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { FinancialMarket, FinancialMarketsTurnoverRow } from "@/lib/api/tables/financial-markets-turnover";

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

interface FinancialMarketsTurnoverGridProps {
    data    : FinancialMarketsTurnoverRow[];
    markets : FinancialMarket[];
}

const FinancialMarketsTurnoverGrid : React.FC<FinancialMarketsTurnoverGridProps> = ({ data, markets }) => {
    // Two decimal places for Rupees Crores; Forex column carries US $ million values.
    const numberFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN", {
            minimumFractionDigits : 2,
            maximumFractionDigits : 4,
        });
    };

    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const marketCols : ColDef[] = markets.map((market) => ({
            headerName     : market.label,
            colId          : market.key,
            valueGetter    : (p : any) => (p.data ? p.data.values[market.key] : null),
            width          : 200,
            minWidth       : 160,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        }));

        return [
            {
                field      : "period",
                headerName : "Week ended",
                pinned     : "left",
                width      : 160,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            ...marketCols,
        ];
    }, [ markets ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="financial-markets-turnover-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[ 25, 50, 100, 200 ]}
                domLayout="normal"
                suppressCellFocus={true}
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default FinancialMarketsTurnoverGrid;

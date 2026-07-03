"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { DailyCallMoneyRateRow } from "@/lib/api/tables/daily-call-money-rates";

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

interface DailyCallMoneyRatesGridProps {
    data : DailyCallMoneyRateRow[];
}

const DailyCallMoneyRatesGrid : React.FC<DailyCallMoneyRatesGridProps> = ({ data }) => {
    // Rate formatter — two decimal places, dash for null
    const rateFormatter = (params : any) => {
        if (params.value == null) return "-";
        return `${Number(params.value).toFixed(2)}%`;
    };

    // Column definitions
    const columnDefs = useMemo<ColDef[]>(() => {
        const cols : ColDef[] = [
            {
                field      : "date",
                headerName : "Date",
                pinned     : "left",
                width      : 140,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            {
                field     : "fy",
                headerName : "Financial year",
                width      : 160,
                filter     : true,
            },
            {
                field          : "minRate",
                headerName     : "Minimum rate (borrowings/lendings)",
                flex           : 1,
                minWidth       : 260,
                type           : "numericColumn",
                valueFormatter : rateFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "maxRate",
                headerName     : "Maximum rate (borrowings/lendings)",
                flex           : 1,
                minWidth       : 260,
                type           : "numericColumn",
                valueFormatter : rateFormatter,
                cellStyle      : { textAlign: "right" },
            },
        ];
        return cols;
    }, []);

    const defaultColDef = useMemo<ColDef>(() => {
        return {
            sortable        : true,
            filter          : true,
            resizable       : true,
            suppressMovable : true,
        };
    }, []);

    return (
        <div className="daily-call-money-rates-grid-wrapper">
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

export default DailyCallMoneyRatesGrid;

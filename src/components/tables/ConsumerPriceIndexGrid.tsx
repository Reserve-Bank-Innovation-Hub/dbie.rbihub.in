"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { CPIRow, CPISeries } from "@/lib/api/tables/consumer-price-index";

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

interface ConsumerPriceIndexGridProps {
    series : CPISeries;
    month  : string; // ISO year-month to display; "" shows every month
}

const ConsumerPriceIndexGrid : React.FC<ConsumerPriceIndexGridProps> = ({ series, month }) => {
    // One month shows a commodity table; "all months" keeps the month column so the
    // series can be scanned end to end.
    const showMonthColumn = month === "";

    const rowData = useMemo<CPIRow[]>(() => {
        if (showMonthColumn) return series.rows;
        return series.rows.filter((r) => r.month === month);
    }, [ series.rows, month, showMonthColumn ]);

    const indexFormatter = (params: any) => {
        if (params.value == null) return "-";
        return Number(params.value).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    };

    const inflationFormatter = (params: any) => {
        if (params.value == null) return "-";
        return `${Number(params.value).toFixed(2)}%`;
    };

    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const cols: (ColDef | ColGroupDef)[] = [];

        if (showMonthColumn) {
            cols.push({
                field      : "month",
                headerName : "Month",
                pinned     : "left",
                width      : 110,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            });
        }

        cols.push({
            field      : "commodity",
            headerName : "Commodity",
            pinned     : "left",
            width      : 320,
            filter     : true,
            cellStyle  : { fontWeight: "500" },
        });

        cols.push({
            field      : "status",
            headerName : "P/F",
            width      : 80,
            filter     : true,
            valueFormatter : (p: any) => (p.value === "F" ? "Final" : "Provisional"),
        });

        const group = (headerName: string, indexField: string, inflationField: string): ColGroupDef => ({
            headerName,
            children : [
                {
                    field          : indexField,
                    headerName     : "Index",
                    width          : 110,
                    type           : "numericColumn",
                    valueFormatter : indexFormatter,
                    cellStyle      : { textAlign: "right" },
                },
                {
                    field          : inflationField,
                    headerName     : "Inflation",
                    width          : 110,
                    type           : "numericColumn",
                    valueFormatter : inflationFormatter,
                    cellStyle      : { textAlign: "right" },
                },
            ],
        });

        cols.push(group("Rural", "ruralIndex", "ruralInflation"));
        cols.push(group("Urban", "urbanIndex", "urbanInflation"));
        cols.push(group("Combined", "combinedIndex", "combinedInflation"));

        return cols;
    }, [ showMonthColumn ]);

    const defaultColDef = useMemo<ColDef>(() => {
        return {
            sortable        : true,
            filter          : true,
            resizable       : true,
            suppressMovable : true,
        };
    }, []);

    return (
        <div className="consumer-price-index-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={showMonthColumn ? 50 : 100}
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

export default ConsumerPriceIndexGrid;

"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { NewCpiRow } from "@/lib/api/tables/consumer-price-index-annual-average";

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

interface ConsumerPriceIndexAnnualAverageGridProps {
    data : NewCpiRow[];
}

const ConsumerPriceIndexAnnualAverageGrid : React.FC<ConsumerPriceIndexAnnualAverageGridProps> = ({ data }) => {
    // Number formatter — two decimal places for CPI index values.
    const numberFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN", {
            minimumFractionDigits : 1,
            maximumFractionDigits : 6,
        });
    };

    const columnDefs = useMemo<ColDef[]>(() => {
        const cols : ColDef[] = [
            {
                field      : "year",
                headerName : "Year",
                pinned     : "left",
                width      : 130,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            {
                field          : "rural",
                headerName     : "Rural",
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "urban",
                headerName     : "Urban",
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "combined",
                headerName     : "Combined",
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
        ];
        return cols;
    }, []);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="consumer-price-index-annual-average-grid-wrapper">
            <AgGridReact
                rowData={data}
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

export default ConsumerPriceIndexAnnualAverageGrid;

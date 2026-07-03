"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { WpiAnnualAverageRow } from "@/lib/api/tables/wholesale-price-index-annual-average";

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

interface WholesalePriceIndexAnnualAverageGridProps {
    data : WpiAnnualAverageRow[];
}

const WholesalePriceIndexAnnualAverageGrid : React.FC<WholesalePriceIndexAnnualAverageGridProps> = ({ data }) => {
    // Format index values to one decimal place; dash for nulls.
    const indexFormatter = (params : any) => {
        if (params.value == null) return "—";
        return Number(params.value).toFixed(1);
    };

    // Column definitions
    const columnDefs = useMemo<ColDef[]>(() => {
        const cols : ColDef[] = [
            {
                field      : "year",
                headerName : "Year",
                pinned     : "left",
                width      : 120,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            {
                field          : "ac",
                headerName     : "All commodities (AC)",
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : indexFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "pa",
                headerName     : "Primary articles (PA)",
                flex           : 1,
                minWidth       : 170,
                type           : "numericColumn",
                valueFormatter : indexFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "fa",
                headerName     : "Food articles (FA)",
                flex           : 1,
                minWidth       : 150,
                type           : "numericColumn",
                valueFormatter : indexFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "nf",
                headerName     : "Non-food articles (NF)",
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : indexFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "fp",
                headerName     : "Fuel & power (F&P)",
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : indexFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "mp",
                headerName     : "Manufactured products (MP)",
                flex           : 1,
                minWidth       : 200,
                type           : "numericColumn",
                valueFormatter : indexFormatter,
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
        <div className="wholesale-price-index-annual-average-grid-wrapper">
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

export default WholesalePriceIndexAnnualAverageGrid;

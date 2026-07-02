"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { GoldAndSilverPriceRow, GoldAndSilverPricesUnits } from "@/lib/api/tables/gold-and-silver-prices";

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

interface GoldAndSilverPricesGridProps {
    data  : GoldAndSilverPriceRow[];
    units : GoldAndSilverPricesUnits;
}

const GoldAndSilverPricesGrid : React.FC<GoldAndSilverPricesGridProps> = ({ data, units }) => {
    // Number formatter with commas
    const numberFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN");
    };

    // Column definitions
    const columnDefs = useMemo<ColDef[]>(() => {
        const cols : ColDef[] = [
            {
                field      : "month",
                headerName : "Month/Year",
                pinned     : "left",
                width      : 160,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            {
                field          : "gold",
                headerName     : `Standard gold (${units.gold})`,
                flex           : 1,
                minWidth       : 200,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "silver",
                headerName     : `Silver (${units.silver})`,
                flex           : 1,
                minWidth       : 200,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
        ];
        return cols;
    }, [ units ]);

    const defaultColDef = useMemo<ColDef>(() => {
        return {
            sortable        : true,
            filter          : true,
            resizable       : true,
            suppressMovable : true,
        };
    }, []);

    return (
        <div className="gold-and-silver-prices-grid-wrapper">
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

export default GoldAndSilverPricesGrid;

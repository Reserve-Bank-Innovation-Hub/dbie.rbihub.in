"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import {
    AveragePriceOfGoldAndSilverRow,
    AveragePriceOfGoldAndSilverUnits,
} from "@/lib/api/tables/average-price-of-gold-and-silver-in-domestic-and-foreign-markets";

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

interface AveragePriceOfGoldAndSilverGridProps {
    data  : AveragePriceOfGoldAndSilverRow[];
    units : AveragePriceOfGoldAndSilverUnits;
}

const AveragePriceOfGoldAndSilverGrid : React.FC<AveragePriceOfGoldAndSilverGridProps> = ({ data, units }) => {
    // Number formatter with commas
    const numberFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN");
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
            // Gold columns
            {
                field          : "gold_mumbai",
                headerName     : `Gold Mumbai (${units.goldMumbai})`,
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "gold_london",
                headerName     : `Gold London (${units.goldLondon})`,
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "gold_mumbai_rupees",
                headerName     : `Gold London in ₹ (${units.goldMumbaiRupees})`,
                flex           : 1,
                minWidth       : 200,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "gold_spread",
                headerName     : `Gold spread (${units.goldSpread})`,
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            // Silver columns
            {
                field          : "silver_mumbai",
                headerName     : `Silver Mumbai (${units.silverMumbai})`,
                flex           : 1,
                minWidth       : 190,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "silver_ny",
                headerName     : `Silver New York (${units.silverNY})`,
                flex           : 1,
                minWidth       : 200,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "silver_ny_rupees",
                headerName     : `Silver New York in ₹ (${units.silverNYRupees})`,
                flex           : 1,
                minWidth       : 220,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "silver_spread",
                headerName     : `Silver spread (${units.silverSpread})`,
                flex           : 1,
                minWidth       : 170,
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
        <div className="average-price-of-gold-and-silver-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={50}
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

export default AveragePriceOfGoldAndSilverGrid;

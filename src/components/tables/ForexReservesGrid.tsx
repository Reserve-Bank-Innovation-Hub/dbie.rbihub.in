"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { ForexReserveData } from "@/lib/api/indicators";

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

interface ForexReservesGridProps {
    data : ForexReserveData[];
}

const ForexReservesGrid: React.FC<ForexReservesGridProps> = ({ data }) => {
    // Number formatter with commas
    const numberFormatter = (params: any) => {
        if (params.value == null || params.value === 0) return "-";
        return params.value.toLocaleString("en-IN");
    };

    // Column definitions
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        return [
            {
                field      : "weekEnded",
                headerName : "Week ended",
                pinned     : "left",
                width      : 140,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            {
                headerName : "Total reserves",
                children   : [
                    {
                        field          : "totalReservesINR",
                        headerName     : "₹ crores",
                        width          : 130,
                        type           : "numericColumn",
                        valueFormatter : numberFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                    {
                        field          : "totalReservesUSD",
                        headerName     : "US $ millions",
                        width          : 140,
                        type           : "numericColumn",
                        valueFormatter : numberFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                ],
            },
            {
                headerName : "Foreign currency assets",
                children   : [
                    {
                        field          : "foreignCurrencyINR",
                        headerName     : "₹ crores",
                        width          : 130,
                        type           : "numericColumn",
                        valueFormatter : numberFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                    {
                        field          : "foreignCurrencyUSD",
                        headerName     : "US $ millions",
                        width          : 140,
                        type           : "numericColumn",
                        valueFormatter : numberFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                ],
            },
            {
                headerName : "Gold",
                children   : [
                    {
                        field          : "goldINR",
                        headerName     : "₹ crores",
                        width          : 130,
                        type           : "numericColumn",
                        valueFormatter : numberFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                    {
                        field          : "goldUSD",
                        headerName     : "US $ millions",
                        width          : 140,
                        type           : "numericColumn",
                        valueFormatter : numberFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                    {
                        field          : "goldVolumeMetricTonnes",
                        headerName     : "Volume (MT)",
                        width          : 120,
                        type           : "numericColumn",
                        valueFormatter : numberFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                ],
            },
            {
                headerName : "SDRs",
                children   : [
                    {
                        field          : "sdrsINR",
                        headerName     : "₹ crores",
                        width          : 130,
                        type           : "numericColumn",
                        valueFormatter : numberFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                    {
                        field          : "sdrsUSD",
                        headerName     : "US $ millions",
                        width          : 140,
                        type           : "numericColumn",
                        valueFormatter : numberFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                ],
            },
            {
                headerName : "Reserve tranche position",
                children   : [
                    {
                        field          : "rtpINR",
                        headerName     : "₹ crores",
                        width          : 130,
                        type           : "numericColumn",
                        valueFormatter : numberFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                    {
                        field          : "rtpUSD",
                        headerName     : "US $ millions",
                        width          : 140,
                        type           : "numericColumn",
                        valueFormatter : numberFormatter,
                        cellStyle      : { textAlign: "right" },
                    },
                ],
            },
        ];
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
        <div className="forex-reserves-grid-wrapper">
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

export default ForexReservesGrid;

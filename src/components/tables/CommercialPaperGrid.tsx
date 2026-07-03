"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { CommercialPaperRow } from "@/lib/api/tables/commercial-paper";

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

interface CommercialPaperGridProps {
    data : CommercialPaperRow[];
}

const CommercialPaperGrid : React.FC<CommercialPaperGridProps> = ({ data }) => {
    // Number formatter with commas
    const numberFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN");
    };

    // Rate formatter (2 decimal places)
    const rateFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toFixed(2);
    };

    // Column definitions
    const columnDefs = useMemo<ColDef[]>(() => {
        const cols : ColDef[] = [
            {
                field      : "fortnightEnded",
                headerName : "Fortnight ended",
                pinned     : "left",
                width      : 160,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            {
                field          : "amountOutstanding",
                headerName     : "Amount outstanding (₹ crores)",
                flex           : 1,
                minWidth       : 230,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "amountReported",
                headerName     : "Amount reported during fortnight (₹ crores)",
                flex           : 1,
                minWidth       : 290,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "minRate",
                headerName     : "Minimum rate of interest (%)",
                flex           : 1,
                minWidth       : 220,
                type           : "numericColumn",
                valueFormatter : rateFormatter,
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
        <div className="commercial-paper-grid-wrapper">
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

export default CommercialPaperGrid;

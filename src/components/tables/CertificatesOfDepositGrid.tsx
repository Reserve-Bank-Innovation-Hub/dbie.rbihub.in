"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, CellStyle, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { CertificatesOfDepositRow } from "@/lib/api/tables/certificates-of-deposit";

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

interface CertificatesOfDepositGridProps {
    data : CertificatesOfDepositRow[];
}

const CertificatesOfDepositGrid : React.FC<CertificatesOfDepositGridProps> = ({ data }) => {
    // Number formatter with commas
    const numberFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN");
    };

    // Rate formatter — show two decimal places
    const rateFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toFixed(2);
    };

    // Column definitions
    const columnDefs = useMemo<ColDef[]>(() => [
        {
            field      : "fortnightEnded",
            headerName : "Fortnight ended",
            pinned     : "left",
            width      : 180,
            filter     : true,
            cellStyle  : { fontWeight: "500" } as CellStyle,
        },
        {
            field          : "amountOutstanding",
            headerName     : "Amount outstanding (₹ Crores)",
            flex           : 1,
            minWidth       : 220,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "amountIssued",
            headerName     : "Amount issued during fortnight (₹ Crores)",
            flex           : 1,
            minWidth       : 260,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        },
        {
            field          : "minRate",
            headerName     : "Minimum rate of interest (% p.a.)",
            flex           : 1,
            minWidth       : 220,
            type           : "numericColumn",
            valueFormatter : rateFormatter,
            cellStyle      : { textAlign: "right" },
        },
    ], []);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="certificates-of-deposit-grid-wrapper">
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

export default CertificatesOfDepositGrid;

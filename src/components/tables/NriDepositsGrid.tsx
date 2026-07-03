"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { NriDepositsRow } from "@/lib/api/tables/nri-deposits";

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

interface NriDepositsGridProps {
    data : NriDepositsRow[];
    unit : string;
}

// "YYYY-MM" → "Mon YYYY" for display.
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatMonth(key : string) : string {
    const m = key.match(/^(\d{4})-(\d{2})$/);
    if (!m) return key;
    const mon = MONTH_LABELS[Number(m[2]) - 1] ?? m[2];
    return `${mon} ${m[1]}`;
}

const NriDepositsGrid : React.FC<NriDepositsGridProps> = ({ data, unit }) => {
    const numFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
    };

    const flowCellStyle = (params : any) => ({
        textAlign : "right" as const,
        color     : params.value != null && params.value < 0 ? "#d12d1b" : undefined,
    });

    const rowData = useMemo(() => data.map(r => ({ ...r, month_label: formatMonth(r.month) })), [data]);

    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => [
        {
            field      : "month_label",
            headerName : "Month",
            pinned     : "left",
            width      : 120,
            filter     : true,
            cellStyle  : { fontWeight: "500" },
        },
        {
            field      : "fiscal_year",
            headerName : "FY",
            width      : 100,
            filter     : true,
        },

        // Outstanding balances
        {
            headerName : `Outstanding (${unit})`,
            children   : [
                {
                    headerName     : "Total NRI",
                    field          : "outstanding_total",
                    width          : 150,
                    type           : "numericColumn",
                    valueFormatter : numFormatter,
                    cellStyle      : { textAlign: "right" },
                },
                {
                    headerName     : "FCNR(B)",
                    field          : "outstanding_fcnrb",
                    width          : 130,
                    type           : "numericColumn",
                    valueFormatter : numFormatter,
                    cellStyle      : { textAlign: "right" },
                },
                {
                    headerName     : "NR(E)RA",
                    field          : "outstanding_nrera",
                    width          : 130,
                    type           : "numericColumn",
                    valueFormatter : numFormatter,
                    cellStyle      : { textAlign: "right" },
                },
                {
                    headerName     : "NRO",
                    field          : "outstanding_nro",
                    width          : 130,
                    type           : "numericColumn",
                    valueFormatter : numFormatter,
                    cellStyle      : { textAlign: "right" },
                },
            ],
        },

        // Inflows / outflows
        {
            headerName : `Inflows (+) / Outflows (−) (${unit})`,
            children   : [
                {
                    headerName     : "Total NRI",
                    field          : "flows_total",
                    width          : 150,
                    type           : "numericColumn",
                    valueFormatter : numFormatter,
                    cellStyle      : flowCellStyle,
                },
                {
                    headerName     : "FCNR(B)",
                    field          : "flows_fcnrb",
                    width          : 130,
                    type           : "numericColumn",
                    valueFormatter : numFormatter,
                    cellStyle      : flowCellStyle,
                },
                {
                    headerName     : "NR(E)RA",
                    field          : "flows_nrera",
                    width          : 130,
                    type           : "numericColumn",
                    valueFormatter : numFormatter,
                    cellStyle      : flowCellStyle,
                },
            ],
        },
    ], [unit]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="nri-deposits-grid-wrapper">
            <AgGridReact
                rowData={rowData}
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

export default NriDepositsGrid;

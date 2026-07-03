"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { RbiStandingFacilitiesRow } from "@/lib/api/tables/rbi-standing-facilities";

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

interface RbiStandingFacilitiesGridProps {
    data : RbiStandingFacilitiesRow[];
}

// Format an Indian-numbering value; "—" for null.
const numFormatter = (params : { value : number | null }) => {
    if (params.value == null) return "—";
    return params.value.toLocaleString("en-IN");
};

const rightAlign = { textAlign : "right" as const };

const RbiStandingFacilitiesGrid : React.FC<RbiStandingFacilitiesGridProps> = ({ data }) => {
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const cols : (ColDef | ColGroupDef)[] = [
            // Date pinned left
            {
                field      : "date",
                headerName : "Date",
                pinned     : "left",
                width      : 140,
                filter     : true,
                cellStyle  : { fontWeight : "500" },
            },

            // 1 · MSF (single column, no child group needed)
            {
                field          : "msf",
                headerName     : "MSF",
                flex           : 1,
                minWidth       : 120,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : rightAlign,
            },

            // 2 · Export credit refinance
            {
                headerName : "Export credit refinance",
                children   : [
                    {
                        field          : "ecr_limit",
                        headerName     : "Limit",
                        flex           : 1,
                        minWidth       : 120,
                        type           : "numericColumn",
                        valueFormatter : numFormatter,
                        cellStyle      : rightAlign,
                    },
                    {
                        field          : "ecr_outstanding",
                        headerName     : "Outstanding",
                        flex           : 1,
                        minWidth       : 130,
                        type           : "numericColumn",
                        valueFormatter : numFormatter,
                        cellStyle      : rightAlign,
                    },
                ],
            },

            // 3 · Liquidity facility for PDs
            {
                headerName : "Liquidity facility for PDs",
                children   : [
                    {
                        field          : "pd_limit",
                        headerName     : "Limit",
                        flex           : 1,
                        minWidth       : 120,
                        type           : "numericColumn",
                        valueFormatter : numFormatter,
                        cellStyle      : rightAlign,
                    },
                    {
                        field          : "pd_outstanding",
                        headerName     : "Outstanding",
                        flex           : 1,
                        minWidth       : 130,
                        type           : "numericColumn",
                        valueFormatter : numFormatter,
                        cellStyle      : rightAlign,
                    },
                ],
            },

            // 4 · Others
            {
                headerName : "Others",
                children   : [
                    {
                        field          : "others_limit",
                        headerName     : "Limit",
                        flex           : 1,
                        minWidth       : 120,
                        type           : "numericColumn",
                        valueFormatter : numFormatter,
                        cellStyle      : rightAlign,
                    },
                    {
                        field          : "others_outstanding",
                        headerName     : "Outstanding",
                        flex           : 1,
                        minWidth       : 130,
                        type           : "numericColumn",
                        valueFormatter : numFormatter,
                        cellStyle      : rightAlign,
                    },
                ],
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
        <div className="rbi-standing-facilities-grid-wrapper">
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
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default RbiStandingFacilitiesGrid;

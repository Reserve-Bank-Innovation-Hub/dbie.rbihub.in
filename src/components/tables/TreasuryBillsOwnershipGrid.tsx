"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { TreasuryBillsOwnershipRow } from "@/lib/api/tables/treasury-bills-ownership";

// Register AG Grid modules
ModuleRegistry.registerModules([ AllCommunityModule ]);

// Create custom theme
const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface TreasuryBillsOwnershipGridProps {
    data : TreasuryBillsOwnershipRow[];
}

const TreasuryBillsOwnershipGrid : React.FC<TreasuryBillsOwnershipGridProps> = ({ data }) => {
    // Format amounts: null → "—", numbers with en-IN locale commas, no decimals.
    const numFormatter = (params : any) => {
        if (params.value == null) return "—";
        return Number(params.value).toLocaleString("en-IN");
    };

    // Column definitions — five tenor groups, each with five holder children.
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        // Week column pinned left.
        const weekCol : ColDef = {
            field      : "week",
            headerName : "Week ended",
            pinned     : "left",
            width      : 140,
            filter     : true,
            cellStyle  : { fontWeight : "500" },
        };

        // Child column factory — shared cell style; Total children get bold.
        const child = (
            field      : string,
            headerName : string,
            isTotal    : boolean = false,
        ) : ColDef => ({
            field,
            headerName,
            flex           : 1,
            minWidth       : 120,
            type           : "numericColumn",
            valueFormatter : numFormatter,
            cellStyle      : isTotal
                ? { textAlign : "right", fontWeight : 600 }
                : { textAlign : "right" },
        });

        // Holder children order is consistent across all five tenors.
        const holderChildren = (prefix : string) : ColDef[] => [
            child(`${prefix}_banks`,    "Banks"),
            child(`${prefix}_pds`,      "Primary dealers"),
            child(`${prefix}_stategov`, "State governments"),
            child(`${prefix}_others`,   "Others"),
            child(`${prefix}_total`,    "Total", true),
        ];

        const cols : (ColDef | ColGroupDef)[] = [
            weekCol,
            {
                headerName : "91-day",
                children   : holderChildren("t91"),
            },
            {
                headerName : "182-day",
                children   : holderChildren("t182"),
            },
            {
                headerName : "364-day",
                children   : holderChildren("t364"),
            },
            {
                headerName : "14-day intermediate",
                children   : holderChildren("t14"),
            },
            {
                headerName : "Cash management bills",
                children   : holderChildren("cmb"),
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
        <div className="treasury-bills-ownership-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[ 25, 50, 100, 200 ]}
                domLayout="normal"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default TreasuryBillsOwnershipGrid;

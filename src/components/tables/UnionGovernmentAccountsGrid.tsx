"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { UnionGovernmentAccountsRow } from "@/lib/api/tables/union-government-accounts";

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

interface UnionGovernmentAccountsGridProps {
    data : UnionGovernmentAccountsRow[];
}

// Format a currency value in Indian numbering system; "—" for null.
const numFormatter = (params : { value : number | null }) => {
    if (params.value == null) return "—";
    return params.value.toLocaleString("en-IN");
};

const rightAlign = { textAlign : "right" as const };

// Build the 3-column Actual / Budget est. / Revised est. children for a group.
function makeChildren(prefix : string) : ColDef[] {
    return [
        {
            field          : `${prefix}_actual`,
            headerName     : "Actual",
            flex           : 1,
            minWidth       : 130,
            type           : "numericColumn",
            valueFormatter : numFormatter,
            cellStyle      : rightAlign,
        },
        {
            field          : `${prefix}_be`,
            headerName     : "Budget est.",
            flex           : 1,
            minWidth       : 130,
            type           : "numericColumn",
            valueFormatter : numFormatter,
            cellStyle      : rightAlign,
        },
        {
            field          : `${prefix}_re`,
            headerName     : "Revised est.",
            flex           : 1,
            minWidth       : 130,
            type           : "numericColumn",
            valueFormatter : numFormatter,
            cellStyle      : rightAlign,
        },
    ];
}

const UnionGovernmentAccountsGrid : React.FC<UnionGovernmentAccountsGridProps> = ({ data }) => {
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const cols : (ColDef | ColGroupDef)[] = [
            // Month pinned left
            {
                field      : "month",
                headerName : "Month",
                pinned     : "left",
                width      : 120,
                filter     : true,
                cellStyle  : { fontWeight : "500" },
            },

            // 14 measure groups
            { headerName : "1 · Revenue receipts",              children : makeChildren("rr") },
            { headerName : "1.1 · Tax revenue (net)",           children : makeChildren("tax") },
            { headerName : "1.2 · Non-tax revenue",             children : makeChildren("ntr") },
            { headerName : "2 · Non-debt capital receipt",      children : makeChildren("ndcr") },
            { headerName : "2.1 · Recovery of loans",           children : makeChildren("recovery") },
            { headerName : "2.2 · Other receipts",              children : makeChildren("other") },
            { headerName : "3 · Total receipts (excl. borrowings)", children : makeChildren("receipts") },
            { headerName : "4 · Revenue expenditure",           children : makeChildren("revexp") },
            { headerName : "4.1 · Interest payments",           children : makeChildren("interest") },
            { headerName : "5 · Capital expenditure",           children : makeChildren("capexp") },
            { headerName : "6 · Total expenditure",             children : makeChildren("totalexp") },
            { headerName : "7 · Revenue deficit",               children : makeChildren("rd") },
            { headerName : "8 · Fiscal deficit",                children : makeChildren("fd") },
            { headerName : "9 · Gross primary deficit",         children : makeChildren("gpd") },
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
        <div className="union-government-accounts-grid-wrapper">
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

export default UnionGovernmentAccountsGrid;

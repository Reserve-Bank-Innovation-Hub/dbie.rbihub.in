"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { CombinedReceiptsDisbursementsRow } from "@/lib/api/tables/combined-receipts-disbursements";

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

interface CombinedReceiptsDisbursementsGridProps {
    years : string[];
    data  : CombinedReceiptsDisbursementsRow[];
}

// Compute indentation depth from the leading numbering token.
// "1"       → depth 0 (no dots)
// "1.1"     → depth 1
// "1.1.1"   → depth 2
// "1.1.1.1" → depth 3
// Non-numbered rows → depth 0.
function itemDepth(item : string) : number {
    const token = item.split(' ')[0];
    const dots = (token.match(/\./g) || []).length;
    return dots;
}

const CombinedReceiptsDisbursementsGrid : React.FC<CombinedReceiptsDisbursementsGridProps> = ({ years, data }) => {
    // Format amounts in Indian numbering system; "—" for null.
    const numFormatter = (params : any) => {
        if (params.value == null) return "—";
        return (params.value as number).toLocaleString("en-IN");
    };

    const columnDefs = useMemo<ColDef[]>(() => {
        const cols : ColDef[] = [
            // Item label pinned left; indentation reflects hierarchy depth.
            {
                field      : "item",
                headerName : "Item",
                pinned     : "left",
                width      : 340,
                filter     : true,
                cellStyle  : (params) => {
                    const depth = itemDepth(params.data?.item ?? "");
                    return { paddingLeft: `${8 + depth * 16}px`, fontWeight: depth === 0 ? "600" : "400" };
                },
            },
            // One column per year, newest-first.
            ...years.map((year, i) : ColDef => ({
                headerName     : year,
                valueGetter    : (p) => p.data?.values?.[i] ?? null,
                valueFormatter : numFormatter,
                width          : 110,
                type           : "numericColumn",
                cellStyle      : { textAlign : "right" as const },
            })),
        ];
        return cols;
    }, [ years ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : false,
        filter          : false,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="combined-receipts-disbursements-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={false}
                domLayout="normal"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default CombinedReceiptsDisbursementsGrid;

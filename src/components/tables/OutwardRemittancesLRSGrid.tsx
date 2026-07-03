"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { LRSCategory, LRSDataRow } from "@/lib/api/tables/outward-remittances-lrs";

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

interface OutwardRemittancesLRSGridProps {
    data       : LRSDataRow[];
    categories : LRSCategory[];
    unit       : string;
}

// One AG Grid row: the month label plus one field per category index.
interface GridRow {
    month : string;
    [key  : string] : number | null | string;
}

const OutwardRemittancesLRSGrid : React.FC<OutwardRemittancesLRSGridProps> = ({ data, categories, unit }) => {
    // Format numbers with two decimal places; return "—" for null.
    const numFormatter = (params : any) => {
        if (params.value == null) return "—";
        return Number(params.value).toLocaleString("en-IN", {
            minimumFractionDigits : 2,
            maximumFractionDigits : 2,
        });
    };

    // Flatten rows into AG Grid–ready objects.
    const rowData = useMemo<GridRow[]>(() => {
        return data.map((row) => {
            const gr : GridRow = { month : row.month };
            row.values.forEach((v, i) => { gr[`c${i}`] = v; });
            return gr;
        });
    }, [ data ]);

    const columnDefs = useMemo<ColDef[]>(() => {
        const cols : ColDef[] = [
            {
                field      : "month",
                headerName : "Month",
                pinned     : "left",
                width      : 130,
                filter     : true,
                cellStyle  : { fontWeight : "500" },
            },
        ];

        categories.forEach((cat, i) => {
            cols.push({
                field          : `c${i}`,
                headerName     : `${cat.code}  ${cat.label}`,
                headerTooltip  : `${cat.label} (${unit})`,
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : { textAlign : "right" },
            });
        });

        return cols;
    }, [ categories, unit ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="outward-remittances-lrs-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[ 25, 50, 100, 200 ]}
                domLayout="normal"
                suppressCellFocus={true}
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default OutwardRemittancesLRSGrid;

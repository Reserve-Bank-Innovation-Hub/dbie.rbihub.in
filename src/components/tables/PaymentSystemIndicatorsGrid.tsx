"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import {
    PaymentSystemIndicatorColumn,
    PaymentSystemIndicatorRow,
} from "@/lib/api/tables/payment-system-indicators";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Custom theme
const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface PaymentSystemIndicatorsGridProps {
    columns : PaymentSystemIndicatorColumn[];
    data    : PaymentSystemIndicatorRow[];
}

// Format a numeric value in Indian numbering; "—" for null.
const numFormatter = (params : { value : number | null }) => {
    if (params.value == null) return "—";
    return params.value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

const rightAlign = { textAlign : "right" as const };

const PaymentSystemIndicatorsGrid : React.FC<PaymentSystemIndicatorsGridProps> = ({ columns, data }) => {
    // Build column definitions dynamically from the JSON columns array.
    // Consecutive entries sharing the same `group` become one ColGroupDef with
    // each measure as a child ColDef. valueGetter reads values[i] by index.
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const cols : (ColDef | ColGroupDef)[] = [
            // Month pinned left
            {
                field      : "month",
                headerName : "Month",
                pinned     : "left",
                width      : 110,
                filter     : true,
                cellStyle  : { fontWeight : "500" },
            },
        ];

        // Group consecutive columns with the same group label.
        let i = 0;
        while (i < columns.length) {
            const groupName = columns[i].group;
            const children  : ColDef[] = [];
            let j = i;

            // Collect all measures belonging to this group.
            while (j < columns.length && columns[j].group === groupName) {
                const colIndex = j; // capture for closure
                children.push({
                    headerName     : columns[j].measure,
                    flex           : 1,
                    minWidth       : 130,
                    type           : "numericColumn",
                    valueGetter    : (p) => (p.data as PaymentSystemIndicatorRow).values[colIndex],
                    valueFormatter : numFormatter,
                    cellStyle      : rightAlign,
                });
                j++;
            }

            if (children.length === 1) {
                // Single-measure column — promote the child directly.
                cols.push({
                    ...children[0],
                    headerName : groupName,
                });
            } else {
                cols.push({
                    headerName : groupName,
                    children,
                });
            }

            i = j;
        }

        return cols;
    }, [columns]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="payment-system-indicators-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={25}
                paginationPageSizeSelector={[10, 25, 50, 100]}
                domLayout="normal"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default PaymentSystemIndicatorsGrid;

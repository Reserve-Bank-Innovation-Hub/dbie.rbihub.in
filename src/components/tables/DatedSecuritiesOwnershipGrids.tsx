"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { DatedSecuritiesOwnershipSection } from "@/lib/api/tables/dated-securities-ownership";

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

interface DatedSecuritiesOwnershipGridProps {
    section : DatedSecuritiesOwnershipSection;
}

// Single parameterised grid — works for all three sections.
const DatedSecuritiesOwnershipGrid : React.FC<DatedSecuritiesOwnershipGridProps> = ({ section }) => {
    // Transform flat values[] into row objects keyed by column index.
    const rowData = useMemo(() =>
        section.data.map(row => {
            const obj : Record<string, string | number | null> = { period: row.period };
            section.columns.forEach((col, i) => {
                obj[`col_${i}`] = row.values[i] ?? null;
            });
            return obj;
        }),
    [ section ]);

    // First column is the total ₹ crore figure; remaining are percentage shares.
    const totalFormatter  = (params : any) => {
        if (params.value == null) return "—";
        return Number(params.value).toLocaleString("en-IN");
    };
    const percentFormatter = (params : any) => {
        if (params.value == null) return "—";
        return Number(params.value).toFixed(2);
    };

    const columnDefs = useMemo<ColDef[]>(() => {
        const cols : ColDef[] = [
            {
                field      : "period",
                headerName : "Period",
                pinned     : "left",
                width      : 120,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
        ];

        section.columns.forEach((colName, i) => {
            cols.push({
                field          : `col_${i}`,
                headerName     : colName,
                flex           : 1,
                minWidth       : i === 0 ? 200 : 150,
                type           : "numericColumn",
                valueFormatter : i === 0 ? totalFormatter : percentFormatter,
                cellStyle      : { textAlign: "right" },
            });
        });

        return cols;
    }, [ section.columns ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="dated-securities-ownership-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={25}
                paginationPageSizeSelector={[10, 25, 50, 100]}
                domLayout="normal"
                suppressCellFocus={true}
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default DatedSecuritiesOwnershipGrid;

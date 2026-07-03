"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { AnnualProductionIndicesItem, AnnualProductionIndicesRow } from "@/lib/api/tables/annual-production-indices-of-select-items";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Custom theme — consistent with other grids in the project.
const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface AnnualProductionIndicesGridProps {
    data  : AnnualProductionIndicesRow[];
    items : AnnualProductionIndicesItem[];
}

const AnnualProductionIndicesGrid : React.FC<AnnualProductionIndicesGridProps> = ({ data, items }) => {
    // Flatten each row so AG Grid can work with plain objects.
    // Each row: { year, i0, i1, … i79 }
    const rowData = useMemo(
        () =>
            data.map(row => {
                const flat : Record<string, string | number | null> = { year: row.year };
                row.indices.forEach((v, idx) => {
                    flat[`i${idx}`] = v;
                });
                return flat;
            }),
        [data],
    );

    const columnDefs = useMemo<ColDef[]>(() => {
        const yearCol : ColDef = {
            field     : "year",
            headerName: "Year",
            pinned    : "left",
            width     : 120,
            filter    : true,
            cellStyle : { fontWeight: "500" },
        };

        const itemCols : ColDef[] = items.map((item, idx) => ({
            field          : `i${idx}`,
            headerName     : item.name,
            headerTooltip  : `${item.name} (${item.group})`,
            flex           : 1,
            minWidth       : 140,
            type           : "numericColumn",
            valueFormatter : (params : any) => {
                if (params.value == null) return "-";
                return Number(params.value).toLocaleString("en-IN");
            },
            cellStyle      : { textAlign: "right" },
        }));

        return [yearCol, ...itemCols];
    }, [items]);

    const defaultColDef = useMemo<ColDef>(
        () => ({
            sortable        : true,
            filter          : true,
            resizable       : true,
            suppressMovable : true,
        }),
        [],
    );

    return (
        <div className="annual-production-indices-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={25}
                paginationPageSizeSelector={[25, 50, 100]}
                domLayout="normal"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default AnnualProductionIndicesGrid;

"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { OtherCPIRow, OtherCPISeries } from "@/lib/api/tables/other-consumer-price-indices";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Create custom theme (house style, matching the other DBIE grids)
const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface OtherConsumerPriceIndicesGridProps {
    data   : OtherCPIRow[];
    series : OtherCPISeries[];
}

const OtherConsumerPriceIndicesGrid : React.FC<OtherConsumerPriceIndicesGridProps> = ({ data, series }) => {
    // Show "-" for unpublished (null) series, else group Indian-style.
    const numberFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN");
    };

    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        // Group the series columns under their sub-table headings, in source order.
        const groups : ColGroupDef[] = [];
        let current : ColGroupDef | null = null;

        for (const s of series) {
            if (!current || current.headerName !== s.group) {
                current = { headerName : s.group, children : [] };
                groups.push(current);
            }
            (current.children as ColDef[]).push({
                headerName     : `Base ${s.baseYear}`,
                colId          : s.key,
                // Values are nested under row.values keyed by series key.
                valueGetter    : (params : any) => params.data?.values?.[s.key] ?? null,
                width          : 130,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign : "right" },
            });
        }

        return [
            {
                field      : "monthLabel",
                headerName : "Month",
                pinned     : "left",
                width      : 120,
                filter     : true,
                cellStyle  : { fontWeight : "500" },
            },
            ...groups,
        ];
    }, [ series ]);

    const defaultColDef = useMemo<ColDef>(() => {
        return {
            sortable        : true,
            filter          : true,
            resizable       : true,
            suppressMovable : true,
        };
    }, []);

    return (
        <div className="other-consumer-price-indices-grid-wrapper">
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
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default OtherConsumerPriceIndicesGrid;

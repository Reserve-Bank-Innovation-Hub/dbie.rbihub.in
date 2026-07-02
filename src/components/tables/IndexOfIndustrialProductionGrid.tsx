"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, CellStyle, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { IIPCategory, IIPDataRow } from "@/lib/api/tables/index-of-industrial-production";

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

interface IndexOfIndustrialProductionGridProps {
    data       : IIPDataRow[];
    categories : IIPCategory[];
}

const IndexOfIndustrialProductionGrid : React.FC<IndexOfIndustrialProductionGridProps> = ({ data, categories }) => {
    // Index values carry one decimal; growth rates two, with a sign.
    const indexFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    };

    const growthFormatter = (params : any) => {
        if (params.value == null) return "-";
        return `${params.value.toFixed(2)}%`;
    };

    // Two top-level column groups mirror the sheet's classifications. Under each,
    // one sub-group per series holds its index level and year-on-year growth.
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const groupNames = [ ...new Set(categories.map(c => c.group)) ];

        const groups : ColGroupDef[] = groupNames.map(groupName => ({
            headerName : groupName,
            children   : categories
                .filter(c => c.group === groupName)
                .map<ColGroupDef>(cat => ({
                    headerName : cat.weight != null ? `${cat.label} (wt. ${cat.weight})` : cat.label,
                    children   : [
                        {
                            headerName     : "Index",
                            colId          : `index__${cat.code}`,
                            valueGetter    : (p : any) => (p.data ? p.data.index[cat.code] : null),
                            width          : 110,
                            type           : "numericColumn",
                            valueFormatter : indexFormatter,
                            cellStyle      : { textAlign: "right" },
                        },
                        {
                            headerName     : "YoY %",
                            colId          : `growth__${cat.code}`,
                            valueGetter    : (p : any) => (p.data ? p.data.growth[cat.code] : null),
                            width          : 100,
                            type           : "numericColumn",
                            valueFormatter : growthFormatter,
                            cellStyle      : (p : any) : CellStyle => {
                                const style : CellStyle = { textAlign: "right" };
                                if (p.value != null) style.color = p.value < 0 ? "#d12d1b" : "#0d5c52";
                                return style;
                            },
                        },
                    ],
                })),
        }));

        return [
            {
                field      : "label",
                headerName : "Month",
                pinned     : "left",
                width      : 130,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            ...groups,
        ];
    }, [ categories ]);

    const defaultColDef = useMemo<ColDef>(() => {
        return {
            sortable        : true,
            filter          : true,
            resizable       : true,
            suppressMovable : true,
        };
    }, []);

    return (
        <div className="index-of-industrial-production-grid-wrapper">
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
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default IndexOfIndustrialProductionGrid;

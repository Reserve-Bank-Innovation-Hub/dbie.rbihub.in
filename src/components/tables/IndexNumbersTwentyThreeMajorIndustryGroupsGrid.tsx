"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { IndustryGroupRow, IndustryGroupIndustry } from "@/lib/api/tables/index-numbers-of-twenty-three-major-industry-groups-of-manufacturing";

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

interface IndexNumbersTwentyThreeMajorIndustryGroupsGridProps {
    data       : IndustryGroupRow[];
    industries : IndustryGroupIndustry[];
}

const IndexNumbersTwentyThreeMajorIndustryGroupsGrid : React.FC<IndexNumbersTwentyThreeMajorIndustryGroupsGridProps> = ({
    data,
    industries,
}) => {
    const numberFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toFixed(1);
    };

    const columnDefs = useMemo<ColDef[]>(() => {
        const industryCols : ColDef[] = industries.map((ind) => ({
            headerName     : ind.weight != null ? `${ind.label} (wt. ${ind.weight})` : ind.label,
            colId          : `val__${ind.code}`,
            valueGetter    : (p : any) => (p.data ? (p.data.values[ind.code] ?? null) : null),
            flex           : 1,
            minWidth       : 160,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        }));

        return [
            {
                field      : "year",
                headerName : "Year",
                pinned     : "left",
                width      : 120,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            ...industryCols,
        ];
    }, [ industries ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="index-numbers-twenty-three-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={25}
                paginationPageSizeSelector={[ 25, 50, 100 ]}
                domLayout="normal"
                suppressCellFocus={true}
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default IndexNumbersTwentyThreeMajorIndustryGroupsGrid;

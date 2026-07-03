"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { CrudeOilPetroleumRow } from "@/lib/api/tables/production-and-imports-of-crude-oil-and-petroleum-products";

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

interface ProductionAndImportsOfCrudeOilGridProps {
    data  : CrudeOilPetroleumRow[];
    units : string;
}

// Format a number to up to 4 decimal places, trimming trailing zeros.
function formatValue(value : number | null) : string {
    if (value == null) return "-";
    const fixed = value.toFixed(4);
    // Trim trailing zeros after the decimal point.
    return fixed.replace(/\.?0+$/, "");
}

const ProductionAndImportsOfCrudeOilGrid : React.FC<ProductionAndImportsOfCrudeOilGridProps> = ({ data, units }) => {
    const numberFormatter = (params : any) => formatValue(params.value);

    const columnDefs = useMemo<ColDef[]>(() => {
        const cols : ColDef[] = [
            {
                field     : "year",
                headerName: "Year",
                pinned    : "left",
                width     : 120,
                filter    : true,
                cellStyle : { fontWeight: "500" },
            },
            {
                field         : "crude_prod",
                headerName    : "Production — crude oil (MMT)",
                flex          : 1,
                minWidth      : 200,
                type          : "numericColumn",
                valueFormatter: numberFormatter,
                cellStyle     : { textAlign: "right" },
            },
            {
                field         : "pol_prod",
                headerName    : "Production — POL products (MMT)",
                flex          : 1,
                minWidth      : 220,
                type          : "numericColumn",
                valueFormatter: numberFormatter,
                cellStyle     : { textAlign: "right" },
            },
            {
                field         : "crude_imp",
                headerName    : "Imports — crude oil (MMT)",
                flex          : 1,
                minWidth      : 200,
                type          : "numericColumn",
                valueFormatter: numberFormatter,
                cellStyle     : { textAlign: "right" },
            },
            {
                field         : "pol_imp",
                headerName    : "Imports — POL products (MMT)",
                flex          : 1,
                minWidth      : 220,
                type          : "numericColumn",
                valueFormatter: numberFormatter,
                cellStyle     : { textAlign: "right" },
            },
        ];
        return cols;
    }, []);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable       : true,
        filter         : true,
        resizable      : true,
        suppressMovable: true,
    }), []);

    return (
        <div className="crude-oil-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={25}
                paginationPageSizeSelector={[25, 50]}
                domLayout="normal"
                suppressCellFocus={true}
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default ProductionAndImportsOfCrudeOilGrid;

"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import {
    InstitutionalSectorGrossCapitalFormationRow,
} from "@/lib/api/tables/institutional-sector-wise-gross-capital-formation-at-current-prices";

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

interface InstitutionalSectorGrossCapitalFormationGridProps {
    data : InstitutionalSectorGrossCapitalFormationRow[];
}

const InstitutionalSectorGrossCapitalFormationGrid : React.FC<InstitutionalSectorGrossCapitalFormationGridProps> = ({ data }) => {
    // Number formatter with commas, rounded to whole rupees
    const numberFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    };

    // Column definitions
    const columnDefs = useMemo<ColDef[]>(() => {
        const numCol = (field : string, headerName : string) : ColDef => ({
            field,
            headerName,
            flex           : 1,
            minWidth       : 220,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        });

        return [
            {
                field      : "year",
                headerName : "Year",
                pinned     : "left",
                width      : 120,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            numCol("public_non_financial_corporations",  "Public non-financial corporations (₹ cr)"),
            numCol("private_non_financial_corporations", "Private non-financial corporations (₹ cr)"),
            numCol("public_financial_corporations",      "Public financial corporations (₹ cr)"),
            numCol("private_financial_corporations",     "Private financial corporations (₹ cr)"),
            numCol("general_government",                 "General government (₹ cr)"),
            numCol("households_including_npish",         "Households incl. NPISH (₹ cr)"),
            numCol("gross_capital_formation",            "Gross capital formation (₹ cr)"),
        ];
    }, []);

    const defaultColDef = useMemo<ColDef>(() => {
        return {
            sortable        : true,
            filter          : true,
            resizable       : true,
            suppressMovable : true,
        };
    }, []);

    return (
        <div className="institutional-sector-gcf-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[10, 20, 50]}
                domLayout="normal"
                suppressCellFocus={true}
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default InstitutionalSectorGrossCapitalFormationGrid;

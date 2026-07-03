"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { SectorWiseDomesticSavingsRow } from "@/lib/api/tables/sector-wise-domestic-savings-at-current-prices";

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

interface SectorWiseDomesticSavingsGridProps {
    data : SectorWiseDomesticSavingsRow[];
}

const SectorWiseDomesticSavingsGrid : React.FC<SectorWiseDomesticSavingsGridProps> = ({ data }) => {
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
            numCol("gross_savings",                      "Gross savings (₹ cr)"),
            numCol("non_financial_corporations",          "Non-financial corporations (₹ cr)"),
            numCol("public_non_financial_corporations",   "Public non-financial corps. (₹ cr)"),
            numCol("private_non_financial_corporations",  "Private non-financial corps. (₹ cr)"),
            numCol("financial_corporations",              "Financial corporations (₹ cr)"),
            numCol("public_financial_corporations",       "Public financial corps. (₹ cr)"),
            numCol("private_financial_corporations",      "Private financial corps. (₹ cr)"),
            numCol("general_government",                  "General government (₹ cr)"),
            numCol("household_sector",                    "Household sector (₹ cr)"),
            numCol("gross_financial_saving",              "Gross financial saving (₹ cr)"),
            numCol("less_financial_liabilities",          "Less: financial liabilities (₹ cr)"),
            numCol("saving_in_physical_assets",           "Saving in physical assets (₹ cr)"),
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
        <div className="sector-wise-domestic-savings-grid-wrapper">
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

export default SectorWiseDomesticSavingsGrid;

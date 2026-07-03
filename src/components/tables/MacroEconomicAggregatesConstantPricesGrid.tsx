"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import {
    MacroEconomicAggregatesConstantPricesRow,
} from "@/lib/api/tables/macro-economic-aggregates-at-constant-prices";

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

interface MacroEconomicAggregatesConstantPricesGridProps {
    data : MacroEconomicAggregatesConstantPricesRow[];
}

const MacroEconomicAggregatesConstantPricesGrid : React.FC<MacroEconomicAggregatesConstantPricesGridProps> = ({ data }) => {
    // Number formatter with commas
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
            minWidth       : 180,
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
            numCol("gva_at_basic_prices",          "GVA at basic prices (₹ cr)"),
            numCol("net_taxes_on_products",         "Net taxes on products (₹ cr)"),
            numCol("gross_domestic_product",        "GDP (₹ cr)"),
            numCol("consumption_of_fixed_capital",  "Consumption of fixed capital (₹ cr)"),
            numCol("net_domestic_product",          "NDP (₹ cr)"),
            numCol("primary_income_from_row_net",   "Primary income from RoW, net (₹ cr)"),
            numCol("gross_national_income",         "GNI (₹ cr)"),
            numCol("net_national_income",           "NNI (₹ cr)"),
            numCol("gross_capital_formation",       "Gross capital formation (₹ cr)"),
            numCol("net_capital_formation",         "Net capital formation (₹ cr)"),
            numCol("per_capita_gdp",                "Per capita GDP (₹)"),
            numCol("per_capita_gni",                "Per capita GNI (₹)"),
            numCol("per_capita_nni",                "Per capita NNI (₹)"),
            numCol("per_capita_pfce",               "Per capita PFCE (₹)"),
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
        <div className="macro-economic-aggregates-constant-prices-grid-wrapper">
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

export default MacroEconomicAggregatesConstantPricesGrid;

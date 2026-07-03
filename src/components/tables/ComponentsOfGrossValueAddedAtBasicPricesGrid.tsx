"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { ComponentsOfGrossValueAddedAtBasicPricesRow } from "@/lib/api/tables/components-of-gross-value-added-at-basic-prices";

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

interface ComponentsOfGrossValueAddedAtBasicPricesGridProps {
    data : ComponentsOfGrossValueAddedAtBasicPricesRow[];
}

const ComponentsOfGrossValueAddedAtBasicPricesGrid : React.FC<ComponentsOfGrossValueAddedAtBasicPricesGridProps> = ({ data }) => {
    // Number formatter with Indian-locale commas
    const numberFormatter = (params : any) => {
        if (params.value == null) return "–";
        return params.value.toLocaleString("en-IN");
    };

    const numCol = (field : string, headerName : string, minWidth = 170) : ColDef => ({
        field,
        headerName,
        minWidth,
        type           : "numericColumn",
        valueFormatter : numberFormatter,
        cellStyle      : { textAlign: "right" },
    });

    // Column definitions
    const columnDefs = useMemo<ColDef[]>(() => [
        {
            field      : "year",
            headerName : "Year",
            pinned     : "left",
            width      : 120,
            filter     : true,
            cellStyle  : { fontWeight: "500" },
        },

        // Agriculture
        numCol("agri_const", "Agriculture, forestry & fishing — const"),
        numCol("agri_curr",  "Agriculture, forestry & fishing — curr"),

        // Industry
        numCol("industry_const", "Industry — const"),
        numCol("industry_curr",  "Industry — curr"),

        // Mining & quarrying
        numCol("mining_quarrying_const", "Mining & quarrying — const"),
        numCol("mining_quarrying_curr",  "Mining & quarrying — curr"),

        // Manufacturing
        numCol("manufacturing_const", "Manufacturing — const"),
        numCol("manufacturing_curr",  "Manufacturing — curr"),

        // Electricity, gas & water
        numCol("electricity_gas_water_const", "Electricity, gas & water — const"),
        numCol("electricity_gas_water_curr",  "Electricity, gas & water — curr"),

        // Services
        numCol("services_const", "Services — const"),
        numCol("services_curr",  "Services — curr"),

        // Construction
        numCol("construction_const", "Construction — const"),
        numCol("construction_curr",  "Construction — curr"),

        // Trade, hotels & transport
        numCol("trade_hotels_transport_const", "Trade, hotels & transport — const"),
        numCol("trade_hotels_transport_curr",  "Trade, hotels & transport — curr"),

        // Financial & real estate
        numCol("financial_realestate_const", "Financial & real estate — const"),
        numCol("financial_realestate_curr",  "Financial & real estate — curr"),

        // Public admin & defence
        numCol("public_admin_defence_const", "Public admin & defence — const"),
        numCol("public_admin_defence_curr",  "Public admin & defence — curr"),

        // GVA at basic prices
        numCol("gva_const", "GVA at basic prices — const"),
        numCol("gva_curr",  "GVA at basic prices — curr"),

        // PFCE
        numCol("pfce_const", "PFCE — const"),
        numCol("pfce_curr",  "PFCE — curr"),

        // GFCE
        numCol("gfce_const", "GFCE — const"),
        numCol("gfce_curr",  "GFCE — curr"),

        // GFCF
        numCol("gfcf_const", "GFCF — const"),
        numCol("gfcf_curr",  "GFCF — curr"),

        // Changes in stocks
        numCol("changes_in_stocks_const", "Changes in stocks — const"),
        numCol("changes_in_stocks_curr",  "Changes in stocks — curr"),

        // Valuables
        numCol("valuables_const", "Valuables — const"),
        numCol("valuables_curr",  "Valuables — curr"),

        // Exports
        numCol("exports_const", "Exports — const"),
        numCol("exports_curr",  "Exports — curr"),

        // Imports
        numCol("imports_const", "Imports — const"),
        numCol("imports_curr",  "Imports — curr"),

        // Discrepancies
        numCol("discrepancies_const", "Discrepancies — const"),
        numCol("discrepancies_curr",  "Discrepancies — curr"),

        // GDP at market prices (constant only)
        numCol("gdp_const", "GDP at market prices — const"),
    ], []);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="components-of-gross-value-added-at-basic-prices-grid-wrapper">
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

export default ComponentsOfGrossValueAddedAtBasicPricesGrid;

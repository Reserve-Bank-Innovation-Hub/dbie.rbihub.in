"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { NetStateValueAddedAtCurrentPrices, NsvaStateEntry } from "@/lib/api/tables/net-state-value-added-by-economic-activity-at-current-prices";

// Register AG Grid modules
ModuleRegistry.registerModules([ AllCommunityModule ]);

const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface NsvaAtCurrentPricesGridProps {
    data          : NetStateValueAddedAtCurrentPrices;
    selectedState : NsvaStateEntry;
}

// One row per economic activity, one column per year.
interface GridRow {
    _isTotal   : boolean;
    _activity  : string;
    [year : string] : boolean | string | number | null;
}

const NsvaAtCurrentPricesGrid : React.FC<NsvaAtCurrentPricesGridProps> = ({ data, selectedState }) => {
    const { activities } = data;
    const { years, values } = selectedState;

    // Number formatter with Indian-locale commas; null / missing → "-".
    const numberFormatter = (params : { value : unknown }) => {
        if (params.value == null) return "-";
        return (params.value as number).toLocaleString("en-IN", { maximumFractionDigits : 2 });
    };

    // Rows: one per activity. years[year_idx] × activities[activity_idx] are stored as
    // values[year_idx][activity_idx], so we transpose here.
    const rowData = useMemo<GridRow[]>(() => {
        return activities.map((activity, ai) => {
            const isTotal = ai === activities.length - 1;
            const row : GridRow = {
                _isTotal  : isTotal,
                _activity : activity,
            };
            years.forEach((year, yi) => {
                row[year] = values[yi]?.[ai] ?? null;
            });
            return row;
        });
    }, [ activities, years, values ]);

    // Columns: activity label pinned left, then one column per year (newest-first).
    const columnDefs = useMemo<ColDef[]>(() => {
        const labelCol : ColDef = {
            field      : "_activity",
            headerName : "Economic activity",
            pinned     : "left",
            width      : 360,
            filter     : true,
            resizable  : true,
            cellStyle  : (params) => ({
                fontWeight : (params.data as GridRow)?._isTotal ? "700" : "400",
                textAlign  : "left",
            }),
        };

        const yearCols : ColDef[] = years.map((year) => ({
            field          : year,
            headerName     : year,
            width          : 130,
            valueFormatter : numberFormatter,
            cellStyle      : (params) => ({
                textAlign       : "right",
                fontWeight      : (params.data as GridRow)?._isTotal ? "700" : "400",
                backgroundColor : (params.data as GridRow)?._isTotal ? "#f0f9ff" : "#ffffff",
            }),
        }));

        return [ labelCol, ...yearCols ];
    }, [ years ]);

    return (
        <div className="nsva-at-current-prices-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                theme={customTheme}
                pagination={false}
                domLayout="normal"
                defaultColDef={{
                    sortable  : false,
                    resizable : true,
                }}
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default NsvaAtCurrentPricesGrid;

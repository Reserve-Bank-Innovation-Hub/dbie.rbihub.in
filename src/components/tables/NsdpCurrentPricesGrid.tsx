"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeQuartz, ColDef } from "ag-grid-community";

// UI ==================================================================================================================
import { Div } from "fictoan-react";

// LIB =================================================================================================================
import { NsdpCurrentPrices } from "@/lib/api/tables/net-state-domestic-product-state-wise-at-current-prices";

ModuleRegistry.registerModules([ AllCommunityModule ]);

const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface NsdpCurrentPricesGridProps {
    data : NsdpCurrentPrices;
}

interface GridRow {
    _state : string;
    [year : string] : string | number | null;
}

const NsdpCurrentPricesGrid : React.FC<NsdpCurrentPricesGridProps> = ({ data }) => {
    const { years, states } = data;

    const formatAmount = (params : { value : unknown }) => {
        if (params.value == null) return "-";
        return (params.value as number).toLocaleString("en-IN", {
            maximumFractionDigits : 0,
        });
    };

    // One row per state.
    const rowData = useMemo<GridRow[]>(() => {
        return states.map((state) => {
            const row : GridRow = { _state : state };
            years.forEach((year, yi) => {
                row[year] = data.data[state]?.[yi] ?? null;
            });
            return row;
        });
    }, [ states, years, data.data ]);

    // Pinned state column + one column per year (newest-first).
    const columnDefs = useMemo<ColDef[]>(() => {
        const stateCol : ColDef = {
            field      : "_state",
            headerName : "State / UT",
            pinned     : "left",
            width      : 220,
            filter     : true,
            resizable  : true,
            cellStyle  : { textAlign : "left" },
        };

        const yearCols : ColDef[] = years.map((year) => ({
            field          : year,
            headerName     : year,
            width          : 130,
            valueFormatter : formatAmount,
            cellStyle      : { textAlign : "right" },
        }));

        return [ stateCol, ...yearCols ];
    }, [ years ]);

    return (
        <Div className="nsdp-current-prices-grid-wrapper" style={{ display : "flex", flexDirection : "column", flex : 1 }}>
            <div style={{ flex : 1 }}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    theme={customTheme}
                    pagination={true}
                    paginationPageSize={50}
                    enableBrowserTooltips={true}
                    defaultColDef={{
                        sortable  : true,
                        resizable : true,
                    }}
                />
            </div>
        </Div>
    );
};

export default NsdpCurrentPricesGrid;

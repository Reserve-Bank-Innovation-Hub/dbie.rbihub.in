"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { ASICharacteristic, ASIDataRow } from "@/lib/api/tables/annual-survey-of-industries-principal-characteristics";

// Register AG Grid modules
ModuleRegistry.registerModules([ AllCommunityModule ]);

// Custom theme aligned with the rest of the app
const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface AnnualSurveyOfIndustriesPrincipalCharacteristicsGridProps {
    data            : ASIDataRow[];
    characteristics : ASICharacteristic[];
}

// One grid row per year: year label plus one numeric field per characteristic code.
interface GridRow {
    year : string;
    [code : string] : string | number | null;
}

const AnnualSurveyOfIndustriesPrincipalCharacteristicsGrid : React.FC<
    AnnualSurveyOfIndustriesPrincipalCharacteristicsGridProps
> = ({ data, characteristics }) => {
    // Number formatter: Indian locale with up to 2 decimal places.
    const numberFormatter = (params : any) => {
        if (params.value == null) return "—";
        return (params.value as number).toLocaleString("en-IN", {
            maximumFractionDigits : 2,
        });
    };

    // Build one flat row per year.
    const rowData = useMemo<GridRow[]>(() => {
        return data.map((d) => {
            const row : GridRow = { year: d.year };
            characteristics.forEach((ch) => {
                row[ch.code] = d.values[ch.code] ?? null;
            });
            return row;
        });
    }, [ data, characteristics ]);

    // Year column pinned left, then one column per characteristic.
    const columnDefs = useMemo<ColDef[]>(() => {
        const yearCol : ColDef = {
            field      : "year",
            headerName : "Year",
            pinned     : "left",
            width      : 120,
            filter     : true,
            cellStyle  : { fontWeight: "500" },
        };

        const charCols : ColDef[] = characteristics.map((ch) => ({
            field          : ch.code,
            headerName     : ch.label,
            flex           : 1,
            minWidth       : 180,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        }));

        return [ yearCol, ...charCols ];
    }, [ characteristics ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="annual-survey-of-industries-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={25}
                paginationPageSizeSelector={[ 25, 50, 100 ]}
                domLayout="normal"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default AnnualSurveyOfIndustriesPrincipalCharacteristicsGrid;

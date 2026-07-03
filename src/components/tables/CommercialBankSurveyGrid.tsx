"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { CommercialBankSurveyColumn, CommercialBankSurveyRow } from "@/lib/api/tables/commercial-bank-survey";

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

interface CommercialBankSurveyGridProps {
    data    : CommercialBankSurveyRow[];
    columns : CommercialBankSurveyColumn[];
}

const CommercialBankSurveyGrid : React.FC<CommercialBankSurveyGridProps> = ({ data, columns }) => {
    // Numbers formatted to 2 decimal places with Indian locale; null/undefined → em dash.
    const numFormatter = (params : any) => {
        if (params.value == null) return "—";
        return params.value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Column groups: Liabilities = codes starting with "c"; Assets = codes starting with "s".
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const liabilityCols = columns.filter((c) => c.code.startsWith("c"));
        const assetCols     = columns.filter((c) => c.code.startsWith("s"));

        const makeSeriesCol = (col : CommercialBankSurveyColumn) : ColDef => ({
            headerName     : col.rawCode ? `${col.rawCode} — ${col.label}` : col.label,
            field          : col.code,
            flex           : 1,
            minWidth       : 160,
            type           : "numericColumn",
            valueFormatter : numFormatter,
            cellStyle      : { textAlign: "right" },
        });

        const liabilitiesGroup : ColGroupDef = {
            headerName : "Liabilities",
            children   : liabilityCols.map(makeSeriesCol),
        };

        const assetsGroup : ColGroupDef = {
            headerName : "Assets",
            children   : assetCols.map(makeSeriesCol),
        };

        return [
            {
                field      : "fortnight",
                headerName : "Fortnight",
                pinned     : "left",
                width      : 130,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            liabilitiesGroup,
            assetsGroup,
        ];
    }, [ columns ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="commercial-bank-survey-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[ 25, 50, 100, 200 ]}
                domLayout="normal"
                suppressCellFocus={true}
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default CommercialBankSurveyGrid;

"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { ScbInvestmentsColumn, ScbInvestmentsRow } from "@/lib/api/tables/scb-investments";

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

interface ScbInvestmentsGridProps {
    data    : ScbInvestmentsRow[];
    columns : ScbInvestmentsColumn[];
}

const ScbInvestmentsGrid : React.FC<ScbInvestmentsGridProps> = ({ data, columns }) => {
    // Number formatter: two decimal places, en-IN locale; null → em dash.
    const numberFormatter = (params : any) => {
        if (params.value == null) return "—";
        return params.value.toLocaleString("en-IN", {
            minimumFractionDigits : 2,
            maximumFractionDigits : 2,
        });
    };

    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        // Build one top-level ColGroupDef per distinct group, preserving order.
        const groupOrder : string[] = [];
        const groupMap : Record<string, ScbInvestmentsColumn[]> = {};
        for (const col of columns) {
            if (!groupMap[col.group]) {
                groupOrder.push(col.group);
                groupMap[col.group] = [];
            }
            groupMap[col.group].push(col);
        }

        const groups : ColGroupDef[] = groupOrder.map(groupName => ({
            headerName : groupName,
            children   : groupMap[groupName].map<ColDef>(col => ({
                headerName     : col.label,
                field          : col.code,
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            })),
        }));

        return [
            {
                field      : "fortnight",
                headerName : "Fortnight ended",
                pinned     : "left",
                width      : 130,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            ...groups,
        ];
    }, [ columns ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="scb-investments-grid-wrapper">
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

export default ScbInvestmentsGrid;

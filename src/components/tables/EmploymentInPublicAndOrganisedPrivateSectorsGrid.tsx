"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { EmploymentRow } from "@/lib/api/tables/employment-in-public-and-organised-private-sectors";

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

interface EmploymentInPublicAndOrganisedPrivateSectorsGridProps {
    data : EmploymentRow[];
}

const EmploymentInPublicAndOrganisedPrivateSectorsGrid : React.FC<EmploymentInPublicAndOrganisedPrivateSectorsGridProps> = ({ data }) => {
    // Number formatter with commas; null → en-dash
    const numberFormatter = (params : any) => {
        if (params.value == null) return "–";
        return params.value.toLocaleString("en-IN");
    };

    // Column definitions
    const columnDefs = useMemo<ColDef[]>(() => {
        const cols : ColDef[] = [
            {
                field      : "year",
                headerName : "Year",
                pinned     : "left",
                width      : 120,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            {
                field          : "public_sector",
                headerName     : "Public sector (end-March) — in lakhs",
                flex           : 1,
                minWidth       : 240,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "private_sector",
                headerName     : "Private sector (end-March) — in lakhs",
                flex           : 1,
                minWidth       : 240,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
        ];
        return cols;
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
        <div className="employment-public-private-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[25, 50, 100]}
                domLayout="normal"
                suppressCellFocus={true}
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default EmploymentInPublicAndOrganisedPrivateSectorsGrid;

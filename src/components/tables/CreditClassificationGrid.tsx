"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { CreditDataRow, OrganizationInfo } from "@/lib/api/publications";

// Register AG Grid modules
ModuleRegistry.registerModules([ AllCommunityModule ]);

// Create custom theme based on Quartz
const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface CreditClassificationGridProps {
    data          : CreditDataRow[];
    organizations : OrganizationInfo[];
}

const CreditClassificationGrid : React.FC<CreditClassificationGridProps> = ({
    data,
    organizations,
}) => {

    // Number formatter with commas
    const numberFormatter = (params : any) => {
        if (params.value == null || params.value === 0) return "-";
        return params.value.toLocaleString("en-IN");
    };

    // Select key organizations to display
    const displayOrganizations = [
        {key : "publicSector", displayName : "Public sector"},
        {key : "cooperativeSector", displayName : "Co-operative sector"},
        {key : "privateCorporateSector", displayName : "Private corporate sector"},
        {key : "householdSector", displayName : "Household sector"},
        {key : "individuals", displayName : "Individuals"},
        {key : "totalCredit", displayName : "Total credit"},
    ];

    // Column definitions
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const columns : (ColDef | ColGroupDef)[] = [
            {
                field      : "period",
                headerName : "Period",
                pinned     : "left",
                width      : 120,
                filter     : true,
                cellStyle  : {fontWeight : "500"},
            },
            {
                field      : "occupation",
                headerName : "Occupation",
                pinned     : "left",
                width      : 300,
                cellStyle  : (params) => {
                    // Bold styling for main categories
                    const isBold = params.value?.startsWith("I.") ||
                        params.value?.startsWith("II.") ||
                        params.value?.startsWith("III.") ||
                        params.value?.startsWith("IV.") ||
                        params.value?.startsWith("V.") ||
                        params.value?.startsWith("VI.") ||
                        params.value?.startsWith("VII.") ||
                        params.value?.startsWith("VIII.") ||
                        params.value?.startsWith("TOTAL");

                    return isBold ? {fontWeight : "600"} : undefined;
                },
            },
        ];

        // Add column groups for each organisation
        displayOrganizations.forEach((org) => {
            columns.push({
                headerName : org.displayName,
                children   : [
                    {
                        field          : `${org.key}.noOfAccounts`,
                        headerName     : "Accounts",
                        width          : 110,
                        type           : "numericColumn",
                        valueFormatter : numberFormatter,
                        cellStyle      : {textAlign : "right"},
                    },
                    {
                        field          : `${org.key}.creditLimit`,
                        headerName     : "Limit (₹Cr)",
                        width          : 120,
                        type           : "numericColumn",
                        valueFormatter : numberFormatter,
                        cellStyle      : {textAlign : "right"},
                    },
                    {
                        field          : `${org.key}.amountOutstanding`,
                        headerName     : "Outstanding (₹Cr)",
                        width          : 150,
                        type           : "numericColumn",
                        valueFormatter : numberFormatter,
                        cellStyle      : {textAlign : "right"},
                    },
                ],
            } as ColGroupDef);
        });

        return columns;
    }, []);

    // Default column configuration
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            sortable        : true,
            filter          : true,
            resizable       : true,
            suppressMovable : true,
        };
    }, []);

    return (
        <div className="credit-classification-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={100}
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

export default CreditClassificationGrid;

"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorRow } from "@/lib/api/tables/changes-in-financial-assets-liabilities-of-the-household-sector";

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

interface ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorGridProps {
    data : ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorRow[];
}

const ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorGrid : React.FC<ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorGridProps> = ({ data }) => {
    // Number formatter with Indian locale commas; null → en-dash
    const numberFormatter = (params : any) => {
        if (params.value == null) return "–";
        return params.value.toLocaleString("en-IN");
    };

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
                field          : "currency",
                headerName     : "Currency",
                flex           : 1,
                minWidth       : 140,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "bank_deposits",
                headerName     : "Bank deposits",
                flex           : 1,
                minWidth       : 150,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "non_banking_deposits",
                headerName     : "Non-banking deposits",
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "life_insurance_fund",
                headerName     : "Life insurance fund",
                flex           : 1,
                minWidth       : 170,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "provident_pension_fund",
                headerName     : "Provident & pension fund",
                flex           : 1,
                minWidth       : 200,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "claims_on_government",
                headerName     : "Claims on Government",
                flex           : 1,
                minWidth       : 190,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "shares_debentures",
                headerName     : "Shares & debentures",
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "units_of_uti",
                headerName     : "Units of UTI",
                flex           : 1,
                minWidth       : 140,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "trade_debt_net",
                headerName     : "Trade debt (net)",
                flex           : 1,
                minWidth       : 160,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "changes_in_financial_assets",
                headerName     : "Changes in financial assets",
                flex           : 1,
                minWidth       : 210,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right", fontWeight: "600" },
            },
            {
                field          : "bank_advances",
                headerName     : "Bank advances",
                flex           : 1,
                minWidth       : 150,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "loans_other_financial_institutions",
                headerName     : "Loans — other financial institutions",
                flex           : 1,
                minWidth       : 260,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "loans_government",
                headerName     : "Loans — Government",
                flex           : 1,
                minWidth       : 180,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "loans_cooperative_societies",
                headerName     : "Loans — co-operative societies",
                flex           : 1,
                minWidth       : 230,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            },
        ];
        return cols;
    }, []);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="changes-in-financial-assets-liabilities-grid-wrapper">
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

export default ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorGrid;

"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeQuartz, ColDef } from "ag-grid-community";

// UI ==================================================================================================================
import { Div } from "fictoan-react";

// LIB =================================================================================================================
import { BankCreditByIndustry, BankCreditIndustry } from "@/lib/api/tables/bank-credit-by-industry";

ModuleRegistry.registerModules([ AllCommunityModule ]);

const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface BankCreditByIndustryGridProps {
    data : BankCreditByIndustry;
}

// Hierarchy depth: "2" -> 0, "2.1" -> 1, "2.2.1" -> 2, "2.13.1" -> 2, etc.
const codeDepth = (code : string) : number => code.split(".").length - 1;

// One row per industry: the `code` and `label` plus one numeric field per
// period string (values, or null for gaps). A single index signature covers
// both the fixed columns and the dynamic period columns.
interface GridRow {
    code  : string;
    label : string;
    [period : string] : string | number | null;
}

// Normalise a period label for display: strip the comma and collapse multiple
// spaces. "January,  18 2019" -> "January 18 2019".
const normalisePeriod = (p : string) : string =>
    p.replace(',', '').replace(/\s+/g, ' ').trim();

const BankCreditByIndustryGrid : React.FC<BankCreditByIndustryGridProps> = ({ data }) => {
    // Formatter for Indian locale with 2 decimal places (values are floats).
    const formatAmount = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN", {
            minimumFractionDigits : 2,
            maximumFractionDigits : 2,
        });
    };

    // Rows: one per industry, values keyed by period label (raw, as-is from the
    // source — matches what the column `field` uses).
    const rowData = useMemo<GridRow[]>(() => {
        return data.items.map((industry : BankCreditIndustry) => {
            const row : GridRow = { code : industry.code, label : industry.label };
            data.periods.forEach((period, pi) => {
                row[period] = industry.values[pi];
            });
            return row;
        });
    }, [ data ]);

    // Columns: label pinned left (indented by depth), then one column per period.
    const columnDefs = useMemo<ColDef[]>(() => {
        const labelCol : ColDef = {
            field      : "label",
            headerName : "Industry",
            pinned     : "left",
            width      : 320,
            filter     : true,
            cellStyle  : (params) => {
                const row     = params.data as GridRow;
                const depth   = codeDepth(String(row.code));
                const isTotal = row.code === "2";
                return {
                    paddingLeft  : `${8 + depth * 16}px`,
                    fontWeight   : isTotal ? "700" : depth === 1 ? "600" : "normal",
                    ...(isTotal && { background : "#f0f9ff" }),
                };
            },
        };

        const periodCols : ColDef[] = data.periods.map((period) => ({
            field          : period,
            headerName     : normalisePeriod(period),
            headerTooltip  : period,
            valueFormatter : formatAmount,
            width          : 160,
            cellStyle      : (params : any) => {
                const row     = params.data as GridRow;
                const isTotal = row.code === "2";
                return {
                    textAlign : "right",
                    ...(isTotal && { background : "#f0f9ff", fontWeight : "700" }),
                };
            },
        }));

        return [ labelCol, ...periodCols ];
    }, [ data ]);

    return (
        <Div className="bank-credit-by-industry-grid-wrapper" style={{ display : "flex", flexDirection : "column", flex : 1 }}>
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
                        cellStyle : { textAlign : "right" },
                    }}
                />
            </div>
        </Div>
    );
};

export default BankCreditByIndustryGrid;

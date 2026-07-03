"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeQuartz, ColDef } from "ag-grid-community";

// UI ==================================================================================================================
import { Div } from "fictoan-react";

// LIB =================================================================================================================
import { BankCreditBySector, BankCreditSector } from "@/lib/api/tables/bank-credit-by-sector";

ModuleRegistry.registerModules([ AllCommunityModule ]);

const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface BankCreditBySectorGridProps {
    data : BankCreditBySector;
}

// Depth of a code in the hierarchy (number of dotted segments beyond the top).
// "I" -> 0, "1" -> 0, "2.1" -> 1, "3.7.1" -> 2.
const codeDepth = (code : string) : number => code.split(".").length - 1;

// Top-level codes have no dot and are either Roman numerals or single digits.
const isTopLevel = (code : string) : boolean => !code.includes(".");

// One row per sector, with period values keyed by period label.
interface GridRow {
    _sector : BankCreditSector;
    _label  : string;
    [periodLabel : string] : BankCreditSector | string | number | null;
}

const BankCreditBySectorGrid : React.FC<BankCreditBySectorGridProps> = ({ data }) => {
    const { periods, items } = data;

    const formatAmount = (params : { value : unknown }) => {
        if (params.value == null) return "-";
        return (params.value as number).toLocaleString("en-IN", {
            maximumFractionDigits : 0,
        });
    };

    // Rows: one per sector item.
    const rowData = useMemo<GridRow[]>(() => {
        return items.map((item) => {
            const depth  = codeDepth(item.code);
            const indent = "    ".repeat(depth); // 4 non-breaking spaces per level
            const row : GridRow = {
                _sector : item,
                _label  : `${indent}${item.label}`,
            };
            periods.forEach((period, pi) => {
                row[period] = item.values[pi];
            });
            return row;
        });
    }, [ items, periods ]);

    // Columns: sector label pinned left, then one column per period.
    const columnDefs = useMemo<ColDef[]>(() => {
        const labelCol : ColDef = {
            field          : "_label",
            headerName     : "Sector",
            pinned         : "left",
            width          : 380,
            filter         : true,
            resizable      : true,
            cellStyle      : (params) => {
                const item = (params.data as GridRow)?._sector;
                return {
                    fontWeight : item && isTopLevel(item.code) ? "700" : "400",
                    textAlign  : "left",
                };
            },
        };

        const periodCols : ColDef[] = periods.map((period) => ({
            field          : period,
            headerName     : period,
            width          : 160,
            valueFormatter : formatAmount,
            cellStyle      : (params) => {
                const item = (params.data as GridRow)?._sector;
                const top  = item && isTopLevel(item.code);
                return {
                    textAlign       : "right",
                    fontWeight      : top ? "600" : "400",
                    backgroundColor : top ? "#f0f9ff" : "#ffffff",
                };
            },
        }));

        return [ labelCol, ...periodCols ];
    }, [ periods ]);

    return (
        <Div className="bank-credit-by-sector-grid-wrapper" style={{ display : "flex", flexDirection : "column", flex : 1 }}>
            <div style={{ flex : 1 }}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    theme={customTheme}
                    pagination={true}
                    paginationPageSize={50}
                    enableBrowserTooltips={true}
                    defaultColDef={{
                        sortable  : false,
                        resizable : true,
                    }}
                />
            </div>
        </Div>
    );
};

export default BankCreditBySectorGrid;

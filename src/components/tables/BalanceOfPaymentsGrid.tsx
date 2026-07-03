"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo, useState } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeQuartz, ColDef, ColGroupDef } from "ag-grid-community";

// UI ==================================================================================================================
import { Div, Text } from "fictoan-react";

// LIB =================================================================================================================
import { BoPItem, BoPEntry } from "@/lib/api/tables/balance-of-payments-usd";

ModuleRegistry.registerModules([ AllCommunityModule ]);

const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

// Transaction type filter options.
type TxType = "Credit" | "Debit" | "Net";

interface BalanceOfPaymentsGridProps {
    items   : BoPItem[];
    data    : BoPEntry[];
    periods : string[];
    unit    : string;
}

// Depth of a BoP item code ("0"→0, "1"→0, "1.1"→1, "1.2.1"→2 …). The overall
// total (code "0") and the two top-level accounts ("1", "2", "3", "4") are level 0.
function codeDepth(code : string) : number {
    if (code === "0") return 0;
    return code.replace(/_legacy$/, "").split(".").length - 1;
}

// Top-level group code for grouping columns: first segment of the code.
function topLevelGroup(code : string) : string {
    if (code === "0") return "0";
    return code.replace(/_legacy$/, "").split(".")[0];
}

// One AG Grid row: the period label + tx type + one field per item code.
interface GridRow {
    period : string;
    type   : TxType;
    [code  : string] : string | number | null;
}

const TRANSACTION_TYPES : TxType[] = [ "Credit", "Debit", "Net" ];

const BalanceOfPaymentsGrid : React.FC<BalanceOfPaymentsGridProps> = ({ items, data, periods, unit }) => {
    const [ selectedType, setSelectedType ] = useState<TxType>("Net");
    const [ selectedPeriods, setSelectedPeriods ] = useState<number>(20); // how many recent quarters to show

    // Format values: null → "—", numbers with localised commas and up to 2 dp.
    const numFormatter = (params : any) => {
        if (params.value == null) return "—";
        const v = Number(params.value);
        if (Number.isNaN(v)) return "—";
        return v.toLocaleString("en-IN", { maximumFractionDigits : 2 });
    };

    // Row data: one AG Grid row per period, values keyed by item code.
    const rowData = useMemo<GridRow[]>(() => {
        const slice = selectedPeriods === 0 ? periods : periods.slice(0, selectedPeriods);
        return slice.map((period) => {
            const entry = data.find((e) => e.period === period && e.type === selectedType);
            const row : GridRow = { period, type : selectedType };
            if (entry) {
                items.forEach((item, idx) => {
                    row[item.code] = entry.values[idx];
                });
            } else {
                items.forEach((item) => { row[item.code] = null; });
            }
            return row;
        });
    }, [ data, items, periods, selectedType, selectedPeriods ]);

    // Column definitions: period pinned left, then items grouped by top-level account.
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const periodCol : ColDef = {
            field      : "period",
            headerName : "Quarter",
            pinned     : "left",
            width      : 140,
            filter     : true,
            cellStyle  : { fontWeight : "600", textAlign : "center" },
        };

        // Overall BoP (code "0") pinned right next to the period.
        const overallItem = items.find((item) => item.code === "0");
        const overallCol : ColDef | null = overallItem
            ? {
                field          : overallItem.code,
                headerName     : "Overall BoP",
                headerTooltip  : overallItem.label,
                valueFormatter : numFormatter,
                pinned         : "left",
                width          : 130,
                cellStyle      : { fontWeight : "700", textAlign : "right", backgroundColor : "#f0f9ff" },
            }
            : null;

        // Group all other items by their top-level account code ("1", "2", "3", "4").
        const groups = new Map<string, ColGroupDef>();
        const groupOrder : string[] = [];

        // Top-level group labels, derived from items themselves.
        const groupLabels = new Map<string, string>();
        for (const item of items) {
            const gl = topLevelGroup(item.code);
            if (!groupLabels.has(gl)) {
                const topItem = items.find((it) => it.code === gl);
                groupLabels.set(gl, topItem ? topItem.label : gl);
            }
        }

        for (const item of items) {
            if (item.code === "0") continue; // handled separately
            const depth   = codeDepth(item.code);
            const gl      = topLevelGroup(item.code);
            const isTop   = depth <= 1; // top-level and their immediate sub-accounts
            const indent  = "  ".repeat(Math.max(0, depth - 1));

            const colDef : ColDef = {
                field          : item.code,
                headerName     : `${indent}${item.label}`,
                headerTooltip  : `${item.code}  ${item.label}`,
                valueFormatter : numFormatter,
                width          : isTop ? 170 : 160,
                cellStyle      : isTop
                    ? { fontWeight : "600", textAlign : "right", backgroundColor : "#f0f9ff" }
                    : { textAlign : "right" },
            };

            if (!groups.has(gl)) {
                groups.set(gl, {
                    headerName    : `${gl}  ${groupLabels.get(gl) ?? gl}`,
                    headerTooltip : `Account ${gl}`,
                    children      : [],
                    openByDefault : depth <= 1,
                });
                groupOrder.push(gl);
            }
            (groups.get(gl)!.children as ColDef[]).push(colDef);
        }

        const groupCols = groupOrder.map((gl) => groups.get(gl)!);
        return [ periodCol, ...(overallCol ? [ overallCol ] : []), ...groupCols ];
    }, [ items, selectedType ]); // numFormatter is stable via ref, but eslint can't tell

    return (
        <Div className="balance-of-payments-grid-wrapper" style={{ display : "flex", flexDirection : "column", flex : 1 }}>
            {/* CONTROLS /////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div style={{ display : "flex", alignItems : "center", gap : "var(--tiny)", marginBottom : "var(--nano)", flexWrap : "wrap" }}>
                <Div style={{ display : "flex", alignItems : "center", gap : "var(--nano)" }}>
                    <Text size="small" weight="600">Transaction type</Text>
                    {TRANSACTION_TYPES.map((t) => (
                        <button
                            key={t}
                            onClick={() => setSelectedType(t)}
                            style={{
                                padding         : "3px 10px",
                                fontSize        : 13,
                                cursor          : "pointer",
                                borderRadius    : 4,
                                border          : "1px solid #ccc",
                                background      : selectedType === t ? "#1e3a5f" : "#fff",
                                color           : selectedType === t ? "#fff" : "inherit",
                                fontWeight      : selectedType === t ? 600 : 400,
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </Div>

                <Div style={{ display : "flex", alignItems : "center", gap : "var(--nano)" }}>
                    <Text size="small" weight="600">Periods</Text>
                    <select
                        value={selectedPeriods}
                        onChange={(e) => setSelectedPeriods(Number(e.target.value))}
                        style={{ padding : "4px 8px", fontSize : 13 }}
                    >
                        <option value={10}>Last 10 quarters</option>
                        <option value={20}>Last 20 quarters</option>
                        <option value={40}>Last 40 quarters</option>
                        <option value={0}>All quarters</option>
                    </select>
                </Div>

                <Text size="small" opacity="60">
                    ({unit})
                </Text>
            </Div>

            <div style={{ flex : 1 }}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    theme={customTheme}
                    pagination={true}
                    paginationPageSize={25}
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

export default BalanceOfPaymentsGrid;

"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz, CellStyle } from "ag-grid-community";

// LIB =================================================================================================================
import { InternationalInvestmentPosition, IIPItem } from "@/lib/api/tables/international-investment-position";

// Register AG Grid modules
ModuleRegistry.registerModules([ AllCommunityModule ]);

// Create custom theme
const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface InternationalInvestmentPositionGridProps {
    data : InternationalInvestmentPosition;
}

// One AG Grid row: the item label plus one field per quarter index.
interface GridRow {
    label   : string;
    code    : string;
    indent  : number;
    section : string;
    [qIdx   : string] : string | number | null;
}

// Padding (px) for each indent level.
const INDENT_PADDING : Record<number, number> = { 0: 8, 1: 24, 2: 40 };

// Extract the fiscal year from a quarter label, e.g. "2025-26:Q3" -> "2025-26".
function fiscalYear(quarter : string) : string {
    return quarter.split(":")[0] ?? quarter;
}

// Extract the quarter part, e.g. "2025-26:Q3" -> "Q3".
function quarterPart(quarter : string) : string {
    return quarter.split(":")[1] ?? quarter;
}

const InternationalInvestmentPositionGrid : React.FC<InternationalInvestmentPositionGridProps> = ({ data }) => {
    const { quarters, items, data: values } = data;

    // Build AG Grid rowData: one row per item.
    const rowData = useMemo<GridRow[]>(() => {
        return items.map((item : IIPItem) => {
            const row : GridRow = {
                label   : item.label,
                code    : item.code,
                indent  : item.indent,
                section : item.section,
            };
            const itemValues = values[item.code] ?? [];
            itemValues.forEach((v, i) => { row[`q${i}`] = v; });
            return row;
        });
    }, [ items, values ]);

    // Build column definitions.
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        // Pinned label column.
        const labelCol : ColDef = {
            field      : "label",
            headerName : "Items",
            pinned     : "left",
            width      : 280,
            suppressMovable : true,
            cellStyle  : (params) => {
                const indent : number = params.data?.indent ?? 0;
                const code   : string = params.data?.code   ?? "";
                const isBold = code === "A" || code === "B" || code === "NET";
                return {
                    paddingLeft : `${INDENT_PADDING[indent] ?? 8}px`,
                    fontWeight  : isBold ? "700" : "400",
                };
            },
        };

        // Group quarter columns by fiscal year.
        const fyOrder : string[] = [];
        const fyMap   = new Map<string, { quarterIdx: number; quarterLabel: string }[]>();

        quarters.forEach((q, i) => {
            const fy = fiscalYear(q);
            if (!fyMap.has(fy)) {
                fyMap.set(fy, []);
                fyOrder.push(fy);
            }
            fyMap.get(fy)!.push({ quarterIdx: i, quarterLabel: quarterPart(q) });
        });

        const quarterGroups : ColGroupDef[] = fyOrder.map((fy) => {
            const children : ColDef[] = (fyMap.get(fy) ?? []).map(({ quarterIdx, quarterLabel }) => ({
                field         : `q${quarterIdx}`,
                headerName    : quarterLabel,
                width         : 110,
                type          : "numericColumn",
                suppressMovable : true,
                valueFormatter : (params) => {
                    if (params.value == null) return "—";
                    return Math.round(params.value).toLocaleString("en-IN", {
                        maximumFractionDigits : 0,
                        minimumFractionDigits : 0,
                    });
                },
                cellStyle     : (params) : CellStyle => {
                    const style : CellStyle = { textAlign: "right" };
                    if (typeof params.value === "number" && params.value < 0) {
                        style["color"] = "#d12d1b";
                    }
                    return style;
                },
            }));

            return {
                headerName    : fy,
                children,
                marryChildren : true,
            };
        });

        return [ labelCol, ...quarterGroups ];
    }, [ quarters ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : false,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="iip-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={false}
                domLayout="autoHeight"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={false}
            />
        </div>
    );
};

export default InternationalInvestmentPositionGrid;

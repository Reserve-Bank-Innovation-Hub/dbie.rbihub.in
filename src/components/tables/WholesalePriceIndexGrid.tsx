"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo, useState } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeQuartz, ColDef, ColGroupDef } from "ag-grid-community";

// UI ==================================================================================================================
import { Div, Text } from "fictoan-react";

// LIB =================================================================================================================
import { WpiBase, WpiCommodity } from "@/lib/api/tables/wholesale-price-index";

ModuleRegistry.registerModules([ AllCommunityModule ]);

const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface WholesalePriceIndexGridProps {
    bases : WpiBase[];
}

// Depth of a commodity in the taxonomy (number of dotted segments beyond the
// top). "1" -> 0, "1.1" -> 1, "1.1.1" -> 2. Used to indent column headers so
// the hierarchy reads without a separate tree.
const codeDepth = (code : string) : number => code.split(".").length - 1;

// One row per month: the `month` label plus one field per commodity code
// (values, or null for gaps). A single index signature covers both.
interface GridRow {
    month : string;
    [commodityCode : string] : string | number | null;
}

const WholesalePriceIndexGrid : React.FC<WholesalePriceIndexGridProps> = ({ bases }) => {
    const [ selectedBase, setSelectedBase ] = useState<string>(bases[0]?.base ?? "");

    const base = useMemo(
        () => bases.find(b => b.base === selectedBase) ?? bases[0],
        [ bases, selectedBase ],
    );

    const formatIndex = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN", { minimumFractionDigits : 1, maximumFractionDigits : 1 });
    };

    // Rows: one per month, values keyed by commodity code.
    const rowData = useMemo<GridRow[]>(() => {
        if (!base) return [];
        return base.months.map((month, mi) => {
            const row : GridRow = { month };
            base.commodities.forEach((commodity, ci) => {
                row[commodity.code] = base.values[mi][ci];
            });
            return row;
        });
    }, [ base ]);

    // Columns: month pinned left, then a column per commodity grouped under its
    // top-level category (code prefix "1.1", "1.2", "1.3"). Header names are
    // indented by depth to convey the finer hierarchy.
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        if (!base) return [];

        const monthCol : ColDef = {
            field      : "month",
            headerName : "Month",
            pinned     : "left",
            width      : 120,
            filter     : true,
            cellStyle  : { fontWeight : "bold", textAlign : "center" },
        };

        const makeCol = (commodity : WpiCommodity) : ColDef => {
            const depth  = codeDepth(commodity.code);
            const indent = "  ".repeat(Math.max(0, depth - 1));
            const isTop  = depth <= 1; // ALL COMMODITIES + top-level categories
            return {
                field          : commodity.code,
                headerName     : `${indent}${commodity.label}`,
                headerTooltip  : `${commodity.code} ${commodity.label}` +
                    (commodity.weight != null ? ` (weight ${commodity.weight})` : ""),
                valueFormatter : formatIndex,
                width          : 150,
                cellStyle      : isTop
                    ? { fontWeight : "600", textAlign : "right", backgroundColor : "#f0f9ff" }
                    : { textAlign : "right" },
            };
        };

        // ALL COMMODITIES (code "1") pinned next to the month for context.
        const allCommodities = base.commodities.find(c => c.code === "1");
        const pinnedCols : ColDef[] = allCommodities
            ? [ { ...makeCol(allCommodities), pinned : "left" as const, width : 160 } ]
            : [];

        // Group the remaining commodities by their top-level category code
        // ("1.1" primary articles, "1.2" fuel & power, "1.3" manufactured), in
        // source order, keeping every descendant column under its category.
        const groups : ColGroupDef[] = [];
        const groupByCode = new Map<string, ColGroupDef>();

        for (const commodity of base.commodities) {
            if (commodity.code === "1") continue; // already pinned
            const topCode = commodity.code.split(".").slice(0, 2).join("."); // "1.1.1" -> "1.1"
            let group = groupByCode.get(topCode);
            if (!group) {
                const topCommodity = base.commodities.find(c => c.code === topCode);
                group = {
                    headerName : topCommodity ? topCommodity.label : topCode,
                    children   : [],
                };
                groupByCode.set(topCode, group);
                groups.push(group);
            }
            (group.children as ColDef[]).push(makeCol(commodity));
        }

        return [ monthCol, ...pinnedCols, ...groups ];
    }, [ base ]);

    return (
        <Div className="wholesale-price-index-grid-wrapper" style={{ display : "flex", flexDirection : "column", flex : 1 }}>
            {/* BASE-YEAR SELECTOR ///////////////////////////////////////////////////////////////////////////////// */}
            <Div style={{ display : "flex", alignItems : "center", gap : "var(--nano)", marginBottom : "var(--nano)" }}>
                <Text size="small" weight="600">Base year</Text>
                <select
                    value={selectedBase}
                    onChange={(e) => setSelectedBase(e.target.value)}
                    style={{ padding : "4px 8px", fontSize : 14 }}
                >
                    {bases.map(b => (
                        <option key={b.base} value={b.base}>{b.base}</option>
                    ))}
                </select>
            </Div>

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

export default WholesalePriceIndexGrid;

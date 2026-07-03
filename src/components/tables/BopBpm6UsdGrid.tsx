"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { BopItem, BopQuarter, BopBpm6Usd } from "@/lib/api/tables/bop-bpm6-usd";

// Register AG Grid modules
ModuleRegistry.registerModules([ AllCommunityModule ]);

const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface BopBpm6UsdGridProps {
    items    : BopItem[];
    quarters : BopQuarter[];
    values   : BopBpm6Usd["values"];
}

// One AG Grid row: the item label plus credit/debit/net per quarter.
interface GridRow {
    itemCode  : string;
    itemLabel : string;
    indent    : number;
    [field : string] : string | number | null;
}

// Format a BoP value: two decimal places, comma-separated; "—" for null.
function fmtValue(v : number | null) : string {
    if (v == null) return "—";
    return v.toLocaleString("en-IN", { minimumFractionDigits : 2, maximumFractionDigits : 2 });
}

const BopBpm6UsdGrid : React.FC<BopBpm6UsdGridProps> = ({ items, quarters, values }) => {
    // Build AG Grid rowData: one row per BPM6 item.
    const rowData = useMemo<GridRow[]>(() => {
        return items.map((item, ii) => {
            const row : GridRow = {
                itemCode  : item.code,
                itemLabel : item.label,
                indent    : item.indent,
            };
            quarters.forEach((q, qi) => {
                const [credit, debit, net] = values[ii]?.[qi] ?? [null, null, null];
                row[`${qi}_credit`] = credit;
                row[`${qi}_debit`]  = debit;
                row[`${qi}_net`]    = net;
            });
            return row;
        });
    }, [ items, quarters, values ]);

    // Column definitions: item label pinned left, then one ColGroupDef per quarter
    // with Credit/Debit/Net children.
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const itemCol : ColDef = {
            field      : "itemLabel",
            headerName : "Item",
            pinned     : "left",
            width      : 340,
            filter     : true,
            cellStyle  : (params) => {
                const indent : number = params.data?.indent ?? 0;
                return {
                    paddingLeft : `${8 + indent * 16}px`,
                    fontWeight  : indent === 0 ? "600" : "400",
                };
            },
        };

        const quarterCols : ColGroupDef[] = quarters.map((q, qi) => ({
            headerName    : q.label + (q.status ? ` (${q.status})` : ""),
            marryChildren : true,
            children      : [
                {
                    field          : `${qi}_credit`,
                    headerName     : "Credit",
                    width          : 130,
                    type           : "numericColumn",
                    valueFormatter : (p : any) => fmtValue(p.value),
                    cellStyle      : { textAlign : "right" },
                } as ColDef,
                {
                    field          : `${qi}_debit`,
                    headerName     : "Debit",
                    width          : 130,
                    type           : "numericColumn",
                    valueFormatter : (p : any) => fmtValue(p.value),
                    cellStyle      : { textAlign : "right" },
                } as ColDef,
                {
                    field          : `${qi}_net`,
                    headerName     : "Net",
                    width          : 130,
                    type           : "numericColumn",
                    valueFormatter : (p : any) => fmtValue(p.value),
                    cellStyle      : (p : any) => ({
                        textAlign  : "right",
                        color      : p.value == null ? undefined : p.value < 0 ? "#c0392b" : "#155724",
                        fontWeight : "500",
                    }),
                } as ColDef,
            ],
        }));

        return [ itemCol, ...quarterCols ];
    }, [ quarters ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : false,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="bop-bpm6-usd-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                domLayout="autoHeight"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={false}
            />
        </div>
    );
};

export default BopBpm6UsdGrid;

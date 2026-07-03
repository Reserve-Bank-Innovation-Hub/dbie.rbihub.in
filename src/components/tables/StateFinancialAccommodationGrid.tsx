"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import {
    StateFinancialAccommodationColumn,
    StateFinancialAccommodationRow,
} from "@/lib/api/tables/state-financial-accommodation";

// Register AG Grid modules
ModuleRegistry.registerModules([ AllCommunityModule ]);

// Custom theme — aligns with rest of DBIE tables
const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface StateFinancialAccommodationGridProps {
    columns : StateFinancialAccommodationColumn[];
    data    : StateFinancialAccommodationRow[];
}

// AG Grid row: state name + one field per column index.
interface GridRow {
    state : string;
    [colIdx : string] : string | number | null;
}

// Format a value in Indian numbering system; "—" for null.
const numFormatter = (params : { value : number | null }) => {
    if (params.value == null) return "—";
    return params.value.toLocaleString("en-IN");
};

const rightAlign = { textAlign : "right" as const };

// Shorten the measure header labels for narrow columns.
function shortMeasure(measure : string) : string {
    if (/average/i.test(measure)) return "Avg amount";
    if (/days/i.test(measure))    return "Days";
    return measure;
}

// Shorten facility names to fit column group headers.
function shortFacility(facility : string) : string {
    const m = facility.match(/\(([A-Z]+)\)/);
    return m ? m[1] : facility;
}

const StateFinancialAccommodationGrid : React.FC<StateFinancialAccommodationGridProps> = ({
    columns,
    data,
}) => {
    // Flatten data into AG Grid rowData (one row per state).
    const rowData = useMemo<GridRow[]>(() => {
        return data.map(row => {
            const gr : GridRow = { state : row.state };
            row.values.forEach((v, i) => { gr[`c${i}`] = v; });
            return gr;
        });
    }, [ data ]);

    // Build 3-level grouped column defs:
    //   month group → facility sub-group → [avg amount, days] children
    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const stateCol : ColDef = {
            field      : "state",
            headerName : "State / UT",
            pinned     : "left",
            width      : 200,
            filter     : true,
            cellStyle  : { fontWeight : "500" },
        };

        // Use insertion-order Maps to preserve month → facility → child ordering.
        const monthGroups  = new Map<string, Map<string, ColDef[]>>();
        const colIndexMap  = new Map<string, number>();

        columns.forEach((col, i) => {
            const monthKey    = col.month;
            const facilityKey = `${col.month}__${col.facility}`;

            if (!monthGroups.has(monthKey)) {
                monthGroups.set(monthKey, new Map());
            }
            const facilityMap = monthGroups.get(monthKey)!;

            if (!facilityMap.has(facilityKey)) {
                facilityMap.set(facilityKey, []);
            }

            const childDef : ColDef = {
                field          : `c${i}`,
                headerName     : shortMeasure(col.measure),
                headerTooltip  : col.measure,
                width          : /days/i.test(col.measure) ? 80 : 120,
                type           : "numericColumn",
                valueFormatter : numFormatter,
                cellStyle      : rightAlign,
            };

            facilityMap.get(facilityKey)!.push(childDef);
        });

        // Assemble into ColGroupDef hierarchy.
        const groups : ColGroupDef[] = [];

        for (const [ monthKey, facilityMap ] of monthGroups) {
            const facilityGroups : ColGroupDef[] = [];
            for (const [ , children ] of facilityMap) {
                // Derive the display facility name from the first child's column record.
                const firstColIdx = parseInt(children[0].field!.slice(1), 10);
                const facLabel    = shortFacility(columns[firstColIdx].facility);
                facilityGroups.push({
                    headerName    : facLabel,
                    children,
                    marryChildren : true,
                });
            }
            groups.push({
                headerName : monthKey,
                children   : facilityGroups,
            });
        }

        return [ stateCol, ...groups ];
    }, [ columns ]);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="state-financial-accommodation-grid-wrapper">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                domLayout="autoHeight"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={false}
            />
        </div>
    );
};

export default StateFinancialAccommodationGrid;

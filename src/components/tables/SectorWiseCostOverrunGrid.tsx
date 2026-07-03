"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { SectorWiseCostOverrunRow } from "@/lib/api/tables/sector-wise-cost-overrun-of-delayed-central-sector-projects-end-march";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 13,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface SectorWiseCostOverrunGridProps {
    data  : SectorWiseCostOverrunRow[];
    units : string;
}

const SECTOR_KEYS = [
    'atomic_energy', 'civil_aviation', 'coal', 'finance', 'fertilisers',
    'mines', 'steel', 'petro_chemicals', 'petroleum', 'power',
    'railways', 'surface_transport', 'telecommunication', 'others', 'total',
];

const SECTOR_NAMES = [
    'Atomic energy', 'Civil aviation', 'Coal', 'Finance', 'Fertilisers',
    'Mines', 'Steel', 'Petro-chemicals', 'Petroleum', 'Power',
    'Railways', 'Surface transport', 'Telecommunication', 'Others', 'Total',
];

const SUB_SUFFIXES  = ['num_projects', 'original_estimate', 'now_anticipated', 'cost_overrun'] as const;
const SUB_HEADERS   = ['No. of projects', 'Original estimate', 'Now anticipated', 'Cost overrun'];

const SectorWiseCostOverrunGrid : React.FC<SectorWiseCostOverrunGridProps> = ({ data, units }) => {
    const numberFormatter = (params : any) => {
        if (params.value == null) return "-";
        return params.value.toLocaleString("en-IN");
    };

    const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
        const cols : (ColDef | ColGroupDef)[] = [
            {
                field      : "year",
                headerName : "Year",
                pinned     : "left",
                width      : 90,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
        ];

        SECTOR_KEYS.forEach((key, idx) => {
            const children : ColDef[] = SUB_SUFFIXES.map((suf, si) => ({
                field          : `${key}_${suf}`,
                headerName     : SUB_HEADERS[si],
                flex           : 1,
                minWidth       : 110,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            }));
            cols.push({
                headerName : SECTOR_NAMES[idx],
                children,
            });
        });

        return cols;
    }, []);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="sector-wise-cost-overrun-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={30}
                paginationPageSizeSelector={[15, 30, 50]}
                domLayout="normal"
                suppressCellFocus={true}
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />
        </div>
    );
};

export default SectorWiseCostOverrunGrid;

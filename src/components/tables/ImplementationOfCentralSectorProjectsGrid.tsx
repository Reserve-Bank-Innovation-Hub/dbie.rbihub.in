"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { ImplementationOfCentralSectorProjectsRow } from "@/lib/api/tables/implementation-of-central-sector-projects-status-end-march";

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

interface ImplementationOfCentralSectorProjectsGridProps {
    data  : ImplementationOfCentralSectorProjectsRow[];
    units : string;
}

const SECTOR_KEYS = [
    'atomic_energy', 'civil_aviation', 'coal', 'finance', 'fertilisers',
    'mines', 'steel', 'petro_chemicals', 'petroleum', 'power',
    'railways', 'surface_transport', 'telecommunication', 'health_family_welfare',
    'urban_development', 'others',
];

const SECTOR_NAMES = [
    'Atomic energy', 'Civil aviation', 'Coal', 'Finance', 'Fertilisers',
    'Mines', 'Steel', 'Petro-chemicals', 'Petroleum', 'Power',
    'Railways', 'Surface transport', 'Telecommunication', 'Health & family welfare',
    'Urban development', 'Others',
];

const SUB_COLS = ['ahead', 'on_schedule', 'delayed', 'without_doc', 'total'] as const;
const SUB_HEADERS = ['Ahead', 'On schedule', 'Delayed', 'Without D.O.C.', 'Total'];

const ImplementationOfCentralSectorProjectsGrid : React.FC<ImplementationOfCentralSectorProjectsGridProps> = ({ data, units }) => {
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

        // Regular sectors (1-16): 5 sub-cols each
        SECTOR_KEYS.forEach((key, idx) => {
            const children : ColDef[] = SUB_COLS.map((sub, si) => ({
                field          : `${key}_${sub}`,
                headerName     : SUB_HEADERS[si],
                flex           : 1,
                minWidth       : 90,
                type           : "numericColumn",
                valueFormatter : numberFormatter,
                cellStyle      : { textAlign: "right" },
            }));
            cols.push({
                headerName : SECTOR_NAMES[idx],
                children,
            });
        });

        // Sector 17 (total): 4 sub-cols only
        const totalChildren : ColDef[] = ['ahead', 'on_schedule', 'delayed', 'without_doc'].map((sub, si) => ({
            field          : `total_${sub}`,
            headerName     : SUB_HEADERS[si],
            flex           : 1,
            minWidth       : 90,
            type           : "numericColumn",
            valueFormatter : numberFormatter,
            cellStyle      : { textAlign: "right" },
        }));
        cols.push({
            headerName : 'Total',
            children   : totalChildren,
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
        <div className="implementation-of-central-sector-projects-grid-wrapper">
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

export default ImplementationOfCentralSectorProjectsGrid;

// OTHER ===============================================================================================================
import { loadData } from "../loadData";

export interface CrudeOilPetroleumColumn {
    code  : string;
    label : string;
    group : string;
}

export interface CrudeOilPetroleumRow {
    year       : string;       // "2024-25" (newest-first)
    crude_prod : number | null; // Production — crude oil (MMT)
    pol_prod   : number | null; // Production — POL products (MMT)
    crude_imp  : number | null; // Imports — crude oil (MMT)
    pol_imp    : number | null; // Imports — POL products (MMT)
}

export interface ProductionAndImportsOfCrudeOilAndPetroleumProducts {
    reportTitle : string;
    units       : string;
    columns     : CrudeOilPetroleumColumn[];
    data        : CrudeOilPetroleumRow[];
}

/**
 * Fetch annual crude oil and petroleum products production and imports data
 * from the build-synced JSON.
 */
export function getProductionAndImportsOfCrudeOilAndPetroleumProducts() : ProductionAndImportsOfCrudeOilAndPetroleumProducts {
    return loadData<ProductionAndImportsOfCrudeOilAndPetroleumProducts>(
        "production-and-imports-of-crude-oil-and-petroleum-products",
    );
}

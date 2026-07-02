// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// A single commodity in the taxonomy. The numeric `code` ("1.1.1") carries the
// hierarchy; `parent` is the code with its last segment dropped (null at the
// top level). `weight` is the commodity's contribution to the index (ALL
// COMMODITIES = 100), null where the source leaves it blank.
export interface WpiCommodity {
    code    : string;
    label   : string;
    parent  : string | null;
    weight  : number | null;
}

// One base year. `months` is newest-first; `values` is a months × commodities
// matrix aligned to `months` and `commodities` by index, with null for gaps.
export interface WpiBase {
    base        : string;
    sheetName   : string;
    commodities : WpiCommodity[];
    months      : string[];
    values      : (number | null)[][];
}

export interface WholesalePriceIndex {
    reportTitle : string;
    bases       : WpiBase[];
}

/**
 * Fetch the wholesale price index (Table 22) data.
 *
 * Every base year is included in full — the current base (2011-12) leads, with
 * the historical bases (2004-05 … 1970-71) following.
 */
export async function getWholesalePriceIndex() : Promise<WholesalePriceIndex> {
    return loadData<WholesalePriceIndex>("wholesale-price-index");
}

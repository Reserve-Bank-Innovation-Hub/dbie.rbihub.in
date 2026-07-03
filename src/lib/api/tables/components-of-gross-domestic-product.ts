import { loadData } from "../loadData";

export interface ComponentsOfGrossDomesticProductRow {
    year                    : string;
    pfce_const              : number | null;
    pfce_curr               : number | null;
    gfce_const              : number | null;
    gfce_curr               : number | null;
    gfcf_const              : number | null;
    gfcf_curr               : number | null;
    changes_in_stocks_const : number | null;
    changes_in_stocks_curr  : number | null;
    valuables_const         : number | null;
    valuables_curr          : number | null;
    exports_const           : number | null;
    exports_curr            : number | null;
    imports_const           : number | null;
    imports_curr            : number | null;
    discrepancies_const     : number | null;
    discrepancies_curr      : number | null;
    gdp_const               : number | null;
}

export interface ComponentsOfGrossDomesticProduct {
    reportTitle : string;
    baseYear    : string;
    unit        : string;
    data        : ComponentsOfGrossDomesticProductRow[];
}

export async function getComponentsOfGrossDomesticProduct() : Promise<ComponentsOfGrossDomesticProduct> {
    return loadData<ComponentsOfGrossDomesticProduct>("components-of-gross-domestic-product");
}

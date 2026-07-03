// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Sector-wise cost overrun of delayed central sector projects (End-March)
export interface SectorWiseCostOverrunRow {
    year                              : string;
    atomic_energy_num_projects        : number | null;
    atomic_energy_original_estimate   : number | null;
    atomic_energy_now_anticipated     : number | null;
    atomic_energy_cost_overrun        : number | null;
    civil_aviation_num_projects       : number | null;
    civil_aviation_original_estimate  : number | null;
    civil_aviation_now_anticipated    : number | null;
    civil_aviation_cost_overrun       : number | null;
    coal_num_projects                 : number | null;
    coal_original_estimate            : number | null;
    coal_now_anticipated              : number | null;
    coal_cost_overrun                 : number | null;
    finance_num_projects              : number | null;
    finance_original_estimate         : number | null;
    finance_now_anticipated           : number | null;
    finance_cost_overrun              : number | null;
    fertilisers_num_projects          : number | null;
    fertilisers_original_estimate     : number | null;
    fertilisers_now_anticipated       : number | null;
    fertilisers_cost_overrun          : number | null;
    mines_num_projects                : number | null;
    mines_original_estimate           : number | null;
    mines_now_anticipated             : number | null;
    mines_cost_overrun                : number | null;
    steel_num_projects                : number | null;
    steel_original_estimate           : number | null;
    steel_now_anticipated             : number | null;
    steel_cost_overrun                : number | null;
    petro_chemicals_num_projects      : number | null;
    petro_chemicals_original_estimate : number | null;
    petro_chemicals_now_anticipated   : number | null;
    petro_chemicals_cost_overrun      : number | null;
    petroleum_num_projects            : number | null;
    petroleum_original_estimate       : number | null;
    petroleum_now_anticipated         : number | null;
    petroleum_cost_overrun            : number | null;
    power_num_projects                : number | null;
    power_original_estimate           : number | null;
    power_now_anticipated             : number | null;
    power_cost_overrun                : number | null;
    railways_num_projects             : number | null;
    railways_original_estimate        : number | null;
    railways_now_anticipated          : number | null;
    railways_cost_overrun             : number | null;
    surface_transport_num_projects      : number | null;
    surface_transport_original_estimate : number | null;
    surface_transport_now_anticipated   : number | null;
    surface_transport_cost_overrun      : number | null;
    telecommunication_num_projects      : number | null;
    telecommunication_original_estimate : number | null;
    telecommunication_now_anticipated   : number | null;
    telecommunication_cost_overrun      : number | null;
    others_num_projects               : number | null;
    others_original_estimate          : number | null;
    others_now_anticipated            : number | null;
    others_cost_overrun               : number | null;
    total_num_projects                : number | null;
    total_original_estimate           : number | null;
    total_now_anticipated             : number | null;
    total_cost_overrun                : number | null;
    [key : string]                    : string | number | null;
}

export interface SectorWiseCostOverrun {
    reportTitle : string;
    units       : string;
    sectors     : string[];
    sectorKeys  : string[];
    data        : SectorWiseCostOverrunRow[];
}

/**
 * Fetch sector-wise cost overrun of delayed central sector projects data from the build-synced JSON.
 */
export async function getSectorWiseCostOverrun() : Promise<SectorWiseCostOverrun> {
    return loadData<SectorWiseCostOverrun>("sector-wise-cost-overrun-of-delayed-central-sector-projects-end-march");
}

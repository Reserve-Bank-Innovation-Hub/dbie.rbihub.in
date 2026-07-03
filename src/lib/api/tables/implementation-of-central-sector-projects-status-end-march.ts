// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Implementation of Central Sector Projects - Status (End-March)
export interface ImplementationOfCentralSectorProjectsRow {
    year                        : string;
    atomic_energy_ahead         : number | null;
    atomic_energy_on_schedule   : number | null;
    atomic_energy_delayed       : number | null;
    atomic_energy_without_doc   : number | null;
    atomic_energy_total         : number | null;
    civil_aviation_ahead        : number | null;
    civil_aviation_on_schedule  : number | null;
    civil_aviation_delayed      : number | null;
    civil_aviation_without_doc  : number | null;
    civil_aviation_total        : number | null;
    coal_ahead                  : number | null;
    coal_on_schedule            : number | null;
    coal_delayed                : number | null;
    coal_without_doc            : number | null;
    coal_total                  : number | null;
    finance_ahead               : number | null;
    finance_on_schedule         : number | null;
    finance_delayed             : number | null;
    finance_without_doc         : number | null;
    finance_total               : number | null;
    fertilisers_ahead           : number | null;
    fertilisers_on_schedule     : number | null;
    fertilisers_delayed         : number | null;
    fertilisers_without_doc     : number | null;
    fertilisers_total           : number | null;
    mines_ahead                 : number | null;
    mines_on_schedule           : number | null;
    mines_delayed               : number | null;
    mines_without_doc           : number | null;
    mines_total                 : number | null;
    steel_ahead                 : number | null;
    steel_on_schedule           : number | null;
    steel_delayed               : number | null;
    steel_without_doc           : number | null;
    steel_total                 : number | null;
    petro_chemicals_ahead       : number | null;
    petro_chemicals_on_schedule : number | null;
    petro_chemicals_delayed     : number | null;
    petro_chemicals_without_doc : number | null;
    petro_chemicals_total       : number | null;
    petroleum_ahead             : number | null;
    petroleum_on_schedule       : number | null;
    petroleum_delayed           : number | null;
    petroleum_without_doc       : number | null;
    petroleum_total             : number | null;
    power_ahead                 : number | null;
    power_on_schedule           : number | null;
    power_delayed               : number | null;
    power_without_doc           : number | null;
    power_total                 : number | null;
    railways_ahead              : number | null;
    railways_on_schedule        : number | null;
    railways_delayed            : number | null;
    railways_without_doc        : number | null;
    railways_total              : number | null;
    surface_transport_ahead        : number | null;
    surface_transport_on_schedule  : number | null;
    surface_transport_delayed      : number | null;
    surface_transport_without_doc  : number | null;
    surface_transport_total        : number | null;
    telecommunication_ahead        : number | null;
    telecommunication_on_schedule  : number | null;
    telecommunication_delayed      : number | null;
    telecommunication_without_doc  : number | null;
    telecommunication_total        : number | null;
    health_family_welfare_ahead        : number | null;
    health_family_welfare_on_schedule  : number | null;
    health_family_welfare_delayed      : number | null;
    health_family_welfare_without_doc  : number | null;
    health_family_welfare_total        : number | null;
    urban_development_ahead        : number | null;
    urban_development_on_schedule  : number | null;
    urban_development_delayed      : number | null;
    urban_development_without_doc  : number | null;
    urban_development_total        : number | null;
    others_ahead               : number | null;
    others_on_schedule         : number | null;
    others_delayed             : number | null;
    others_without_doc         : number | null;
    others_total               : number | null;
    total_ahead                : number | null;
    total_on_schedule          : number | null;
    total_delayed              : number | null;
    total_without_doc          : number | null;
    [key : string]             : string | number | null;
}

export interface ImplementationOfCentralSectorProjects {
    reportTitle : string;
    units       : string;
    sectors     : string[];
    sectorKeys  : string[];
    data        : ImplementationOfCentralSectorProjectsRow[];
}

/**
 * Fetch implementation of central sector projects status data from the build-synced JSON.
 */
export async function getImplementationOfCentralSectorProjects() : Promise<ImplementationOfCentralSectorProjects> {
    return loadData<ImplementationOfCentralSectorProjects>("implementation-of-central-sector-projects-status-end-march");
}

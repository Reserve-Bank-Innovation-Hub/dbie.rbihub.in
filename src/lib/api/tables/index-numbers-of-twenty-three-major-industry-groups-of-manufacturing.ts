// LIB API: index-numbers-of-twenty-three-major-industry-groups-of-manufacturing

// OTHER ===============================================================================================================
import { loadData } from "../loadData";

export interface IndustryGroupRow {
    year   : string;
    values : Record<string, number | null>;
}

export interface IndustryGroupIndustry {
    code   : string;
    label  : string;
    weight : number | null;
}

export interface IndustryGroupBase {
    base       : string;
    label      : string;
    industries : IndustryGroupIndustry[];
    data       : IndustryGroupRow[];
}

export interface IndexNumbersTwentyThreeMajorIndustryGroups {
    reportTitle : string;
    bases       : IndustryGroupBase[];
}

export async function getIndexNumbersTwentyThreeMajorIndustryGroups() : Promise<IndexNumbersTwentyThreeMajorIndustryGroups> {
    return loadData<IndexNumbersTwentyThreeMajorIndustryGroups>(
        "index-numbers-of-twenty-three-major-industry-groups-of-manufacturing",
    );
}

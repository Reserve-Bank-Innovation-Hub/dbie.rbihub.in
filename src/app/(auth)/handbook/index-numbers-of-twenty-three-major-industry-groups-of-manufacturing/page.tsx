// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getIndexNumbersTwentyThreeMajorIndustryGroups } from "@/lib/api/tables/index-numbers-of-twenty-three-major-industry-groups-of-manufacturing";

// OTHER ===============================================================================================================
import IndexNumbersTwentyThreeMajorIndustryGroupsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Index numbers of twenty-three major industry groups of manufacturing | Handbook — Database on Indian Economy",
    description : "Annual index numbers of twenty-three major industry groups of the manufacturing sector (base: 2011-12 = 100).",
    keywords    : [
        "index numbers",
        "manufacturing",
        "industry groups",
        "IIP",
        "annual series",
        "RBI",
        "CSO",
        "2011-12",
        "industrial production",
    ],
    openGraph : {
        title       : "Index numbers of twenty-three major industry groups of manufacturing | Handbook — Database on Indian Economy",
        description : "Annual index numbers of twenty-three major industry groups of the manufacturing sector (base: 2011-12 = 100).",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter   : {
        card        : "summary_large_image",
        title       : "Index numbers of twenty-three major industry groups of manufacturing | Handbook — Database on Indian Economy",
        description : "Annual index numbers of twenty-three major industry groups of the manufacturing sector (base: 2011-12 = 100).",
    },
};

export default async function Page() {
    const data = await getIndexNumbersTwentyThreeMajorIndustryGroups();
    return <IndexNumbersTwentyThreeMajorIndustryGroupsPage data={data} />;
}

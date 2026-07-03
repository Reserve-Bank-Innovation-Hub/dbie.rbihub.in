// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getAreaUnderCultivationMajorCommercialCrops } from "@/lib/api/tables/area-under-cultivation-major-commercial-crops";

// OTHER ===============================================================================================================
import AreaUnderCultivationMajorCommercialCropsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Area under cultivation — major commercial crops | Handbook — Database on Indian Economy",
    description : "Annual area under cultivation for major commercial crops in India (oilseeds, sugarcane, cotton, jute, tea, coffee, tobacco) in lakhs hectares, from 1950-51 onwards.",
    keywords    : [
        "area under cultivation",
        "commercial crops",
        "oilseeds area",
        "sugarcane area",
        "cotton area",
        "jute area",
        "India agriculture",
        "RBI Handbook",
    ],
    openGraph   : {
        title       : "Area under cultivation — major commercial crops | Handbook — Database on Indian Economy",
        description : "Annual area under cultivation for major commercial crops in India (oilseeds, sugarcane, cotton, jute, tea, coffee, tobacco) in lakhs hectares, from 1950-51 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Area under cultivation — major commercial crops | Handbook — Database on Indian Economy",
        description : "Annual area under cultivation for major commercial crops in India (oilseeds, sugarcane, cotton, jute, tea, coffee, tobacco) in lakhs hectares, from 1950-51 onwards.",
    },
};

export default async function Page() {
    const tableData = await getAreaUnderCultivationMajorCommercialCrops();

    return <AreaUnderCultivationMajorCommercialCropsPage tableData={tableData} />;
}

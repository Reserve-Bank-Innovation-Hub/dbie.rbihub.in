// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getAgriProductionMajorCrops } from "@/lib/api/tables/index-numbers-of-agricultural-production-major-crops";

// OTHER ===============================================================================================================
import AgriProductionMajorCropsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Index numbers of agricultural production — major crops | Handbook — Database on Indian Economy",
    description : "Annual index numbers of agricultural production for major crops in India including foodgrains, oilseeds, fibres and cash crops, across three base periods.",
    keywords    : [
        "agricultural production index",
        "major crops",
        "foodgrains production",
        "oilseeds production",
        "index numbers",
        "India",
        "RBI",
    ],
    openGraph   : {
        title       : "Index numbers of agricultural production — major crops | Handbook — Database on Indian Economy",
        description : "Annual index numbers of agricultural production for major crops in India including foodgrains, oilseeds, fibres and cash crops, across three base periods.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Index numbers of agricultural production — major crops | Handbook — Database on Indian Economy",
        description : "Annual index numbers of agricultural production for major crops in India including foodgrains, oilseeds, fibres and cash crops, across three base periods.",
    },
};

export default async function Page() {
    const tableData = await getAgriProductionMajorCrops();
    return <AgriProductionMajorCropsPage tableData={tableData} />;
}

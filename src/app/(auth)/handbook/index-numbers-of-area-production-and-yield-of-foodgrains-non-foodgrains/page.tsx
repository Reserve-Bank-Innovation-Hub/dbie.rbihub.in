// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getAreaProductionYieldFoodgrainsNonFoodgrains } from "@/lib/api/tables/index-numbers-of-area-production-and-yield-of-foodgrains-non-foodgrains";

// OTHER ===============================================================================================================
import AreaProductionYieldFoodgrainsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Index numbers of area, production and yield — foodgrains & non-foodgrains | Handbook — Database on Indian Economy",
    description : "Annual index numbers of area, production and yield for foodgrains, non-foodgrains and all crops in India, across three base periods from 1949-50 onwards.",
    keywords    : [
        "area production yield index",
        "foodgrains",
        "non-foodgrains",
        "agricultural index",
        "India",
        "RBI",
    ],
    openGraph   : {
        title       : "Index numbers of area, production and yield — foodgrains & non-foodgrains | Handbook",
        description : "Annual index numbers of area, production and yield for foodgrains, non-foodgrains and all crops in India, across three base periods from 1949-50 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Index numbers of area, production and yield — foodgrains & non-foodgrains | Handbook",
        description : "Annual index numbers of area, production and yield for foodgrains, non-foodgrains and all crops in India, across three base periods from 1949-50 onwards.",
    },
};

export default async function Page() {
    const tableData = await getAreaProductionYieldFoodgrainsNonFoodgrains();
    return <AreaProductionYieldFoodgrainsPage tableData={tableData} />;
}

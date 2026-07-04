// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getAreaUnderCultivationFoodgrains } from "@/lib/api/tables/area-under-cultivation-foodgrains";

// OTHER ===============================================================================================================
import AreaUnderCultivationFoodgrainsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Area under cultivation — foodgrains | Handbook — Database on Indian Economy",
    description : "Annual area under cultivation for foodgrains in India (rice, wheat, coarse cereals and pulses) in lakhs hectares, from 1950-51 onwards.",
    keywords    : [
        "area under cultivation",
        "foodgrains",
        "rice area",
        "wheat area",
        "coarse cereals",
        "pulses",
        "India agriculture",
        "RBI Handbook",
    ],
    openGraph   : {
        title       : "Area under cultivation — foodgrains | Handbook — Database on Indian Economy",
        description : "Annual area under cultivation for foodgrains in India (rice, wheat, coarse cereals and pulses) in lakhs hectares, from 1950-51 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Area under cultivation — foodgrains | Handbook — Database on Indian Economy",
        description : "Annual area under cultivation for foodgrains in India (rice, wheat, coarse cereals and pulses) in lakhs hectares, from 1950-51 onwards.",
    },
};

export default async function Page() {
    const tableData = await getAreaUnderCultivationFoodgrains();

    return <AreaUnderCultivationFoodgrainsPage tableData={tableData} />;
}

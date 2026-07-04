// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getAgriculturalProductionFoodgrains } from "@/lib/api/tables/agricultural-production-foodgrains";

// OTHER ===============================================================================================================
import AgriculturalProductionFoodgrainsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Agricultural production — foodgrains | Handbook — Database on Indian Economy",
    description : "Annual production of foodgrains in India (rice, wheat, coarse cereals and pulses) in lakhs tonnes, from 1950-51 onwards.",
    keywords    : [
        "agricultural production",
        "foodgrains",
        "rice production",
        "wheat production",
        "coarse cereals",
        "pulses",
        "India agriculture",
        "RBI Handbook",
    ],
    openGraph   : {
        title       : "Agricultural production — foodgrains | Handbook — Database on Indian Economy",
        description : "Annual production of foodgrains in India (rice, wheat, coarse cereals and pulses) in lakhs tonnes, from 1950-51 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Agricultural production — foodgrains | Handbook — Database on Indian Economy",
        description : "Annual production of foodgrains in India (rice, wheat, coarse cereals and pulses) in lakhs tonnes, from 1950-51 onwards.",
    },
};

export default async function Page() {
    const tableData = await getAgriculturalProductionFoodgrains();

    return <AgriculturalProductionFoodgrainsPage tableData={tableData} />;
}

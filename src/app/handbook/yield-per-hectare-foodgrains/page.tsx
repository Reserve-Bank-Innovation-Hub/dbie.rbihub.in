// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getYieldPerHectareFoodgrains } from "@/lib/api/tables/yield-per-hectare-foodgrains";

// OTHER ===============================================================================================================
import YieldPerHectareFoodgrainsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Yield per hectare — foodgrains | Handbook — Database on Indian Economy",
    description : "Annual yield per hectare (kg/hectare) of foodgrain crops in India — rice, wheat, coarse cereals and pulses, from 1950-51 onwards.",
    keywords    : [
        "yield per hectare",
        "foodgrains",
        "rice yield",
        "wheat yield",
        "coarse cereals",
        "pulses",
        "agricultural yield",
        "India",
        "RBI",
    ],
    openGraph   : {
        title       : "Yield per hectare — foodgrains | Handbook — Database on Indian Economy",
        description : "Annual yield per hectare (kg/hectare) of foodgrain crops in India — rice, wheat, coarse cereals and pulses, from 1950-51 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Yield per hectare — foodgrains | Handbook — Database on Indian Economy",
        description : "Annual yield per hectare (kg/hectare) of foodgrain crops in India — rice, wheat, coarse cereals and pulses, from 1950-51 onwards.",
    },
};

export default async function Page() {
    const tableData = await getYieldPerHectareFoodgrains();
    return <YieldPerHectareFoodgrainsPage tableData={tableData} />;
}

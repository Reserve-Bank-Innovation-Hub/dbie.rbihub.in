// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getYieldPerHectareMajorCommercialCrops } from "@/lib/api/tables/yield-per-hectare-major-commercial-crops";

// OTHER ===============================================================================================================
import YieldPerHectareMajorCommercialCropsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Yield per hectare — major commercial crops | Handbook — Database on Indian Economy",
    description : "Annual yield per hectare (kg/hectare) of major commercial crops in India — oilseeds, sugarcane, tea, coffee, cotton and jute, from 1950-51 onwards.",
    keywords    : [
        "yield per hectare",
        "commercial crops",
        "oilseeds yield",
        "sugarcane yield",
        "cotton yield",
        "tea yield",
        "agricultural yield",
        "India",
        "RBI",
    ],
    openGraph   : {
        title       : "Yield per hectare — major commercial crops | Handbook — Database on Indian Economy",
        description : "Annual yield per hectare (kg/hectare) of major commercial crops in India — oilseeds, sugarcane, tea, coffee, cotton and jute, from 1950-51 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Yield per hectare — major commercial crops | Handbook — Database on Indian Economy",
        description : "Annual yield per hectare (kg/hectare) of major commercial crops in India — oilseeds, sugarcane, tea, coffee, cotton and jute, from 1950-51 onwards.",
    },
};

export default async function Page() {
    const tableData = await getYieldPerHectareMajorCommercialCrops();
    return <YieldPerHectareMajorCommercialCropsPage tableData={tableData} />;
}

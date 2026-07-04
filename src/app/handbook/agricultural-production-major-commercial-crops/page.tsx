// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getAgriculturalProductionMajorCommercialCrops } from "@/lib/api/tables/agricultural-production-major-commercial-crops";

// OTHER ===============================================================================================================
import AgriculturalProductionMajorCommercialCropsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Agricultural production — major commercial crops | Handbook — Database on Indian Economy",
    description : "Annual production of major commercial crops in India (oilseeds, sugarcane, cotton, jute, tea, coffee) in lakhs tonnes, from 1950-51 onwards.",
    keywords    : [
        "agricultural production",
        "commercial crops",
        "oilseeds",
        "sugarcane",
        "cotton",
        "jute",
        "tea",
        "India agriculture",
        "RBI Handbook",
    ],
    openGraph   : {
        title       : "Agricultural production — major commercial crops | Handbook — Database on Indian Economy",
        description : "Annual production of major commercial crops in India (oilseeds, sugarcane, cotton, jute, tea, coffee) in lakhs tonnes, from 1950-51 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Agricultural production — major commercial crops | Handbook — Database on Indian Economy",
        description : "Annual production of major commercial crops in India (oilseeds, sugarcane, cotton, jute, tea, coffee) in lakhs tonnes, from 1950-51 onwards.",
    },
};

export default async function Page() {
    const tableData = await getAgriculturalProductionMajorCommercialCrops();

    return <AgriculturalProductionMajorCommercialCropsPage tableData={tableData} />;
}

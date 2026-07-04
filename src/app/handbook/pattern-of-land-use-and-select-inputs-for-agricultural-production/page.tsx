// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getLandUseData } from "@/lib/api/tables/pattern-of-land-use-and-select-inputs-for-agricultural-production";

// OTHER ===============================================================================================================
import PatternOfLandUsePage from "./page.client";

export const metadata : Metadata = {
    title       : "Pattern of land use and select inputs for agricultural production | Handbook — Database on Indian Economy",
    description : "Annual data on net sown area, gross sown area, irrigated area, high yielding variety coverage, fertiliser and pesticide consumption in India from 1950-51 onwards.",
    keywords    : [
        "land use",
        "net sown area",
        "gross sown area",
        "irrigated area",
        "high yielding varieties",
        "fertiliser consumption",
        "pesticide consumption",
        "agricultural inputs",
        "India agriculture",
        "RBI Handbook",
    ],
    openGraph   : {
        title       : "Pattern of land use and select inputs for agricultural production | Handbook — Database on Indian Economy",
        description : "Annual data on net sown area, gross sown area, irrigated area, high yielding variety coverage, fertiliser and pesticide consumption in India from 1950-51 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Pattern of land use and select inputs for agricultural production | Handbook — Database on Indian Economy",
        description : "Annual data on net sown area, gross sown area, irrigated area, high yielding variety coverage, fertiliser and pesticide consumption in India from 1950-51 onwards.",
    },
};

export default async function Page() {
    // Fetch annual land use and agricultural input data (Server Component)
    const landUseData = await getLandUseData();

    return <PatternOfLandUsePage landUseData={landUseData} />;
}

// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getMspNonFoodgrains } from "@/lib/api/tables/minimum-support-price-for-non-foodgrains-according-to-crop-year-fair";

// OTHER ===============================================================================================================
import MspNonFoodgrainsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Minimum support price for non-foodgrains (crop year, fair average quality) | Handbook — Database on Indian Economy",
    description : "Minimum support prices for non-foodgrains — sugarcane, cotton, jute, groundnut, soyabean, sunflower seed, rapeseed/mustard and safflower — by crop year, in rupees per quintal.",
    keywords    : [
        "minimum support price",
        "MSP",
        "non-foodgrains",
        "sugarcane",
        "cotton",
        "jute",
        "groundnut",
        "soyabean",
        "oilseeds",
        "crop year",
        "RBI",
        "HSIE",
    ],
    openGraph   : {
        title       : "Minimum support price for non-foodgrains (crop year, fair average quality) | Handbook — Database on Indian Economy",
        description : "Minimum support prices for non-foodgrains — sugarcane, cotton, jute, groundnut, soyabean, sunflower seed, rapeseed/mustard and safflower — by crop year, in rupees per quintal.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Minimum support price for non-foodgrains (crop year, fair average quality) | Handbook — Database on Indian Economy",
        description : "Minimum support prices for non-foodgrains — sugarcane, cotton, jute, groundnut, soyabean, sunflower seed, rapeseed/mustard and safflower — by crop year, in rupees per quintal.",
    },
};

export default async function Page() {
    const tableData = await getMspNonFoodgrains();
    return <MspNonFoodgrainsPage tableData={tableData} />;
}

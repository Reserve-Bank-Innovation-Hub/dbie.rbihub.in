// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getMspFoodgrains } from "@/lib/api/tables/minimum-support-price-for-foodgrains-according-to-crop-year-fair-average";

// OTHER ===============================================================================================================
import MspFoodgrainsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Minimum support price for foodgrains (crop year, fair average quality) | Handbook — Database on Indian Economy",
    description : "Minimum support prices for foodgrains — paddy (common), maize, wheat, gram, arhar/tur and moong — by crop year, fair average quality, in rupees per quintal.",
    keywords    : [
        "minimum support price",
        "MSP",
        "foodgrains",
        "paddy",
        "wheat",
        "maize",
        "gram",
        "arhar",
        "crop year",
        "RBI",
        "HSIE",
    ],
    openGraph   : {
        title       : "Minimum support price for foodgrains (crop year, fair average quality) | Handbook — Database on Indian Economy",
        description : "Minimum support prices for foodgrains — paddy (common), maize, wheat, gram, arhar/tur and moong — by crop year, fair average quality, in rupees per quintal.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Minimum support price for foodgrains (crop year, fair average quality) | Handbook — Database on Indian Economy",
        description : "Minimum support prices for foodgrains — paddy (common), maize, wheat, gram, arhar/tur and moong — by crop year, fair average quality, in rupees per quintal.",
    },
};

export default async function Page() {
    const tableData = await getMspFoodgrains();
    return <MspFoodgrainsPage tableData={tableData} />;
}

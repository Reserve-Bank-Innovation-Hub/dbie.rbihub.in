// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getComponentsOfGrossDomesticProduct } from "@/lib/api/tables/components-of-gross-domestic-product";

// OTHER ===============================================================================================================
import ComponentsOfGrossDomesticProductPage from "./page.client";

export const metadata : Metadata = {
    title       : "Components of gross domestic product | National income — Database on Indian Economy",
    description : "Annual series of GDP components at constant and current prices (base year 2011-12) in rupees crores, from 1950-51 onwards. Includes PFCE, GFCE, GFCF, exports, imports and more.",
    keywords    : [
        "GDP components",
        "gross domestic product",
        "PFCE",
        "GFCE",
        "GFCF",
        "national income",
        "constant prices",
        "current prices",
        "RBI handbook",
        "India GDP",
    ],
    openGraph   : {
        title       : "Components of gross domestic product | National income — Database on Indian Economy",
        description : "Annual series of GDP components at constant and current prices (base year 2011-12) in rupees crores, from 1950-51 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Components of gross domestic product | National income — Database on Indian Economy",
        description : "Annual series of GDP components at constant and current prices (base year 2011-12) in rupees crores, from 1950-51 onwards.",
    },
};

export default async function Page() {
    const gdpData = await getComponentsOfGrossDomesticProduct();

    return <ComponentsOfGrossDomesticProductPage gdpData={gdpData} />;
}

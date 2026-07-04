// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getComponentsOfGrossValueAddedAtBasicPrices } from "@/lib/api/tables/components-of-gross-value-added-at-basic-prices";

// OTHER ===============================================================================================================
import ComponentsOfGrossValueAddedAtBasicPricesPage from "./page.client";

export const metadata : Metadata = {
    title       : "Components of gross value added at basic prices | National income — Database on Indian Economy",
    description : "Annual series of GVA components at basic prices (constant and current prices, base year 2011-12), covering agriculture, industry, services, and GDP at market prices from 1951-52 onwards.",
    keywords    : [
        "gross value added",
        "GVA at basic prices",
        "national income",
        "GDP at market prices",
        "agriculture forestry fishing",
        "industry services",
        "constant prices",
        "current prices",
        "India national accounts",
        "NSO",
        "RBI handbook",
    ],
    openGraph   : {
        title       : "Components of gross value added at basic prices | National income — Database on Indian Economy",
        description : "Annual series of GVA components at basic prices (constant and current prices, base year 2011-12), covering agriculture, industry, services, and GDP at market prices from 1951-52 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Components of gross value added at basic prices | National income — Database on Indian Economy",
        description : "Annual series of GVA components at basic prices (constant and current prices, base year 2011-12), covering agriculture, industry, services, and GDP at market prices from 1951-52 onwards.",
    },
};

export default async function Page() {
    // Fetch GVA components data (Server Component)
    const gvaData = await getComponentsOfGrossValueAddedAtBasicPrices();

    return <ComponentsOfGrossValueAddedAtBasicPricesPage gvaData={gvaData} />;
}

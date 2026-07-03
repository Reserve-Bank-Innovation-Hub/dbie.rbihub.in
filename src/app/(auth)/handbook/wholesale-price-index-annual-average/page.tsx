// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getWpiAnnualAverage } from "@/lib/api/tables/wholesale-price-index-annual-average";

// OTHER ===============================================================================================================
import WholesalePriceIndexAnnualAveragePage from "./page.client";

export const metadata : Metadata = {
    title       : "Wholesale price index — annual average | Handbook — Database on Indian Economy",
    description : "Annual-average wholesale price index (base 2011-12 = 100) for all commodities, primary articles, fuel & power, and manufactured products, from 1952-53 onwards.",
    keywords    : [
        "wholesale price index",
        "WPI",
        "annual average",
        "inflation",
        "all commodities",
        "primary articles",
        "fuel and power",
        "manufactured products",
        "RBI",
        "handbook",
    ],
    openGraph   : {
        title       : "Wholesale price index — annual average | Handbook — Database on Indian Economy",
        description : "Annual-average wholesale price index (base 2011-12 = 100) for all commodities, primary articles, fuel & power, and manufactured products, from 1952-53 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Wholesale price index — annual average | Handbook — Database on Indian Economy",
        description : "Annual-average wholesale price index (base 2011-12 = 100) for all commodities, primary articles, fuel & power, and manufactured products, from 1952-53 onwards.",
    },
};

export default async function Page() {
    // Fetch annual-average WPI data (Server Component)
    const wpiData = await getWpiAnnualAverage();

    return <WholesalePriceIndexAnnualAveragePage wpiData={wpiData} />;
}

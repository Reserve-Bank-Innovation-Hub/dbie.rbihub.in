// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getWholesalePriceIndex } from "@/lib/api/tables/wholesale-price-index";

// OTHER ===============================================================================================================
import WholesalePriceIndexPage from "./page.client";

export const metadata : Metadata = {
    title       : "Wholesale price index | Prices — Database on Indian Economy",
    description : "Monthly wholesale price index (Table 22) across the full commodity taxonomy, with historical base years back to 1947",
    keywords    : [
        "wholesale price index",
        "WPI",
        "inflation",
        "commodity prices",
        "price index",
        "base year 2011-12",
        "RBI",
    ],
    openGraph   : {
        title       : "Wholesale price index | Prices — Database on Indian Economy",
        description : "Monthly wholesale price index (Table 22) across the full commodity taxonomy, with historical base years back to 1947",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Wholesale price index | Prices — Database on Indian Economy",
        description : "Monthly wholesale price index (Table 22) across the full commodity taxonomy, with historical base years back to 1947",
    },
};

export default async function Page() {
    const wpiData = await getWholesalePriceIndex();
    return <WholesalePriceIndexPage wpiData={wpiData} />;
}

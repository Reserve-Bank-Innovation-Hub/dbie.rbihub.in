// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getConsumerPriceIndex } from "@/lib/api/tables/consumer-price-index";

// OTHER ===============================================================================================================
import ConsumerPriceIndexPage from "./page.client";

export const metadata: Metadata = {
    title       : "Consumer price index | Prices — Database on Indian Economy",
    description : "Monthly consumer price index (CPI) for rural, urban and combined India across base years, with year-on-year inflation",
    keywords    : [
        "consumer price index",
        "CPI",
        "inflation",
        "rural CPI",
        "urban CPI",
        "combined CPI",
        "cost of living",
        "prices",
        "RBI",
    ],
    openGraph   : {
        title       : "Consumer price index | Prices — Database on Indian Economy",
        description : "Monthly consumer price index (CPI) for rural, urban and combined India across base years, with year-on-year inflation",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Consumer price index | Prices — Database on Indian Economy",
        description : "Monthly consumer price index (CPI) for rural, urban and combined India across base years, with year-on-year inflation",
    },
};

export default async function Page() {
    // Fetch consumer price index data (Server Component).
    const cpiData = await getConsumerPriceIndex();

    return <ConsumerPriceIndexPage cpiData={cpiData} />;
}

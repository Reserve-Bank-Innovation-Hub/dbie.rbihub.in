// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getConsumerPriceIndexAnnualAverage } from "@/lib/api/tables/consumer-price-index-annual-average";

// OTHER ===============================================================================================================
import ConsumerPriceIndexAnnualAveragePage from "./page.client";

export const metadata : Metadata = {
    title       : "Consumer price index — annual average | Handbook — Database on Indian Economy",
    description : "Annual average Consumer Price Index for agricultural labourers, industrial workers, and the new CPI (rural/urban/combined) from 1970-71 onwards.",
    keywords    : [
        "consumer price index",
        "CPI",
        "CPI-AL",
        "CPI-IW",
        "new CPI",
        "inflation",
        "agricultural labourers",
        "industrial workers",
        "annual average",
        "RBI",
        "NSO",
    ],
    openGraph   : {
        title       : "Consumer price index — annual average | Handbook — Database on Indian Economy",
        description : "Annual average Consumer Price Index for agricultural labourers, industrial workers, and the new CPI (rural/urban/combined) from 1970-71 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Consumer price index — annual average | Handbook — Database on Indian Economy",
        description : "Annual average Consumer Price Index for agricultural labourers, industrial workers, and the new CPI (rural/urban/combined) from 1970-71 onwards.",
    },
};

export default async function Page() {
    // Fetch CPI annual average data (Server Component)
    const cpiData = await getConsumerPriceIndexAnnualAverage();

    return <ConsumerPriceIndexAnnualAveragePage cpiData={cpiData} />;
}

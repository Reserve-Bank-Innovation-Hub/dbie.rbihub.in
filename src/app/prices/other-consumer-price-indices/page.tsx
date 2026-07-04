// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getOtherConsumerPriceIndices } from "@/lib/api/tables/other-consumer-price-indices";

// OTHER ===============================================================================================================
import OtherConsumerPriceIndicesPage from "./page.client";

export const metadata : Metadata = {
    title       : "Other consumer price indices | Prices — Database on Indian Economy",
    description : "Consumer Price Index for Industrial Workers, Agricultural Labourers and Rural Labourers across their respective base years",
    keywords    : [
        "consumer price index",
        "CPI",
        "CPI industrial workers",
        "CPI agricultural labourers",
        "CPI rural labourers",
        "inflation",
        "prices",
        "RBI",
    ],
    openGraph   : {
        title       : "Other consumer price indices | Prices — Database on Indian Economy",
        description : "Consumer Price Index for Industrial Workers, Agricultural Labourers and Rural Labourers across their respective base years",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Other consumer price indices | Prices — Database on Indian Economy",
        description : "Consumer Price Index for Industrial Workers, Agricultural Labourers and Rural Labourers across their respective base years",
    },
};

export default async function Page() {
    // Fetch other consumer price indices data (Server Component)
    const otherCPIData = await getOtherConsumerPriceIndices();

    return <OtherConsumerPriceIndicesPage otherCPIData={otherCPIData} />;
}

// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getAveragePriceOfGoldAndSilver } from "@/lib/api/tables/average-price-of-gold-and-silver-in-domestic-and-foreign-markets";

// OTHER ===============================================================================================================
import AveragePriceOfGoldAndSilverPage from "./page.client";

export const metadata : Metadata = {
    title       : "Average price of gold and silver in domestic and foreign markets | Handbook — Database on Indian Economy",
    description : "Annual average price of gold (Mumbai and London) and silver (Mumbai and New York) from 1970-71 onwards, with domestic-foreign price spreads.",
    keywords    : [
        "gold price",
        "silver price",
        "Mumbai gold",
        "London gold fix",
        "New York silver",
        "precious metals",
        "domestic foreign markets",
        "annual average price",
        "RBI handbook",
    ],
    openGraph   : {
        title       : "Average price of gold and silver in domestic and foreign markets | Handbook — Database on Indian Economy",
        description : "Annual average price of gold (Mumbai and London) and silver (Mumbai and New York) from 1970-71 onwards, with domestic-foreign price spreads.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Average price of gold and silver in domestic and foreign markets | Handbook — Database on Indian Economy",
        description : "Annual average price of gold (Mumbai and London) and silver (Mumbai and New York) from 1970-71 onwards, with domestic-foreign price spreads.",
    },
};

export default async function Page() {
    // Fetch annual gold and silver price data (Server Component)
    const pricesData = await getAveragePriceOfGoldAndSilver();

    return <AveragePriceOfGoldAndSilverPage pricesData={pricesData} />;
}

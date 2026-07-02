// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getGoldAndSilverPrices } from "@/lib/api/tables/gold-and-silver-prices";

// OTHER ===============================================================================================================
import GoldAndSilverPricesPage from "./page.client";

export const metadata : Metadata = {
    title       : "Gold and silver prices | Prices — Database on Indian Economy",
    description : "Monthly average price of standard gold (₹ per 10 grams) and silver (₹ per kilogram) in Mumbai, from 1990 onwards.",
    keywords    : [
        "gold price",
        "silver price",
        "Mumbai bullion",
        "standard gold",
        "precious metals",
        "monthly average price",
        "RBI",
    ],
    openGraph   : {
        title       : "Gold and silver prices | Prices — Database on Indian Economy",
        description : "Monthly average price of standard gold (₹ per 10 grams) and silver (₹ per kilogram) in Mumbai, from 1990 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Gold and silver prices | Prices — Database on Indian Economy",
        description : "Monthly average price of standard gold (₹ per 10 grams) and silver (₹ per kilogram) in Mumbai, from 1990 onwards.",
    },
};

export default async function Page() {
    // Fetch monthly gold and silver prices (Server Component)
    const pricesData = await getGoldAndSilverPrices();

    return <GoldAndSilverPricesPage pricesData={pricesData} />;
}

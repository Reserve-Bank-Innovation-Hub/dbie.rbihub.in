// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getPerCapitaNsdpCurrentPrices } from "@/lib/api/tables/per-capita-net-state-domestic-product-state-wise-at-current-prices";

// OTHER ===============================================================================================================
import PerCapitaNsdpCurrentPricesPage from "./page.client";

export const metadata : Metadata = {
    title       : "Per capita Net State Domestic Product — state-wise (at current prices) | Handbook — Database on Indian Economy",
    description : "Annual per capita Net State Domestic Product (NSDP) at current prices, state-wise, from 2011-12 onwards. Source: National Statistical Office.",
    keywords    : [
        "per capita NSDP",
        "Net State Domestic Product",
        "state GDP per capita",
        "current prices",
        "state-wise",
        "national income",
        "NSO",
        "RBI Handbook",
    ],
    openGraph   : {
        title       : "Per capita Net State Domestic Product — state-wise (at current prices) | Handbook — Database on Indian Economy",
        description : "Annual per capita Net State Domestic Product (NSDP) at current prices, state-wise, from 2011-12 onwards. Source: National Statistical Office.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Per capita Net State Domestic Product — state-wise (at current prices) | Handbook — Database on Indian Economy",
        description : "Annual per capita Net State Domestic Product (NSDP) at current prices, state-wise, from 2011-12 onwards. Source: National Statistical Office.",
    },
};

export default async function Page() {
    const nsdpData = await getPerCapitaNsdpCurrentPrices();

    return <PerCapitaNsdpCurrentPricesPage nsdpData={nsdpData} />;
}

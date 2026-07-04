// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getPerCapitaNsdpConstantPrices } from "@/lib/api/tables/per-capita-net-state-domestic-product-state-wise-at-constant-prices";

// OTHER ===============================================================================================================
import PerCapitaNsdpConstantPricesPage from "./page.client";

export const metadata : Metadata = {
    title       : "Per capita Net State Domestic Product — state-wise (at constant prices) | Handbook — Database on Indian Economy",
    description : "Annual per capita Net State Domestic Product (NSDP) at constant prices (base 2011-12), state-wise, from 2011-12 onwards. Source: National Statistical Office.",
    keywords    : [
        "per capita NSDP",
        "Net State Domestic Product",
        "state GDP per capita",
        "constant prices",
        "state-wise",
        "national income",
        "NSO",
        "RBI Handbook",
    ],
    openGraph   : {
        title       : "Per capita Net State Domestic Product — state-wise (at constant prices) | Handbook — Database on Indian Economy",
        description : "Annual per capita Net State Domestic Product (NSDP) at constant prices (base 2011-12), state-wise, from 2011-12 onwards. Source: National Statistical Office.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Per capita Net State Domestic Product — state-wise (at constant prices) | Handbook — Database on Indian Economy",
        description : "Annual per capita Net State Domestic Product (NSDP) at constant prices (base 2011-12), state-wise, from 2011-12 onwards. Source: National Statistical Office.",
    },
};

export default async function Page() {
    const nsdpData = await getPerCapitaNsdpConstantPrices();

    return <PerCapitaNsdpConstantPricesPage nsdpData={nsdpData} />;
}

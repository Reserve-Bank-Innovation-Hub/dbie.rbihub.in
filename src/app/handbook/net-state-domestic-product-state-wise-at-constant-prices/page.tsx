// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getNsdpConstantPrices } from "@/lib/api/tables/net-state-domestic-product-state-wise-at-constant-prices";

// OTHER ===============================================================================================================
import NsdpConstantPricesPage from "./page.client";

export const metadata : Metadata = {
    title       : "Net State Domestic Product — state-wise (at constant prices) | Handbook — Database on Indian Economy",
    description : "Annual Net State Domestic Product (NSDP) at constant prices (base 2011-12), state-wise, from 2011-12 onwards. Source: National Statistical Office.",
    keywords    : [
        "Net State Domestic Product",
        "NSDP",
        "state GDP",
        "constant prices",
        "state-wise",
        "national income",
        "NSO",
        "RBI Handbook",
    ],
    openGraph   : {
        title       : "Net State Domestic Product — state-wise (at constant prices) | Handbook — Database on Indian Economy",
        description : "Annual Net State Domestic Product (NSDP) at constant prices (base 2011-12), state-wise, from 2011-12 onwards. Source: National Statistical Office.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Net State Domestic Product — state-wise (at constant prices) | Handbook — Database on Indian Economy",
        description : "Annual Net State Domestic Product (NSDP) at constant prices (base 2011-12), state-wise, from 2011-12 onwards. Source: National Statistical Office.",
    },
};

export default async function Page() {
    const nsdpData = await getNsdpConstantPrices();

    return <NsdpConstantPricesPage nsdpData={nsdpData} />;
}

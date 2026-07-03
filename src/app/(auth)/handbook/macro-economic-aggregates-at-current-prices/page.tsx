// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getMacroEconomicAggregatesCurrentPrices } from "@/lib/api/tables/macro-economic-aggregates-at-current-prices";

// OTHER ===============================================================================================================
import MacroEconomicAggregatesCurrentPricesPage from "./page.client";

export const metadata : Metadata = {
    title       : "Macro-economic aggregates at current prices | National accounts — Database on Indian Economy",
    description : "Annual macro-economic aggregates for India at current prices (base year 2011–12) including GDP, GNI, NNI, gross saving, capital formation and per-capita measures.",
    keywords    : [
        "GDP current prices",
        "GNI India",
        "NNI India",
        "gross saving",
        "capital formation",
        "national accounts India",
        "NSO",
        "base year 2011-12",
    ],
    openGraph   : {
        title       : "Macro-economic aggregates at current prices | National accounts — Database on Indian Economy",
        description : "Annual macro-economic aggregates for India at current prices (base year 2011–12) including GDP, GNI, NNI, gross saving, capital formation and per-capita measures.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Macro-economic aggregates at current prices | National accounts — Database on Indian Economy",
        description : "Annual macro-economic aggregates for India at current prices (base year 2011–12) including GDP, GNI, NNI, gross saving, capital formation and per-capita measures.",
    },
};

export default async function Page() {
    const data = await getMacroEconomicAggregatesCurrentPrices();

    return <MacroEconomicAggregatesCurrentPricesPage data={data} />;
}

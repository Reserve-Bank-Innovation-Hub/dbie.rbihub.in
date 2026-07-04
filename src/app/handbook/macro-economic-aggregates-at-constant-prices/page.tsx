// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getMacroEconomicAggregatesConstantPrices } from "@/lib/api/tables/macro-economic-aggregates-at-constant-prices";

// OTHER ===============================================================================================================
import MacroEconomicAggregatesConstantPricesPage from "./page.client";

export const metadata : Metadata = {
    title       : "Macro-economic aggregates at constant prices | National accounts — Database on Indian Economy",
    description : "Annual macro-economic aggregates for India at constant prices (base year 2011–12) including GDP, GNI, NNI, capital formation and per-capita measures.",
    keywords    : [
        "GDP constant prices",
        "GNI India",
        "NNI India",
        "gross capital formation",
        "national accounts India",
        "NSO",
        "base year 2011-12",
    ],
    openGraph   : {
        title       : "Macro-economic aggregates at constant prices | National accounts — Database on Indian Economy",
        description : "Annual macro-economic aggregates for India at constant prices (base year 2011–12) including GDP, GNI, NNI, capital formation and per-capita measures.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Macro-economic aggregates at constant prices | National accounts — Database on Indian Economy",
        description : "Annual macro-economic aggregates for India at constant prices (base year 2011–12) including GDP, GNI, NNI, capital formation and per-capita measures.",
    },
};

export default async function Page() {
    const data = await getMacroEconomicAggregatesConstantPrices();

    return <MacroEconomicAggregatesConstantPricesPage data={data} />;
}

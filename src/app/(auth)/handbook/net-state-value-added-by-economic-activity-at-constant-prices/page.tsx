// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getNetStateValueAddedAtConstantPrices } from "@/lib/api/tables/net-state-value-added-by-economic-activity-at-constant-prices";

// OTHER ===============================================================================================================
import NsvaAtConstantPricesPage from "./page.client";

export const metadata : Metadata = {
    title       : "Net State Value Added by economic activity at constant prices | Handbook — Database on Indian Economy",
    description : "Net State Value Added (NSVA) by economic activity at constant prices (base 2011-12) for 33 Indian states and union territories, from 2011-12 to 2024-25. Source: RBI Handbook of Statistics on Indian Economy.",
    keywords    : [
        "net state value added",
        "NSVA",
        "economic activity",
        "constant prices",
        "state GDP",
        "India",
        "RBI handbook",
        "national accounts statistics",
    ],
    openGraph   : {
        title       : "Net State Value Added by economic activity at constant prices | Handbook — Database on Indian Economy",
        description : "Net State Value Added (NSVA) by economic activity at constant prices (base 2011-12) for 33 Indian states and union territories, from 2011-12 to 2024-25.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Net State Value Added by economic activity at constant prices | Handbook — Database on Indian Economy",
        description : "Net State Value Added (NSVA) by economic activity at constant prices (base 2011-12) for 33 Indian states and union territories, from 2011-12 to 2024-25.",
    },
};

export default async function Page() {
    const data = await getNetStateValueAddedAtConstantPrices();
    return <NsvaAtConstantPricesPage data={data} />;
}

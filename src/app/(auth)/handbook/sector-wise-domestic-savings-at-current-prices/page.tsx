// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getSectorWiseDomesticSavings } from "@/lib/api/tables/sector-wise-domestic-savings-at-current-prices";

// OTHER ===============================================================================================================
import SectorWiseDomesticSavingsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Sector-wise domestic savings | National accounts — Database on Indian Economy",
    description : "Annual sector-wise domestic savings at current prices (base year 2011–12) covering non-financial corporations, financial corporations, general government and households.",
    keywords    : [
        "domestic savings India",
        "household savings",
        "corporate savings",
        "general government savings",
        "national accounts",
        "NSO",
        "base year 2011-12",
    ],
    openGraph   : {
        title       : "Sector-wise domestic savings | National accounts — Database on Indian Economy",
        description : "Annual sector-wise domestic savings at current prices (base year 2011–12) covering non-financial corporations, financial corporations, general government and households.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Sector-wise domestic savings | National accounts — Database on Indian Economy",
        description : "Annual sector-wise domestic savings at current prices (base year 2011–12) covering non-financial corporations, financial corporations, general government and households.",
    },
};

export default async function Page() {
    const data = await getSectorWiseDomesticSavings();

    return <SectorWiseDomesticSavingsPage data={data} />;
}

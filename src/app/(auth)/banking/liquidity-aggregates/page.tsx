// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getLiquidityAggregates } from "@/lib/api/tables/liquidity-aggregates";

// OTHER ===============================================================================================================
import LiquidityAggregatesPage from "./page.client";

export const metadata : Metadata = {
    title       : "Liquidity aggregates | Banking — Database on Indian Economy",
    description : "Monthly liquidity aggregates (NM3, L1, L2) and sub-components including postal deposits, liabilities of financial institutions, and public deposits with NBFCs. Source: Reserve Bank of India Bulletin Table 09.",
    keywords    : [
        "liquidity aggregates",
        "NM3",
        "L1",
        "L2",
        "postal deposits",
        "financial institutions",
        "certificates of deposit",
        "NBFC",
        "monetary policy",
        "RBI",
        "India",
    ],
    openGraph   : {
        title       : "Liquidity aggregates | Banking — Database on Indian Economy",
        description : "Monthly liquidity aggregates (NM3, L1, L2) and sub-components from the Reserve Bank of India.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Liquidity aggregates | Banking — Database on Indian Economy",
        description : "Monthly liquidity aggregates (NM3, L1, L2) and sub-components from the Reserve Bank of India.",
    },
};

export default async function Page() {
    // Fetch liquidity aggregates matrix (Server Component)
    const data = await getLiquidityAggregates();

    return <LiquidityAggregatesPage data={data} />;
}

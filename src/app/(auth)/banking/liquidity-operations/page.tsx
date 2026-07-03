// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getLiquidityOperations } from "@/lib/api/tables/liquidity-operations";

// OTHER ===============================================================================================================
import LiquidityOperationsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Liquidity operations by RBI | Banking — Database on Indian Economy",
    description : "Daily central bank liquidity injection and absorption operations by the Reserve Bank of India, in Rupees crore. Covers repo, reverse repo, MSF, SDF, OMO, LTRO, TLTRO and other instruments. Source: RBI Monthly Bulletin Table 3.",
    keywords    : [
        "liquidity operations",
        "RBI",
        "repo",
        "reverse repo",
        "MSF",
        "marginal standing facility",
        "SDF",
        "standing deposit facility",
        "OMO",
        "LTRO",
        "TLTRO",
        "liquidity adjustment facility",
        "LAF",
        "monetary policy",
        "India",
    ],
    openGraph   : {
        title       : "Liquidity operations by RBI | Banking — Database on Indian Economy",
        description : "Daily RBI liquidity injection and absorption operations — repo, MSF, SDF, OMO, LTRO, TLTRO and more.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Liquidity operations by RBI | Banking — Database on Indian Economy",
        description : "Daily RBI liquidity injection and absorption operations — repo, MSF, SDF, OMO, LTRO, TLTRO and more.",
    },
};

export default function Page() {
    // Fetch liquidity operations data (Server Component — synchronous loadData)
    const data = getLiquidityOperations();

    return <LiquidityOperationsPage data={data} />;
}

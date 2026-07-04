// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getRbiStandingFacilities } from "@/lib/api/tables/rbi-standing-facilities";

// OTHER ===============================================================================================================
import RbiStandingFacilitiesPage from "./page.client";

export const metadata : Metadata = {
    title       : "RBI's standing facilities | Banking — Database on Indian Economy",
    description : "Fortnightly utilisation of the Reserve Bank's standing facilities — MSF, export credit refinance, liquidity facility for primary dealers, and others. Rupees crore, from the monthly RBI Bulletin.",
    keywords    : [
        "standing facilities",
        "MSF",
        "marginal standing facility",
        "export credit refinance",
        "liquidity facility",
        "primary dealers",
        "RBI",
        "Reserve Bank of India",
        "monetary policy",
        "India",
    ],
    openGraph   : {
        title       : "RBI's standing facilities | Banking — Database on Indian Economy",
        description : "Fortnightly utilisation of the Reserve Bank's standing facilities — MSF, export credit refinance, liquidity facility for primary dealers, and others.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "RBI's standing facilities | Banking — Database on Indian Economy",
        description : "Fortnightly utilisation of the Reserve Bank's standing facilities — MSF, export credit refinance, liquidity facility for primary dealers, and others.",
    },
};

export default function Page() {
    // Fetch standing facilities data (Server Component — synchronous loadData)
    const data = getRbiStandingFacilities();

    return <RbiStandingFacilitiesPage data={data} />;
}

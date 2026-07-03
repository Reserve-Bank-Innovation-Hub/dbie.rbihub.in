// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getForeignInvestmentInflowsBulletin } from "@/lib/api/tables/foreign-investment-inflows-bulletin";

// OTHER ===============================================================================================================
import ForeignInvestmentInflowsBulletinPage from "./page.client";

export const metadata : Metadata = {
    title       : "Foreign investment inflows | External — Database on Indian Economy",
    description : "Monthly foreign direct investment (FDI) and portfolio investment inflows into and from India in US $ Millions, from 2011 onwards.",
    keywords    : [
        "foreign investment inflows",
        "FDI India",
        "portfolio investment",
        "FPIs",
        "direct investment",
        "gross inflows",
        "net FDI",
        "RBI bulletin",
    ],
    openGraph   : {
        title       : "Foreign investment inflows | External — Database on Indian Economy",
        description : "Monthly foreign direct investment (FDI) and portfolio investment inflows into and from India in US $ Millions, from 2011 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Foreign investment inflows | External — Database on Indian Economy",
        description : "Monthly foreign direct investment (FDI) and portfolio investment inflows into and from India in US $ Millions, from 2011 onwards.",
    },
};

export default async function Page() {
    // Fetch monthly foreign investment inflows data (Server Component)
    const investmentData = await getForeignInvestmentInflowsBulletin();

    return <ForeignInvestmentInflowsBulletinPage investmentData={investmentData} />;
}

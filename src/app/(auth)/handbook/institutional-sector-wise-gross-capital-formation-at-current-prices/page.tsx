// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getInstitutionalSectorGrossCapitalFormation } from "@/lib/api/tables/institutional-sector-wise-gross-capital-formation-at-current-prices";

// OTHER ===============================================================================================================
import InstitutionalSectorGrossCapitalFormationPage from "./page.client";

export const metadata : Metadata = {
    title       : "Institutional sector-wise gross capital formation | National accounts — Database on Indian Economy",
    description : "Annual institutional sector-wise gross capital formation at current prices (base year 2011–12) covering public and private corporations, general government and households.",
    keywords    : [
        "gross capital formation India",
        "institutional sector",
        "public corporations",
        "private corporations",
        "general government",
        "households NPISH",
        "national accounts",
        "NSO",
    ],
    openGraph   : {
        title       : "Institutional sector-wise gross capital formation | National accounts — Database on Indian Economy",
        description : "Annual institutional sector-wise gross capital formation at current prices (base year 2011–12) covering public and private corporations, general government and households.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Institutional sector-wise gross capital formation | National accounts — Database on Indian Economy",
        description : "Annual institutional sector-wise gross capital formation at current prices (base year 2011–12) covering public and private corporations, general government and households.",
    },
};

export default async function Page() {
    const data = await getInstitutionalSectorGrossCapitalFormation();

    return <InstitutionalSectorGrossCapitalFormationPage data={data} />;
}

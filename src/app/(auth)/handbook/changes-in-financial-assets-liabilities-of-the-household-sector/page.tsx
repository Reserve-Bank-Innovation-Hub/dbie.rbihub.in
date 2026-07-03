// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getChangesInFinancialAssetsLiabilitiesOfTheHouseholdSector } from "@/lib/api/tables/changes-in-financial-assets-liabilities-of-the-household-sector";

// OTHER ===============================================================================================================
import ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorPage from "./page.client";

export const metadata : Metadata = {
    title       : "Changes in financial assets/liabilities of the household sector | National income — Database on Indian Economy",
    description : "Annual changes in financial assets and liabilities of the household sector at current prices, covering currency, bank deposits, life insurance, provident fund, shares, and more, from 1970-71 onwards.",
    keywords    : [
        "household sector",
        "financial assets",
        "financial liabilities",
        "bank deposits",
        "life insurance fund",
        "provident fund",
        "bank advances",
        "current prices",
        "national income",
        "RBI",
        "NSO",
    ],
    openGraph   : {
        title       : "Changes in financial assets/liabilities of the household sector | National income — Database on Indian Economy",
        description : "Annual changes in financial assets and liabilities of the household sector at current prices, from 1970-71 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Changes in financial assets/liabilities of the household sector | National income — Database on Indian Economy",
        description : "Annual changes in financial assets and liabilities of the household sector at current prices, from 1970-71 onwards.",
    },
};

export default async function Page() {
    const data = await getChangesInFinancialAssetsLiabilitiesOfTheHouseholdSector();

    return <ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorPage data={data} />;
}

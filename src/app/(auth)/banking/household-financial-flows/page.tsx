// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getHouseholdFinancialFlows } from "@/lib/api/tables/household-financial-flows";

// OTHER ===============================================================================================================
import HouseholdFinancialFlowsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Household financial flows | Banking — Database on Indian Economy",
    description : "Quarterly and annual flow of financial assets and liabilities of Indian households by instrument — deposits, insurance, provident funds, currency, investments, and borrowings. Source: RBI Bulletin Table 52(a).",
    keywords    : [
        "household financial assets",
        "household financial liabilities",
        "financial flows",
        "deposits",
        "life insurance",
        "provident fund",
        "currency",
        "investments",
        "mutual funds",
        "borrowings",
        "RBI",
        "India",
    ],
    openGraph   : {
        title       : "Household financial flows | Banking — Database on Indian Economy",
        description : "Quarterly and annual flow of financial assets and liabilities of Indian households by instrument — deposits, insurance, provident funds, currency, investments, and borrowings.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Household financial flows | Banking — Database on Indian Economy",
        description : "Quarterly and annual flow of financial assets and liabilities of Indian households by instrument — deposits, insurance, provident funds, currency, investments, and borrowings.",
    },
};

export default async function Page() {
    const data = await getHouseholdFinancialFlows();

    return <HouseholdFinancialFlowsPage data={data} />;
}

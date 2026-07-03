// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getBankCreditBySector } from "@/lib/api/tables/bank-credit-by-sector";

// OTHER ===============================================================================================================
import BankCreditBySectorPage from "./page.client";

export const metadata : Metadata = {
    title       : "Deployment of gross bank credit by major sectors | Banking — Database on Indian Economy",
    description : "Fortnightly outstanding gross bank credit deployed by major sectors — agriculture, industry, services, and personal loans — from January 2019 to December 2025. Source: RBI Bulletin Table 15.",
    keywords    : [
        "gross bank credit",
        "bank credit by sector",
        "agriculture credit",
        "industry credit",
        "services credit",
        "personal loans",
        "priority sector",
        "RBI",
        "India",
    ],
    openGraph   : {
        title       : "Deployment of gross bank credit by major sectors | Banking — Database on Indian Economy",
        description : "Fortnightly outstanding gross bank credit deployed by major sectors — agriculture, industry, services, and personal loans — from January 2019 to December 2025.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Deployment of gross bank credit by major sectors | Banking — Database on Indian Economy",
        description : "Fortnightly outstanding gross bank credit deployed by major sectors — agriculture, industry, services, and personal loans — from January 2019 to December 2025.",
    },
};

export default async function Page() {
    const data = await getBankCreditBySector();
    return <BankCreditBySectorPage data={data} />;
}

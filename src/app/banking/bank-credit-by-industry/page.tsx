// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getBankCreditByIndustry } from "@/lib/api/tables/bank-credit-by-industry";

// OTHER ===============================================================================================================
import BankCreditByIndustryPage from "./page.client";

export const metadata : Metadata = {
    title       : "Industry-wise deployment of bank credit | Banking — Database on Indian Economy",
    description : "Outstanding bank credit across 43 industry categories (Table 16) spanning January 2019 to December 2025, in Rupees crores",
    keywords    : [
        "bank credit",
        "industry credit",
        "deployment of bank credit",
        "infrastructure credit",
        "food processing",
        "textiles credit",
        "RBI",
        "Table 16",
    ],
    openGraph   : {
        title       : "Industry-wise deployment of bank credit | Banking — Database on Indian Economy",
        description : "Outstanding bank credit across 43 industry categories (Table 16) spanning January 2019 to December 2025, in Rupees crores",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Industry-wise deployment of bank credit | Banking — Database on Indian Economy",
        description : "Outstanding bank credit across 43 industry categories (Table 16) spanning January 2019 to December 2025, in Rupees crores",
    },
};

export default async function Page() {
    const data = await getBankCreditByIndustry();
    return <BankCreditByIndustryPage data={data} />;
}

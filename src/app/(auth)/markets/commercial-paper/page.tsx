// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getCommercialPaper } from "@/lib/api/tables/commercial-paper";

// OTHER ===============================================================================================================
import CommercialPaperPage from "./page.client";

export const metadata : Metadata = {
    title       : "Commercial paper | Markets — Database on Indian Economy",
    description : "Fortnightly commercial paper data: amount outstanding, amount reported during the fortnight, and minimum rate of interest, from June 2011 onwards.",
    keywords    : [
        "commercial paper",
        "money market",
        "short-term debt",
        "amount outstanding",
        "interest rate",
        "RBI",
        "India",
    ],
    openGraph   : {
        title       : "Commercial paper | Markets — Database on Indian Economy",
        description : "Fortnightly commercial paper data: amount outstanding, amount reported during the fortnight, and minimum rate of interest, from June 2011 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Commercial paper | Markets — Database on Indian Economy",
        description : "Fortnightly commercial paper data: amount outstanding, amount reported during the fortnight, and minimum rate of interest, from June 2011 onwards.",
    },
};

export default async function Page() {
    // Fetch fortnightly commercial paper data (Server Component)
    const paperData = await getCommercialPaper();

    return <CommercialPaperPage paperData={paperData} />;
}

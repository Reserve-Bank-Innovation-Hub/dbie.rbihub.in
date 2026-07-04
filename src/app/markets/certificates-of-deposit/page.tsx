// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getCertificatesOfDeposit } from "@/lib/api/tables/certificates-of-deposit";

// OTHER ===============================================================================================================
import CertificatesOfDepositPage from "./page.client";

export const metadata : Metadata = {
    title       : "Certificates of deposit | Markets — Database on Indian Economy",
    description : "Fortnightly data on certificates of deposit (CDs) issued by scheduled commercial banks in India — amount outstanding, amount issued, and minimum rate of interest, from 1991 onwards.",
    keywords    : [
        "certificates of deposit",
        "CD",
        "money market",
        "scheduled commercial banks",
        "amount outstanding",
        "interest rate",
        "RBI",
    ],
    openGraph   : {
        title       : "Certificates of deposit | Markets — Database on Indian Economy",
        description : "Fortnightly data on certificates of deposit (CDs) issued by scheduled commercial banks in India — amount outstanding, amount issued, and minimum rate of interest, from 1991 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Certificates of deposit | Markets — Database on Indian Economy",
        description : "Fortnightly data on certificates of deposit (CDs) issued by scheduled commercial banks in India — amount outstanding, amount issued, and minimum rate of interest, from 1991 onwards.",
    },
};

export default async function Page() {
    // Fetch fortnightly certificates of deposit data (Server Component)
    const cdData = await getCertificatesOfDeposit();

    return <CertificatesOfDepositPage cdData={cdData} />;
}

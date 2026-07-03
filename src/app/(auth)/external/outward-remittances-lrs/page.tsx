// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getOutwardRemittancesLRS } from "@/lib/api/tables/outward-remittances-lrs";

// OTHER ===============================================================================================================
import OutwardRemittancesLRSPage from "./page.client";

export const metadata : Metadata = {
    title       : "Outward remittances under the LRS | External sector — Database on Indian Economy",
    description : "Monthly outward remittances by resident individuals under the Liberalised Remittance Scheme (LRS), broken down by purpose — deposit, property, equity/debt, gift, travel, studies, and more. In US$ millions.",
    keywords    : [
        "LRS",
        "Liberalised Remittance Scheme",
        "outward remittances",
        "resident individuals",
        "foreign remittances",
        "studies abroad",
        "travel remittances",
        "RBI",
        "India",
    ],
    openGraph   : {
        title       : "Outward remittances under the LRS | External sector — Database on Indian Economy",
        description : "Monthly LRS outward remittances by resident individuals, by purpose. In US$ millions.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Outward remittances under the LRS | External sector — Database on Indian Economy",
        description : "Monthly LRS outward remittances by resident individuals, by purpose. In US$ millions.",
    },
};

export default async function Page() {
    const lrsData = await getOutwardRemittancesLRS();

    return <OutwardRemittancesLRSPage lrsData={lrsData} />;
}

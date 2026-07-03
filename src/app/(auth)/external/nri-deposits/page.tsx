// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getNriDeposits } from "@/lib/api/tables/nri-deposits";

// OTHER ===============================================================================================================
import NriDepositsPage from "./page.client";

export const metadata : Metadata = {
    title       : "NRI deposits | External sector — Database on Indian Economy",
    description : "Monthly NRI deposit outstandings and inflows/outflows by scheme — FCNR(B), NR(E)RA and NRO — in US$ millions. RBI Bulletin Table 34.",
    keywords    : [
        "NRI deposits",
        "FCNR(B)",
        "NR(E)RA",
        "NRO",
        "non-resident deposits",
        "foreign currency deposits",
        "external sector",
        "RBI",
    ],
    openGraph   : {
        title       : "NRI deposits | External sector — Database on Indian Economy",
        description : "Monthly NRI deposit outstandings and inflows/outflows by scheme — FCNR(B), NR(E)RA and NRO — in US$ millions.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "NRI deposits | External sector — Database on Indian Economy",
        description : "Monthly NRI deposit outstandings and inflows/outflows by scheme — FCNR(B), NR(E)RA and NRO — in US$ millions.",
    },
};

export default async function Page() {
    const depositsData = await getNriDeposits();

    return <NriDepositsPage depositsData={depositsData} />;
}

// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getCombinedReceiptsDisbursements } from "@/lib/api/tables/combined-receipts-disbursements";

// OTHER ===============================================================================================================
import CombinedReceiptsDisbursementsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Combined receipts and disbursements | Government — Database on Indian Economy",
    description : "Annual combined receipts and disbursements of the Central and State Governments — revenue, capital and fiscal position, ₹ crore. Source: Budget Documents via RBI Bulletin Table 48.",
    keywords    : [
        "combined receipts disbursements",
        "central government",
        "state governments",
        "fiscal deficit",
        "revenue receipts",
        "capital expenditure",
        "RBI Bulletin",
        "India government finance",
    ],
    openGraph   : {
        title       : "Combined receipts and disbursements | Government — Database on Indian Economy",
        description : "Annual combined receipts and disbursements of the Central and State Governments — revenue, capital and fiscal position, ₹ crore.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Combined receipts and disbursements | Government — Database on Indian Economy",
        description : "Annual combined receipts and disbursements of the Central and State Governments — revenue, capital and fiscal position, ₹ crore.",
    },
};

export default async function Page() {
    const data = await getCombinedReceiptsDisbursements();

    return <CombinedReceiptsDisbursementsPage data={data} />;
}

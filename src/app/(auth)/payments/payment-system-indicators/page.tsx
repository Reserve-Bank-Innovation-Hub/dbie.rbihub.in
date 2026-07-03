// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getPaymentSystemIndicators } from "@/lib/api/tables/payment-system-indicators";

// OTHER ===============================================================================================================
import PaymentSystemIndicatorsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Payment system indicators | Payments — Database on Indian Economy",
    description : "Monthly volumes (lakh) and values (₹ crore) across settlement and payment systems in India — CCIL, RTGS, UPI, NEFT, IMPS, cards, PPIs, ATMs and more. Source: RBI Bulletin Table 45.",
    keywords    : [
        "payment system indicators",
        "UPI",
        "NEFT",
        "RTGS",
        "IMPS",
        "CCIL",
        "digital payments",
        "payment infrastructure",
        "RBI",
        "India",
        "settlement systems",
    ],
    openGraph   : {
        title       : "Payment system indicators | Payments — Database on Indian Economy",
        description : "Monthly volumes and values across settlement and payment systems in India — CCIL, RTGS, UPI, NEFT, IMPS, cards, PPIs, ATMs and more.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Payment system indicators | Payments — Database on Indian Economy",
        description : "Monthly volumes and values across settlement and payment systems in India — CCIL, RTGS, UPI, NEFT, IMPS, cards, PPIs, ATMs and more.",
    },
};

export default async function Page() {
    // Fetch payment system indicators (Server Component)
    const data = await getPaymentSystemIndicators();

    return <PaymentSystemIndicatorsPage data={data} />;
}

// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import PaymentsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Payments — Database on Indian Economy",
    description : "Payment and settlement system indicators including UPI, NEFT, RTGS and cards",
    keywords    : [ "payments", "UPI", "NEFT", "RTGS", "IMPS", "cards", "digital payments", "India" ],
    openGraph   : {
        title       : "Payments — Database on Indian Economy",
        description : "Payment and settlement system indicators including UPI, NEFT, RTGS and cards",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Payments — Database on Indian Economy",
        description : "Payment and settlement system indicators including UPI, NEFT, RTGS and cards",
    },
};

export default function Page() {
    return <PaymentsPage />;
}

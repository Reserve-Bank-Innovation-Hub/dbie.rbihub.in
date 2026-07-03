// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import PaymentsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Payments — Database on Indian Economy",
    description : "Payment and settlement system statistics — volumes and values across RTGS, UPI, cards and more.",
    openGraph   : {
        title       : "Payments — Database on Indian Economy",
        description : "Payment and settlement system statistics — volumes and values across RTGS, UPI, cards and more.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
};

export default function Page() {
    return <PaymentsPage />;
}

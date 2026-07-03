// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getExternalCommercialBorrowings } from "@/lib/api/tables/external-commercial-borrowings";

// OTHER ===============================================================================================================
import ExternalCommercialBorrowingsPage from "./page.client";

export const metadata : Metadata = {
    title       : "External commercial borrowings (ECB) registrations | External sector — Database on Indian Economy",
    description : "Monthly ECB registrations by Indian entities under the automatic and approval routes — number, amount (US$ millions), weighted average maturity, interest rate, and borrower-category breakdown.",
    keywords    : [
        "ECB",
        "external commercial borrowings",
        "automatic route",
        "approval route",
        "ECB registrations",
        "foreign borrowings",
        "weighted average maturity",
        "borrower category",
        "RBI",
        "India",
    ],
    openGraph   : {
        title       : "External commercial borrowings (ECB) registrations | External sector — Database on Indian Economy",
        description : "Monthly ECB registrations — automatic route, approval route, maturity, interest rate, borrower breakdown.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "External commercial borrowings (ECB) registrations | External sector — Database on Indian Economy",
        description : "Monthly ECB registrations — automatic route, approval route, maturity, interest rate, borrower breakdown.",
    },
};

export default async function Page() {
    const ecbData = await getExternalCommercialBorrowings();

    return <ExternalCommercialBorrowingsPage ecbData={ecbData} />;
}

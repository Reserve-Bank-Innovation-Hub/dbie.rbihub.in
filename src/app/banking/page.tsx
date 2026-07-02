// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import BankingPage from "./page.client";

export const metadata : Metadata = {
    title       : "Banking — Database on Indian Economy",
    description : "Bank credit, deposits, monetary aggregates and scheduled bank statistics",
    keywords    : [ "banking", "bank credit", "deposits", "monetary aggregates", "SCB", "India" ],
    openGraph   : {
        title       : "Banking — Database on Indian Economy",
        description : "Bank credit, deposits, monetary aggregates and scheduled bank statistics",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Banking — Database on Indian Economy",
        description : "Bank credit, deposits, monetary aggregates and scheduled bank statistics",
    },
};

export default function Page() {
    return <BankingPage />;
}

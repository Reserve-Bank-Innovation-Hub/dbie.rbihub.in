// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import MarketsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Markets — Database on Indian Economy",
    description : "Financial market statistics — money market rates, certificates of deposit, commercial paper, turnover and capital issues.",
    openGraph   : {
        title       : "Markets — Database on Indian Economy",
        description : "Financial market statistics — money market rates, certificates of deposit, commercial paper, turnover and capital issues.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
};

export default function Page() {
    return <MarketsPage />;
}

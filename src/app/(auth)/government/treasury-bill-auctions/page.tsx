// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getTreasuryBillAuctions } from "@/lib/api/tables/treasury-bill-auctions";

// OTHER ===============================================================================================================
import TreasuryBillAuctionsPageClient from "./page.client";

export const metadata : Metadata = {
    title       : "Treasury bill auctions | Government — Database on Indian Economy",
    description : "Auction-wise results for 91, 182 and 364-day Government of India treasury bills — notified amounts, bids received and accepted, cut-off prices and implicit yields. Source: RBI Bulletin Table 26.",
    keywords    : [
        "treasury bills",
        "T-bill auctions",
        "91-day",
        "182-day",
        "364-day",
        "cut-off price",
        "implicit yield",
        "government securities",
        "RBI",
        "India",
    ],
    openGraph   : {
        title       : "Treasury bill auctions | Government — Database on Indian Economy",
        description : "Auction-wise results for 91, 182 and 364-day Government of India treasury bills — cut-off prices, yields and issue amounts.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Treasury bill auctions | Government — Database on Indian Economy",
        description : "Auction-wise results for 91, 182 and 364-day Government of India treasury bills — cut-off prices, yields and issue amounts.",
    },
};

export default async function Page() {
    // Fetch treasury bill auction data (Server Component)
    const data = await getTreasuryBillAuctions();

    return <TreasuryBillAuctionsPageClient data={data} />;
}

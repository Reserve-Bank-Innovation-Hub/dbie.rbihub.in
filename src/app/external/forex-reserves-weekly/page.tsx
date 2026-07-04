// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getForexReservesWeekly } from "@/lib/api/tables/forex-reserves-weekly";

// OTHER ===============================================================================================================
import ForexReservesWeeklyPage from "./page.client";

export const metadata : Metadata = {
    title       : "Foreign exchange reserves (weekly) | External — Database on Indian Economy",
    description : "Weekly snapshot of India's official foreign exchange reserves, including foreign currency assets, gold, SDRs and reserve tranche position, from 2001 onwards.",
    keywords    : [
        "foreign exchange reserves",
        "forex reserves weekly",
        "India reserves",
        "foreign currency assets",
        "gold reserves",
        "SDR",
        "reserve tranche",
        "RBI",
    ],
    openGraph   : {
        title       : "Foreign exchange reserves (weekly) | External — Database on Indian Economy",
        description : "Weekly snapshot of India's official foreign exchange reserves, including foreign currency assets, gold, SDRs and reserve tranche position, from 2001 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Foreign exchange reserves (weekly) | External — Database on Indian Economy",
        description : "Weekly snapshot of India's official foreign exchange reserves, including foreign currency assets, gold, SDRs and reserve tranche position, from 2001 onwards.",
    },
};

export default async function Page() {
    // Fetch weekly forex reserve data (Server Component)
    const reservesData = await getForexReservesWeekly();

    return <ForexReservesWeeklyPage reservesData={reservesData} />;
}

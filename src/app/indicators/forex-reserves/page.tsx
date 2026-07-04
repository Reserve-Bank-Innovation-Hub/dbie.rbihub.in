// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getForexReserves } from "@/lib/api/indicators";

// OTHER ===============================================================================================================
import ForexReservesPage from "./page.client";

export const metadata: Metadata = {
    title       : "Foreign Exchange Reserves | Indicators — Database on Indian Economy",
    description : "Weekly foreign exchange reserves data including total reserves, foreign currency assets, gold holdings, and SDRs",
    keywords    : [
        "forex reserves",
        "foreign exchange",
        "FX reserves",
        "gold reserves",
        "SDR",
        "RBI reserves",
        "India reserves"
    ],
    openGraph   : {
        title       : "Foreign Exchange Reserves | Indicators — Database on Indian Economy",
        description : "Weekly foreign exchange reserves data including total reserves, foreign currency assets, gold holdings, and SDRs",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Foreign Exchange Reserves | Indicators — Database on Indian Economy",
        description : "Weekly foreign exchange reserves data including total reserves, foreign currency assets, gold holdings, and SDRs",
    },
};

export default async function Page() {
    const forexData = await getForexReserves();

    return <ForexReservesPage forexData={forexData} />;
}

// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getReserveMoney } from "@/lib/api/tables/reserve-money";

// OTHER ===============================================================================================================
import ReserveMoneyPage from "./page.client";

export const metadata : Metadata = {
    title       : "Reserve money — components and sources | Banking — Database on Indian Economy",
    description : "Reserve money (M0) components and sources in Rupees millions, from the RBI Monthly Bulletin. Covers currency in circulation, bankers' deposits, and net foreign exchange assets.",
    keywords    : [
        "reserve money",
        "M0",
        "currency in circulation",
        "bankers deposits",
        "RBI",
        "monetary base",
        "net foreign exchange assets",
    ],
    openGraph   : {
        title       : "Reserve money — components and sources | Banking — Database on Indian Economy",
        description : "Reserve money (M0) components and sources in Rupees millions, from the RBI Monthly Bulletin.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Reserve money — components and sources | Banking — Database on Indian Economy",
        description : "Reserve money (M0) components and sources in Rupees millions, from the RBI Monthly Bulletin.",
    },
};

export default function Page() {
    // Fetch reserve money data (Server Component — synchronous loadData)
    const reserveMoneyData = getReserveMoney();

    return <ReserveMoneyPage reserveMoneyData={reserveMoneyData} />;
}

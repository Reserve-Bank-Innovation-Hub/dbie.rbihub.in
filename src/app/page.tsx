// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import DashboardPage from "./page.client";

export const metadata : Metadata = {
    title       : "Database on Indian Economy",
    description : "Access comprehensive economic data, indicators, statistics, and publications from the Reserve Bank of India.",
    keywords    : ["DBIE", "Database on Indian Economy", "RBI", "Reserve Bank of India", "economic data", "India economy", "statistics", "indicators"],
    openGraph   : {
        title       : "Database on Indian Economy",
        description : "Access comprehensive economic data, indicators, statistics, and publications from the Reserve Bank of India.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Database on Indian Economy",
        description : "Access comprehensive economic data, indicators, statistics, and publications from the Reserve Bank of India.",
    },
};

// LIB =================================================================================================================
import { getHomeData } from "@/lib/api/home";

export default async function Page() {
    const home = getHomeData();

    return <DashboardPage home={home} />;
}

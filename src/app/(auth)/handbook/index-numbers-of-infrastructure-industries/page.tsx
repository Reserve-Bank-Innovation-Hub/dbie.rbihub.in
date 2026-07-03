// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getIndexNumbersOfInfrastructureIndustries } from "@/lib/api/tables/index-numbers-of-infrastructure-industries";

// OTHER ===============================================================================================================
import IndexNumbersOfInfrastructureIndustriesPage from "./page.client";

export const metadata : Metadata = {
    title       : "Index numbers of infrastructure industries | Output and prices — Database on Indian Economy",
    description : "Annual index numbers of eight core infrastructure industries (base 2011-12 = 100): electricity, coal, steel, cement, crude oil, petroleum refinery products, natural gas, and fertilisers.",
    keywords    : [
        "infrastructure industries index",
        "ICI",
        "electricity",
        "coal",
        "steel",
        "cement",
        "crude oil",
        "petroleum refinery products",
        "natural gas",
        "fertilisers",
        "core sector",
        "RBI handbook",
    ],
    openGraph   : {
        title       : "Index numbers of infrastructure industries | Output and prices — Database on Indian Economy",
        description : "Annual index numbers of eight core infrastructure industries (base 2011-12 = 100): electricity, coal, steel, cement, crude oil, petroleum refinery products, natural gas, and fertilisers.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Index numbers of infrastructure industries | Output and prices — Database on Indian Economy",
        description : "Annual index numbers of eight core infrastructure industries (base 2011-12 = 100): electricity, coal, steel, cement, crude oil, petroleum refinery products, natural gas, and fertilisers.",
    },
};

export default async function Page() {
    // Fetch infrastructure industries index data (Server Component)
    const infraData = await getIndexNumbersOfInfrastructureIndustries();

    return <IndexNumbersOfInfrastructureIndustriesPage infraData={infraData} />;
}

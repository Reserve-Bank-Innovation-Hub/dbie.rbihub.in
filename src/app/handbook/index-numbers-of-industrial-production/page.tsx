// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getIndexNumbersOfIndustrialProduction } from "@/lib/api/tables/index-numbers-of-industrial-production";

// OTHER ===============================================================================================================
import IndexNumbersOfIndustrialProductionPage from "./page.client";

export const metadata : Metadata = {
    title       : "Index numbers of industrial production | Output and prices — Database on Indian Economy",
    description : "Annual index numbers of industrial production (base 2011-12 = 100) covering mining & quarrying, manufacturing, and electricity sectors across multiple base year series.",
    keywords    : [
        "index of industrial production",
        "IIP",
        "mining and quarrying",
        "manufacturing",
        "electricity",
        "industrial output",
        "base year 2011-12",
        "RBI",
        "NSO",
    ],
    openGraph : {
        title       : "Index numbers of industrial production | Output and prices — Database on Indian Economy",
        description : "Annual index numbers of industrial production (base 2011-12 = 100) covering mining & quarrying, manufacturing, and electricity sectors across multiple base year series.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter : {
        card        : "summary_large_image",
        title       : "Index numbers of industrial production | Output and prices — Database on Indian Economy",
        description : "Annual index numbers of industrial production (base 2011-12 = 100) covering mining & quarrying, manufacturing, and electricity sectors across multiple base year series.",
    },
};

export default async function Page() {
    const iipData = await getIndexNumbersOfIndustrialProduction();
    return <IndexNumbersOfIndustrialProductionPage iipData={iipData} />;
}

// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getIndexNumbersOfIndustrialProductionUseBased } from "@/lib/api/tables/index-numbers-of-industrial-production-use-based-classification";

// OTHER ===============================================================================================================
import IIPUseBasedPage from "./page.client";

export const metadata : Metadata = {
    title       : "Index numbers of industrial production: use-based classification | Output and prices — Database on Indian Economy",
    description : "Annual index numbers of industrial production by use-based classification (base 2011-12 = 100): primary goods, capital goods, intermediate goods, infrastructure/construction goods, consumer durables, and consumer non-durables.",
    keywords    : [
        "index of industrial production",
        "IIP",
        "use-based classification",
        "primary goods",
        "capital goods",
        "intermediate goods",
        "infrastructure goods",
        "consumer durables",
        "consumer non-durables",
        "NSO",
        "RBI handbook",
    ],
    openGraph   : {
        title       : "Index numbers of industrial production: use-based classification | Output and prices — Database on Indian Economy",
        description : "Annual index numbers of industrial production by use-based classification (base 2011-12 = 100): primary goods, capital goods, intermediate goods, infrastructure/construction goods, consumer durables, and consumer non-durables.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Index numbers of industrial production: use-based classification | Output and prices — Database on Indian Economy",
        description : "Annual index numbers of industrial production by use-based classification (base 2011-12 = 100): primary goods, capital goods, intermediate goods, infrastructure/construction goods, consumer durables, and consumer non-durables.",
    },
};

export default async function Page() {
    // Fetch IIP use-based classification data (Server Component)
    const iipData = getIndexNumbersOfIndustrialProductionUseBased();

    return <IIPUseBasedPage iipData={iipData} />;
}

// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getIndexOfIndustrialProduction } from "@/lib/api/tables/index-of-industrial-production";

// OTHER ===============================================================================================================
import IndexOfIndustrialProductionPage from "./page.client";

export const metadata : Metadata = {
    title       : "Index of Industrial Production | Growth — Database on Indian Economy",
    description : "Monthly index of industrial production (base 2011-12=100) by sectoral and use-based classification, with year-on-year growth rates",
    keywords    : [
        "index of industrial production",
        "IIP",
        "industrial growth",
        "manufacturing",
        "mining",
        "electricity",
        "use-based classification",
        "RBI",
        "MoSPI",
    ],
    openGraph   : {
        title       : "Index of Industrial Production | Growth — Database on Indian Economy",
        description : "Monthly index of industrial production (base 2011-12=100) by sectoral and use-based classification, with year-on-year growth rates",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Index of Industrial Production | Growth — Database on Indian Economy",
        description : "Monthly index of industrial production (base 2011-12=100) by sectoral and use-based classification, with year-on-year growth rates",
    },
};

export default async function Page() {
    const iipData = await getIndexOfIndustrialProduction();

    return <IndexOfIndustrialProductionPage iipData={iipData} />;
}

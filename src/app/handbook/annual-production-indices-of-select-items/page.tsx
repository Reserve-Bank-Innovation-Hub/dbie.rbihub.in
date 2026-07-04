// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getAnnualProductionIndices } from "@/lib/api/tables/annual-production-indices-of-select-items";

// OTHER ===============================================================================================================
import AnnualProductionIndicesClientPage from "./page.client";

export const metadata : Metadata = {
    title       : "Annual production indices of select items | Output and prices — Database on Indian Economy",
    description : "Annual production indices of select items (base 2011-12 = 100) covering 80 industries across primary, capital, intermediate, infrastructure/construction, and consumer goods sectors.",
};

export default async function Page() {
    const indicesData = await getAnnualProductionIndices();
    return <AnnualProductionIndicesClientPage indicesData={indicesData} />;
}

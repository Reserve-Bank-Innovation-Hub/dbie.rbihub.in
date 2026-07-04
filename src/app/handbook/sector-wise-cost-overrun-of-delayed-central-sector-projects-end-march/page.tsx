// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getSectorWiseCostOverrun } from "@/lib/api/tables/sector-wise-cost-overrun-of-delayed-central-sector-projects-end-march";

// OTHER ===============================================================================================================
import SectorWiseCostOverrunPage from "./page.client";

export const metadata : Metadata = {
    title       : "Sector-wise cost overrun of delayed central sector projects (end-March) | Handbook — Database on Indian Economy",
    description : "Sector-wise cost overrun of delayed central sector projects — number of projects, original estimate, anticipated cost and cost overrun, as at end-March.",
    keywords    : [
        "cost overrun",
        "central sector projects",
        "delayed projects",
        "infrastructure",
        "original estimate",
        "now anticipated",
        "RBI",
        "HSIE",
    ],
    openGraph   : {
        title       : "Sector-wise cost overrun of delayed central sector projects (end-March) | Handbook — Database on Indian Economy",
        description : "Sector-wise cost overrun of delayed central sector projects — number of projects, original estimate, anticipated cost and cost overrun, as at end-March.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Sector-wise cost overrun of delayed central sector projects (end-March) | Handbook — Database on Indian Economy",
        description : "Sector-wise cost overrun of delayed central sector projects — number of projects, original estimate, anticipated cost and cost overrun, as at end-March.",
    },
};

export default async function Page() {
    const tableData = await getSectorWiseCostOverrun();
    return <SectorWiseCostOverrunPage tableData={tableData} />;
}

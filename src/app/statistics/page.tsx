// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { SectorListPage } from "@components/SectorPage/SectorListPage";

// LIB =================================================================================================================
import { menuHint } from "@/lib/api/catalogue";
import { menuOrder, statisticsMenu } from "@/lib/dbie-menu";

const TITLE       = "Statistics — Database on Indian Economy";
const DESCRIPTION = "DBIE's Statistics menu sector by sector: the report tables of each sub-section and the Data Query datasets filed with them, straight from the database.";

export const metadata : Metadata = {
    title       : TITLE,
    description : DESCRIPTION,
    keywords    : [ "statistics", "corporate sector", "external sector", "financial market", "financial sector", "public finance", "real sector", "Data Query", "India economy", "RBI" ],
    openGraph   : {
        title       : TITLE,
        description : DESCRIPTION,
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : TITLE,
        description : DESCRIPTION,
    },
};

export default function Page() {
    const { sectors } = statisticsMenu();

    return (
        <SectorListPage
            id="statistics-page"
            menuKey="statistics"
            base="/statistics"
            title="Statistics"
            subtitle={menuHint("statistics")}
            groupTitle="Sectors"
            items={sectors}
            order={menuOrder()}
        />
    );
}

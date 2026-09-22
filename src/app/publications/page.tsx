// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { SectorListPage } from "@components/SectorPage/SectorListPage";

// LIB =================================================================================================================
import { menuHint } from "@/lib/api/catalogue";
import { publicationsMenu } from "@/lib/dbie-menu";

const TITLE       = "Publications — Database on Indian Economy";
const DESCRIPTION = "DBIE's time-series publications, table by table: the Monthly RBI Bulletin, the Handbook of Statistics on the Indian Economy, the Basic Statistical Returns, the Weekly Statistical Supplement and the rest.";

export const metadata : Metadata = {
    title       : TITLE,
    description : DESCRIPTION,
    keywords    : [ "publications", "RBI reports", "statistical releases", "Monthly RBI Bulletin", "Handbook of Statistics on the Indian Economy", "Basic Statistical Returns", "India economy", "RBI" ],
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
    const { category, publications } = publicationsMenu();

    return (
        <SectorListPage
            id="publications-page"
            menuKey="publication"
            base="/publications"
            title="Publications"
            subtitle={menuHint("publication")}
            groupTitle={category}
            items={publications}
        />
    );
}

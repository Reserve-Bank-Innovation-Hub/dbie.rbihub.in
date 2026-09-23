// REACT CORE ==========================================================================================================
import React, { Suspense } from "react";
import { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { Loading }  from "@components/Loading/Loading";
import { MenuPage } from "@components/SectorPage/MenuPage";

// LIB =================================================================================================================
import { menuHint } from "@/lib/api/catalogue";
import { menuOrder, seriesSlugs } from "@/lib/dbie-menu";

// OTHER ===============================================================================================================
import curatedPages from "../tables/curated-pages.json";

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

// The eight sectors of DBIE's Statistics menu with their tables, from the data API's catalogue in the browser. The
// client reads ?table= to open a table in place, and useSearchParams needs a Suspense boundary on a statically
// generated route.
export default function Page() {
    return (
        <Suspense fallback={<Loading name="statistics" />}>
            <MenuPage
                id="statistics-page"
                path="/statistics"
                menuKey="statistics"
                title="Statistics"
                subtitle={menuHint("statistics")}
                curated={curatedPages}
                seriesSlugs={seriesSlugs()}
                order={menuOrder()}
            />
        </Suspense>
    );
}

// REACT CORE ==========================================================================================================
import React, { Suspense } from "react";
import { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { Loading }  from "@components/Loading/Loading";
import { MenuPage } from "@components/SectorPage/MenuPage";

// LIB =================================================================================================================
import { menuHint } from "@/lib/api/catalogue";
import { menuOrder } from "@/lib/dbie-menu";

// OTHER ===============================================================================================================
import curatedPages from "../tables/curated-pages.json";

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

// DBIE's time-series publications with their tables, from the data API's catalogue in the browser. The client reads
// ?table= to open a table in place, and useSearchParams needs a Suspense boundary on a statically generated route.
export default function Page() {
    return (
        <Suspense fallback={<Loading name="publications" />}>
            <MenuPage
                id="publications-page"
                path="/publications"
                menuKey="publication"
                title="Publications"
                subtitle={menuHint("publication")}
                curated={curatedPages}
                order={menuOrder()}
            />
        </Suspense>
    );
}

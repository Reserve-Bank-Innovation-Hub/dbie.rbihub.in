// REACT CORE ==========================================================================================================
import React, { Suspense } from "react";
import { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { Loading } from "@components/Loading/Loading";

// LIB =================================================================================================================
import { menuOrder, seriesSlugs } from "@/lib/dbie-menu";

// OTHER ===============================================================================================================
import TablesPage from "./page.client";
import curatedPages from "./curated-pages.json";

export const metadata : Metadata = {
    title       : "Tables — Database on Indian Economy",
    description : "Every table in DBIE's Statistics and Publication menus, the Data Query datasets in their sectors, one at a time, with what the database holds for each.",
};

// The page lists DBIE's menus from the data API in the browser (src/lib/api/catalogue.ts). From the build it takes
// DBIE's own menu order and where the site already has a page for an entry (src/lib/dbie-menu.ts reads both out of
// data/): curated-pages.json maps DBIE report ids and SDMX dataset codes to routes, and every SDMX dataset in the
// release catalogue has a generic series page at /tables/<slug>, slug being its CSV file name.
export default function Page() {
    return (
        <Suspense fallback={<Loading name="tables" />}>
            <TablesPage curated={curatedPages} seriesSlugs={seriesSlugs()} order={menuOrder()} />
        </Suspense>
    );
}

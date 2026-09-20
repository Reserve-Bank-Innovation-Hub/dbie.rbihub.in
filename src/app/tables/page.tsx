// REACT CORE ==========================================================================================================
import React, { Suspense } from "react";
import { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";

// LOCAL COMPONENTS ====================================================================================================
import { Loading } from "@components/Loading/Loading";

// LIB =================================================================================================================
import { menuOrderFrom } from "@/lib/api/catalogue";

// OTHER ===============================================================================================================
import TablesPage from "./page.client";
import curatedPages from "./curated-pages.json";

export const metadata : Metadata = {
    title       : "Tables — Database on Indian Economy",
    description : "Every table in DBIE's Statistics and Publication menus, the Data Query datasets in their sectors, one at a time, with what the database holds for each.",
};

// The page lists DBIE's menus from the data API in the browser (src/lib/api/catalogue.ts). From the build it
// takes DBIE's own menu order (data/dbie-menu.json, captured from the portal) and where the site already has a
// page for an entry: curated-pages.json maps DBIE report ids and SDMX dataset codes to routes, and every SDMX
// dataset in the release catalogue has a generic series page at /tables/<slug>, slug being its CSV file name.
export default function Page() {
    const dbieMenu    = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "dbie-menu.json"), "utf8"));
    const catalogue   = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "catalogue.json"), "utf8"));
    const seriesSlugs : Record<string, string> = {};
    for (const entry of catalogue.entries as { source : string; dsdCode ? : string; path ? : string }[]) {
        if (entry.source === "sdmx" && entry.dsdCode && entry.path) {
            seriesSlugs[entry.dsdCode] = path.basename(entry.path, ".csv");
        }
    }

    return (
        <Suspense fallback={<Loading name="tables" />}>
            <TablesPage curated={curatedPages} seriesSlugs={seriesSlugs} order={menuOrderFrom(dbieMenu)} />
        </Suspense>
    );
}

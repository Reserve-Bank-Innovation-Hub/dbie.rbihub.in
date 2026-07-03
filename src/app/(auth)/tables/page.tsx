// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";

// OTHER ===============================================================================================================
import TablesPage, { TableGroup } from "./page.client";
import livePages from "./live-pages.json";

export const metadata : Metadata = {
    title       : "Tables — Database on Indian Economy",
    description : "Every data table available on the platform — SDMX series and RBI Bulletin tables, grouped by sector.",
};

interface CatalogueEntry {
    id          : string;
    source      : "sdmx" | "rbib";
    label       : string;
    frequency ? : string;
    sector ?    : string;
    subSector ? : string;
    publication ? : string;
    topic ?     : string;
}

// Catalogue entries that have a live page on the site (id -> route)
const LIVE_PAGES : Record<string, string> = livePages;

export default function Page() {
    // The catalogue is committed alongside the data — read it at build time (SSG)
    const cataloguePath = path.join(process.cwd(), "data", "catalogue.json");
    const catalogue = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));

    // Normalise both sources into sector → sub-sector → tables
    const groups = new Map<string, Map<string, { label : string; frequency : string; linkTo ? : string }[]>>();

    for (const entry of catalogue.entries as CatalogueEntry[]) {
        const sector    = entry.sector ?? entry.publication ?? "Other";
        const subSector = entry.subSector ?? entry.topic ?? "";

        if (!groups.has(sector)) groups.set(sector, new Map());
        const subGroups = groups.get(sector)!;
        if (!subGroups.has(subSector)) subGroups.set(subSector, []);
        subGroups.get(subSector)!.push({
            label     : entry.label,
            frequency : entry.frequency ?? "",
            linkTo    : LIVE_PAGES[entry.id],
        });
    }

    const tableGroups : TableGroup[] = [ ...groups.entries() ].map(([ sector, subGroups ]) => ({
        sector,
        subGroups : [ ...subGroups.entries() ].map(([ subSector, tables ]) => ({
            subSector,
            tables : tables.sort((a, b) => a.label.localeCompare(b.label)),
        })),
    }));

    const total     = (catalogue.entries as CatalogueEntry[]).length;
    const liveCount = Object.keys(LIVE_PAGES).length;

    return <TablesPage groups={tableGroups} total={total} liveCount={liveCount} />;
}

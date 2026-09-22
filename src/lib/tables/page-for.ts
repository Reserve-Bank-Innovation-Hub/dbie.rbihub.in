// The page the site already has for a catalogue entry, for the table view to link to: a curated page where
// src/app/tables/curated-pages.json maps the DBIE report id or SDMX dataset code to a route, else the generic SDMX
// series page at /tables/<slug> with its chart (src/lib/dbie-menu.ts's seriesSlugs() names those). A publication's
// tables are reports, so those pages pass no series slugs.

// LIB =================================================================================================================
import { CatalogueEntry } from "@/lib/api/catalogue";

export interface PageLink {
    href  : string;
    label : string;
}

export function pageFor(
    entry       : CatalogueEntry,
    curated     : Record<string, string>,
    seriesSlugs : Record<string, string> = {},
) : PageLink | null {
    if (entry.report_id != null && curated[`report:${entry.report_id}`]) return { href : curated[`report:${entry.report_id}`], label : "Curated page" };
    if (entry.dsd_code) {
        if (curated[`dsd:${entry.dsd_code}`]) return { href : curated[`dsd:${entry.dsd_code}`], label : "Curated page" };
        if (seriesSlugs[entry.dsd_code]) return { href : `/tables/${seriesSlugs[entry.dsd_code]}`, label : "Chart page" };
    }
    return null;
}

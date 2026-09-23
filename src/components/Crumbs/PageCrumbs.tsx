"use client";

// The trail above a page's heading: the section of the site the page belongs to, then the levels under which that
// section's own page lists it, each an anchor there, so every crumb lands on something. Which page this is comes from
// the route. A table page under a theme is found through src/app/tables/curated-pages.json and its DBIE levels come
// from the catalogue, drawn on the theme's page by SectorPage under the shared rules (src/lib/tables/placement.ts); a
// publication's page and an SDMX series page the same, on the menu pages MenuPage draws; a Handbook, Indicators or
// Stories page is found in that section's own list of sections; a docs page leads back to the docs overview. The
// DBIE levels need the catalogue, which the browser fetches once per page; until it is in, the trail is the site
// section alone.

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import { usePathname } from "next/navigation";

// LOCAL COMPONENTS ====================================================================================================
import { Crumb, Crumbs } from "./Crumbs";

// LIB =================================================================================================================
import { CatalogueEntry, curatedKeys, menuOrderFrom, slugify } from "@/lib/api/catalogue";
import { menuSectors, themeKeys, themeSector, useCatalogue } from "@/lib/api/use-menu";
import {
    findPlacement,
    groupShown,
    menuGroupAnchor,
    menuSectionAnchor,
    sectionShown,
    themeGroupAnchor,
} from "@/lib/tables/placement";
import { sentenceCase, shortTitle } from "@/lib/tables/titles";

// OTHER ===============================================================================================================
import curatedPages from "@/app/tables/curated-pages.json";
import dbieMenu from "../../../data/dbie-menu.json";
import { HANDBOOK_SECTIONS } from "@/app/handbook/sections";
import { INDICATOR_SECTIONS } from "@/app/indicators/sections";
import { STORY_SECTIONS } from "@/app/stories/(dashboard)/sections";

// The themes, by the first segment of their routes, and the name each shows.
const THEMES : Record<string, string> = {
    banking    : "Banking",
    external   : "External",
    government : "Government",
    markets    : "Markets",
    prices     : "Prices",
    growth     : "Growth",
    payments   : "Payments",
};

// The two menus a page can be filed under, by the first segment of its route: a publication's own page, or an SDMX
// series page, whose datasets DBIE's Statistics menu lists.
const MENUS : Record<string, { key : string; label : string; base : string }> = {
    publications : { key : "publication", label : "Publications", base : "/publications" },
    tables       : { key : "statistics",  label : "Statistics",   base : "/statistics" },
};

const curated : Record<string, string> = curatedPages;

// The sections of the site whose pages are listed by a static list of their own, with the name the trail shows.
const LISTED : Record<string, { label : string; sections : typeof HANDBOOK_SECTIONS }> = {
    handbook   : { label : "Handbook of statistics", sections : HANDBOOK_SECTIONS },
    indicators : { label : "Indicators",             sections : INDICATOR_SECTIONS },
    stories    : { label : "Stories",                sections : STORY_SECTIONS },
};

interface PageCrumbsProps {
    dsd ? : string;   // an SDMX series page: its dataset's DBIE code
}

export const PageCrumbs = ({ dsd } : PageCrumbsProps) => {
    const pathname = usePathname();
    const [ , head = "" ] = pathname.split("/");

    const theme  = THEMES[head];
    const menu   = MENUS[head];
    const listed = LISTED[head];
    const isDocs = head === "docs" && pathname !== "/docs";

    // Only the pages filed in DBIE's menus need the catalogue.
    const { entries } = useCatalogue(Boolean(theme || menu));
    const order = useMemo(() => menuOrderFrom(dbieMenu), []);

    // The keys curated-pages.json files this route under; a table matches when one of its keys is among them.
    const routeKeys = useMemo(
        () => new Set(Object.entries(curated).filter(([ , route ]) => route === pathname).map(([ key ]) => key)),
        [ pathname ],
    );

    const crumbs : Crumb[] = useMemo(() => {
        const mine = (e : CatalogueEntry) : boolean => curatedKeys(e).some(k => routeKeys.has(k));

        if (theme) {
            const root : Crumb = { label : theme, href : `/${head}` };
            if (!entries) return [ root ];
            const sector = themeSector(entries, themeKeys(curated, `/${head}`), theme, `/${head}`, order);
            const found  = findPlacement([ sector ], mine);
            if (!found) return [ root ];
            return [
                root,
                ...(sectionShown(sector, found.section)
                    ? [ { label : sentenceCase(found.section.label), href : `/${head}#${found.section.slug}` } ]
                    : []),
                ...(groupShown(found.section, found.group)
                    ? [ { label : sentenceCase(found.group.label), href : `/${head}#${themeGroupAnchor(found.section, found.group)}` } ]
                    : []),
            ];
        }

        if (listed) {
            const root : Crumb = { label : listed.label, href : `/${head}` };
            const section = listed.sections.find(s => s.items.some(item => item.linkTo === pathname));
            return section?.title
                ? [ root, { label : section.title, href : `/${head}#${slugify(section.title)}` } ]
                : [ root ];
        }

        if (isDocs) return [ { label : "Docs", href : "/docs" } ];

        if (menu) {
            const root : Crumb = { label : menu.label, href : menu.base };
            if (!entries) return [ root ];
            const match = head === "tables" ? (e : CatalogueEntry) => Boolean(dsd) && e.dsd_code === dsd : mine;
            const found = findPlacement(menuSectors(entries, menu.key, order), match);
            if (!found) return [ root ];
            return [
                root,
                { label : shortTitle(found.sector.label), title : sentenceCase(found.sector.label), href : `${menu.base}#${found.sector.slug}` },
                ...(sectionShown(found.sector, found.section)
                    ? [ { label : sentenceCase(found.section.label), href : `${menu.base}#${menuSectionAnchor(found.sector, found.section)}` } ]
                    : []),
                ...(groupShown(found.section, found.group)
                    ? [ { label : sentenceCase(found.group.label), href : `${menu.base}#${menuGroupAnchor(found.sector, found.section, found.group)}` } ]
                    : []),
            ];
        }

        return [];
    }, [ theme, menu, listed, isDocs, head, pathname, entries, order, routeKeys, dsd ]);

    return <Crumbs crumbs={crumbs} />;
};

export default PageCrumbs;

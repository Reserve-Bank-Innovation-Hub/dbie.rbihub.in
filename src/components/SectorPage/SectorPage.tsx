"use client";

// One page of tables, laid out as the site's list pages are (the banking page): the title card, then the tables as
// DBIE files them, each level of the hierarchy a column from left to right. What it holds comes either from one of
// DBIE's own menus — a time-series publication under /publications, a Statistics sector under /statistics — or from
// a theme, the tables the site's curated pages under a route cover (/banking, /prices and the rest); either way
// src/lib/api/use-menu.ts reads it from the data API's catalogue in the browser, so the page lists what the
// database holds: only loaded tables, as on the tables page. A table opens in place: the listing gives way to the
// tables page's own view of the table (@components/tables/TableView) on the page grid, the sidebar staying as it
// is. ?table=<schema>.<table> names the table, the key the tables page takes too; the site's own page for it, where
// there is one, is linked from the view.

// REACT CORE ==========================================================================================================
import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// UI ==================================================================================================================
import { Article, Div, Header, Heading4, Heading6, Section, Text } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { Loading }          from "@components/Loading/Loading";
import { Crumb, TableView } from "@components/tables/TableView";

// LIB =================================================================================================================
import {
    CatalogueEntry,
    EntryGroup,
    MenuOrder,
    Section as MenuSection,
    Sector,
    periodRange,
    slugify,
    tableKey,
} from "@/lib/api/catalogue";
import { DATA_API_URL } from "@/lib/api/dataApi";
import { describe, menuSectors, themeKeys, themeSector, useCatalogue } from "@/lib/api/use-menu";
import { pageFor } from "@/lib/tables/page-for";
import { sentenceCase, shortTitle } from "@/lib/tables/titles";

interface SectorPageProps {
    id            : string;                      // the Article's id: publication-page, sector-page, banking-page
    path          : string;                      // the page's own route: /publications/<slug>, /statistics/<slug>, /banking
    label         : string;                      // DBIE's name, or the theme's
    menuKey     ? : string;                      // one of DBIE's menus: the catalogue's key for it
    slug        ? : string;                      // one of DBIE's menus: the sector's slug in it
    theme       ? : boolean;                     // a theme: its tables are the ones curated under path
    subtitle    ? : string;                      // a theme's own description; a sector counts its tables instead
    noun        ? : string;                      // what this section calls one of its own, for the empty state
    curated       : Record<string, string>;      // "report:<id>" or "dsd:<code>" → the site's curated page
    seriesSlugs ? : Record<string, string>;      // SDMX dataset code → slug of its series page (with a chart)
    order       ? : MenuOrder;                   // DBIE's own order of sectors and sections
}

// The table ?table= asks for, with the levels of the sector it sits under. A sector's groups hold only loaded
// tables (src/lib/api/use-menu.ts), so whatever is found here can be opened.
interface FoundTable {
    entry   : CatalogueEntry;
    section : MenuSection;
    group   : EntryGroup;
}

// The anchor of a group within its section; section slugs are unique in a sector and group labels within a section,
// so the id is unique on the page.
const groupAnchor = (section : MenuSection, group : EntryGroup) : string => `${section.slug}--${slugify(group.label)}`;

const findTable = (sector : Sector | null, key : string | null) : FoundTable | null => {
    if (!sector || !key) return null;
    for (const section of sector.sections) {
        for (const group of section.groups) {
            const entry = group.entries.find(e => tableKey(e) === key);
            if (entry) return { entry, section, group };
        }
    }
    return null;
};

// What DBIE lists with a table: its frequency and period.
const details = (entry : CatalogueEntry) : string =>
    [ entry.frequency, periodRange(entry) ].filter(Boolean).join(" · ");

// The cells of a list of tables; each opens its table in place on this page.
const TableCells = ({ entries, path } : { entries : CatalogueEntry[]; path : string }) => (
    <>
        {entries.map(entry => (
            <Div className="grid-cell" key={entry.entry_id} padding="micro">
                <Link href={`${path}?table=${tableKey(entry)}`}>
                    <Text weight="600">{sentenceCase(entry.title)}</Text>

                    {details(entry) && (
                        <Text size="small" opacity="80" weight="400">
                            {details(entry)}
                        </Text>
                    )}
                </Link>
            </Div>
        ))}
    </>
);

export const SectorPage = ({ id, path, label, menuKey, slug, theme, subtitle, noun = "sector", curated, seriesSlugs = {}, order = {} } : SectorPageProps) => {
    const searchParams = useSearchParams();

    // The sector on show: one of a menu's, found by its slug, or the one a theme's keys gather.
    const { entries, error } = useCatalogue();
    const sector = useMemo(() => {
        if (!entries) return null;
        if (theme) {
            const built = themeSector(entries, themeKeys(curated, path), label, slug ?? path, order);
            return built.count > 0 ? built : null;
        }
        return menuSectors(entries, menuKey ?? "", order).find(s => s.slug === slug) ?? null;
    }, [ entries, theme, curated, label, slug, path, menuKey, order ]);

    const requestedTable = searchParams.get("table");
    const found          = useMemo(() => findTable(sector, requestedTable), [ sector, requestedTable ]);

    // The trail above the view's heading: the sector, then every level above the table that DBIE names, each one an
    // anchor in this sector's hierarchy. The table itself is the heading, so it is not in the trail.
    const crumbs : Crumb[] = found
        ? [
            { label : shortTitle(label), title : sentenceCase(label), href : path },
            ...(found.section.implicit ? [] : [ {
                label : sentenceCase(found.section.label),
                href  : `${path}#${found.section.slug}`,
            } ]),
            ...(found.group.label ? [ {
                label : sentenceCase(found.group.label),
                href  : `${path}#${groupAnchor(found.section, found.group)}`,
            } ] : []),
        ]
        : [];

    // A crumb leads back to a section or group by its hash, and the hierarchy it names is only rendered once the
    // catalogue is in — on a fresh load, and in the same commit as the URL change when coming back from a table —
    // so the hash is acted on here rather than left to the browser.
    useEffect(() => {
        if (found || !sector) return;
        const anchor = decodeURIComponent(window.location.hash.slice(1));
        if (anchor) document.getElementById(anchor)?.scrollIntoView({ block : "start" });
    }, [ found, sector ]);

    // THE TABLE IN PLACE: the listing gives way to it ///////////////////////////////////////////////////////////////
    if (found) {
        return (
            <Article id={id} className="page-grid">
                <TableView
                    key={requestedTable}
                    entry={found.entry}
                    crumbs={crumbs}
                    pageLink={pageFor(found.entry, curated, seriesSlugs)}
                />
            </Article>
        );
    }

    const heading = sector
        ? subtitle ?? describe(sector)
        : error
            ? `Could not load the catalogue from the data API at ${DATA_API_URL}.`
            : entries
                ? `The database holds no tables of this ${noun}.`
                : "";

    return (
        <Article id={id} className="data-list-page">
            <Header id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        {sentenceCase(label)}
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        {heading}
                    </Heading6>
                </Div>
            </Header>

            <Div id="sections-wrapper">
                {sector ? sector.sections.map(section => (
                    <Section key={section.slug} id={section.slug} marginBottom="nano" className={section.implicit ? "untitled" : ""}>
                        {/* LEVEL ONE: the part of the sector, when it has parts /////////////////////////////////// */}
                        {!section.implicit && (
                            <Div className="grid-cell section-header" padding="micro">
                                <Heading6 weight="700" className="section-title">
                                    {sentenceCase(section.label)}
                                </Heading6>
                            </Div>
                        )}

                        <Div className="section-content">
                            {section.groups.map(group => group.label ? (
                                /* LEVEL TWO: the group within the part, then its tables ////////////////////////// */
                                <Section key={group.label} id={groupAnchor(section, group)}>
                                    <Div className="grid-cell section-header" padding="micro">
                                        <Heading6 weight="600" className="section-title">
                                            {sentenceCase(group.label)}
                                        </Heading6>
                                    </Div>

                                    <Div className="section-content">
                                        <TableCells entries={group.entries} path={path} />
                                    </Div>
                                </Section>
                            ) : (
                                /* No level two: the tables ///////////////////////////////////////////////////////// */
                                <TableCells key={group.label} entries={group.entries} path={path} />
                            ))}
                        </Div>
                    </Section>
                )) : (
                    <Div className="grid-cell" padding="micro">
                        {error
                            ? <Text size="small" opacity="60">{error}</Text>
                            : !entries && <Loading name={sentenceCase(label)} />}
                    </Div>
                )}
            </Div>
        </Article>
    );
};

export default SectorPage;

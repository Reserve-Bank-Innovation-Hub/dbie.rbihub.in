"use client";

// One page of tables, laid out as the site's list pages are: the title card, then the tables as DBIE files them,
// each level of the hierarchy a column from left to right. What it holds is a theme, the tables the site's curated
// pages under a route cover (/banking, /prices and the rest), gathered into one sector by src/lib/api/use-menu.ts
// from the data API's catalogue in the browser, so the page lists what the database holds: only loaded tables, as
// on the tables page. (A whole DBIE menu, /statistics or /publications, is MenuPage.tsx, which shares the cells
// below.) A table opens in place: the listing gives way to the tables page's own view of the table
// (@components/tables/TableView) on the page grid. ?table=<schema>.<table> names the table, the key the tables page
// takes too; the site's own page for it, where there is one, is linked from the view.

// REACT CORE ==========================================================================================================
import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// UI ==================================================================================================================
import { Article, Badge, Div, Header, Heading4, Heading6, Section, Text } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { Loading }          from "@components/Loading/Loading";
import { Crumb }            from "@components/Crumbs/Crumbs";
import { TableView }        from "@components/tables/TableView";
import { HeadingIcon }      from "./HeadingIcon";

// LIB =================================================================================================================
import { CatalogueEntry, MenuOrder, Sector, periodRange, tableKey } from "@/lib/api/catalogue";
import { DATA_API_URL } from "@/lib/api/dataApi";
import { themeKeys, themeSector, useCatalogue } from "@/lib/api/use-menu";
import { pageFor } from "@/lib/tables/page-for";
import { Placement, findPlacement, groupShown, sectionShown, themeGroupAnchor as groupAnchor } from "@/lib/tables/placement";
import { sentenceCase, shortTitle } from "@/lib/tables/titles";

interface SectorPageProps {
    id            : string;                      // the Article's id: banking-page
    path          : string;                      // the theme's route: /banking; its tables are the ones curated under it
    label         : string;                      // the theme's name
    subtitle      : string;                      // the theme's own description
    noun        ? : string;                      // what this section calls one of its own, for the empty state
    curated       : Record<string, string>;      // "report:<id>" or "dsd:<code>" → the site's curated page
    seriesSlugs ? : Record<string, string>;      // SDMX dataset code → slug of its series page (with a chart)
    order       ? : MenuOrder;                   // DBIE's own order of sectors and sections
}

// The table ?table= asks for, with the levels of the sector it sits under. A sector's groups hold only loaded
// tables (src/lib/api/use-menu.ts), so whatever is found here can be opened. Which levels are drawn, and their
// anchors, are the shared rules in src/lib/tables/placement.ts, which the crumbs on the curated pages follow too.
const findTable = (sector : Sector | null, key : string | null) : Placement | null =>
    sector && key ? findPlacement([ sector ], e => tableKey(e) === key) : null;

// What DBIE lists with a table: its frequency and period.
const details = (entry : CatalogueEntry) : string =>
    [ entry.frequency, periodRange(entry) ].filter(Boolean).join(" · ");

// The cells of a list of tables; each is a link that opens its table in place on the page at path, the whole cell
// being the link (fictoan's padding-all-micro is what padding="micro" gives a Div). An SDMX dataset, from DBIE's
// Data Query wizard rather than a report, is listed with the report tables of its section and marked with a badge.
export const TableCells = ({ entries, path } : { entries : CatalogueEntry[]; path : string }) => (
    <>
        {entries.map(entry => (
            <Link href={`${path}?table=${tableKey(entry)}`} key={entry.entry_id} className="grid-cell padding-all-micro full-width">
                <Div className="table-name">
                    <Text weight="600">{sentenceCase(entry.title)}</Text>

                    {entry.source === "sdmx" && (
                        <Badge
                            className="source-badge"
                            size="small" borderColour="transparent"
                            title="An SDMX dataset from DBIE's Data Query wizard"
                        >
                            DATA QUERY
                        </Badge>
                    )}
                </Div>

                {details(entry) && (
                    <Text size="small" opacity="80" weight="400">
                        {details(entry)}
                    </Text>
                )}
            </Link>
        ))}
    </>
);

export const SectorPage = ({ id, path, label, subtitle, noun = "theme", curated, seriesSlugs = {}, order = {} } : SectorPageProps) => {
    const searchParams = useSearchParams();

    // The sector on show: the one the theme's keys gather.
    const { entries, error } = useCatalogue();
    const sector = useMemo(() => {
        if (!entries) return null;
        const built = themeSector(entries, themeKeys(curated, path), label, path, order);
        return built.count > 0 ? built : null;
    }, [ entries, curated, label, path, order ]);

    const requestedTable = searchParams.get("table");
    const found          = useMemo(() => findTable(sector, requestedTable), [ sector, requestedTable ]);

    // The trail above the view's heading: the sector, then every level above the table that DBIE names, each one an
    // anchor in this sector's hierarchy. The table itself is the heading, so it is not in the trail.
    const crumbs : Crumb[] = found
        ? [
            { label : shortTitle(label), title : sentenceCase(label), href : path },
            ...(sector && sectionShown(sector, found.section) ? [ {
                label : sentenceCase(found.section.label),
                href  : `${path}#${found.section.slug}`,
            } ] : []),
            ...(groupShown(found.section, found.group) ? [ {
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
        ? subtitle
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
                    <Section key={section.slug} id={section.slug} marginBottom="nano" className={sectionShown(sector, section) ? "" : "untitled"}>
                        {/* LEVEL ONE: the part of the sector, when it has parts /////////////////////////////////// */}
                        {sectionShown(sector, section) && (
                            <Div className="grid-cell section-header" padding="micro">
                                <Div className="section-title">
                                    <HeadingIcon label={section.label} />

                                    <Heading6 weight="700">
                                        {sentenceCase(section.label)}
                                    </Heading6>
                                </Div>
                            </Div>
                        )}

                        <Div className="section-content">
                            {section.groups.map(group => groupShown(section, group) ? (
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

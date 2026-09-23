"use client";

// The page of one of DBIE's menus — /statistics, /publications: the title card, then every sector of the menu (the
// eight Statistics sectors, the time-series publications), each a section with its name on the left and its tables
// on the right, laid out as DBIE files them, every level a column: a sector's parts, then a part's groups, then the
// tables. A level with a single member is not drawn, so its tables sit one column up: a part with one group shows the
// group's tables directly, a sector with one part that part's. src/lib/api/use-menu.ts reads the menu from the data API's catalogue in the browser, so the
// page lists what the database holds: only loaded tables, as on the tables page. A table opens in place at
// ?table=<schema>.<table>, the key the tables page takes too: the listing gives way to the tables page's own view
// of the table (@components/tables/TableView) on the page grid; the site's own page for it, where there is one, is
// linked from the view.

// REACT CORE ==========================================================================================================
import React, { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

// UI ==================================================================================================================
import { Article, Div, Header, Heading4, Heading6, Section, Text } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { Loading }          from "@components/Loading/Loading";
import { Crumb }            from "@components/Crumbs/Crumbs";
import { TableView }        from "@components/tables/TableView";
import { TableCells }       from "./SectorPage";
import { HeadingIcon }      from "./HeadingIcon";

// LIB =================================================================================================================
import { MenuOrder, Section as MenuSection, Sector, tableKey } from "@/lib/api/catalogue";
import { DATA_API_URL } from "@/lib/api/dataApi";
import { describe, menuSectors, useCatalogue } from "@/lib/api/use-menu";
import { pageFor } from "@/lib/tables/page-for";
import {
    Placement,
    findPlacement,
    groupShown,
    menuGroupAnchor as groupAnchor,
    menuSectionAnchor as sectionAnchor,
    sectionShown,
} from "@/lib/tables/placement";
import { sentenceCase, shortTitle } from "@/lib/tables/titles";

interface MenuPageProps {
    id            : string;                      // the Article's id: statistics-page, publications-page
    path          : string;                      // the page's own route: /statistics, /publications
    menuKey       : string;                      // the catalogue's key for the menu: statistics, publication
    title         : string;
    subtitle      : string;
    curated       : Record<string, string>;      // "report:<id>" or "dsd:<code>" → the site's curated page
    seriesSlugs ? : Record<string, string>;      // SDMX dataset code → slug of its series page (with a chart)
    order       ? : MenuOrder;                   // DBIE's own order of sectors and sections
}

// The table ?table= asks for, with the levels it sits under. The sectors hold only loaded tables
// (src/lib/api/use-menu.ts), so whatever is found here can be opened. Which levels are drawn, and their anchors, are
// the shared rules in src/lib/tables/placement.ts, which the crumbs on the curated pages follow too.
const findTable = (sectors : Sector[] | null, key : string | null) : Placement | null =>
    sectors && key ? findPlacement(sectors, e => tableKey(e) === key) : null;

// A part's groups: each a column of its own with its tables beside it, or, for the only group of a part, the tables
// alone.
const Groups = ({ sector, section, path } : { sector : Sector; section : MenuSection; path : string }) => (
    <>
        {section.groups.map(group => groupShown(section, group) ? (
            <Section key={group.label} id={groupAnchor(sector, section, group)}>
                <Div className="grid-cell section-header" padding="micro">
                    <Heading6 weight="500" className="section-title">
                        {sentenceCase(group.label)}
                    </Heading6>
                </Div>

                <Div className="section-content">
                    <TableCells entries={group.entries} path={path} />
                </Div>
            </Section>
        ) : (
            <TableCells key={group.label} entries={group.entries} path={path} />
        ))}
    </>
);

export const MenuPage = ({ id, path, menuKey, title, subtitle, curated, seriesSlugs = {}, order = {} } : MenuPageProps) => {
    const searchParams = useSearchParams();

    const { entries, error } = useCatalogue();
    const sectors = useMemo(() => (entries ? menuSectors(entries, menuKey, order) : null), [ entries, menuKey, order ]);

    const requestedTable = searchParams.get("table");
    const found          = useMemo(() => findTable(sectors, requestedTable), [ sectors, requestedTable ]);

    // The trail above the view's heading: this page, then every level above the table that DBIE names, each one an
    // anchor on this page. The table itself is the heading, so it is not in the trail.
    const crumbs : Crumb[] = found
        ? [
            { label : title, href : path },
            { label : shortTitle(found.sector.label), title : sentenceCase(found.sector.label), href : `${path}#${found.sector.slug}` },
            ...(sectionShown(found.sector, found.section) ? [ {
                label : sentenceCase(found.section.label),
                href  : `${path}#${sectionAnchor(found.sector, found.section)}`,
            } ] : []),
            ...(groupShown(found.section, found.group) ? [ {
                label : sentenceCase(found.group.label),
                href  : `${path}#${groupAnchor(found.sector, found.section, found.group)}`,
            } ] : []),
        ]
        : [];

    // A crumb leads back to a sector, part or group by its hash, and the listing is only rendered once the catalogue
    // is in — on a fresh load, and in the same commit as the URL change when coming back from a table — so the hash
    // is acted on here rather than left to the browser.
    useEffect(() => {
        if (found || !sectors) return;
        const anchor = decodeURIComponent(window.location.hash.slice(1));
        if (anchor) document.getElementById(anchor)?.scrollIntoView({ block : "start" });
    }, [ found, sectors ]);

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

    const heading = error
        ? `Could not load the catalogue from the data API at ${DATA_API_URL}.`
        : subtitle;

    return (
        <Article id={id} className="data-list-page">
            <Header id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        {title}
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        {heading}
                    </Heading6>
                </Div>
            </Header>

            <Div id="sections-wrapper">
                {sectors ? sectors.map(sector => (
                    <Section key={sector.slug} id={sector.slug} marginBottom="nano">
                        {/* LEVEL ONE: the sector, with what it holds ///////////////////////////////////////////// */}
                        <Div className="grid-cell section-header" padding="micro">
                            <Div className="section-title">
                                <HeadingIcon label={sector.label} />

                                <Div>
                                    <Heading6 weight="700">
                                        {sentenceCase(sector.label)}
                                    </Heading6>

                                    <Text size="small" opacity="60">
                                        {describe(sector)}
                                    </Text>
                                </Div>
                            </Div>
                        </Div>

                        <Div className="section-content">
                            {sector.sections.map(section => sectionShown(sector, section) ? (
                                /* LEVEL TWO: a part of the sector, then its groups and tables ///////////////////// */
                                <Section key={section.slug} id={sectionAnchor(sector, section)}>
                                    <Div className="grid-cell section-header" padding="micro">
                                        <Div className="section-title">
                                            <HeadingIcon label={section.label} />

                                            <Heading6 weight="600">
                                                {sentenceCase(section.label)}
                                            </Heading6>
                                        </Div>
                                    </Div>

                                    <Div className="section-content">
                                        <Groups sector={sector} section={section} path={path} />
                                    </Div>
                                </Section>
                            ) : (
                                /* No parts, or one: the sector's groups and tables //////////////////////////////// */
                                <Groups key={section.slug} sector={sector} section={section} path={path} />
                            ))}
                        </Div>
                    </Section>
                )) : (
                    <Div className="grid-cell" padding="micro">
                        {error
                            ? <Text size="small" opacity="60">{error}</Text>
                            : <Loading name={title.toLowerCase()} />}
                    </Div>
                )}

                {sectors && sectors.length === 0 && (
                    <Div className="grid-cell" padding="micro">
                        <Text size="small" opacity="60">The database holds no tables of this menu.</Text>
                    </Div>
                )}
            </Div>
        </Article>
    );
};

export default MenuPage;

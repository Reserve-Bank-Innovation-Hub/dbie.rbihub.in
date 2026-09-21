"use client";

// The tables page: the site's page sidebar to move through DBIE's menus, and the chosen table on the page grid.
// The sidebar has two levels, both made of the sidebar's own link groups. At the top: Publications and Statistics
// as groups of links (the publications, the sectors). Inside one: its sections as group headings and their loaded
// tables as links, with a link back up. Which level shows, and which table, is all in the URL: ?table=<schema>.<table>
// names the table, ?section=<menu>/<sector>[/<section>] a section (its first loaded table is shown), and ?menu=<menu>
// shows the top level while the table stays on show.

// REACT CORE ==========================================================================================================
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

// UI ==================================================================================================================
import { Article, Div, Divider, Heading4, Heading6, Main, Text } from "fictoan-react";
import { BookOpen, ChevronLeft, Layers, Table2 } from "lucide-react";

// LOCAL COMPONENTS ====================================================================================================
import { LinkGroup, LinkItem, PageSidebar } from "@components/PageSidebars/PageSidebar";
import { Loading }                          from "@components/Loading/Loading";
import { TableView }                        from "./TableView";

// LIB =================================================================================================================
import {
    CatalogueEntry,
    EntryRef,
    Menu,
    MenuOrder,
    Section,
    SectionRef,
    buildMenus,
    defaultEntry,
    fetchCatalogue,
    findEntry,
    findSection,
    firstLoaded,
    isLoaded,
    tableKey,
} from "@/lib/api/catalogue";
import { DATA_API_URL } from "@/lib/api/dataApi";

// STYLES ==============================================================================================================
import "./tables-page.css";

interface TablesPageProps {
    curated     : Record<string, string>;   // "report:<id>" or "dsd:<code>" → the site's curated page
    seriesSlugs : Record<string, string>;   // SDMX dataset code → slug of its generic series page (with a chart)
    order       : MenuOrder;                // DBIE's own order of sectors and sections
}

// The page the site already has for an entry, if any: a curated page, else the SDMX series page with its chart.
function pageFor(entry : CatalogueEntry, curated : Record<string, string>, seriesSlugs : Record<string, string>) : { href : string; label : string } | null {
    if (entry.report_id != null && curated[`report:${entry.report_id}`]) return { href : curated[`report:${entry.report_id}`], label : "Curated page" };
    if (entry.dsd_code) {
        if (curated[`dsd:${entry.dsd_code}`]) return { href : curated[`dsd:${entry.dsd_code}`], label : "Curated page" };
        if (seriesSlugs[entry.dsd_code]) return { href : `/tables/${seriesSlugs[entry.dsd_code]}`, label : "Chart page" };
    }
    return null;
}

// A section's tables in the sidebar, grouped as DBIE groups them.
const groupTitle = (section : Section, label : string, sections : number) : string => {
    if (label) return `${section.label} · ${label}`;
    return sections > 1 || !section.implicit ? section.label : "Tables";
};

const TablesPage = ({ curated, seriesSlugs, order } : TablesPageProps) => {
    const searchParams = useSearchParams();

    const [ entries,    setEntries ]    = useState<CatalogueEntry[] | null>(null);
    const [ fetchError, setFetchError ] = useState<string | null>(null);

    // The catalogue comes from the data API in the browser, so the page always shows what the database holds.
    useEffect(() => {
        const controller = new AbortController();
        fetchCatalogue(controller.signal)
            .then(setEntries)
            .catch((err : unknown) => {
                if (!controller.signal.aborted) setFetchError(err instanceof Error ? err.message : String(err));
            });
        return () => controller.abort();
    }, []);

    const menus : Menu[] = useMemo(() => (entries ? buildMenus(entries, order) : []), [ entries, order ]);

    const requestedTable   = searchParams.get("table");
    const requestedSection = searchParams.get("section");
    const atRoot           = searchParams.get("menu") != null;
    const current : SectionRef | null = useMemo(() => {
        const byTable = findEntry(menus, requestedTable);
        if (byTable) return byTable;
        return findSection(menus, requestedSection) ?? defaultEntry(menus);
    }, [ menus, requestedTable, requestedSection ]);
    const entry : CatalogueEntry | null = useMemo(() => {
        if (!current) return null;
        return (current as EntryRef).entry ?? firstLoaded(current.section) ?? current.sector.sections.map(firstLoaded).find(Boolean) ?? null;
    }, [ current ]);
    const currentKey = entry ? tableKey(entry) : null;

    const crumbs = current
        ? [ current.menu.label, current.sector.label, ...(current.section.implicit ? [] : [ current.section.label ]) ]
        : [];
    const sectorIcon = (menu : Menu) => (menu.key === "publication" ? <BookOpen /> : <Layers />);

    return (
        <Article id="tables-page" className="page-with-sidebar">
            {/* SIDEBAR //////////////////////////////////////////////////////////////////////////////////////////// */}
            {current && !atRoot ? (
                <PageSidebar id="tables-sidebar" headerIcon={sectorIcon(current.menu)} headerLabel={current.sector.label}>
                    <LinkGroup>
                        <LinkItem
                            icon={<ChevronLeft />}
                            label={current.menu.label}
                            linkTo={`/tables?menu=${current.menu.key}${currentKey ? `&table=${currentKey}` : ""}`}
                        />
                    </LinkGroup>

                    {current.sector.sections.map(section => section.groups.map(group => {
                        const loaded = group.entries.filter(e => isLoaded(e) && tableKey(e));
                        if (loaded.length === 0) return null;
                        return (
                            <React.Fragment key={`${section.slug}/${group.label}`}>
                                <Divider />
                                <LinkGroup title={groupTitle(section, group.label, current.sector.sections.length)}>
                                    {loaded.map(e => (
                                        <LinkItem
                                            key={e.entry_id}
                                            icon={<Table2 />}
                                            label={e.title}
                                            linkTo={`/tables?table=${tableKey(e)}`}
                                            isActive={tableKey(e) === currentKey}
                                        />
                                    ))}
                                </LinkGroup>
                            </React.Fragment>
                        );
                    }))}
                </PageSidebar>
            ) : (
                <PageSidebar id="tables-sidebar" headerIcon={<Table2 />} headerLabel="Tables">
                    {menus.map((menu, i) => (
                        <React.Fragment key={menu.key}>
                            {i > 0 && <Divider />}
                            <LinkGroup title={menu.label}>
                                {menu.sectors.map(sector => (
                                    <LinkItem
                                        key={sector.slug}
                                        icon={sectorIcon(menu)}
                                        label={sector.label}
                                        linkTo={`/tables?section=${menu.key}/${sector.slug}`}
                                        isActive={current?.sector === sector}
                                    />
                                ))}
                            </LinkGroup>
                        </React.Fragment>
                    ))}
                </PageSidebar>
            )}

            {/* THE TABLE ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Main>
                <Div className="page-grid">
                    {entry && current ? (
                        <TableView
                            key={currentKey ?? entry.entry_id}
                            entry={entry}
                            section={current.section}
                            crumbs={crumbs}
                            pageLink={pageFor(entry, curated, seriesSlugs)}
                        />
                    ) : (
                        <>
                            <Div id="title-card" className="grid-cell" padding="micro">
                                <Div>
                                    <Heading4 weight="700" marginBottom="nano">Tables</Heading4>
                                    <Heading6 weight="400" opacity="60">
                                        {fetchError ? `Could not load the catalogue from the data API at ${DATA_API_URL}.` : "Every table DBIE publishes, straight from the database."}
                                    </Heading6>
                                </Div>
                                {fetchError && <Text size="small" opacity="60">{fetchError}</Text>}
                            </Div>
                            <Div id="meta-card" className="grid-cell" padding="micro" />
                            <Div className="table-cell grid-cell" padding="micro">
                                {!fetchError && <Loading name="the DBIE catalogue" />}
                            </Div>
                        </>
                    )}
                </Div>
            </Main>
        </Article>
    );
};

export default TablesPage;

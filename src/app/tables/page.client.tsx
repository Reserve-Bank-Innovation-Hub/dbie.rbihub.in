"use client";

// The tables page: the site's page sidebar to move through DBIE's menus, and the chosen table on the right. The
// sidebar has two levels. At the top: Publications and Statistics, each a group of links (the publications, the
// sectors). Inside one: its sections as group headings and their tables as links, with a way back up.

// REACT CORE ==========================================================================================================
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// UI ==================================================================================================================
import { Article, Div, Divider, Main, Text } from "fictoan-react";
import { BookOpen, ChevronLeft, FileX2, Layers, Table2 } from "lucide-react";

// LOCAL COMPONENTS ====================================================================================================
import { LinkGroup, PageSidebar } from "@components/PageSidebars/PageSidebar";
import { Loading }                from "@components/Loading/Loading";
import { TableView }              from "./TableView";

// LIB =================================================================================================================
import {
    CatalogueEntry,
    EntryRef,
    Menu,
    MenuOrder,
    Section,
    SectionRef,
    STATE_LABELS,
    buildMenus,
    defaultEntry,
    entryState,
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
const groupTitle = (section : Section, label : string) : string => (label ? `${section.label} · ${label}` : section.label);

const TablesPage = ({ curated, seriesSlugs, order } : TablesPageProps) => {
    const router       = useRouter();
    const pathname     = usePathname();
    const searchParams = useSearchParams();

    const [ entries,    setEntries ]    = useState<CatalogueEntry[] | null>(null);
    const [ fetchError, setFetchError ] = useState<string | null>(null);
    const [ showRoot,   setShowRoot ]   = useState(false);   // the sidebar's top level, on request

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

    // ?table=<schema>.<table> names the table on show; ?section=<menu>/<sector>/<section> a section, whose first
    // loaded table is shown; nothing opens the default table.
    const requestedTable   = searchParams.get("table");
    const requestedSection = searchParams.get("section");
    const current : SectionRef | null = useMemo(() => {
        const byTable = findEntry(menus, requestedTable);
        if (byTable) return byTable;
        return findSection(menus, requestedSection) ?? defaultEntry(menus);
    }, [ menus, requestedTable, requestedSection ]);
    const entry : CatalogueEntry | null = useMemo(() => {
        if (!current) return null;
        return (current as EntryRef).entry ?? firstLoaded(current.section);
    }, [ current ]);
    const currentKey = entry ? tableKey(entry) : null;

    // A new place in the menus closes the top level.
    useEffect(() => { setShowRoot(false); }, [ currentKey, current?.section.key ]);

    const goSection = (key : string) => router.replace(`${pathname}?section=${key}`, { scroll : false });
    const goTable   = (key : string) => router.replace(`${pathname}?table=${key}`, { scroll : false });

    const crumbs = current
        ? [ current.menu.label, current.sector.label, ...(current.section.implicit ? [] : [ current.section.label ]) ]
        : [];

    return (
        <Article id="tables-page" className="page-with-sidebar">
            {/* SIDEBAR //////////////////////////////////////////////////////////////////////////////////////////// */}
            <PageSidebar id="tables-sidebar" headerIcon={<Table2 />} headerLabel="Tables">
                {!entries && (
                    <Div className="sidebar-note">
                        <Text size="small" opacity="60">{fetchError ? "Menus unavailable" : "Loading DBIE's menus…"}</Text>
                    </Div>
                )}

                {/* TOP LEVEL: the publications, then the sectors ------------------------------------------------ */}
                {entries && (showRoot || !current) && menus.map((menu, i) => (
                    <React.Fragment key={menu.key}>
                        {i > 0 && <Divider />}
                        <LinkGroup title={menu.label}>
                            {menu.sectors.map(sector => {
                                const isHere = current?.sector === sector;
                                return (
                                    <button
                                        key={sector.slug}
                                        type="button"
                                        className={`link-item ${isHere ? "active" : ""}`}
                                        onClick={() => goSection(`${menu.key}/${sector.slug}`)}
                                    >
                                        {menu.key === "publication" ? <BookOpen /> : <Layers />}
                                        <Text>{sector.label}</Text>
                                    </button>
                                );
                            })}
                        </LinkGroup>
                    </React.Fragment>
                ))}

                {/* INSIDE A PUBLICATION OR SECTOR: its sections, their tables -------------------------------------- */}
                {entries && current && !showRoot && (
                    <>
                        <button type="button" className="sidebar-back" onClick={() => setShowRoot(true)}>
                            <ChevronLeft size={16} />
                            <span>{current.menu.label}</span>
                        </button>
                        <Text className="sidebar-current" weight="700">{current.sector.label}</Text>

                        {current.sector.sections.map((section, s) => section.groups.map((group, g) => (
                            <React.Fragment key={`${section.slug}/${group.label || "(root)"}`}>
                                {(s > 0 || g > 0) && <Divider />}
                                <LinkGroup title={current.sector.sections.length > 1 || group.label ? groupTitle(section, group.label) : "Tables"}>
                                    {group.entries.map(e => {
                                        const key = tableKey(e);
                                        if (!isLoaded(e) || !key) {
                                            return (
                                                <span
                                                    key={e.entry_id}
                                                    className="link-item is-unavailable"
                                                    title={`${STATE_LABELS[entryState(e)]}${e.notes ? ` · ${e.notes}` : ""}`}
                                                >
                                                    <FileX2 />
                                                    <Text>{e.title}</Text>
                                                </span>
                                            );
                                        }
                                        return (
                                            <Link
                                                key={e.entry_id}
                                                href={`${pathname}?table=${key}`}
                                                scroll={false}
                                                className={`link-item ${key === currentKey ? "active" : ""}`}
                                                aria-current={key === currentKey ? "page" : undefined}
                                            >
                                                <Table2 />
                                                <Text>{e.title}</Text>
                                            </Link>
                                        );
                                    })}
                                </LinkGroup>
                            </React.Fragment>
                        )))}
                    </>
                )}
            </PageSidebar>

            {/* THE TABLE ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Main>
                {current && (
                    <Div className="mobile-nav">
                        <label>
                            <span>Publication or sector</span>
                            <select value={`${current.menu.key}/${current.sector.slug}`} onChange={e => goSection(e.target.value)} aria-label="Publication or sector">
                                {menus.map(menu => (
                                    <optgroup key={menu.key} label={menu.label}>
                                        {menu.sectors.map(sector => (
                                            <option key={sector.slug} value={`${menu.key}/${sector.slug}`}>{sector.label}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </label>
                        <label>
                            <span>Table</span>
                            <select value={currentKey ?? ""} onChange={e => goTable(e.target.value)} aria-label="Table">
                                {!currentKey && <option value="">—</option>}
                                {current.sector.sections.map(section => (
                                    <optgroup key={section.slug} label={section.label}>
                                        {section.entries.filter(isLoaded).map(e => (
                                            <option key={e.entry_id} value={tableKey(e)!}>{e.title}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </label>
                    </Div>
                )}

                {fetchError && (
                    <Div className="view-note">
                        <Text>Could not load the catalogue from the data API at {DATA_API_URL}.</Text>
                        <Text size="small" opacity="60">{fetchError}</Text>
                    </Div>
                )}

                {!entries && !fetchError && <Loading name="the DBIE catalogue" />}

                {entry && current && (
                    <TableView
                        key={currentKey ?? entry.entry_id}
                        entry={entry}
                        crumbs={crumbs}
                        pageLink={pageFor(entry, curated, seriesSlugs)}
                    />
                )}

                {current && !entry && (
                    <>
                        <header className="page-head">
                            <div className="page-head-text">
                                <h2 className="page-title">{current.section.label}</h2>
                                <p className="page-sub">{crumbs.join(" › ")} · none of this section&apos;s {current.section.count} tables is in the database yet</p>
                            </div>
                        </header>
                        <ul className="section-list">
                            {current.section.entries.map(e => (
                                <li key={e.entry_id} title={e.notes ?? undefined}>
                                    <span>{e.title}</span>
                                    <span className={`status status-${entryState(e)}`}>{STATE_LABELS[entryState(e)]}</span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </Main>
        </Article>
    );
};

export default TablesPage;

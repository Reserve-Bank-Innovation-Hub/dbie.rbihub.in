"use client";

// The tables page: the site's page sidebar listing every loaded table under its DBIE menu, Publications then
// Statistics, in DBIE's own order, and the chosen table on the page grid. ?table=<schema>.<table> names the table;
// with nothing asked for, the page opens on the Monthly RBI Bulletin's Select Economic Indicators.

// REACT CORE ==========================================================================================================
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

// UI ==================================================================================================================
import { Article, Div, Divider, Heading4, Heading6, Main, Text } from "fictoan-react";
import { Table2 } from "lucide-react";

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
    buildMenus,
    defaultEntry,
    fetchCatalogue,
    findEntry,
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

// Every loaded table of a menu, in DBIE's order: sector by sector, section by section, a section's Data Query
// datasets after its report tables.
const tablesOf = (menu : Menu) : CatalogueEntry[] =>
    menu.sectors.flatMap(sector => sector.sections.flatMap(section => section.groups.flatMap(group =>
        group.entries.filter(e => isLoaded(e) && tableKey(e)))));

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

    const menus = useMemo(() => (entries ? buildMenus(entries, order) : []), [ entries, order ]);
    const lists = useMemo(() => menus.map(menu => ({ menu, tables : tablesOf(menu) })), [ menus ]);

    const requestedTable = searchParams.get("table");
    const current : EntryRef | null = useMemo(() => findEntry(menus, requestedTable) ?? defaultEntry(menus), [ menus, requestedTable ]);
    const entry      = current?.entry ?? null;
    const currentKey = entry ? tableKey(entry) : null;

    // The sidebar lists a thousand tables; the one on show is brought into view: centred the first time, by the
    // least movement after that, and once more when the site's font is in, since the list reflows on it.
    const centred = useRef(false);
    useEffect(() => {
        const show = () => {
            const active = document.querySelector("#tables-sidebar .link-item.active");
            if (!active) return;
            active.scrollIntoView({ block : centred.current ? "nearest" : "center" });
            centred.current = true;
        };
        show();
        document.fonts?.ready.then(show);
    }, [ currentKey ]);

    const crumbs = current
        ? [ current.menu.label, current.sector.label, ...(current.section.implicit ? [] : [ current.section.label ]) ]
        : [];

    return (
        <Article id="tables-page" className="page-with-sidebar">
            {/* SIDEBAR: every table under its menu //////////////////////////////////////////////////////////////// */}
            <PageSidebar id="tables-sidebar" headerIcon={<Table2 />} headerLabel="Tables">
                {lists.map(({ menu, tables }, i) => (
                    <React.Fragment key={menu.key}>
                        {i > 0 && <Divider />}
                        <LinkGroup title={menu.label}>
                            {tables.map(e => {
                                const key = tableKey(e)!;
                                return (
                                    <LinkItem
                                        key={e.entry_id}
                                        icon={<Table2 />}
                                        label={e.title}
                                        linkTo={`/tables?table=${key}`}
                                        isActive={key === currentKey}
                                    />
                                );
                            })}
                        </LinkGroup>
                    </React.Fragment>
                ))}
            </PageSidebar>

            {/* THE TABLE ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Main>
                <Div className="page-grid">
                    {entry && current ? (
                        <TableView
                            key={currentKey ?? entry.entry_id}
                            entry={entry}
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

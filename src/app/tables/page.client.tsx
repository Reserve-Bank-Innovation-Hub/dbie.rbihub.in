"use client";

// REACT CORE ==========================================================================================================
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// UI ==================================================================================================================
import { Article, Div, Heading4, Heading6, Text } from "fictoan-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// LOCAL COMPONENTS ====================================================================================================
import { TablesMenubar } from "@components/TablesMenubar/TablesMenubar";
import { DataUnit }      from "@components/DataUnit/DataUnit";
import { Loading }       from "@components/Loading/Loading";
import { TableView }     from "./TableView";

// LIB =================================================================================================================
import {
    CatalogueEntry,
    EntryRef,
    Menu,
    MenuOrder,
    SectionRef,
    STATE_LABELS,
    buildMenus,
    defaultSection,
    entryState,
    fetchCatalogue,
    findEntry,
    findSection,
    firstLoaded,
    isLoaded,
    periodRange,
    tableKey,
} from "@/lib/api/catalogue";
import { DATA_API_URL, tableCsvUrl, tableRowsUrl } from "@/lib/api/dataApi";

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

const TablesPage = ({ curated, seriesSlugs, order } : TablesPageProps) => {
    const router       = useRouter();
    const pathname     = usePathname();
    const searchParams = useSearchParams();

    const [ entries,    setEntries ]    = useState<CatalogueEntry[] | null>(null);
    const [ fetchError, setFetchError ] = useState<string | null>(null);
    const [ total,      setTotal ]      = useState<number | null>(null);    // rows in the view, once the API has counted
    const [ period,     setPeriod ]     = useState<string | null>(null);    // the table's period, from its provenance

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
    // loaded table is shown; nothing names the first loaded table in DBIE's order.
    const requestedTable   = searchParams.get("table");
    const requestedSection = searchParams.get("section");
    const current : SectionRef | null = useMemo(() => {
        const byTable = findEntry(menus, requestedTable);
        if (byTable) return byTable;
        return findSection(menus, requestedSection) ?? defaultSection(menus);
    }, [ menus, requestedTable, requestedSection ]);
    const entry : CatalogueEntry | null = useMemo(() => {
        if (!current) return null;
        return (current as EntryRef).entry ?? firstLoaded(current.section);
    }, [ current ]);
    const currentKey = entry ? tableKey(entry) : null;

    const goTable   = useCallback((e : CatalogueEntry) => {
        const key = tableKey(e);
        if (key) router.replace(`${pathname}?table=${key}`, { scroll : false });
    }, [ router, pathname ]);
    const goSection = useCallback((key : string) => router.replace(`${pathname}?section=${key}`, { scroll : false }), [ router, pathname ]);

    // Previous and next loaded tables within the section.
    const loadedInSection = useMemo(() => (current ? current.section.entries.filter(isLoaded) : []), [ current ]);
    const position = entry ? loadedInSection.findIndex(e => e.entry_id === entry.entry_id) : -1;
    const previous = position > 0 ? loadedInSection[position - 1] : null;
    const next     = position >= 0 && position < loadedInSection.length - 1 ? loadedInSection[position + 1] : null;

    const page = entry ? pageFor(entry, curated, seriesSlugs) : null;
    const identity = entry
        ? (entry.dsd_code ? `SDMX dataset ${entry.dsd_code}` : `DBIE report ${entry.report_id}`)
        : "";

    return (
        <Article id="tables-page" className="page-grid">
            {/* HEADER: the table on show //////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    {current && (
                        <Div className="section-crumbs">
                            <span className="crumb crumb-menu">{current.menu.label}</span>
                            <span className="crumb-sep">›</span>
                            <span className="crumb">{current.sector.label}</span>
                            {!current.section.implicit && (
                                <>
                                    <span className="crumb-sep">›</span>
                                    <span className="crumb">{current.section.label}</span>
                                </>
                            )}
                        </Div>
                    )}

                    <Heading4 weight="700" marginBottom="nano">
                        {entry ? entry.title : current ? current.section.label : "Tables"}
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        {!entries && !fetchError && "Loading DBIE's menus…"}
                        {entry && identity}
                        {entry && entry.notes && ` · ${entry.notes}`}
                        {!entry && current && `None of this section's ${current.section.count} tables is in the database yet.`}
                    </Heading6>
                </Div>
            </Div>

            {/* META CARD ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit label="Source" value="Reserve Bank of India (DBIE)" />
                <DataUnit label="Frequency" value={entry?.frequency ?? "—"} />
                <DataUnit label="Period" value={period || (entry ? periodRange(entry) : "") || "—"} />
                <DataUnit label="Rows" value={total != null ? total.toLocaleString("en-IN") : (entry?.row_count?.toLocaleString("en-IN") ?? "—")} />
                {entry && currentKey && (
                    <Div className="table-links">
                        <a href={tableCsvUrl(entry.schema_name!, entry.table_name!)}>CSV</a>
                        <a href={tableRowsUrl(entry.schema_name!, entry.table_name!)} target="_blank" rel="noreferrer">JSON</a>
                        {page && <Link href={page.href}>{page.label}</Link>}
                        <span className="table-id">{currentKey}</span>
                    </Div>
                )}
            </Div>

            {/* MENUBAR //////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="controls-cell grid-cell">
                {entries ? (
                    <TablesMenubar
                        menus={menus}
                        current={current}
                        currentTable={currentKey}
                        onSelectTable={goTable}
                        onSelectSection={goSection}
                    />
                ) : (
                    <Div className="menubar-placeholder">
                        <Text size="small" opacity="60">{fetchError ? "Menus unavailable" : "Loading DBIE's menus…"}</Text>
                    </Div>
                )}
            </Div>

            {/* THE TABLE ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                {fetchError && (
                    <Div className="view-note">
                        <Text>Could not load the catalogue from the data API at {DATA_API_URL}.</Text>
                        <Text size="small" opacity="60">{fetchError}</Text>
                    </Div>
                )}

                {!entries && !fetchError && <Loading name="the DBIE catalogue" />}

                {current && (
                    <Div className="section-strip">
                        <button type="button" className="strip-step" disabled={!previous} onClick={() => previous && goTable(previous)} aria-label="Previous table in this section">
                            <ChevronLeft size={16} />
                        </button>

                        <label className="strip-select">
                            <span>Table</span>
                            <select
                                value={entry ? String(entry.entry_id) : ""}
                                onChange={e => {
                                    const chosen = current.section.entries.find(x => String(x.entry_id) === e.target.value);
                                    if (chosen) goTable(chosen);
                                }}
                            >
                                {!entry && <option value="">—</option>}
                                {current.section.groups.map(group => {
                                    const options = group.entries.map(e => (
                                        <option key={e.entry_id} value={String(e.entry_id)} disabled={!isLoaded(e)}>
                                            {e.title}{isLoaded(e) ? "" : ` (${STATE_LABELS[entryState(e)].toLowerCase()})`}
                                        </option>
                                    ));
                                    return group.label
                                        ? <optgroup key={group.label} label={group.label}>{options}</optgroup>
                                        : <React.Fragment key="(root)">{options}</React.Fragment>;
                                })}
                            </select>
                        </label>

                        <button type="button" className="strip-step" disabled={!next} onClick={() => next && goTable(next)} aria-label="Next table in this section">
                            <ChevronRight size={16} />
                        </button>

                        <span className="strip-count">
                            {position >= 0 ? `${position + 1} of ${loadedInSection.length} loaded` : `${loadedInSection.length} loaded`}
                            {" · "}
                            {current.section.count} in DBIE
                        </span>
                    </Div>
                )}

                {entry && <TableView key={currentKey ?? entry.entry_id} entry={entry} onTotal={setTotal} onPeriod={setPeriod} />}

                {current && !entry && (
                    <ul className="section-list">
                        {current.section.entries.map(e => (
                            <li key={e.entry_id} title={e.notes ?? undefined}>
                                <span>{e.title}</span>
                                <span className={`status status-${entryState(e)}`}>{STATE_LABELS[entryState(e)]}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </Div>
        </Article>
    );
};

export default TablesPage;

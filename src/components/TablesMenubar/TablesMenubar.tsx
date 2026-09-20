"use client";

// The menubar of the tables page: DBIE's menus (Statistics, with the Data Query datasets folded into its
// sections, and Publication) as a horizontal bar, each opening a panel of its sectors, the highlighted sector's
// sections, and the highlighted section's tables in their groups, the way DBIE's own trees are laid out.
// Choosing a table (or a section) closes the panel and tells the page.

// REACT CORE ==========================================================================================================
import React, { useEffect, useRef, useState } from "react";

// UI ==================================================================================================================
import { ChevronDown, ChevronRight } from "lucide-react";

// LIB =================================================================================================================
import { CatalogueEntry, Menu, SectionRef, STATE_LABELS, entryState, isLoaded, tableKey } from "@/lib/api/catalogue";

// STYLES ==============================================================================================================
import "./tables-menubar.css";

interface TablesMenubarProps {
    menus         : Menu[];
    current       : SectionRef | null;
    currentTable  : string | null;                  // "<schema>.<table>" of the table on show
    onSelectTable : (entry : CatalogueEntry) => void;
    onSelectSection : (key : string) => void;
}

export const TablesMenubar = ({ menus, current, currentTable, onSelectTable, onSelectSection } : TablesMenubarProps) => {
    const [ openKey,     setOpenKey ]     = useState<string | null>(null);
    const [ sectorSlug,  setSectorSlug ]  = useState<string | null>(null);
    const [ sectionSlug, setSectionSlug ] = useState<string | null>(null);
    const ref = useRef<HTMLElement>(null);

    const openMenu    = menus.find(m => m.key === openKey) ?? null;
    const openSector  = openMenu?.sectors.find(s => s.slug === sectorSlug) ?? openMenu?.sectors[0] ?? null;
    const openSection = openSector?.sections.find(s => s.slug === sectionSlug) ?? openSector?.sections[0] ?? null;

    const open = (menu : Menu) => {
        setOpenKey(menu.key);
        // Land where the page is when it is inside this menu.
        const here = current?.menu.key === menu.key ? current : null;
        setSectorSlug(here?.sector.slug ?? menu.sectors[0]?.slug ?? null);
        setSectionSlug(here?.section.slug ?? null);
    };
    const close  = () => setOpenKey(null);
    const toggle = (menu : Menu) => (openKey === menu.key ? close() : open(menu));

    const highlightSector = (slug : string) => {
        if (slug !== sectorSlug) setSectionSlug(null);
        setSectorSlug(slug);
    };
    const pickSection = (key : string) => { onSelectSection(key); close(); };
    const pickTable   = (entry : CatalogueEntry) => { onSelectTable(entry); close(); };

    // Escape or a click anywhere else closes the panel.
    useEffect(() => {
        if (!openKey) return;
        const onKey   = (e : KeyboardEvent) => { if (e.key === "Escape") close(); };
        const onClick = (e : MouseEvent)    => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onClick);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onClick);
        };
    }, [ openKey ]);

    return (
        <nav className="tables-menubar" ref={ref} aria-label="DBIE menus">
            {/* THE BAR ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="menubar-items" role="menubar">
                {menus.map(menu => {
                    const isOpen    = openKey === menu.key;
                    const isCurrent = current?.menu.key === menu.key;
                    return (
                        <button
                            key={menu.key}
                            type="button"
                            role="menuitem"
                            className={`menubar-item ${isOpen ? "is-open" : ""} ${isCurrent ? "is-current" : ""}`}
                            aria-haspopup="true"
                            aria-expanded={isOpen}
                            onClick={() => toggle(menu)}
                        >
                            <span className="item-label">{menu.label}</span>
                            <span className="item-count">{menu.loaded.toLocaleString("en-IN")}</span>
                            <ChevronDown className="item-chevron" size={14} />
                        </button>
                    );
                })}
            </div>

            {/* THE PANEL: sectors | the sector's sections | the section's tables ///////////////////////////////// */}
            {openMenu && (
                <div className="menubar-panel" role="menu" aria-label={openMenu.label}>
                    <ul className="panel-column panel-sectors">
                        {openMenu.sectors.map(sector => {
                            const isHighlighted = sector.slug === openSector?.slug;
                            const isCurrent     = current?.menu.key === openMenu.key && current.sector.slug === sector.slug;
                            return (
                                <li key={sector.slug}>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className={`panel-entry ${isHighlighted ? "is-highlighted" : ""} ${isCurrent ? "is-current" : ""}`}
                                        aria-haspopup="true"
                                        aria-expanded={isHighlighted}
                                        onMouseEnter={() => highlightSector(sector.slug)}
                                        onFocus={() => highlightSector(sector.slug)}
                                        onClick={() => highlightSector(sector.slug)}
                                    >
                                        <span className="entry-label">{sector.label}</span>
                                        <span className="entry-count">{sector.loaded}</span>
                                        <ChevronRight className="entry-chevron" size={14} />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    {openSector && (
                        <ul className="panel-column panel-sections" aria-label={openSector.label}>
                            {openSector.sections.map(section => {
                                const isHighlighted = section.slug === openSection?.slug;
                                const isCurrent     = current?.section.key === section.key;
                                return (
                                    <li key={section.slug}>
                                        <button
                                            type="button"
                                            role="menuitem"
                                            className={`panel-entry ${isHighlighted ? "is-highlighted" : ""} ${isCurrent ? "is-current" : ""}`}
                                            aria-haspopup="true"
                                            aria-expanded={isHighlighted}
                                            onMouseEnter={() => setSectionSlug(section.slug)}
                                            onFocus={() => setSectionSlug(section.slug)}
                                            onClick={() => pickSection(section.key)}
                                        >
                                            <span className="entry-label">{section.implicit ? "All tables" : section.label}</span>
                                            <span className="entry-count">{section.loaded}/{section.count}</span>
                                            <ChevronRight className="entry-chevron" size={14} />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {openSection && (
                        <ul className="panel-column panel-tables" aria-label={openSection.label}>
                            {openSection.groups.map(group => (
                                <React.Fragment key={group.label || "(root)"}>
                                    {group.label && <li className="panel-group">{group.label}</li>}

                                    {group.entries.map(entry => {
                                        const key = tableKey(entry);
                                        if (!isLoaded(entry) || !key) {
                                            return (
                                                <li key={entry.entry_id} className="panel-entry is-unavailable" title={entry.notes ?? undefined}>
                                                    <span className="entry-label">{entry.title}</span>
                                                    <span className="entry-state">{STATE_LABELS[entryState(entry)]}</span>
                                                </li>
                                            );
                                        }
                                        return (
                                            <li key={entry.entry_id}>
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    className={`panel-entry ${key === currentTable ? "is-current" : ""}`}
                                                    onClick={() => pickTable(entry)}
                                                >
                                                    <span className="entry-label">{entry.title}</span>
                                                    <span className="entry-count">{entry.row_count?.toLocaleString("en-IN") ?? ""}</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </nav>
    );
};

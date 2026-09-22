"use client";

// The sectors a page lists, from the data API's catalogue in the browser, so the pages show what the database
// holds: only loaded tables, as on the tables page.
//
// A menu's sectors are DBIE's own (the time-series publications of the Publication menu, the eight sectors of the
// Statistics menu), their sections and groups the levels DBIE files a table under (src/lib/api/catalogue.ts
// rebuilds them from each entry's menu path). A theme — Banking, Prices and the rest — has no menu of its own: it
// is the set of tables the site's curated pages under its route cover (src/app/tables/curated-pages.json), so it
// is gathered into one synthetic sector, its sections being DBIE's own sections restricted to those tables.

// REACT CORE ==========================================================================================================
import { useEffect, useMemo, useState } from "react";

// LIB =================================================================================================================
import {
    CatalogueEntry,
    MenuOrder,
    Section,
    Sector,
    buildMenus,
    curatedKeys,
    fetchCatalogue,
    isLoaded,
    tableKey,
} from "./catalogue";

// A table the site holds and the page can open.
const held = (e : CatalogueEntry) : boolean => isLoaded(e) && tableKey(e) !== null;

// The sectors of one menu with their loaded tables only; a group, section or sector left empty is dropped. The order
// is DBIE's own where the menu tree gives one (src/lib/dbie-menu.ts reads it at build time).
export function menuSectors(entries : CatalogueEntry[], key : string, order : MenuOrder = {}) : Sector[] {
    const menu = buildMenus(entries, order).find(m => m.key === key);
    return (menu?.sectors ?? [])
        .map(sector => {
            const sections = sector.sections
                .map(section => withGroups(section, section.groups.map(group => ({ ...group, entries : group.entries.filter(held) }))))
                .filter(section => section.count > 0);
            const count = sections.reduce((n, s) => n + s.count, 0);
            return { ...sector, sections, count, loaded : count };
        })
        .filter(sector => sector.count > 0);
}

// A section with its groups replaced, the empty ones dropped.
function withGroups(section : Section, groups : Section["groups"]) : Section {
    const kept = groups.filter(group => group.entries.length > 0);
    const flat = kept.flatMap(g => g.entries);
    return { ...section, groups : kept, entries : flat, count : flat.length, loaded : flat.length };
}

// The keys of the tables a theme covers: the curated pages filed under its route.
export const themeKeys = (curated : Record<string, string>, path : string) : string[] =>
    Object.entries(curated).filter(([ , route ]) => route.startsWith(`${path}/`)).map(([ key ]) => key);

// Slugs unique among the sections gathered here: sections of different sectors can share one.
function uniqueSlug(slug : string, taken : Set<string>) : string {
    let unique = slug;
    for (let n = 2; taken.has(unique); n++) unique = `${slug}-${n}`;
    taken.add(unique);
    return unique;
}

// A theme as one sector: DBIE's sections, from whichever menus the theme's tables come, holding only those tables.
// A section counts as implicit — standing in for its sector, so the page prints no heading for it — only when every
// table of the theme is unsectioned; otherwise the sector's name is the section's heading, as DBIE's menu has it.
export function themeSector(
    entries : CatalogueEntry[],
    keys    : string[],
    label   : string,
    slug    : string,
    order   : MenuOrder = {},
) : Sector {
    const wanted = new Set(keys);
    const taken  = new Set<string>();
    const mine   = (e : CatalogueEntry) : boolean => held(e) && curatedKeys(e).some(k => wanted.has(k));

    const sections : Section[] = [];
    for (const menu of buildMenus(entries, order)) {
        for (const sector of menu.sectors) {
            for (const section of sector.sections) {
                const kept = withGroups(section, section.groups.map(group => ({ ...group, entries : group.entries.filter(mine) })));
                if (kept.count > 0) sections.push({ ...kept, slug : uniqueSlug(kept.slug, taken) });
            }
        }
    }

    const implicit = sections.every(s => s.implicit);
    const count    = sections.reduce((n, s) => n + s.count, 0);
    return { slug, label, sections : sections.map(s => ({ ...s, implicit })), count, loaded : count };
}

export interface Catalogue {
    entries : CatalogueEntry[] | null;   // null until the catalogue is in
    error   : string | null;
}

export function useCatalogue() : Catalogue {
    const [ entries, setEntries ] = useState<CatalogueEntry[] | null>(null);
    const [ error,   setError ]   = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchCatalogue(controller.signal)
            .then(fetched => {
                if (!controller.signal.aborted) setEntries(fetched);
            })
            .catch((err : unknown) => {
                if (!controller.signal.aborted) setError(err instanceof Error ? err.message : String(err));
            });
        return () => controller.abort();
    }, []);

    return { entries, error };
}

export interface MenuSectors {
    sectors : Sector[] | null;   // null until the catalogue is in
    error   : string | null;
}

export function useMenu(key : string, order : MenuOrder = {}) : MenuSectors {
    const { entries, error } = useCatalogue();
    const sectors = useMemo(() => (entries ? menuSectors(entries, key, order) : null), [ entries, key, order ]);
    return { sectors, error };
}

export interface ThemeSector {
    sector : Sector | null;   // null until the catalogue is in, or when the theme covers no loaded table
    error  : string | null;
}

export function useTheme(keys : string[], label : string, slug : string, order : MenuOrder = {}) : ThemeSector {
    const { entries, error } = useCatalogue();
    const sector = useMemo(() => {
        if (!entries) return null;
        const built = themeSector(entries, keys, label, slug, order);
        return built.count > 0 ? built : null;
    }, [ entries, keys, label, slug, order ]);
    return { sector, error };
}

// What a sector holds, for its title card and the list of sectors: "56 tables in 9 sections", "15 tables".
export function describe(sector : Sector) : string {
    const tables   = `${sector.count} ${sector.count === 1 ? "table" : "tables"}`;
    const sections = sector.sections.filter(s => !s.implicit).length;
    return sections > 0 ? `${tables} in ${sections} ${sections === 1 ? "section" : "sections"}` : tables;
}

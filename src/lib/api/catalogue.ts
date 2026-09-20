// DBIE's menus as the database records them: meta.catalogue through GET /api/catalogue (docs/data-api.md). Every
// entry carries its DBIE menu path ("Statistics > Real Sector > Agriculture > Agriculture"), so DBIE's menus and
// their sectors and sections are rebuilt here from the paths. They are ordered the way DBIE's own menu tree orders
// them (data/dbie-menu.json, captured from the portal), and within a section the way DBIE lists the entries
// (entry_id follows that order). Nothing is renamed: labels are DBIE's.

// OTHER ===============================================================================================================
import { apiUrl } from "./dataApi";

// =====================================================================================================================
// The API's shape
// =====================================================================================================================
export type CatalogueSource = "statistics" | "sdmx" | "publications";

export interface CatalogueEntry {
    entry_id    : number;
    source      : CatalogueSource;
    menu_path   : string;
    title       : string;
    report_id   : number | null;
    dsd_code    : string | null;
    frequency   : string | null;
    period_from : string | null;
    period_to   : string | null;
    kind        : string;             // table, dataset, documentation, archive file
    schema_name : string | null;
    table_name  : string | null;
    status      : string;             // loaded, not exported, not exported: archive file (pdf or excel), exported empty
    row_count   : number | null;
    notes       : string | null;
}

interface CataloguePage {
    data   : CatalogueEntry[];
    total  : number;
    limit  : number;
    offset : number;
}

const PAGE = 2000;   // the API's maximum

// Every catalogue entry, paging if the catalogue ever outgrows one page.
export async function fetchCatalogue(signal ? : AbortSignal) : Promise<CatalogueEntry[]> {
    const entries : CatalogueEntry[] = [];
    for (let offset = 0; ; offset += PAGE) {
        const res = await fetch(apiUrl(`/api/catalogue?limit=${PAGE}&offset=${offset}`), { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status} from the data API`);
        const page : CataloguePage = await res.json();
        entries.push(...page.data);
        if (entries.length >= page.total || page.data.length === 0) break;
    }
    return entries;
}

// =====================================================================================================================
// DBIE's hierarchy: menu → sector → section (→ groups of entries)
// =====================================================================================================================
export interface EntryGroup {
    label   : string;                 // the rest of the DBIE path below the section; "" when there is none
    entries : CatalogueEntry[];
}

export interface Section {
    key      : string;                // the ?section= value: <menu>/<sector>[/<section>]
    slug     : string;
    label    : string;
    implicit : boolean;               // the sector has no sections of its own; this one stands in for it
    groups   : EntryGroup[];
    entries  : CatalogueEntry[];
    count    : number;
    loaded   : number;
}

export interface Sector {
    slug     : string;
    label    : string;
    sections : Section[];
    count    : number;
    loaded   : number;
}

export interface Menu {
    key     : string;                 // statistics, publication
    label   : string;                 // DBIE's name for the menu
    sources : CatalogueSource[];
    sectors : Sector[];
    count   : number;
    loaded  : number;
}

export interface SectionRef {
    menu    : Menu;
    sector  : Sector;
    section : Section;
}

// DBIE's Statistics and Publication menus, in the order DBIE's own top menu has them. DBIE's third menu, SDMX Data
// Query, is folded into Statistics: each dataset sits in the sector and sub-section of the same name, in a "Data
// Query" group after the section's report tables. DATA_QUERY_HOME holds the few names that differ.
const MENUS : { key : string; label : string; sources : CatalogueSource[]; hint : string }[] = [
    { key : "statistics",  label : "Statistics",  sources : [ "statistics", "sdmx" ], hint : "Report tables and Data Query datasets by sector, as DBIE's Statistics menu lists them" },
    { key : "publication", label : "Publication", sources : [ "publications" ],      hint : "DBIE's time-series publications, table by table" },
];

export const DATA_QUERY_GROUP = "Data Query";

// Data Query sub-sectors whose names differ from the Statistics subsection they belong to (DBIE's spelling on both
// sides), and the one dataset DBIE files under a sector with no sub-sector.
const DATA_QUERY_HOME : Record<string, [ sector : string, section : string ]> = {
    "Financial Markets > Equity and Corporate Debt Market"   : [ "Financial Market", "Equity and Corporate Debt Market" ],
    "Financial Markets > Forex Market"                       : [ "Financial Market", "Forex Market" ],
    "Financial Markets > Government Securities Market"       : [ "Financial Market", "Government Securities Market" ],
    "Financial Markets > Money Market"                       : [ "Financial Market", "Money Market" ],
    "Public Finance > Cental & State Govt Finance(Combined)" : [ "Public Finance", "Central & State Govt. Finance (Combined)" ],
    "Public Finance > Central Govt Finance"                  : [ "Public Finance", "Central Govt. Finance" ],
    "Public Finance > State Govt Finance"                    : [ "Public Finance", "State Govt. Finance" ],
    "Financial Sector > "                                    : [ "Financial Sector", "Banking - Sectoral Statistics" ],
};

export const menuHint = (key : string) : string => MENUS.find(m => m.key === key)?.hint ?? "";

// Where an entry sits: its sector, its section within the sector, and the path left over below that.
function place(entry : CatalogueEntry) : { sector : string; section : string; group : string } {
    const parts = entry.menu_path.split(" > ").map(p => p.trim());
    switch (entry.source) {
        case "statistics": {
            // Statistics > <sector> > <subsection> > <group>; the group repeats the subsection.
            const [, sector = "", section = "", ...rest] = parts;
            const group = rest.filter(p => p && p !== section).join(" > ");
            return { sector, section, group };
        }
        case "sdmx": {
            // Data Query > <sector> > <sub-sector>, folded into the Statistics section of the same name.
            const [, sector = "", sub = ""] = parts;
            const [ home, section ] = DATA_QUERY_HOME[`${sector} > ${sub}`] ?? [ sector, sub || sector ];
            return { sector : home, section, group : DATA_QUERY_GROUP };
        }
        case "publications": {
            // Publication > Time-Series Publications > <publication> > <publication again> > <part> > <group…>
            const [, , sector = "", ...rest] = parts;
            if (rest[0] === sector) rest.shift();
            const [section = "", ...group] = rest;
            return { sector, section, group : group.filter(Boolean).join(" > ") };
        }
    }
}

export function slugify(label : string) : string {
    return label
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// Slugs unique among siblings: a repeated name gets -2, -3, …
function uniqueSlug(label : string, taken : Set<string>) : string {
    const base = slugify(label) || "section";
    let slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
    taken.add(slug);
    return slug;
}

export const isLoaded = (e : CatalogueEntry) : boolean => e.status === "loaded";

// The database table an entry is loaded into, as "<schema>.<table>", or null when it is not loaded.
export const tableKey = (e : CatalogueEntry) : string | null =>
    e.schema_name && e.table_name ? `${e.schema_name}.${e.table_name}` : null;

// =====================================================================================================================
// DBIE's own order, from its menu tree
// =====================================================================================================================
export interface MenuOrder {
    [menuKey : string] : {
        sectors  : string[];                    // sector labels in DBIE's order
        sections : Record<string, string[]>;    // sector label → its section labels in DBIE's order
    };
}

interface DbieMenuNode {
    id    ? : number;
    title   : string;
    items ? : DbieMenuNode[];
}

// data/dbie-menu.json: DBIE's Statistics (4) and Publication (5) trees.
export function menuOrderFrom(tree : { menus : DbieMenuNode[] }) : MenuOrder {
    const byId = (id : number) => tree.menus.find(m => m.id === id);
    const fromTree = (node : DbieMenuNode | undefined) : MenuOrder[string] => {
        const sectors  = node?.items ?? [];
        return {
            sectors  : sectors.map(s => s.title),
            sections : Object.fromEntries(sectors.map(s => [ s.title, (s.items ?? []).map(i => i.title) ])),
        };
    };
    return {
        // Publications sit one level down, under "Time-Series Publications"; their parts come from the catalogue.
        "statistics"  : fromTree(byId(4)),
        "publication" : { sectors : (byId(5)?.items?.[0]?.items ?? []).map(i => i.title), sections : {} },
    };
}

const normalise = (label : string) : string => label.toLowerCase().replace(/[^a-z0-9]/g, "");

// Stable sort by position in DBIE's list; anything DBIE's tree lacks keeps its first-seen order after the rest.
function inDbieOrder<T extends { label : string }>(nodes : T[], order : string[] | undefined) : T[] {
    if (!order || order.length === 0) return nodes;
    const rank = new Map(order.map((label, i) => [ normalise(label), i ]));
    return nodes
        .map((node, i) => ({ node, rank : rank.get(normalise(node.label)) ?? order.length + i }))
        .sort((a, b) => a.rank - b.rank)
        .map(x => x.node);
}

// Rebuild DBIE's menus from the entries, sectors and sections in DBIE's order when the tree is given, entries in
// DBIE's listing order (the smallest entry_id first).
export function buildMenus(entries : CatalogueEntry[], order : MenuOrder = {}) : Menu[] {
    const sorted = [...entries].sort((a, b) => a.entry_id - b.entry_id);

    return MENUS.map(def => {
        // sector label → section label → group label → entries, in first-seen order (Map keeps insertion order)
        const sectors = new Map<string, Map<string, Map<string, CatalogueEntry[]>>>();
        for (const entry of sorted) {
            if (!def.sources.includes(entry.source)) continue;
            const { sector, section, group } = place(entry);
            const sections = sectors.get(sector) ?? new Map();
            sectors.set(sector, sections);
            const groups = sections.get(section) ?? new Map();
            sections.set(section, groups);
            const list = groups.get(group) ?? [];
            groups.set(group, list);
            list.push(entry);
        }

        const sectorSlugs = new Set<string>();
        const builtSectors : Sector[] = [...sectors.entries()].map(([sectorLabel, sections]) => {
            const sectorSlug   = uniqueSlug(sectorLabel, sectorSlugs);
            const sectionSlugs = new Set<string>();
            // A sector whose only section is unnamed has no sections of its own: the section stands in for it.
            const implicit = sections.size === 1 && sections.has("");

            const builtSections : Section[] = [...sections.entries()].map(([sectionLabel, groups]) => {
                const label   = sectionLabel || sectorLabel;
                const slug    = uniqueSlug(label, sectionSlugs);
                // Groups in DBIE's order, the Data Query datasets after the section's report tables.
                const built   = [...groups.entries()]
                    .sort((a, b) => Number(a[0] === DATA_QUERY_GROUP) - Number(b[0] === DATA_QUERY_GROUP))
                    .map(([groupLabel, list]) => ({ label : groupLabel, entries : list }));
                const flat    = built.flatMap(g => g.entries);
                return {
                    key      : implicit ? `${def.key}/${sectorSlug}` : `${def.key}/${sectorSlug}/${slug}`,
                    slug,
                    label,
                    implicit,
                    groups   : built,
                    entries  : flat,
                    count    : flat.length,
                    loaded   : flat.filter(isLoaded).length,
                };
            });

            const ordered = inDbieOrder(builtSections, order[def.key]?.sections[sectorLabel]);
            return {
                slug     : sectorSlug,
                label    : sectorLabel,
                sections : ordered,
                count    : ordered.reduce((n, s) => n + s.count, 0),
                loaded   : ordered.reduce((n, s) => n + s.loaded, 0),
            };
        });

        const orderedSectors = inDbieOrder(builtSectors, order[def.key]?.sectors);
        return {
            key     : def.key,
            label   : def.label,
            sources : def.sources,
            sectors : orderedSectors,
            count   : orderedSectors.reduce((n, s) => n + s.count, 0),
            loaded  : orderedSectors.reduce((n, s) => n + s.loaded, 0),
        };
    }).filter(menu => menu.sectors.length > 0);
}

// Resolve a ?section= value; null when it names nothing.
export function findSection(menus : Menu[], key : string | null | undefined) : SectionRef | null {
    if (!key) return null;
    const [menuKey, sectorSlug, sectionSlug] = key.split("/");
    const menu = menus.find(m => m.key === menuKey);
    const sector = menu?.sectors.find(s => s.slug === sectorSlug);
    if (!menu || !sector) return null;
    const section = sectionSlug
        ? sector.sections.find(s => s.slug === sectionSlug)
        : sector.sections.find(s => s.implicit) ?? sector.sections[0];
    return section ? { menu, sector, section } : null;
}

// The section shown when none is asked for: the first one, in DBIE's order, that has a loaded table (the first
// Statistics sections are report tables DBIE has but the database does not), else the very first.
export function defaultSection(menus : Menu[]) : SectionRef | null {
    let first : SectionRef | null = null;
    for (const menu of menus) {
        for (const sector of menu.sectors) {
            for (const section of sector.sections) {
                first ??= { menu, sector, section };
                if (section.loaded > 0) return { menu, sector, section };
            }
        }
    }
    return first;
}

export interface EntryRef extends SectionRef {
    entry : CatalogueEntry;
}

// The entry loaded into the table "<schema>.<table>", with where it sits in DBIE's menus.
export function findEntry(menus : Menu[], key : string | null | undefined) : EntryRef | null {
    if (!key) return null;
    for (const menu of menus) {
        for (const sector of menu.sectors) {
            for (const section of sector.sections) {
                const entry = section.entries.find(e => tableKey(e) === key);
                if (entry) return { menu, sector, section, entry };
            }
        }
    }
    return null;
}

// The first entry of a section that is in the database, in DBIE's order.
export const firstLoaded = (section : Section) : CatalogueEntry | null => section.entries.find(isLoaded) ?? null;

export const sectionCount = (menus : Menu[]) : number =>
    menus.reduce((n, m) => n + m.sectors.reduce((k, s) => k + s.sections.length, 0), 0);

// =====================================================================================================================
// Presentation helpers for one entry
// =====================================================================================================================
export type EntryState = "loaded" | "not-exported" | "archive" | "empty" | "documentation";

export function entryState(entry : CatalogueEntry) : EntryState {
    if (entry.status === "loaded") return "loaded";
    if (entry.kind === "documentation") return "documentation";
    if (entry.kind === "archive file" || entry.status.includes("archive")) return "archive";
    if (entry.status.startsWith("exported empty")) return "empty";
    return "not-exported";
}

export const STATE_LABELS : Record<EntryState, string> = {
    "loaded"        : "Loaded",
    "not-exported"  : "Not exported",
    "archive"       : "PDF or Excel",
    "empty"         : "Empty export",
    "documentation" : "Notes",
};

const MONTHS : Record<string, string> = {
    jan : "01", feb : "02", mar : "03", apr : "04", may : "05", jun : "06",
    jul : "07", aug : "08", sep : "09", oct : "10", nov : "11", dec : "12",
};

// DBIE writes periods as 31-Mar-2026 or 31-MAR-2026; SDMX start dates arrive as 2013-03-31. All shown DD-MM-YYYY.
export function formatPeriod(value : string | null | undefined) : string {
    if (!value) return "";
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;
    const dbie = value.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
    if (dbie) {
        const month = MONTHS[dbie[2].toLowerCase()];
        if (month) return `${dbie[1].padStart(2, "0")}-${month}-${dbie[3]}`;
    }
    return value;
}

// "01-04-2013 – 31-03-2026", "since 31-03-2013", or "" when there is no period.
export function formatRange(from ? : string | null, to ? : string | null) : string {
    const a = formatPeriod(from);
    const b = formatPeriod(to);
    if (a && b) return a === b ? a : `${a} – ${b}`;
    if (a) return `since ${a}`;
    return b;
}

export const periodRange = (entry : CatalogueEntry) : string => formatRange(entry.period_from, entry.period_to);

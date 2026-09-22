// DBIE's own menus as the build reads them, straight off the files in data/ with fs, so these run on the server
// only. data/dbie-menu.json is DBIE's menu tree captured from the portal: menu 4 is Statistics, whose items are its
// eight sectors, and menu 5 is Publication, whose one category holds the time-series publications.
// data/reports-sections.json is DBIE's report listing, which says which publications it gives tables for.
// data/catalogue.json is the site's release catalogue, which names the CSV each SDMX dataset has a series page for.
// Slugs are the catalogue's (src/lib/api/catalogue.ts), so a route finds its sector in the menu the data API's
// catalogue rebuilds in the browser.

// NODE ================================================================================================================
import fs from "node:fs";
import path from "node:path";

// LIB =================================================================================================================
import { MenuOrder, menuOrderFrom, slugify } from "@/lib/api/catalogue";

export interface MenuItem {
    label : string;   // DBIE's name
    slug  : string;
}

export interface PublicationsMenu {
    category     : string;       // DBIE's name for what the publications sit under: Time-Series Publications
    publications : MenuItem[];   // in DBIE's order
}

interface MenuNode {
    id    ? : number;
    title   : string;
    items ? : MenuNode[];
}

interface ReportSection {
    section    : string;
    categories : { subsections : { subsection : string; reportPath ? : string }[] }[];
}

const STATISTICS_MENU  = 4;   // DBIE's id for its Statistics menu
const PUBLICATION_MENU = 5;   // DBIE's id for its Publication menu

const readData = <T>(name : string) : T =>
    JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", name), "utf8")) as T;

const dbieMenu = () => readData<{ menus : MenuNode[] }>("dbie-menu.json");

// DBIE's eight Statistics sectors, in DBIE's order. None is left out: every one has tables in the database.
export function statisticsMenu() : { sectors : MenuItem[] } {
    const menu = dbieMenu().menus.find(m => m.id === STATISTICS_MENU);
    return {
        sectors : (menu?.items ?? []).map(item => ({ label : item.title.trim(), slug : slugify(item.title) })),
    };
}

// DBIE's time-series publications, in DBIE's order, kept to those its report listing gives tables for. Two the menu
// names but the listing gives nothing (Report on Trend and Progress of Banking in India, Handbook of Statistics on
// Indian States) are left out.
export function publicationsMenu() : PublicationsMenu {
    const tree     = dbieMenu();
    const listing  = readData<ReportSection[]>("reports-sections.json");
    const category = tree.menus.find(m => m.id === PUBLICATION_MENU)?.items?.[0];

    const listed = new Set(
        listing
            .filter(s => s.section === "Publication")
            .flatMap(s => s.categories.flatMap(c => c.subsections.filter(x => x.reportPath).map(x => slugify(x.subsection)))),
    );

    return {
        category     : category?.title.trim() ?? "",
        publications : (category?.items ?? [])
            .map(item => ({ label : item.title.trim(), slug : slugify(item.title) }))
            .filter(p => listed.has(p.slug)),
    };
}

export const findPublication = (slug : string) : MenuItem | undefined =>
    publicationsMenu().publications.find(p => p.slug === slug);

export const findSector = (slug : string) : MenuItem | undefined =>
    statisticsMenu().sectors.find(s => s.slug === slug);

// DBIE's own order of sectors and sections, for the menus the browser rebuilds from the data API's catalogue.
export const menuOrder = () : MenuOrder => menuOrderFrom(dbieMenu());

// SDMX dataset code → the slug of its generic series page at /tables/<slug>, which is its CSV file's name.
export function seriesSlugs() : Record<string, string> {
    const catalogue = readData<{ entries : { source : string; dsdCode ? : string; path ? : string }[] }>("catalogue.json");
    const slugs : Record<string, string> = {};
    for (const entry of catalogue.entries) {
        if (entry.source === "sdmx" && entry.dsdCode && entry.path) {
            slugs[entry.dsdCode] = path.basename(entry.path, ".csv");
        }
    }
    return slugs;
}

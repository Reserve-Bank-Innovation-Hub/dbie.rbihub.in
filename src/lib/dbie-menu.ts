// What the build reads out of data/ for the pages over DBIE's menus, straight off the files with fs, so these run on
// the server only. data/dbie-menu.json is DBIE's menu tree captured from the portal: menu 4 is Statistics, whose
// items are its eight sectors, and menu 5 is Publication, whose one category holds the time-series publications; it
// gives the order the browser lays the menus out in. data/catalogue.json is the site's release catalogue, which
// names the CSV each SDMX dataset has a series page for.

// NODE ================================================================================================================
import fs from "node:fs";
import path from "node:path";

// LIB =================================================================================================================
import { MenuOrder, menuOrderFrom } from "@/lib/api/catalogue";

interface MenuNode {
    id    ? : number;
    title   : string;
    items ? : MenuNode[];
}

const readData = <T>(name : string) : T =>
    JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", name), "utf8")) as T;

const dbieMenu = () => readData<{ menus : MenuNode[] }>("dbie-menu.json");

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

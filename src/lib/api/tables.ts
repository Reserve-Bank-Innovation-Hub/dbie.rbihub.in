// One loaded table through the data API (docs/data-api.md): its identity and columns, its provenance row, pages of
// rows, and the code lists behind an SDMX table's dimensions.

// OTHER ===============================================================================================================
import { apiUrl } from "./dataApi";

export interface ApiColumn {
    name : string;
    type : string;    // text, integer, numeric, date, timestamp, boolean, text[]
}

export interface ApiTable {
    key        : string;
    source     : string;                          // sdmx, statistics, publication
    schema     : string;
    table      : string;
    title      : string;
    dbie_path  : string;
    frequency ?: string;
    row_count  : number;
    layout     : "typed" | "columns" | "array";   // SDMX observations; a report grid as c1..cN; a report grid as one cells array
    width     ?: number;                          // report grids: the number of cells per row
    dsd_code  ?: string;
    report_id ?: number;
    columns    : ApiColumn[];
    dimensions?: string[];                        // SDMX: the dimension columns
    codelists ?: string[];                        // SDMX: the dimensions DBIE publishes a code list for
}

// One export file of a report (a DBIE tab, for one period), as meta.report.files records it.
export interface ReportFile {
    file    : string;       // path of the export; rows carry its base name in src_file
    tab     : string;
    period  : string;       // "full-history" or the period the tab was exported for
    rows    : number;
    width   : number;
    loaded  : boolean;
    empty   : boolean;
}

export interface TableInfo {
    data       : ApiTable;
    provenance : Record<string, unknown> | null;   // a meta.sdmx_dataset or meta.report row
}

export const fileName = (p : string) : string => p.split("/").pop() ?? p;

// The report's files that hold rows, in export order.
export function reportFiles(info : TableInfo) : ReportFile[] {
    const files = info.provenance?.files;
    return Array.isArray(files) ? (files as ReportFile[]).filter(f => f.loaded && !f.empty) : [];
}

export async function fetchTable(schema : string, table : string, signal ? : AbortSignal) : Promise<TableInfo> {
    const res = await fetch(apiUrl(`/api/tables/${schema}/${table}`), { signal });
    if (res.status === 404) throw new Error("This table is not in the database.");
    if (!res.ok) throw new Error(`HTTP ${res.status} from the data API`);
    return res.json();
}

export interface RowsPage {
    table    : string;
    columns  : string[];
    rows     : unknown[][];
    total   ?: number;     // present when count=1 was asked for
    returned : number;
    limit    : number;
    offset   : number;
}

const withQuery = (path : string, params : Record<string, string>) : string => {
    const q = new URLSearchParams(params).toString();
    return apiUrl(q ? `${path}?${q}` : path);
};

export const rowsUrl = (schema : string, table : string, params : Record<string, string> = {}) : string =>
    withQuery(`/api/tables/${schema}/${table}/rows`, params);

export const csvUrl = (schema : string, table : string, params : Record<string, string> = {}) : string =>
    withQuery(`/api/tables/${schema}/${table}/csv`, params);

export async function fetchRows(schema : string, table : string, params : Record<string, string>, signal ? : AbortSignal) : Promise<RowsPage> {
    const res = await fetch(rowsUrl(schema, table, params), { signal });
    if (!res.ok) {
        let message = `HTTP ${res.status} from the data API`;
        try {
            const body = await res.json();
            if (body?.error) message = String(body.error);
        } catch { /* keep the status message */ }
        throw new Error(message);
    }
    return res.json();
}

export interface CodelistValue {
    value_id        : string;
    code            : string;
    label           : string;
    parent_value_id : string;
    level           : number;
}

export interface Codelist {
    dim_code : string;          // as DBIE spells it, upper case
    dim_name : string;          // "Components", "State", …
    values   : CodelistValue[]; // in DBIE's order, parents before children
}

// Every code list of a dataset, keyed by the lower-case dimension column name the table uses.
export async function fetchCodelists(dsd : string, signal ? : AbortSignal) : Promise<Record<string, Codelist>> {
    const res = await fetch(apiUrl(`/api/codelists/${dsd}`), { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} from the data API`);
    const body : { dimensions : Codelist[] } = await res.json();
    return Object.fromEntries((body.dimensions ?? []).map(d => [ d.dim_code.toLowerCase(), d ]));
}

// Spreadsheet-style column letters: 1 → A, 26 → Z, 27 → AA.
export function columnLetter(n : number) : string {
    let s = "";
    for (let i = n; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
    return s;
}

// =====================================================================================================================
// Every row of a view
// =====================================================================================================================
export interface AllRows {
    columns : string[];
    rows    : unknown[][];
    total   : number;      // rows the filters match, whether or not all were fetched
    capped  : boolean;     // true when max stopped the fetch short of total
}

interface FetchAllOptions {
    max        ?: number;                                   // rows to fetch at most (default 20,000)
    signal     ?: AbortSignal;
    onProgress ?: (loaded : number, total : number) => void;
}

const PAGE_SIZE = 5000;   // the API's maximum per call

// The rows a filter matches, fetched in pages of 5,000 up to max, in the order the caller asks for.
export async function fetchAllRows(schema : string, table : string, params : Record<string, string>, { max = 20000, signal, onProgress } : FetchAllOptions = {}) : Promise<AllRows> {
    let columns : string[] = [];
    let total = 0;
    const rows : unknown[][] = [];
    for (let offset = 0; offset < max; offset += PAGE_SIZE) {
        const limit = Math.min(PAGE_SIZE, max - offset);
        const page = await fetchRows(schema, table, { ...params, limit : String(limit), offset : String(offset), ...(offset === 0 ? { count : "1" } : {}) }, signal);
        if (offset === 0) {
            columns = page.columns;
            total   = page.total ?? page.returned;
        }
        rows.push(...page.rows);
        onProgress?.(rows.length, total);
        if (page.returned < limit || rows.length >= total) break;
    }
    return { columns, rows, total, capped : rows.length < total };
}

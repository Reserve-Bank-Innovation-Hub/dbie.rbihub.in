#!/usr/bin/env node
// dbie-mcp — MCP server for the Database on Indian Economy.
//
// A thin, read-only layer over the site's static JSON payloads: search the
// 337-entry corpus, list the catalogue, and fetch table data — full payloads
// (with array truncation) or sliced observations for SDMX series.
//
// Data source: DBIE_BASE_URL (default https://dbie.rbihub.in). Data reflects
// the deployment's last scrape of the RBI DBIE portal; every response carries
// the base URL and, where cheap to compute, the latest observation period.

// MCP =================================================================================================================
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// SEARCH ==============================================================================================================
import { create, insert, search as oramaSearch } from "@orama/orama";

const BASE = (process.env.DBIE_BASE_URL ?? "https://dbie.rbihub.in").replace(/\/$/, "");

// ── payload fetching, cached for the process lifetime ───────────────────────────────────────────────────────────────
const cache = new Map();

async function fetchJson(path) {
    if (cache.has(path)) return cache.get(path);
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${BASE}${path}`);
    const json = await res.json();
    cache.set(path, json);
    return json;
}

// ── search index + Orama DB, built on first use ─────────────────────────────────────────────────────────────────────
let searchDb = null;
let indexEntries = null;

async function getSearchDb() {
    if (searchDb) return searchDb;
    indexEntries = await fetchJson("/data/search-index.json");
    const db = create({
        schema : {
            title       : "string",
            description : "string",
            keywords    : "string",
            section     : "string",
            url         : "string",
        },
    });
    for (const entry of indexEntries) {
        insert(db, { ...entry, keywords : entry.keywords.join(" ") });
    }
    searchDb = db;
    return db;
}

// ── route → payload resolution ──────────────────────────────────────────────────────────────────────────────────────
// Accepts a page url ("/banking/liquidity-operations", full https url) or a
// bare slug. Generic SDMX pages ("/tables/<slug>") map to "sdmx-<slug>.json";
// every other page maps to "<last-segment>.json". Bare slugs are tried as
// given, then with the "sdmx-" prefix.
function payloadCandidates(table) {
    const t = table.trim().replace(/^https?:\/\/[^/]+/, "");
    if (t.includes("/")) {
        const segs = t.replace(/^\/+|\/+$/g, "").split("/");
        const last = segs[segs.length - 1];
        return segs[0] === "tables" ? [ `sdmx-${last}` ] : [ last ];
    }
    return t.startsWith("sdmx-") ? [ t ] : [ t, `sdmx-${t}` ];
}

async function fetchPayload(table) {
    const candidates = payloadCandidates(table);
    let lastErr = null;
    for (const name of candidates) {
        try {
            return { name, payload : await fetchJson(`/data/${name}.json`) };
        } catch (err) {
            lastErr = err;
        }
    }
    throw new Error(
        `No payload found for "${table}" (tried ${candidates.map((c) => c + ".json").join(", ")}). ` +
        `Use search_tables to find the right table.`,
    );
}

// ── helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────
function truncateArrays(value, max, stats) {
    if (Array.isArray(value)) {
        const trimmed = value.length > max;
        if (trimmed) stats.truncated += 1;
        const slice = trimmed ? value.slice(0, max) : value;
        const out = slice.map((v) => truncateArrays(v, max, stats));
        if (trimmed) out.push(`… ${value.length - max} more items truncated — raise max_array_items or use get_series`);
        return out;
    }
    if (value && typeof value === "object") {
        const out = {};
        for (const [ k, v ] of Object.entries(value)) out[k] = truncateArrays(v, max, stats);
        return out;
    }
    return value;
}

function textResult(obj) {
    return { content : [ { type : "text", text : JSON.stringify(obj, null, 1) } ] };
}

const SOURCE_NOTE = `Data is from ${BASE} and reflects its last scrape of the RBI DBIE portal — quote periods, not "today".`;

// ── server ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const server = new McpServer({ name : "dbie-mcp", version : "0.1.0" });

server.tool(
    "search_tables",
    "Full-text search across every DBIE table and series (RBI Bulletin tables, Handbook series, SDMX series, publications, docs and data stories). Returns matching tables with the `table` value to pass to get_series/get_table.",
    {
        query : z.string().describe("Search terms, e.g. 'wholesale price index' or 'forex reserves'"),
        limit : z.number().int().min(1).max(25).optional().describe("Max results (default 8)"),
    },
    async ({ query, limit }) => {
        const db = await getSearchDb();
        const res = await oramaSearch(db, {
            term       : query,
            properties : [ "title", "keywords", "description" ],
            boost      : { title : 2, keywords : 1.4, description : 1 },
            tolerance  : 1,
            limit      : limit ?? 8,
        });
        return textResult({
            source  : BASE,
            note    : SOURCE_NOTE,
            results : res.hits.map((h) => ({
                title       : h.document.title,
                section     : h.document.section,
                description : h.document.description,
                table       : h.document.url,
                page_url    : BASE + h.document.url,
            })),
        });
    },
);

server.tool(
    "list_tables",
    "Browse the DBIE catalogue. Without arguments: all sections with entry counts. With a section: every table in it.",
    {
        section : z.string().optional().describe("Section name from the no-argument listing, e.g. 'Banking' or 'Financial Markets'"),
    },
    async ({ section }) => {
        await getSearchDb();
        if (!section) {
            const counts = {};
            for (const e of indexEntries) counts[e.section] = (counts[e.section] ?? 0) + 1;
            return textResult({ source : BASE, sections : counts });
        }
        const matches = indexEntries.filter((e) => e.section.toLowerCase() === section.toLowerCase());
        return textResult({
            source : BASE,
            tables : matches.map((e) => ({ title : e.title, table : e.url, description : e.description })),
        });
    },
);

server.tool(
    "get_series",
    "Fetch observations for an SDMX series (wide payloads: shared date axis + named columns), sliced by date range and columns. For RBI Bulletin / Handbook tables and long cross-tabs, use get_table instead.",
    {
        table   : z.string().describe("A `table` value from search_tables, a page url, or a slug"),
        from    : z.string().optional().describe("Earliest ISO date to include, e.g. 2020-01-01"),
        to      : z.string().optional().describe("Latest ISO date to include"),
        columns : z.array(z.string()).optional().describe("Only these columns, matched by key or label (case-insensitive)"),
        limit   : z.number().int().min(1).max(5000).optional().describe("Max most-recent observations per column (default 500)"),
    },
    async ({ table, from, to, columns, limit }) => {
        const { name, payload } = await fetchPayload(table);
        if (!Array.isArray(payload.dates) || !Array.isArray(payload.columns) || !Array.isArray(payload.values)) {
            const hint = payload.mode === "long"
                ? "This is a long-format cross-tab — use get_table with max_array_items."
                : "This payload is not a wide SDMX series — use get_table for its full JSON.";
            return textResult({ error : `get_series only handles wide series payloads. ${hint}`, payload : name });
        }

        const wanted = columns?.map((c) => c.toLowerCase());
        const colIdx = payload.columns
            .map((c, i) => ({ c, i }))
            .filter(({ c }) => !wanted || wanted.includes(c.key.toLowerCase()) || wanted.includes((c.label ?? "").toLowerCase()));

        let dateIdx = payload.dates
            .map((d, i) => ({ d, i }))
            .filter(({ d }) => (!from || d >= from) && (!to || d <= to));
        const cap = limit ?? 500;
        const capped = dateIdx.length > cap;
        if (capped) dateIdx = dateIdx.slice(-cap);   // keep the most recent

        return textResult({
            source             : BASE,
            note               : SOURCE_NOTE,
            title              : payload.label,
            sector             : payload.sector,
            sub_sector         : payload.subSector,
            frequency          : payload.frequency,
            as_of              : payload.dates[payload.dates.length - 1],
            total_observations : payload.dates.length,
            returned           : dateIdx.length,
            capped             : capped ? `oldest observations dropped at limit ${cap}; narrow with from/to` : false,
            columns            : colIdx.map(({ c }) => ({ key : c.key, label : c.label, unit : c.unit, unit_mult : c.unitMult })),
            dates              : dateIdx.map(({ d }) => d),
            values             : colIdx.map(({ i }) => dateIdx.map(({ i : di }) => payload.values[i][di])),
            footnotes          : payload.footnotes?.length ? payload.footnotes : undefined,
        });
    },
);

server.tool(
    "get_table",
    "Fetch any table's full JSON payload (RBI Bulletin tables, Handbook series, long cross-tabs, publications). Long arrays are truncated to max_array_items to protect context — most payloads are newest-first.",
    {
        table           : z.string().describe("A `table` value from search_tables, a page url, or a slug"),
        max_array_items : z.number().int().min(1).max(10000).optional().describe("Per-array truncation limit (default 100)"),
    },
    async ({ table, max_array_items }) => {
        const { name, payload } = await fetchPayload(table);
        const stats = { truncated : 0 };
        const data = truncateArrays(payload, max_array_items ?? 100, stats);
        return textResult({
            source           : BASE,
            note             : SOURCE_NOTE,
            payload          : `${name}.json`,
            arrays_truncated : stats.truncated,
            data,
        });
    },
);

await server.connect(new StdioServerTransport());

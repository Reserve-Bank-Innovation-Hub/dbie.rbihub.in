"use client";

// One table of the database, viewed through the data API, laid out as the site's other table pages are: the page
// grid's title and meta cards, a controls cell of selects where the table has tabs or dimensions, the grid, and
// the notes. A report is shown as the table DBIE exported, one tab at a time (src/lib/tables/report-grid.ts
// reads its title, headers, figures and notes back out of the rows); an SDMX dataset as a time series, newest
// first, narrowed by a select per dimension that has a code list (src/lib/tables/sdmx-pivot.ts). Up to 20,000
// rows are fetched for a view; beyond that the selects narrow it. Sorting and filtering are the grid's own.

// REACT CORE ==========================================================================================================
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Div, Heading4, Heading6, Select, Text } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ReportGrid                       from "@/components/tables/ReportGrid";
import SdmxSeriesGrid, { SdmxLongGrid } from "@/components/tables/SdmxSeriesGrid";
import { DataUnit }                     from "@components/DataUnit/DataUnit";
import { Loading }                      from "@components/Loading/Loading";

// LIB =================================================================================================================
import { CatalogueEntry, formatRange, periodRange } from "@/lib/api/catalogue";
import {
    AllRows,
    Codelist,
    ReportFile,
    TableInfo,
    csvUrl,
    fetchAllRows,
    fetchCodelists,
    fetchTable,
    fileName,
    reportFiles,
    rowsUrl,
} from "@/lib/api/tables";
import { parseReportGrid } from "@/lib/tables/report-grid";
import { pivotSdmx }       from "@/lib/tables/sdmx-pivot";

const MAX_ROWS    = 20000;
const MAX_ACROSS  = 100;        // series laid across as columns; past this the observations are listed
const ALL         = "";         // the "All" choice of a dimension select
const INDENT      = String.fromCharCode(160).repeat(2);   // a code list's levels, in a native select

interface TableViewProps {
    entry    : CatalogueEntry;
    crumbs   : string[];                                    // where the table sits in DBIE's menus
    pageLink : { href : string; label : string } | null;   // the site's own page for it, if any
}

// A file's name in the tab select: its tab, and its period when the tab was exported per period.
const fileLabel = (f : ReportFile) : string =>
    f.period && f.period !== "full-history" ? `${f.tab} · ${f.period}` : f.tab;

export const TableView = ({ entry, crumbs, pageLink } : TableViewProps) => {
    const schema = entry.schema_name!;
    const table  = entry.table_name!;

    const [ period,    setPeriod ]    = useState<string | null>(null);                 // from the provenance
    const [ total,     setTotal ]     = useState<number | null>(null);                 // rows the selects match
    const [ info,      setInfo ]      = useState<TableInfo | null>(null);
    const [ codelists, setCodelists ] = useState<Record<string, Codelist>>({});
    const [ error,     setError ]     = useState<string | null>(null);
    const [ file,      setFile ]      = useState<string>("");                        // reports: the tab on show
    const [ dims,      setDims ]      = useState<Record<string, string>>({});        // SDMX: dimension → code
    const [ rows,      setRows ]      = useState<AllRows | null>(null);
    const [ progress,  setProgress ]  = useState<{ loaded : number; total : number } | null>(null);

    // The table's identity and provenance, then (SDMX) its code lists.
    useEffect(() => {
        const controller = new AbortController();
        setInfo(null);
        setCodelists({});
        setError(null);
        setFile("");
        setDims({});
        setRows(null);
        setTotal(null);
        setPeriod(null);

        fetchTable(schema, table, controller.signal)
            .then(async fetched => {
                if (controller.signal.aborted) return;
                const prov = (fetched.provenance ?? {}) as Record<string, string | null | undefined>;
                setPeriod(fetched.data.layout === "typed"
                    ? formatRange(prov.first_period, prov.last_period)
                    : formatRange(prov.period_from, prov.period_to));
                const files = reportFiles(fetched);
                if (files.length > 0) setFile(fileName(files[0].file));
                if (fetched.data.dsd_code && (fetched.data.codelists?.length ?? 0) > 0) {
                    setCodelists(await fetchCodelists(fetched.data.dsd_code, controller.signal));
                }
                if (!controller.signal.aborted) setInfo(fetched);
            })
            .catch((err : unknown) => {
                if (!controller.signal.aborted) setError(err instanceof Error ? err.message : String(err));
            });
        return () => controller.abort();
    }, [ schema, table ]);

    const isSdmx = info?.data.layout === "typed";
    const files  = useMemo(() => (info ? reportFiles(info) : []), [ info ]);

    // What the API is asked for: a report's file, an SDMX table's dimension codes.
    const filters = useMemo<Record<string, string>>(() => {
        if (!info) return {};
        if (isSdmx) return Object.fromEntries(Object.entries(dims).filter(([ , code ]) => code !== ALL));
        return file ? { src_file : file } : {};
    }, [ info, isSdmx, dims, file ]);

    // The rows of the view.
    useEffect(() => {
        if (!info) return;
        if (!isSdmx && files.length > 0 && !file) return;    // the tab is being chosen
        const controller = new AbortController();
        setRows(null);
        setProgress({ loaded : 0, total : 0 });
        setError(null);
        const params : Record<string, string> = { ...filters, order : isSdmx ? "time_period:desc,src_line" : "row_no" };
        if (isSdmx) params.labels = "1";
        fetchAllRows(schema, table, params, {
            max        : MAX_ROWS,
            signal     : controller.signal,
            onProgress : (loaded, total) => setProgress({ loaded, total }),
        })
            .then(fetched => {
                if (controller.signal.aborted) return;
                setRows(fetched);
                setProgress(null);
                setTotal(fetched.total);
            })
            .catch((err : unknown) => {
                if (!controller.signal.aborted) {
                    setError(err instanceof Error ? err.message : String(err));
                    setProgress(null);
                }
            });
        return () => controller.abort();
    }, [ info, isSdmx, files, file, filters, schema, table ]);

    const grid  = useMemo(() => (rows && info && !isSdmx ? parseReportGrid(rows.columns, rows.rows, info.data.width) : null), [ rows, info, isSdmx ]);
    const pivot = useMemo(() => (rows && info && isSdmx ? pivotSdmx(rows.columns, rows.rows, info.data.dimensions ?? [], codelists) : null), [ rows, info, isSdmx, codelists ]);

    // The pivot in the shape the site's SDMX grids take: periods down, one column per series, or one line per
    // observation when there are too many series to lay across.
    const wide = useMemo(() => {
        if (!pivot || pivot.series.length > MAX_ACROSS) return null;
        return {
            columns : pivot.series.map(s => ({ key : s.key, label : s.labels.join(" · ") || "Value", unit : "N_A", unitMult : 0 })),
            rows    : pivot.periods.map((p, i) => ({ period : p, values : pivot.values[i] })),
        };
    }, [ pivot ]);
    const long = useMemo(() => {
        if (!pivot || pivot.series.length <= MAX_ACROSS) return null;
        const unit = pivot.context.find(c => c.name === "Unit")?.value ?? "";
        const out : (string | number | null)[][] = [];
        pivot.periods.forEach((p, i) => pivot.series.forEach((s, j) => {
            const v = pivot.values[i][j];
            if (v != null) out.push([ ...s.labels, unit, p, v ]);
        }));
        return { dimensions : pivot.varying.map(v => v.name), rows : out };
    }, [ pivot ]);

    // ------------------------------------------------------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------------------------------------------------------
    const identity = entry.dsd_code ? `SDMX dataset ${entry.dsd_code}` : `DBIE report ${entry.report_id}`;
    const context  = [
        ...(grid ? grid.subtitles : []),
        ...(pivot ? pivot.context.map(c => `${c.name}: ${c.value}`) : []),
    ];
    const rowCount = total ?? entry.row_count;

    const dimensionSelects = isSdmx && info
        ? (info.data.codelists ?? []).filter(dim => codelists[dim]).map(dim => ({ dim, list : codelists[dim] }))
        : [];
    const hasControls = files.length > 1 || dimensionSelects.length > 0;

    const notes = [
        ...(rows?.capped
            ? [ `Showing the newest ${rows.rows.length.toLocaleString("en-IN")} of ${rows.total.toLocaleString("en-IN")} observations. Narrow the dataset with the selects above, or download the CSV for all of them.` ]
            : []),
        ...(grid ? grid.notes : []),
        ...(entry.notes ? [ entry.notes ] : []),
    ];

    return (
        <>
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        {entry.title}
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        {crumbs.join(" › ")}
                    </Heading6>
                </Div>

                <Text>
                    {[ identity, ...context ].join(" · ")}
                </Text>
            </Div>

            {/* META CARD ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit label="Source" value="Reserve Bank of India (DBIE)" />
                <DataUnit label="Frequency" value={entry.frequency ?? "—"} />
                <DataUnit label="Period" value={period ?? periodRange(entry) ?? "—"} />
                <DataUnit label="Rows" value={rowCount != null ? rowCount.toLocaleString("en-IN") : "—"} />
                <Text size="small">
                    <a href={csvUrl(schema, table, filters)}>Download CSV</a>
                    {" · "}
                    <a href={rowsUrl(schema, table, filters)} target="_blank" rel="noreferrer">JSON</a>
                    {pageLink && (
                        <>
                            {" · "}
                            <Link href={pageLink.href}>{pageLink.label}</Link>
                        </>
                    )}
                </Text>
            </Div>

            {/* CONTROLS: a report's tabs, an SDMX table's dimensions ///////////////////////////////////////////// */}
            {hasControls && (
                <Div id="table-controls" className="controls-cell grid-cell" padding="micro">
                    {files.length > 1 && (
                        <Select
                            label="Tab"
                            options={files.map(f => ({ value : fileName(f.file), label : `${fileLabel(f)} · ${f.rows.toLocaleString("en-IN")} rows` }))}
                            value={file}
                            onChange={setFile}
                        />
                    )}

                    {dimensionSelects.map(({ dim, list }) => (
                        <Select
                            key={dim}
                            label={list.dim_name || dim.toUpperCase()}
                            options={[
                                { value : ALL, label : "All" },
                                ...list.values.map(v => ({ value : v.code, label : `${INDENT.repeat(Math.max(0, (v.level ?? 1) - 1))}${v.label}` })),
                            ]}
                            value={dims[dim] ?? ALL}
                            onChange={code => setDims(d => ({ ...d, [dim] : code }))}
                        />
                    ))}
                </Div>
            )}

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell" padding={grid || wide || long ? undefined : "micro"}>
                {error && (
                    <Text size="small" opacity="60">Could not open this table. {error}</Text>
                )}

                {!error && !rows && (
                    <Loading
                        name={progress && progress.total > 0
                            ? `${progress.loaded.toLocaleString("en-IN")} of ${Math.min(progress.total, MAX_ROWS).toLocaleString("en-IN")} rows`
                            : entry.title}
                    />
                )}

                {grid && <ReportGrid key={file} grid={grid} />}
                {wide && <SdmxSeriesGrid columns={wide.columns} rows={wide.rows} />}
                {long && <SdmxLongGrid dimensions={long.dimensions} rows={long.rows} />}
            </Div>

            {/* NOTES ////////////////////////////////////////////////////////////////////////////////////////////// */}
            {notes.length > 0 && (
                <Div className="notes-cell grid-cell" padding="micro">
                    {notes.map((note, i) => (
                        <Text key={i} size="small" opacity="60" marginBottom="nano">{note}</Text>
                    ))}
                </Div>
            )}
        </>
    );
};

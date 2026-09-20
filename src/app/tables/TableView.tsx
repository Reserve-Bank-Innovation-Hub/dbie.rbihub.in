"use client";

// One table of the database, viewed through the data API. A report is shown as the table DBIE exported, one tab
// at a time (src/lib/tables/report-grid.ts reads its title, headers, figures and notes back out of the rows). An
// SDMX dataset is shown as a time series, newest first, with a select per dimension that has a code list
// (src/lib/tables/sdmx-pivot.ts). Up to 20,000 rows are fetched for a view; beyond that the selects narrow it.
// Within the table, every column filters and sorts on its own (src/lib/tables/column-filters.ts).

// REACT CORE ==========================================================================================================
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Div, ListBox, Text } from "fictoan-react";
import { Braces, Download, LineChart, Search } from "lucide-react";

// LOCAL COMPONENTS ====================================================================================================
import { ReportTable } from "@components/tables/ReportTable";
import { SeriesTable } from "@components/tables/SeriesTable";
import { Loading }     from "@components/Loading/Loading";

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

const MAX_ROWS = 20000;
const ALL      = "__all__";   // the "All" choice of a dimension list

interface TableViewProps {
    entry    : CatalogueEntry;
    crumbs   : string[];                                    // where the table sits in DBIE's menus
    pageLink : { href : string; label : string } | null;   // the site's own page for it, if any
}

// A file's name in the tab selector: its tab, and its period when the tab was exported per period.
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
    const [ find,      setFind ]      = useState("");

    // The table's identity and provenance, then (SDMX) its code lists.
    useEffect(() => {
        const controller = new AbortController();
        setInfo(null);
        setCodelists({});
        setError(null);
        setFile("");
        setDims({});
        setRows(null);
        setFind("");
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
        if (isSdmx) return Object.fromEntries(Object.entries(dims).filter(([ , code ]) => code !== ""));
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

    // ------------------------------------------------------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------------------------------------------------------
    const identity = entry.dsd_code ? `SDMX dataset ${entry.dsd_code}` : `DBIE report ${entry.report_id}`;
    const subline  = [
        crumbs.join(" › "),
        identity,
        entry.frequency ?? "",
        period ?? periodRange(entry),
        total != null ? `${total.toLocaleString("en-IN")} rows` : (entry.row_count != null ? `${entry.row_count.toLocaleString("en-IN")} rows` : ""),
    ].filter(Boolean).join(" · ");
    const download = csvUrl(schema, table, filters);

    const head = (
        <header className="page-head">
            <div className="page-head-text">
                <h2 className="page-title">{entry.title}</h2>
                <p className="page-sub">{subline}</p>
                {entry.notes && <p className="page-sub page-notes">{entry.notes}</p>}
            </div>

            <div className="page-actions">
                <a className="icon-button" href={download} title="Download this view as CSV" aria-label="Download this view as CSV">
                    <Download size={18} />
                </a>
                <a className="icon-button" href={rowsUrl(schema, table, filters)} target="_blank" rel="noreferrer" title="Rows as JSON from the data API" aria-label="Rows as JSON from the data API">
                    <Braces size={18} />
                </a>
                {pageLink && (
                    <Link className="icon-button" href={pageLink.href} title={pageLink.label} aria-label={pageLink.label}>
                        <LineChart size={18} />
                    </Link>
                )}
            </div>
        </header>
    );

    if (error && !info) {
        return (
            <>
                {head}
                <Div className="view-note">
                    <Text>Could not open this table. {error}</Text>
                </Div>
            </>
        );
    }
    if (!info) {
        return (
            <>
                {head}
                <Loading name={entry.title} />
            </>
        );
    }

    const dimensionFilters = isSdmx
        ? (info.data.codelists ?? []).filter(dim => codelists[dim]).map(dim => ({ dim, list : codelists[dim] }))
        : [];

    return (
        <>
            {head}

            <Div className="view-controls">
                {files.length > 1 && (
                    <div className="view-control view-control-tab">
                        <span>Tab</span>
                        <ListBox
                            size="small"
                            isFullWidth
                            options={files.map(f => ({ value : fileName(f.file), label : `${fileLabel(f)} · ${f.rows.toLocaleString("en-IN")} rows` }))}
                            value={file}
                            onChange={v => setFile(Array.isArray(v) ? (v[0] ?? "") : v)}
                        />
                    </div>
                )}

                {dimensionFilters.map(({ dim, list }) => (
                    <div key={dim} className="view-control">
                        <span>{list.dim_name || dim.toUpperCase()}</span>
                        <ListBox
                            size="small"
                            isFullWidth
                            options={[
                                { value : ALL, label : "All" },
                                ...list.values.map(v => ({ value : v.code, label : `${"  ".repeat(Math.max(0, (v.level ?? 1) - 1))}${v.label}` })),
                            ]}
                            value={dims[dim] || ALL}
                            onChange={v => {
                                const code = Array.isArray(v) ? (v[0] ?? ALL) : v;
                                setDims(d => ({ ...d, [dim] : code === ALL ? "" : code }));
                            }}
                        />
                    </div>
                ))}

                <label className="view-control view-find">
                    <Search size={14} />
                    <input
                        type="search"
                        value={find}
                        placeholder={isSdmx ? "Find a series" : "Find a row"}
                        aria-label={isSdmx ? "Find a series by its label" : "Find rows containing text"}
                        onChange={e => setFind(e.target.value)}
                    />
                </label>
            </Div>

            {error && (
                <Div className="view-note">
                    <Text size="small">{error}</Text>
                </Div>
            )}

            {!rows && !error && (
                <Div className="view-note">
                    <Loading
                        name={progress && progress.total > 0
                            ? `${progress.loaded.toLocaleString("en-IN")} of ${Math.min(progress.total, MAX_ROWS).toLocaleString("en-IN")} rows`
                            : "rows"}
                    />
                </Div>
            )}

            {rows?.capped && (
                <Div className="view-note view-capped">
                    <Text size="small">
                        Showing the newest {rows.rows.length.toLocaleString("en-IN")} of {rows.total.toLocaleString("en-IN")} observations.
                        Narrow the dataset with the selects above, or download the CSV for all of them.
                    </Text>
                </Div>
            )}

            {grid  && <ReportTable grid={grid} find={find} />}
            {pivot && <SeriesTable pivot={pivot} find={find} />}
        </>
    );
};

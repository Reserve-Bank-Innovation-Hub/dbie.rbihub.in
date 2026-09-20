"use client";

// An SDMX dataset as a time series: periods down the side, newest first, one column per series (the combination
// of the dimensions that vary), the fixed dimensions stated once above. Past sixty series the columns would not
// read, so the rows are listed instead, one observation per line, and the selects above narrow them. Every
// column sorts and filters from its header, as Pratirupa's tables do: periods by date, figures by value.

// REACT CORE ==========================================================================================================
import React, { useMemo, useState } from "react";

// LOCAL COMPONENTS ====================================================================================================
import { HeaderCell } from "./HeaderCell";

// LIB =================================================================================================================
import { formatPeriod } from "@/lib/api/catalogue";
import { KEY_SEP, SdmxPivot } from "@/lib/tables/sdmx-pivot";
import { ColumnFilter, ColumnKind, SortState, compareCells, isActive, matches, nextSort } from "@/lib/tables/column-filters";

// STYLES ==============================================================================================================
import "./data-table.css";

export const MAX_SERIES_ACROSS = 60;
const LONG_PAGE  = 200;
const PERIOD_COL = "period";
const VALUE_COL  = "value";

interface SeriesTableProps {
    pivot : SdmxPivot;
    find  : string;     // narrows the series to those whose labels contain this text
}

// Figures the way the site prints them: Indian grouping, decimals only where the value has them.
export const formatValue = (v : number | null) : string => {
    if (v == null) return "–";
    const decimals = Math.abs(v) >= 1000 ? 2 : 4;
    return v.toLocaleString("en-IN", { maximumFractionDigits : decimals });
};

const labelMatches = (labels : string[], needle : string) : boolean => labels.some(l => l.toLowerCase().includes(needle));

export const SeriesTable = ({ pivot, find } : SeriesTableProps) => {
    const needle = find.trim().toLowerCase();
    const [ page,    setPage ]    = useState(0);
    const [ filters, setFilters ] = useState<Record<string, ColumnFilter>>({});
    const [ sort,    setSort ]    = useState<SortState | null>(null);

    const onSort   = (column : string) => setSort(s => nextSort(s, column));
    const onFilter = (column : string, f : ColumnFilter | null) => setFilters(all => {
        const next = { ...all };
        if (f) next[column] = f;
        else delete next[column];
        return next;
    });
    const clearAll = () => { setFilters({}); setSort(null); };
    const activeFilters = useMemo(() => Object.entries(filters).filter(([ , f ]) => isActive(f)), [ filters ]);

    // The series to show, with their column index into the values.
    const shown = useMemo(() => {
        const all = pivot.series.map((s, i) => ({ ...s, index : i }));
        return needle ? all.filter(s => labelMatches(s.labels, needle)) : all;
    }, [ pivot, needle ]);

    const wide = shown.length <= MAX_SERIES_ACROSS;

    // Header rows for the wide form: one per varying dimension; above the leaf row a heading spans the neighbours
    // it shares every level above with. The leaf row stays one cell per series so each can sort and filter.
    const headerRows = useMemo(() => {
        if (!wide) return [];
        return pivot.varying.map((_, level) => {
            const isLeaf = level === pivot.varying.length - 1;
            const cells : { text : string; group : string; span : number }[] = [];
            for (const s of shown) {
                const group = isLeaf ? s.key : s.labels.slice(0, level + 1).join(KEY_SEP);
                const last  = cells[cells.length - 1];
                if (!isLeaf && last && last.group === group) last.span++;
                else cells.push({ text : s.labels[level], group, span : 1 });
            }
            return cells;
        });
    }, [ pivot, shown, wide ]);

    // Wide form rows: periods, filtered by the period and series columns, sorted by one of them.
    const periodRows = useMemo(() => {
        if (!wide) return [];
        const kindOf = (col : string) : ColumnKind => (col === PERIOD_COL ? "date" : "number");
        const cellOf = (p : number, col : string) : string | number | null => {
            if (col === PERIOD_COL) return pivot.periods[p];
            const s = pivot.series.findIndex(x => x.key === col);
            return s >= 0 ? pivot.values[p][s] : null;
        };
        let rows = pivot.periods.map((_, p) => p);
        if (activeFilters.length > 0) rows = rows.filter(p => activeFilters.every(([ col, f ]) => matches(kindOf(col), f, cellOf(p, col))));
        if (sort) rows = [ ...rows ].sort((a, b) => compareCells(kindOf(sort.column), cellOf(a, sort.column), cellOf(b, sort.column), sort.direction));
        return rows;
    }, [ pivot, wide, activeFilters, sort ]);

    // The long form: one line per observation, newest first, filtered, sorted and paged.
    const longRows = useMemo(() => {
        if (wide) return [];
        const out : { period : string; labels : string[]; value : number | null }[] = [];
        pivot.periods.forEach((period, p) => {
            for (const s of shown) {
                const v = pivot.values[p][s.index];
                if (v != null) out.push({ period, labels : s.labels, value : v });
            }
        });
        const kindOf = (col : string) : ColumnKind => (col === PERIOD_COL ? "date" : col === VALUE_COL ? "number" : "text");
        const cellOf = (row : typeof out[number], col : string) : string | number | null => {
            if (col === PERIOD_COL) return row.period;
            if (col === VALUE_COL) return row.value;
            const d = pivot.varying.findIndex(v => `dim:${v.dim}` === col);
            return d >= 0 ? row.labels[d] : null;
        };
        let rows = out;
        if (activeFilters.length > 0) rows = rows.filter(row => activeFilters.every(([ col, f ]) => matches(kindOf(col), f, cellOf(row, col))));
        if (sort) rows = [ ...rows ].sort((a, b) => compareCells(kindOf(sort.column), cellOf(a, sort.column), cellOf(b, sort.column), sort.direction));
        return rows;
    }, [ pivot, shown, wide, activeFilters, sort ]);
    const pages   = Math.max(1, Math.ceil(longRows.length / LONG_PAGE));
    const current = Math.min(page, pages - 1);

    const filteredNote = (shownRows : number, totalRows : number) => (activeFilters.length > 0 || sort) && (
        <div className="data-table-filtered-note">
            {shownRows.toLocaleString("en-IN")} of {totalRows.toLocaleString("en-IN")} rows
            {activeFilters.length > 0 ? ` match ${activeFilters.length} column filter${activeFilters.length > 1 ? "s" : ""}` : ""}
            {sort ? `, sorted ${sort.direction === "asc" ? "ascending" : "descending"}` : ""}
            {" · "}
            <button type="button" className="popover-clear" onClick={clearAll}>Clear filters and sort</button>
        </div>
    );

    return (
        <div className="data-table-block">
            {pivot.context.length > 0 && (
                <div className="data-table-head">
                    <div className="data-table-context">
                        {pivot.context.map(c => <span key={c.name}><b>{c.name}</b> {c.value}</span>)}
                    </div>
                </div>
            )}

            {shown.length === 0 ? (
                <div className="data-table-empty">No series matches “{find.trim()}”.</div>
            ) : wide ? (
                <>
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                {headerRows.length === 0 ? (
                                    <tr>
                                        <HeaderCell column={PERIOD_COL} label="Period" kind="date" sort={sort} filter={filters[PERIOD_COL]} onSort={onSort} onFilter={onFilter} />
                                        <HeaderCell column={shown[0].key} label="Value" kind="number" sort={sort} filter={filters[shown[0].key]} onSort={onSort} onFilter={onFilter} className="num" />
                                    </tr>
                                ) : headerRows.map((cells, level) => {
                                    const isLeaf = level === headerRows.length - 1;
                                    return (
                                        <tr key={level}>
                                            {level === 0 && (
                                                <HeaderCell column={PERIOD_COL} label="Period" kind="date" sort={sort} filter={filters[PERIOD_COL]} onSort={onSort} onFilter={onFilter} rowSpan={headerRows.length} />
                                            )}
                                            {cells.map((cell, i) => isLeaf ? (
                                                <HeaderCell
                                                    key={cell.group}
                                                    column={cell.group}
                                                    label={cell.text}
                                                    kind="number"
                                                    sort={sort}
                                                    filter={filters[cell.group]}
                                                    onSort={onSort}
                                                    onFilter={onFilter}
                                                    className="num"
                                                />
                                            ) : (
                                                <th key={i} colSpan={cell.span > 1 ? cell.span : undefined} className={cell.span > 1 ? undefined : "num"}>
                                                    {cell.text}
                                                </th>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </thead>
                            <tbody>
                                {periodRows.map(p => (
                                    <tr key={pivot.periods[p]}>
                                        <th scope="row" className="period">{formatPeriod(pivot.periods[p])}</th>
                                        {shown.map(s => {
                                            const v = pivot.values[p][s.index];
                                            return <td key={s.key} className={v == null ? "num empty" : "num"}>{formatValue(v)}</td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {periodRows.length === 0 && <div className="data-table-empty">No period matches the filters.</div>}
                    </div>
                    {filteredNote(periodRows.length, pivot.periods.length)}
                </>
            ) : (
                <>
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <HeaderCell column={PERIOD_COL} label="Period" kind="date" sort={sort} filter={filters[PERIOD_COL]} onSort={onSort} onFilter={onFilter} />
                                    {pivot.varying.map(d => (
                                        <HeaderCell key={d.dim} column={`dim:${d.dim}`} label={d.name} kind="text" sort={sort} filter={filters[`dim:${d.dim}`]} onSort={onSort} onFilter={onFilter} />
                                    ))}
                                    <HeaderCell column={VALUE_COL} label="Value" kind="number" sort={sort} filter={filters[VALUE_COL]} onSort={onSort} onFilter={onFilter} className="num" />
                                </tr>
                            </thead>
                            <tbody>
                                {longRows.slice(current * LONG_PAGE, (current + 1) * LONG_PAGE).map((row, i) => (
                                    <tr key={i}>
                                        <th scope="row" className="period">{formatPeriod(row.period)}</th>
                                        {row.labels.map((l, j) => <td key={j}>{l}</td>)}
                                        <td className="num">{formatValue(row.value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {longRows.length === 0 && <div className="data-table-empty">No observation matches the filters.</div>}
                    </div>
                    {filteredNote(longRows.length, pivot.observations)}
                    <div className="data-table-pager">
                        <span>
                            {shown.length.toLocaleString("en-IN")} series, listed one observation per line because there are too
                            many to lay across; narrow them with the selects above.
                        </span>
                        <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</button>
                        <span>{current + 1} of {pages}</span>
                        <button type="button" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next</button>
                    </div>
                </>
            )}
        </div>
    );
};

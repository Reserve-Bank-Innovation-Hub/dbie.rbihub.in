"use client";

// A DBIE report, as the table it is: its title and unit above, its header rows (with their spans) kept, DBIE's
// column numbers as a quiet line under them, row labels held in place while the figures scroll, notes below.
// Every column sorts and filters from its header, as Pratirupa's tables do.

// REACT CORE ==========================================================================================================
import React, { useMemo, useState } from "react";

// LOCAL COMPONENTS ====================================================================================================
import { HeaderCell } from "./HeaderCell";

// LIB =================================================================================================================
import { ReportGrid, isNumeric } from "@/lib/tables/report-grid";
import { ColumnFilter, ColumnKind, SortState, compareCells, detectKind, isActive, matches, nextSort } from "@/lib/tables/column-filters";

// STYLES ==============================================================================================================
import "./data-table.css";

interface ReportTableProps {
    grid : ReportGrid;
    find : string;     // narrows the body to rows containing this text
}

const key = (c : number) : string => `c${c}`;

export const ReportTable = ({ grid, find } : ReportTableProps) => {
    const [ filters, setFilters ] = useState<Record<string, ColumnFilter>>({});
    const [ sort,    setSort ]    = useState<SortState | null>(null);

    // What each column holds decides its filter: figures get number conditions, the rest text ones.
    const kinds = useMemo<ColumnKind[]>(
        () => Array.from({ length : grid.width }, (_, c) => (c === 0 ? "text" : detectKind(grid.body.map(row => row[c])))),
        [ grid ],
    );

    const needle = find.trim().toLowerCase();
    const activeFilters = useMemo(() => Object.entries(filters).filter(([ , f ]) => isActive(f)), [ filters ]);

    const body = useMemo(() => {
        let rows = grid.body;
        if (needle) rows = rows.filter(row => row.some(cell => cell.toLowerCase().includes(needle)));
        if (activeFilters.length > 0) {
            rows = rows.filter(row => activeFilters.every(([ k, f ]) => {
                const c = Number(k.slice(1));
                return matches(kinds[c], f, row[c]);
            }));
        }
        if (sort) {
            const c = Number(sort.column.slice(1));
            rows = [ ...rows ].sort((a, b) => compareCells(kinds[c], a[c], b[c], sort.direction));
        }
        return rows;
    }, [ grid, needle, activeFilters, sort, kinds ]);

    const onSort   = (column : string) => setSort(s => nextSort(s, column));
    const onFilter = (column : string, f : ColumnFilter | null) => setFilters(all => {
        const next = { ...all };
        if (f) next[column] = f;
        else delete next[column];
        return next;
    });
    const clearAll = () => { setFilters({}); setSort(null); };

    // The header row that carries the controls: the leaf row, or one made of the column letters' worth of blanks.
    const leaf = grid.header.length > 0 ? grid.header[grid.header.length - 1] : Array.from({ length : grid.width }, () => ({ text : "", span : 1 }));
    const upper = grid.header.length > 0 ? grid.header.slice(0, -1) : [];

    return (
        <div className="data-table-block">
            {(grid.title || grid.subtitles.length > 0) && (
                <div className="data-table-head">
                    {grid.title && <div className="data-table-title">{grid.title}</div>}
                    {grid.subtitles.map((line, i) => <div key={i} className="data-table-sub">{line}</div>)}
                </div>
            )}

            <div className="data-table-wrap">
                <table className="data-table">
                    <thead>
                        {upper.map((row, r) => (
                            <tr key={r}>
                                {row.map((cell, c) => (
                                    <th key={c} colSpan={cell.span > 1 ? cell.span : undefined} className={isNumeric(cell.text) ? "num" : undefined}>
                                        {cell.text}
                                    </th>
                                ))}
                            </tr>
                        ))}
                        <tr>
                            {leaf.map((cell, c) => (
                                <HeaderCell
                                    key={c}
                                    column={key(c)}
                                    label={cell.text}
                                    kind={kinds[c]}
                                    sort={sort}
                                    filter={filters[key(c)]}
                                    onSort={onSort}
                                    onFilter={onFilter}
                                    className={kinds[c] === "number" ? "num" : undefined}
                                />
                            ))}
                        </tr>
                        {grid.numbering && (
                            <tr className="numbering">
                                {grid.numbering.map((n, c) => <th key={c}>{n}</th>)}
                            </tr>
                        )}
                    </thead>

                    <tbody>
                        {body.map((row, r) => {
                            const subrow = row[0] === "" && row.every(cell => cell === "" || isNumeric(cell));
                            return (
                                <tr key={r} className={subrow ? "is-subrow" : undefined}>
                                    {row.map((cell, c) => {
                                        if (c === 0) return <th key={c} scope="row">{cell}</th>;
                                        const numeric = isNumeric(cell);
                                        return (
                                            <td key={c} className={numeric ? "num" : cell === "" ? "empty" : undefined}>
                                                {cell}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {body.length === 0 && (
                    <div className="data-table-empty">
                        {needle || activeFilters.length > 0 ? "No row matches the filters." : "This tab has no rows of figures."}
                    </div>
                )}
            </div>

            {(activeFilters.length > 0 || sort) && (
                <div className="data-table-filtered-note">
                    {body.length.toLocaleString("en-IN")} of {grid.body.length.toLocaleString("en-IN")} rows
                    {activeFilters.length > 0 ? ` match ${activeFilters.length} column filter${activeFilters.length > 1 ? "s" : ""}` : ""}
                    {sort ? `, sorted by column ${Number(sort.column.slice(1)) + 1} ${sort.direction === "asc" ? "ascending" : "descending"}` : ""}
                    {" · "}
                    <button type="button" className="popover-clear" onClick={clearAll}>Clear filters and sort</button>
                </div>
            )}

            {grid.notes.length > 0 && (
                <div className="data-table-notes">
                    {grid.notes.map((note, i) => <p key={i}>{note}</p>)}
                </div>
            )}
        </div>
    );
};

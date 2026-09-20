"use client";

// A table header cell that sorts and filters its column, the way every column of Pratirupa's DataGrid does:
// click the name to sort (ascending, descending, off), click the funnel for the column's filter, which opens in
// a small popover with a condition and a value. The funnel stays lit while a filter is on.

// REACT CORE ==========================================================================================================
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// UI ==================================================================================================================
import { ArrowDown, ArrowUp, Filter, X } from "lucide-react";

// HOOKS ===============================================================================================================
import { useClickOutside } from "@/hooks/useClickOutside";

// LIB =================================================================================================================
import {
    ColumnFilter,
    ColumnKind,
    DATE_OPS,
    NUMBER_OPS,
    SortState,
    TEXT_OPS,
    defaultFilter,
    isActive,
} from "@/lib/tables/column-filters";

interface HeaderCellProps {
    column     : string;                 // the column's key
    label      : React.ReactNode;
    kind       : ColumnKind;
    sort       : SortState | null;
    filter   ? : ColumnFilter;
    onSort     : (column : string) => void;
    onFilter   : (column : string, filter : ColumnFilter | null) => void;
    className? : string;
    colSpan  ? : number;
    rowSpan  ? : number;
    scope    ? : "col" | "row";
}

const opsFor = (kind : ColumnKind) => (kind === "number" ? NUMBER_OPS : kind === "date" ? DATE_OPS : TEXT_OPS);

export const HeaderCell = ({ column, label, kind, sort, filter, onSort, onFilter, className, colSpan, rowSpan, scope = "col" } : HeaderCellProps) => {
    const [ open, setOpen ] = useState(false);
    const [ pos,  setPos ]  = useState<{ top : number; left : number } | null>(null);
    const buttonRef  = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const sorted = sort?.column === column ? sort.direction : null;
    const active = isActive(filter);
    const draft  = filter ?? defaultFilter(kind);

    // The popover is drawn outside the scrolling table, under the funnel.
    const place = useCallback(() => {
        const r = buttonRef.current?.getBoundingClientRect();
        if (!r) return;
        const width = 280;
        setPos({ top : r.bottom + 6, left : Math.max(8, Math.min(r.left, window.innerWidth - width - 8)) });
    }, []);

    const toggle = (e : React.MouseEvent) => {
        e.stopPropagation();
        if (!open) place();
        setOpen(o => !o);
    };

    const close = useCallback(() => setOpen(false), []);
    useClickOutside(popoverRef, useCallback((e : MouseEvent | TouchEvent) => {
        if (buttonRef.current?.contains(e.target as Node)) return;
        close();
    }, [ close ]));

    useEffect(() => {
        if (!open) return;
        const onKey = (e : KeyboardEvent) => { if (e.key === "Escape") close(); };
        const onMove = () => place();
        window.addEventListener("keydown", onKey);
        window.addEventListener("resize", onMove);
        window.addEventListener("scroll", onMove, true);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("resize", onMove);
            window.removeEventListener("scroll", onMove, true);
        };
    }, [ open, close, place ]);

    const update = (patch : Partial<ColumnFilter>) => onFilter(column, { ...draft, ...patch });
    const needsValue = draft.op !== "blank" && draft.op !== "notBlank";
    const inputType  = kind === "number" ? "number" : kind === "date" ? "date" : "text";

    return (
        <th className={`${className ?? ""} header-cell ${sorted ? "is-sorted" : ""} ${active ? "is-filtered" : ""}`} colSpan={colSpan} rowSpan={rowSpan} scope={scope} aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}>
            <span className="header-inner">
                <button type="button" className="header-sort" onClick={() => onSort(column)} title="Sort">
                    <span className="header-label">{label}</span>
                    {sorted === "asc"  && <ArrowUp className="sort-icon" size={12} />}
                    {sorted === "desc" && <ArrowDown className="sort-icon" size={12} />}
                </button>

                <button
                    ref={buttonRef}
                    type="button"
                    className={`header-filter ${active ? "is-active" : ""} ${open ? "is-open" : ""}`}
                    onClick={toggle}
                    aria-label="Filter this column"
                    aria-expanded={open}
                    title="Filter"
                >
                    <Filter size={12} />
                </button>
            </span>

            {open && typeof document !== "undefined" && pos && createPortal(
                <div ref={popoverRef} className="column-filter-popover" style={{ top : pos.top, left : pos.left }} role="dialog" aria-label="Column filter">
                    <div className="popover-head">
                        <span>Filter</span>
                        <button type="button" className="popover-close" onClick={close} aria-label="Close"><X size={14} /></button>
                    </div>

                    <select value={draft.op} onChange={e => update({ op : e.target.value as ColumnFilter["op"] })}>
                        {opsFor(kind).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>

                    {needsValue && (
                        <input
                            type={inputType}
                            value={draft.value}
                            placeholder={draft.op === "inRange" ? "From" : kind === "text" ? "Text" : ""}
                            autoFocus
                            onChange={e => update({ value : e.target.value })}
                        />
                    )}

                    {draft.op === "inRange" && (
                        <input type={inputType} value={draft.value2} placeholder="To" onChange={e => update({ value2 : e.target.value })} />
                    )}

                    <div className="popover-actions">
                        <button type="button" className="popover-clear" disabled={!active} onClick={() => { onFilter(column, null); close(); }}>
                            Clear filter
                        </button>
                    </div>
                </div>,
                document.body,
            )}
        </th>
    );
};

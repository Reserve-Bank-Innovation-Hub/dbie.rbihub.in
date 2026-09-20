// Per-column filtering and sorting for the site's tables, with the conditions AG Grid's column filters offer
// (the ones Pratirupa's DataGrid turns on for every column): text columns match by contains, equals, starts
// with and so on; figure columns by equals, greater than, less than, between; period columns by before, after,
// between. Everything runs on the rows already on screen.

export type ColumnKind = "text" | "number" | "date";

export type TextOp   = "contains" | "notContains" | "equals" | "notEqual" | "startsWith" | "endsWith" | "blank" | "notBlank";
export type NumberOp = "equals" | "notEqual" | "greaterThan" | "greaterThanOrEqual" | "lessThan" | "lessThanOrEqual" | "inRange" | "blank" | "notBlank";
export type DateOp   = "equals" | "before" | "after" | "inRange";

export interface ColumnFilter {
    op     : TextOp | NumberOp | DateOp;
    value  : string;     // text, a number as typed, or YYYY-MM-DD
    value2 : string;     // the upper bound of a range
}

export const TEXT_OPS : { value : TextOp; label : string }[] = [
    { value : "contains",    label : "Contains" },
    { value : "notContains", label : "Does not contain" },
    { value : "equals",      label : "Equals" },
    { value : "notEqual",    label : "Does not equal" },
    { value : "startsWith",  label : "Starts with" },
    { value : "endsWith",    label : "Ends with" },
    { value : "blank",       label : "Is blank" },
    { value : "notBlank",    label : "Is not blank" },
];

export const NUMBER_OPS : { value : NumberOp; label : string }[] = [
    { value : "equals",             label : "Equals" },
    { value : "notEqual",           label : "Does not equal" },
    { value : "greaterThan",        label : "Greater than" },
    { value : "greaterThanOrEqual", label : "Greater than or equal to" },
    { value : "lessThan",           label : "Less than" },
    { value : "lessThanOrEqual",    label : "Less than or equal to" },
    { value : "inRange",            label : "Between" },
    { value : "blank",              label : "Is blank" },
    { value : "notBlank",           label : "Is not blank" },
];

export const DATE_OPS : { value : DateOp; label : string }[] = [
    { value : "equals",  label : "On" },
    { value : "before",  label : "Before" },
    { value : "after",   label : "After" },
    { value : "inRange", label : "Between" },
];

export const defaultFilter = (kind : ColumnKind) : ColumnFilter => ({
    op     : kind === "number" ? "equals" : kind === "date" ? "after" : "contains",
    value  : "",
    value2 : "",
});

const needsNoValue = (op : string) : boolean => op === "blank" || op === "notBlank";

// A filter that would change nothing is not active.
export const isActive = (f : ColumnFilter | undefined) : f is ColumnFilter =>
    !!f && (needsNoValue(f.op) || f.value.trim() !== "" || (f.op === "inRange" && f.value2.trim() !== ""));

// "1,82,950", "(4.0)", "41,24,767*", "3.2%", "-12.5" as numbers; "–", "..", "NA" and text as null.
export function parseNumber(s : string | number | null | undefined) : number | null {
    if (s == null || s === "") return null;
    if (typeof s === "number") return Number.isFinite(s) ? s : null;
    const cleaned = s.replace(/[,\s*#@†^%()]/g, "").replace(/^[–]/, "-");
    if (cleaned === "" || cleaned === "-" || cleaned === "..") return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
}

// Whether a cell passes the filter. Text is compared case-insensitively; dates as YYYY-MM-DD strings.
export function matches(kind : ColumnKind, f : ColumnFilter, cell : string | number | null | undefined) : boolean {
    const text = cell == null ? "" : String(cell);
    if (f.op === "blank")    return text.trim() === "";
    if (f.op === "notBlank") return text.trim() !== "";
    if (!isActive(f)) return true;

    if (kind === "number") {
        const n = parseNumber(cell);
        const a = parseNumber(f.value);
        const b = parseNumber(f.value2);
        if (n == null) return false;
        switch (f.op) {
            case "equals":             return a != null && n === a;
            case "notEqual":           return a != null && n !== a;
            case "greaterThan":        return a != null && n > a;
            case "greaterThanOrEqual": return a != null && n >= a;
            case "lessThan":           return a != null && n < a;
            case "lessThanOrEqual":    return a != null && n <= a;
            case "inRange":            return (a == null || n >= a) && (b == null || n <= b);
            default:                   return true;
        }
    }

    if (kind === "date") {
        const d = text;
        switch (f.op) {
            case "equals":  return d === f.value;
            case "before":  return f.value !== "" && d < f.value;
            case "after":   return f.value !== "" && d > f.value;
            case "inRange": return (f.value === "" || d >= f.value) && (f.value2 === "" || d <= f.value2);
            default:        return true;
        }
    }

    const hay    = text.toLowerCase();
    const needle = f.value.trim().toLowerCase();
    switch (f.op) {
        case "contains":    return hay.includes(needle);
        case "notContains": return !hay.includes(needle);
        case "equals":      return hay === needle;
        case "notEqual":    return hay !== needle;
        case "startsWith":  return hay.startsWith(needle);
        case "endsWith":    return hay.endsWith(needle);
        default:            return true;
    }
}

export type SortDirection = "asc" | "desc";

export interface SortState {
    column    : string;
    direction : SortDirection;
}

// Click on a header: none → ascending → descending → none, AG Grid's cycle.
export const nextSort = (current : SortState | null, column : string) : SortState | null => {
    if (!current || current.column !== column) return { column, direction : "asc" };
    if (current.direction === "asc") return { column, direction : "desc" };
    return null;
};

// Compares two cells of a column: figures as numbers, dates and text as strings; blanks last either way.
export function compareCells(kind : ColumnKind, a : string | number | null | undefined, b : string | number | null | undefined, direction : SortDirection) : number {
    const sign = direction === "asc" ? 1 : -1;
    if (kind === "number") {
        const x = parseNumber(a);
        const y = parseNumber(b);
        if (x == null && y == null) return 0;
        if (x == null) return 1;
        if (y == null) return -1;
        return (x - y) * sign;
    }
    const x = a == null ? "" : String(a);
    const y = b == null ? "" : String(b);
    if (x === "" && y === "") return 0;
    if (x === "") return 1;
    if (y === "") return -1;
    return x.localeCompare(y, "en", { numeric : true, sensitivity : "base" }) * sign;
}

// A column is a figure column when most of what it holds is a figure.
export function detectKind(cells : (string | number | null | undefined)[]) : ColumnKind {
    let filled = 0;
    let numeric = 0;
    for (const c of cells) {
        const t = c == null ? "" : String(c).trim();
        if (t === "") continue;
        filled++;
        if (parseNumber(t) != null) numeric++;
    }
    return filled > 0 && numeric / filled >= 0.6 ? "number" : "text";
}

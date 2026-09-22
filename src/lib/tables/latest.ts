// The newest row of a table that actually carries a field, for the stat cards on the curated pages.
//
// The tables are newest-first, so a card used to read row 0. DBIE publishes some columns of a table a period or
// two behind the rest — Table 7's M3 total lags its credit components, for one — so row 0 can be partial and a
// card taken from it reads "—" while the series itself is fine. Each card therefore takes the newest row in which
// its own field is set, and is labelled with that row's period rather than the table's.

export function newestWith<T>(rows : T[] | null | undefined, value : (row : T) => unknown) : T | null {
    for (const row of rows ?? []) {
        const v = value(row);
        if (v != null) return row;
    }
    return null;
}

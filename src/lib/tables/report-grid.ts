// DBIE's report exports are spreadsheets: a few single-cell rows on top (the title, a subtitle, the unit), one or
// more header rows, often a row numbering the columns (1, 2, 3 …), the body, and notes at the end. This reads
// that structure back out of the rows the database holds (src_file, tab, period, row_no, c1..cN, or one cells
// array), so a report can be shown as the table it is rather than as a grid of lettered cells.

export interface HeaderCell {
    text : string;
    span : number;      // columns the cell covers: a heading followed by empty cells spans them
}

export interface ReportGrid {
    title     : string;
    subtitles : string[];           // the other preamble lines: a subtitle, the unit
    header    : HeaderCell[][];     // header rows, top to bottom; the last is the leaf row
    numbering : string[] | null;    // DBIE's column numbers, when the export has them
    body      : string[][];         // data rows, each `width` cells
    notes     : string[];
    width     : number;             // columns in use
}

// One line of text per cell: line breaks inside a heading become spaces.
const clean = (v : unknown) : string => (v == null ? "" : String(v).replace(/\s+/g, " ").trim());

// "1,82,950", "(4.0)", "-12.5", "41,24,767*", "3.2%": what DBIE prints where a number goes.
export const isNumeric = (s : string) : boolean => /\d/.test(s) && /^\(?[-–+]?(\d[\d,]*)?(\.\d+)?\)?[*#@†^]*%?$/.test(s);

// "1 2 3 4 …" or "(1) (2) (3) …", counting up.
const isNumberingRow = (cells : string[]) : boolean => {
    const filled = cells.filter(Boolean);
    if (filled.length < 2) return false;
    let expect : number | null = null;
    for (const c of filled) {
        const m = c.match(/^\(?(\d{1,4})\)?$/);
        if (!m) return false;
        const n = Number(m[1]);
        if (expect != null && n !== expect) return false;
        expect = n + 1;
    }
    return true;
};

const NOTE = /^(notes?\b|source\b|\*|#|@|†|\(\*|see\b|figures\b)/i;

const filled = (row : string[]) : number => row.filter(Boolean).length;

export function parseReportGrid(columns : string[], rows : unknown[][], width ? : number) : ReportGrid {
    const cellsAt = columns.indexOf("cells");
    const firstC  = columns.findIndex(c => /^c\d+$/.test(c));
    const grid : string[][] = rows.map(r => {
        const cells = cellsAt >= 0 ? ((r[cellsAt] as unknown[] | null) ?? []) : r.slice(firstC);
        return cells.map(clean);
    });

    // Only the columns anything uses.
    let used = 0;
    for (const row of grid) {
        for (let i = row.length - 1; i >= 0; i--) {
            if (row[i]) { used = Math.max(used, i + 1); break; }
        }
    }
    const w = used || width || 1;
    const norm = grid.map(row => {
        const out = row.slice(0, w);
        while (out.length < w) out.push("");
        return out;
    });

    // Preamble: leading rows with at most one cell.
    let i = 0;
    const preamble : string[] = [];
    while (i < norm.length && filled(norm[i]) <= 1) {
        const text = norm[i].find(Boolean);
        if (text) preamble.push(text);
        i++;
    }

    // Header: the first row, then rows without a row label and without figures, until the numbering row.
    const header : string[][] = [];
    let numbering : string[] | null = null;
    if (i < norm.length && !isNumberingRow(norm[i])) {
        header.push(norm[i]);
        i++;
    }
    while (i < norm.length) {
        const row = norm[i];
        if (isNumberingRow(row)) {
            numbering = row;
            i++;
            break;
        }
        if (row[0] === "" && filled(row) > 0 && !row.some(isNumeric)) {
            header.push(row);
            i++;
            continue;
        }
        break;
    }

    // Notes: trailing rows that are a sentence rather than figures.
    let end = norm.length;
    const notes : string[] = [];
    while (end > i) {
        const row  = norm[end - 1];
        const n    = filled(row);
        const text = row.find(Boolean) ?? "";
        if (n === 0) { end--; continue; }
        if ((n === 1 && !isNumeric(text)) || NOTE.test(text)) {
            notes.unshift(row.filter(Boolean).join(" "));
            end--;
            continue;
        }
        break;
    }

    const body = norm.slice(i, end).filter(row => filled(row) > 0);

    // Spans: in the rows above the leaf row, a heading covers the empty cells after it.
    const headerCells : HeaderCell[][] = header.map((row, r) => {
        if (r === header.length - 1) return row.map(text => ({ text, span : 1 }));
        const out : HeaderCell[] = [];
        let c = 0;
        while (c < w) {
            let span = 1;
            while (c + span < w && row[c + span] === "") span++;
            out.push({ text : row[c], span });
            c += span;
        }
        return out;
    });

    return {
        title     : preamble[0] ?? "",
        subtitles : preamble.slice(1),
        header    : headerCells,
        numbering,
        body,
        notes,
        width     : w,
    };
}

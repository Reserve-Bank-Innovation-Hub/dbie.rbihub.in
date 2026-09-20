// An SDMX table holds one row per observation: dimension codes, a period, a value. Read as a table, it is a
// time series: periods down the side, one column per combination of the dimensions that vary in the rows on
// show, and the dimensions that do not vary (the unit, the frequency) stated once above it.

// LIB =================================================================================================================
import { Codelist } from "@/lib/api/tables";

export interface PivotDimension {
    dim  : string;     // the column, e.g. comp_rn
    name : string;     // DBIE's name for it, e.g. Components
}

export interface PivotSeries {
    key    : string;
    labels : string[];   // one per varying dimension
}

export interface SdmxPivot {
    context      : { name : string; value : string }[];   // dimensions with one value across the rows
    varying      : PivotDimension[];
    series       : PivotSeries[];                          // the columns, in DBIE's code-list order
    periods      : string[];                               // newest first
    values       : (number | null)[][];                    // values[period][series]
    observations : number;
}

const DIMENSION_NAMES : Record<string, string> = {
    unit_measure : "Unit",
    freq         : "Frequency",
    unit_mult    : "Multiplier",
};

// Joins the parts of a key; a character no label contains.
export const KEY_SEP = String.fromCharCode(31);

export const dimensionName = (dim : string, codelists : Record<string, Codelist>) : string =>
    codelists[dim]?.dim_name || DIMENSION_NAMES[dim] || dim.toUpperCase();

const multiplierLabel = (n : unknown) : string => {
    const p = Number(n);
    if (!Number.isFinite(p) || p === 0) return "units";
    return `× 10^${p}`;
};

const toNumber = (v : unknown) : number | null => {
    if (v == null || v === "") return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
};

export function pivotSdmx(columns : string[], rows : unknown[][], dimensions : string[], codelists : Record<string, Codelist>) : SdmxPivot {
    const at = (name : string) : number => columns.indexOf(name);
    const periodAt = at("time_period");
    const valueAt  = at("obs_value");

    // Every dimension, plus the multiplier when the rows use more than one.
    const dims = [ ...dimensions ];
    if (at("unit_mult") >= 0 && !dims.includes("unit_mult")) dims.push("unit_mult");

    const codeAt  = Object.fromEntries(dims.map(d => [ d, at(d) ]));
    const labelAt = Object.fromEntries(dims.map(d => [ d, at(`${d}_label`) ]));
    const codeOf  = (row : unknown[], d : string) : string => String(row[codeAt[d]] ?? "");
    const labelOf = (row : unknown[], d : string) : string => {
        if (d === "unit_mult") return multiplierLabel(row[codeAt[d]]);
        const code = codeOf(row, d);
        if (code === "N_A") return "–";    // DBIE's placeholder where a dimension does not apply
        const l = labelAt[d] >= 0 ? row[labelAt[d]] : null;
        return l != null && l !== "" ? String(l) : code;
    };

    // Which dimensions vary.
    const seen : Record<string, Map<string, string>> = Object.fromEntries(dims.map(d => [ d, new Map() ]));
    for (const row of rows) {
        for (const d of dims) {
            if (codeAt[d] < 0) continue;
            const code = codeOf(row, d);
            if (!seen[d].has(code)) seen[d].set(code, labelOf(row, d));
        }
    }
    // Fixed dimensions are stated above the table, except the ones that say nothing: a code of N_A, the
    // frequency (the page shows it), a multiplier of 1.
    const context : SdmxPivot["context"] = [];
    const varying : PivotDimension[] = [];
    for (const d of dims) {
        if (codeAt[d] < 0) continue;
        const name = dimensionName(d, codelists);
        if (seen[d].size <= 1) {
            const [ code, value ] = seen[d].entries().next().value ?? [ "", "" ];
            const silent = code === "N_A" || d === "freq" || (d === "unit_mult" && value === "units");
            if (value && !silent) context.push({ name, value });
        } else {
            varying.push({ dim : d, name });
        }
    }

    // Series in DBIE's order: each dimension's codes as its code list lists them.
    const rank : Record<string, Map<string, number>> = {};
    for (const { dim } of varying) {
        const list = codelists[dim]?.values ?? [];
        rank[dim] = new Map(list.map((v, i) => [ v.code, i ]));
    }
    const seriesByKey = new Map<string, { labels : string[]; ranks : number[] }>();
    const periodSet   = new Set<string>();
    const cells       = new Map<string, number | null>();
    for (const row of rows) {
        const codes = varying.map(({ dim }) => codeOf(row, dim));
        const key   = codes.join(KEY_SEP);
        if (!seriesByKey.has(key)) {
            seriesByKey.set(key, {
                labels : varying.map(({ dim }) => labelOf(row, dim)),
                ranks  : varying.map(({ dim }, i) => rank[dim].get(codes[i]) ?? Number.MAX_SAFE_INTEGER),
            });
        }
        const period = String(row[periodAt] ?? "");
        periodSet.add(period);
        cells.set(period + KEY_SEP + key, toNumber(row[valueAt]));
    }
    const series : PivotSeries[] = [ ...seriesByKey.entries() ]
        .sort((a, b) => {
            for (let i = 0; i < a[1].ranks.length; i++) {
                if (a[1].ranks[i] !== b[1].ranks[i]) return a[1].ranks[i] - b[1].ranks[i];
            }
            return a[1].labels.join().localeCompare(b[1].labels.join());
        })
        .map(([ key, s ]) => ({ key, labels : s.labels }));
    const periods = [ ...periodSet ].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
    const values  = periods.map(p => series.map(s => cells.get(p + KEY_SEP + s.key) ?? null));

    return { context, varying, series, periods, values, observations : rows.length };
}

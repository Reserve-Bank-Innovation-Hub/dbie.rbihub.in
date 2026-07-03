// Generic SDMX series payload — produced by the SDMX processor for each DSD.
// Slug = catalogue path basename minus ".csv".
//
// Two modes:
//   "wide" (≤100 series) — column-major: values[colIdx][dateIdx], dates ascending.
//   "long" (>100 series) — row array: [dim0, dim1, …, unit, date, value] per observation.
//
// Older payloads (pre-dual-mode) lack a `mode` field — client-side fetch code should
// treat them as "wide" (same coercion as the former server loader did).

// ---------------------------------------------------------------------------------------------------------------------
// Shared fields
// ---------------------------------------------------------------------------------------------------------------------
interface SdmxSeriesBase {
    slug      : string;
    label     : string;
    sector    : string;
    subSector : string;
    frequency : string;
    dsdCode   : string;
    chartable : boolean;
    footnotes : string[];
}

// ---------------------------------------------------------------------------------------------------------------------
// Wide mode (columns/dates/values)
// ---------------------------------------------------------------------------------------------------------------------
export interface SdmxSeriesColumn {
    key      : string;   // dimension key (e.g. "EUR")
    label    : string;   // human-readable label
    unit     : string;   // e.g. "INR", "N_A"
    unitMult : number;   // power-of-10 multiplier (0 = units as-is)
}

export interface SdmxWidePayload extends SdmxSeriesBase {
    mode    : "wide";
    columns : SdmxSeriesColumn[];
    dates   : string[];                    // ISO YYYY-MM-DD, ascending
    values  : (number | null)[][];         // values[colIdx][dateIdx]
}

// ---------------------------------------------------------------------------------------------------------------------
// Long mode (dimensions/rows)
// ---------------------------------------------------------------------------------------------------------------------
export interface SdmxLongPayload extends SdmxSeriesBase {
    mode       : "long";
    dimensions : string[];                        // ordered dimension names (e.g. ["AGG_STATS", "STATE_CODE"])
    rows       : (string | number | null)[][];    // each row: [dim0, dim1, …, unit, date, value]
}

// ---------------------------------------------------------------------------------------------------------------------
// Union — fetch result is cast to this; callers narrow by payload.mode.
// Legacy payloads (no `mode`) should be treated as "wide" at the call site.
// ---------------------------------------------------------------------------------------------------------------------
export type SdmxSeriesPayload = SdmxWidePayload | SdmxLongPayload;

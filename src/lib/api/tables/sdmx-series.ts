// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Generic SDMX series payload — produced by the SDMX processor for each DSD.
// Slug = catalogue path basename minus ".csv".
//
// Two modes:
//   "wide" (≤100 series) — column-major: values[colIdx][dateIdx], dates ascending.
//   "long" (>100 series) — row array: [dim0, dim1, …, unit, date, value] per observation.
//
// Older payloads (pre-dual-mode) lack a `mode` field — treat them as "wide".

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
// Union — loader returns this; callers narrow by payload.mode
// Older payloads lacking `mode` are normalised to SdmxWidePayload by getSdmxSeries().
// ---------------------------------------------------------------------------------------------------------------------
export type SdmxSeriesPayload = SdmxWidePayload | SdmxLongPayload;

// ---------------------------------------------------------------------------------------------------------------------
// Raw shape of pre-dual-mode payloads (no `mode` field)
// ---------------------------------------------------------------------------------------------------------------------
interface SdmxLegacyPayload extends SdmxSeriesBase {
    columns : SdmxSeriesColumn[];
    dates   : string[];
    values  : (number | null)[][];
}

/**
 * Load the SDMX series payload for a given slug from the build-synced JSON.
 * File: public/data/sdmx-<slug>.json
 *
 * Legacy payloads (no `mode`) are coerced to wide mode so callers always see the union.
 */
export function getSdmxSeries(slug : string) : SdmxSeriesPayload {
    const raw = loadData<SdmxWidePayload | SdmxLongPayload | SdmxLegacyPayload>(`sdmx-${slug}`);

    // If `mode` is already set, the parser has emitted the new dual-mode shape.
    if ("mode" in raw && raw.mode != null) {
        return raw as SdmxSeriesPayload;
    }

    // Legacy: coerce to wide.
    const legacy = raw as SdmxLegacyPayload;
    return {
        mode      : "wide",
        slug      : legacy.slug,
        label     : legacy.label,
        sector    : legacy.sector,
        subSector : legacy.subSector,
        frequency : legacy.frequency,
        dsdCode   : legacy.dsdCode,
        columns   : legacy.columns,
        dates     : legacy.dates,
        values    : legacy.values,
        chartable : legacy.chartable,
        footnotes : legacy.footnotes,
    } satisfies SdmxWidePayload;
}

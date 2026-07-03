"use client";

// REACT CORE ==========================================================================================================
import React, { useEffect, useMemo, useState } from "react";

// UI ==================================================================================================================
import { Article, Div, Heading4, Heading6, Text } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import SdmxSeriesGrid, { SdmxLongGrid } from "@/components/tables/SdmxSeriesGrid";
import TimeSeriesChart                  from "@/components/charts/TimeSeriesChart";
import { DataUnit }                     from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import {
    SdmxSeriesPayload,
    SdmxSeriesColumn,
    SdmxWidePayload,
} from "@/lib/api/tables/sdmx-series";

// STYLES ==============================================================================================================
import "./sdmx-series-page.css";

// =====================================================================================================================
// Props — catalogue fields arrive as props (no payload at render time)
// =====================================================================================================================
interface SdmxSeriesPageClientProps {
    slug      : string;
    label     : string;
    sector    : string;
    subSector : string;
    frequency : string;
}

// =====================================================================================================================
// Helpers
// =====================================================================================================================

// Return the most common non-"N_A" unit string from the column list, or "" if none.
function dominantUnit(columns : SdmxSeriesColumn[]) : string {
    const counts = new Map<string, number>();
    for (const col of columns) {
        if (col.unit && col.unit !== "N_A") {
            counts.set(col.unit, (counts.get(col.unit) ?? 0) + 1);
        }
    }
    if (counts.size === 0) return "";
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

// Coerce a raw fetched JSON object to the discriminated union.
// Legacy payloads (no `mode` field) are treated as wide.
function normalisePayload(raw : unknown) : SdmxSeriesPayload {
    const r = raw as Record<string, unknown>;
    if (r.mode === "wide" || r.mode === "long") {
        return r as unknown as SdmxSeriesPayload;
    }
    // Legacy: synthesise mode === "wide".
    return {
        mode      : "wide",
        slug      : String(r.slug      ?? ""),
        label     : String(r.label     ?? ""),
        sector    : String(r.sector    ?? ""),
        subSector : String(r.subSector ?? ""),
        frequency : String(r.frequency ?? ""),
        dsdCode   : String(r.dsdCode   ?? ""),
        columns   : (r.columns   as SdmxWidePayload["columns"]) ?? [],
        dates     : (r.dates     as string[])                   ?? [],
        values    : (r.values    as SdmxWidePayload["values"])  ?? [],
        chartable : Boolean(r.chartable),
        footnotes : (r.footnotes as string[])                   ?? [],
    } satisfies SdmxWidePayload;
}

// =====================================================================================================================
// Component
// =====================================================================================================================
const SdmxSeriesPageClient : React.FC<SdmxSeriesPageClientProps> = ({
    slug,
    label,
    sector,
    subSector,
    frequency,
}) => {
    const [payload,    setPayload]    = useState<SdmxSeriesPayload | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Fetch the payload client-side — not inlined into the SSG bundle.
    useEffect(() => {
        let cancelled = false;
        setPayload(null);
        setFetchError(null);

        fetch(`/data/sdmx-${slug}.json`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((raw : unknown) => {
                if (!cancelled) setPayload(normalisePayload(raw));
            })
            .catch((err : unknown) => {
                if (!cancelled) setFetchError(String(err));
            });

        return () => { cancelled = true; };
    }, [slug]);

    // ------------------------------------------------------------------------------------------------------------------
    // Wide mode: transpose column-major → row-major and build chart series.
    // ------------------------------------------------------------------------------------------------------------------
    const wideGridRows = useMemo(() => {
        if (!payload || payload.mode !== "wide") return [];
        const { columns, dates, values } = payload;
        const rows = dates.map((date, dateIdx) => ({
            period : date,
            values : columns.map((_, colIdx) => values[colIdx][dateIdx]),
        }));
        return [...rows].reverse();   // newest-first display order
    }, [payload]);

    const chartSeries = useMemo(() => {
        if (!payload || payload.mode !== "wide") return [];
        const { columns, values } = payload;
        return columns.map((col, i) => ({
            key    : col.key,
            label  : col.unit && col.unit !== "N_A" ? `${col.label} (${col.unit})` : col.label,
            values : values[i],
        }));
    }, [payload]);

    // ------------------------------------------------------------------------------------------------------------------
    // Derived meta values per mode — only computed once payload is available.
    // ------------------------------------------------------------------------------------------------------------------
    const meta = useMemo(() => {
        if (!payload) return null;

        if (payload.mode === "wide") {
            const { columns, dates } = payload;
            return {
                observCount  : dates.length,
                dimLabel     : "Series",
                dimCount     : columns.length,
                latestPeriod : dates.length > 0 ? dates[dates.length - 1] : "—",
                yAxisTitle   : dominantUnit(columns),
                chartable    : payload.chartable,
                footnotes    : payload.footnotes,
            };
        }

        // Long mode: rows arrive date-descending; date is at index dimensions.length + 1.
        const { dimensions, rows } = payload;
        const dateIdx = dimensions.length + 1;
        return {
            observCount  : rows.length,
            dimLabel     : "Dimensions",
            dimCount     : dimensions.length,
            latestPeriod : rows.length > 0 ? String(rows[0][dateIdx] ?? "—") : "—",
            yAxisTitle   : "",
            chartable    : false,
            footnotes    : payload.footnotes,
        };
    }, [payload]);

    // ------------------------------------------------------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------------------------------------------------------
    return (
        <Article id="sdmx-series-page" className="page-grid">
            {/* HEADER — always visible from props, no fetch needed //////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        {label}
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        {sector} · {subSector} · {frequency}
                    </Heading6>
                </Div>
            </Div>

            {/* META CARD ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India (DBIE)"
                />

                <DataUnit
                    label="Frequency"
                    value={frequency}
                />

                {meta ? (
                    <>
                        <DataUnit
                            label="Observations"
                            value={meta.observCount.toLocaleString("en-IN")}
                        />

                        <DataUnit
                            label={meta.dimLabel}
                            value={meta.dimCount.toLocaleString("en-IN")}
                        />

                        <DataUnit
                            label="Latest period"
                            value={meta.latestPeriod}
                        />
                    </>
                ) : (
                    <DataUnit
                        label="Status"
                        value={fetchError ? "Error loading data" : "Loading…"}
                    />
                )}
            </Div>

            {/* LOADING / ERROR STATE ////////////////////////////////////////////////////////////////////////////// */}
            {!payload && (
                <Div className="sdmx-grid-cell grid-cell" padding="micro">
                    {fetchError ? (
                        <Text size="small" opacity="60">
                            Could not load series data. {fetchError}
                        </Text>
                    ) : (
                        <Text size="small" opacity="60">Loading data…</Text>
                    )}
                </Div>
            )}

            {/* CHART — wide mode only, when chartable ///////////////////////////////////////////////////////////// */}
            {payload?.mode === "wide" && meta?.chartable && (
                <Div className="sdmx-chart-cell grid-cell">
                    <TimeSeriesChart
                        dates         = {payload.dates}
                        series        = {chartSeries}
                        yAxisTitle    = {meta.yAxisTitle}
                        valueDecimals = {2}
                        exportName    = {slug}
                        height        = {550}
                    />
                </Div>
            )}

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            {payload && (
                <Div className="sdmx-grid-cell grid-cell">
                    {payload.mode === "wide" ? (
                        <SdmxSeriesGrid
                            columns = {payload.columns}
                            rows    = {wideGridRows}
                        />
                    ) : (
                        <SdmxLongGrid
                            dimensions = {payload.dimensions}
                            rows       = {payload.rows}
                        />
                    )}
                </Div>
            )}

            {/* FOOTNOTES ////////////////////////////////////////////////////////////////////////////////////////// */}
            {meta && meta.footnotes.length > 0 && (
                <Div className="sdmx-footnotes grid-cell" padding="micro">
                    {meta.footnotes.map((note, i) => (
                        <Text
                            key     = {i}
                            size    = "small"
                            opacity = "60"
                            style   = {{ whiteSpace : "pre-line", display : "block", marginBottom : "4px" }}
                        >
                            {note}
                        </Text>
                    ))}
                </Div>
            )}
        </Article>
    );
};

export default SdmxSeriesPageClient;

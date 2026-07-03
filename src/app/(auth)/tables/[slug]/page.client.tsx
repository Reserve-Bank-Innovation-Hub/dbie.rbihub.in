"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Div, Heading4, Heading6, Text } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import SdmxSeriesGrid, { SdmxLongGrid } from "@/components/tables/SdmxSeriesGrid";
import TimeSeriesChart                  from "@/components/charts/TimeSeriesChart";
import { DataUnit }                     from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { SdmxSeriesPayload, SdmxSeriesColumn } from "@/lib/api/tables/sdmx-series";

// STYLES ==============================================================================================================
import "./sdmx-series-page.css";

interface SdmxSeriesPageClientProps {
    payload : SdmxSeriesPayload;
}

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

const SdmxSeriesPageClient : React.FC<SdmxSeriesPageClientProps> = ({ payload }) => {
    const { slug, label, sector, subSector, frequency, chartable, footnotes } = payload;

    // ------------------------------------------------------------------------------------------------------------------
    // Wide mode: transpose column-major → row-major and build chart series.
    // ------------------------------------------------------------------------------------------------------------------
    const wideGridRows = useMemo(() => {
        if (payload.mode !== "wide") return [];
        const { columns, dates, values } = payload;
        const rows = dates.map((date, dateIdx) => ({
            period : date,
            values : columns.map((_, colIdx) => values[colIdx][dateIdx]),
        }));
        return [...rows].reverse();           // newest-first display order
    }, [payload]);

    const chartSeries = useMemo(() => {
        if (payload.mode !== "wide") return [];
        const { columns, values } = payload;
        return columns.map((col, i) => ({
            key    : col.key,
            label  : col.unit && col.unit !== "N_A" ? `${col.label} (${col.unit})` : col.label,
            values : values[i],
        }));
    }, [payload]);

    // ------------------------------------------------------------------------------------------------------------------
    // Derived meta values per mode.
    // ------------------------------------------------------------------------------------------------------------------
    const { observCount, seriesCount, latestPeriod, yAxisTitle } = useMemo(() => {
        if (payload.mode === "wide") {
            const { columns, dates } = payload;
            return {
                observCount  : dates.length,
                seriesCount  : columns.length,
                latestPeriod : dates.length > 0 ? dates[dates.length - 1] : "—",
                yAxisTitle   : dominantUnit(columns),
            };
        }
        // Long mode: rows arrive date-descending; date is at index dimensions.length + 1.
        const { dimensions, rows } = payload;
        const dateIdx = dimensions.length + 1;
        return {
            observCount  : rows.length,
            seriesCount  : dimensions.length,
            latestPeriod : rows.length > 0 ? String(rows[0][dateIdx] ?? "—") : "—",
            yAxisTitle   : "",
        };
    }, [payload]);

    return (
        <Article id="sdmx-series-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
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

                <DataUnit
                    label="Observations"
                    value={observCount.toLocaleString("en-IN")}
                />

                {payload.mode === "wide" ? (
                    <DataUnit
                        label="Series"
                        value={seriesCount.toLocaleString("en-IN")}
                    />
                ) : (
                    <DataUnit
                        label="Dimensions"
                        value={seriesCount.toLocaleString("en-IN")}
                    />
                )}

                <DataUnit
                    label="Latest period"
                    value={latestPeriod}
                />
            </Div>

            {/* CHART — wide mode only, when chartable ///////////////////////////////////////////////////////////// */}
            {payload.mode === "wide" && chartable && (
                <Div className="sdmx-chart-cell grid-cell">
                    <TimeSeriesChart
                        dates         = {payload.dates}
                        series        = {chartSeries}
                        yAxisTitle    = {yAxisTitle}
                        valueDecimals = {2}
                        exportName    = {slug}
                        height        = {550}
                    />
                </Div>
            )}

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
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

            {/* FOOTNOTES ////////////////////////////////////////////////////////////////////////////////////////// */}
            {footnotes.length > 0 && (
                <Div className="sdmx-footnotes grid-cell" padding="micro">
                    {footnotes.map((note, i) => (
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

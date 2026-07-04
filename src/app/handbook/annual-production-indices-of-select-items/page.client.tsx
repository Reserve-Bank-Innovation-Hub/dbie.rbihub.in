"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import AnnualProductionIndicesGrid from "@/components/tables/AnnualProductionIndicesGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { AnnualProductionIndices } from "@/lib/api/tables/annual-production-indices-of-select-items";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@components/charts/chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// STYLES ==============================================================================================================
import "./annual-production-indices-page.css";

// Dynamic import to avoid SSR issues with Plotly.
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface AnnualProductionIndicesClientPageProps {
    indicesData : AnnualProductionIndices;
}

const AnnualProductionIndicesClientPage : React.FC<AnnualProductionIndicesClientPageProps> = ({ indicesData }) => {
    // Newest-first; first entry is the most recent year.
    const latest = indicesData.data[0];

    const stats = useMemo(() => ({
        latestYear : latest?.year ?? "—",
        yearCount  : indicesData.data.length,
    }), [latest, indicesData.data.length]);

    // Electricity (item 1, index 0) line chart — oldest to newest on the x-axis.
    const chart = useMemo(() => {
        // data is newest-first — reverse for a left-to-right time axis.
        const chronological = [...indicesData.data].reverse();

        const x = chronological.map(r => r.year);
        const y = chronological.map(r => r.indices[0]);

        const traces : Partial<Plotly.PlotData>[] = [
            {
                x,
                y,
                name          : "Electricity",
                type          : "scatter",
                mode          : "lines+markers",
                line          : { color: CHART_COLORS.purpleDark, width: 2 },
                marker        : { color: CHART_COLORS.purpleDark, size: 6 },
                hovertemplate : "<b>Electricity</b><br>%{x}<br>Index: %{y:.2f}<extra></extra>",
            },
        ];

        const layout : Partial<Plotly.Layout> = getBaseLayout({
            title  : createTitle("Electricity production index (base 2011-12 = 100)"),
            xaxis  : createAxis("Year"),
            yaxis  : createAxis("Index (2011-12 = 100)", { rangemode: "tozero" }),
            height : 400,
            margin : { t: 70, b: 120, l: 80, r: 40 },
        });

        const config : Partial<Plotly.Config> = getBaseConfig("electricity_production_index");

        return { traces, layout, config };
    }, [indicesData.data]);

    return (
        <Article id="annual-production-indices-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Heading4 weight="700" marginBottom="nano">
                    Annual production indices of select items (base 2011-12 = 100)
                </Heading4>
                <Heading6 weight="400" opacity="60">
                    {indicesData.baseYear}
                </Heading6>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="National Statistics Office (NSO), Government of India"
                />
                <DataUnit
                    label="Latest year"
                    value={indicesData.data[0]?.year ?? "—"}
                />
                <DataUnit
                    label="Items covered"
                    value="80 industries"
                />
            </Div>

            {/* STAT CARD ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell stat-card" padding="micro">
                <DataUnit
                    label="Latest year"
                    value={stats.latestYear}
                    size="large"
                />
                <DataUnit
                    label="Years of data"
                    value={`${stats.yearCount} years`}
                />
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="annual-production-indices-chart">
                <Plot
                    data={chart.traces}
                    layout={chart.layout}
                    config={chart.config}
                    style={{ width: "100%", height: "100%" }}
                    useResizeHandler={true}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="annual-production-indices-grid">
                <AnnualProductionIndicesGrid
                    data={indicesData.data}
                    items={indicesData.items}
                />
            </Div>
        </Article>
    );
};

export default AnnualProductionIndicesClientPage;

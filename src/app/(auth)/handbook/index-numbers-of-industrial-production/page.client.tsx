"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import IndexNumbersOfIndustrialProductionGrid from "@/components/tables/IndexNumbersOfIndustrialProductionGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { IndexNumbersOfIndustrialProduction } from "@/lib/api/tables/index-numbers-of-industrial-production";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@components/charts/chartConfig";

// STYLES ==============================================================================================================
import "./index-numbers-industrial-production-page.css";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface IndexNumbersOfIndustrialProductionPageProps {
    iipData : IndexNumbersOfIndustrialProduction;
}

const IndexNumbersOfIndustrialProductionPage : React.FC<IndexNumbersOfIndustrialProductionPageProps> = ({ iipData }) => {
    // The most recent series is series[0] (base 2011-12). Data is newest-first.
    const currentSeries = iipData.series[0];
    const latestRow     = currentSeries?.data[0];

    const stats = useMemo(() => {
        const fmt = (v : number | null) => (v == null ? "—" : v.toLocaleString("en-IN"));
        return {
            latestYear   : latestRow?.year    ?? "—",
            latestMining : fmt(latestRow?.values[0] ?? null),
            latestMfg    : fmt(latestRow?.values[1] ?? null),
            latestElec   : fmt(latestRow?.values[2] ?? null),
        };
    }, [latestRow]);

    // Line chart — series[0], oldest-first (reverse of data array).
    const chart = useMemo(() => {
        if (!currentSeries) return null;

        // Reverse so the x-axis runs chronologically (oldest left, newest right).
        const chronological = [...currentSeries.data].reverse();
        const xLabels       = chronological.map(r => r.year);

        const traceColors = [
            CHART_COLORS.purpleDark,
            CHART_COLORS.blueMid,
            CHART_COLORS.greenMid,
        ];

        const traces : Partial<Plotly.PlotData>[] = currentSeries.columns.map((col, ci) => ({
            x             : xLabels,
            y             : chronological.map(r => r.values[ci]),
            name          : col,
            type          : "scatter",
            mode          : "lines",
            line          : { color : traceColors[ci] ?? CHART_COLORS.purpleDark, width : 2 },
            hovertemplate : `<b>${col}</b><br>%{x}<br>Index: %{y:.2f}<extra></extra>`,
        }));

        const layout : Partial<Plotly.Layout> = getBaseLayout({
            title : createTitle(`Index numbers of industrial production — base ${currentSeries.baseYear} = 100`),
            xaxis : createAxis("Year"),
            yaxis : createAxis(`Index (base ${currentSeries.baseYear} = 100)`),
        });

        const config : Partial<Plotly.Config> = getBaseConfig("index_numbers_of_industrial_production");

        return { traces, layout, config };
    }, [currentSeries]);

    return (
        <Article id="index-numbers-industrial-production-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Index numbers of industrial production
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Base 2011-12 = 100 (also includes series for base years 2004-05, 1993-94, 1980-81)
                    </Heading6>
                </Div>

                <Text>
                    Annual index numbers of industrial production covering mining &amp; quarrying, manufacturing,
                    and electricity sectors. The current series uses base year 2011-12 = 100. Historical series
                    for earlier base years (2004-05, 1993-94, and 1980-81) are also included.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="National Statistics Office (NSO), Government of India"
                />

                <DataUnit
                    label="Latest year"
                    value={stats.latestYear}
                />

                <DataUnit
                    label="Series available"
                    value="4 base years"
                />
            </Div>

            {/* STAT CARDS ///////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell iip-stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Mining &amp; quarrying</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={stats.latestMining}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Index (base 2011-12 = 100)</Text>
            </Div>

            <Div className="grid-cell iip-stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Manufacturing</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={stats.latestMfg}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Index (base 2011-12 = 100)</Text>
            </Div>

            <Div className="grid-cell iip-stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Electricity</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={stats.latestElec}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Index (base 2011-12 = 100)</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="iip-chart">
                {chart ? (
                    <Plot
                        data={chart.traces}
                        layout={chart.layout}
                        config={chart.config}
                        style={{ width : "100%", height : "100%" }}
                        useResizeHandler={true}
                    />
                ) : null}
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="iip-grid">
                <IndexNumbersOfIndustrialProductionGrid series={iipData.series} />
            </Div>
        </Article>
    );
};

export default IndexNumbersOfIndustrialProductionPage;

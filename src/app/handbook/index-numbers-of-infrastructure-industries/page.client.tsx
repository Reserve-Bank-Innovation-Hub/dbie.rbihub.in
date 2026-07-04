"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import IndexNumbersOfInfrastructureIndustriesGrid from "@/components/tables/IndexNumbersOfInfrastructureIndustriesGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { IndexNumbersOfInfrastructureIndustries } from "@/lib/api/tables/index-numbers-of-infrastructure-industries";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@components/charts/chartConfig";


// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface IndexNumbersOfInfrastructureIndustriesPageProps {
    infraData : IndexNumbersOfInfrastructureIndustries;
}

const IndexNumbersOfInfrastructureIndustriesPage : React.FC<IndexNumbersOfInfrastructureIndustriesPageProps> = ({ infraData }) => {
    const primarySeries = infraData.series[0];
    const latestRow     = primarySeries?.data[0];

    const latestOverallIndex = latestRow?.values[0];
    const latestYear         = latestRow?.year ?? "—";

    // Line chart — Overall Index (values[0]) for series[0], chronological order.
    const chart = useMemo(() => {
        if (!primarySeries) return null;

        // Data is newest-first — reverse for left-to-right chronological axis.
        const chronological = [...primarySeries.data].reverse();

        const traces : Partial<Plotly.PlotData>[] = [
            {
                x             : chronological.map((r) => r.year),
                y             : chronological.map((r) => r.values[0]),
                name          : "Overall index",
                type          : "scatter",
                mode          : "lines+markers",
                line          : { color: CHART_COLORS.purpleDark, width: 2 },
                marker        : { color: CHART_COLORS.purpleDark, size: 5 },
                hovertemplate : "<b>Overall index</b><br>Year: %{x}<br>Index: %{y:.2f}<extra></extra>",
            },
        ];

        const layout : Partial<Plotly.Layout> = getBaseLayout({
            title : createTitle(`Overall index of infrastructure industries (base ${primarySeries.baseYear} = 100)`),
            xaxis : createAxis("Year"),
            yaxis : createAxis(`Index (base ${primarySeries.baseYear} = 100)`),
        });

        const config : Partial<Plotly.Config> = getBaseConfig("infrastructure_industries_overall_index");

        return { traces, layout, config };
    }, [ primarySeries ]);

    return (
        <Article id="infrastructure-industries-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Index numbers of infrastructure industries
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Base 2011-12 = 100 (also includes series for base years 2004-05 and 1993-94)
                    </Heading6>
                </Div>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Ministry of Commerce and Industry, Government of India"
                />

                <DataUnit
                    label="Latest year"
                    value={latestYear}
                />

                <DataUnit
                    label="Industries covered"
                    value="8 core infrastructure industries"
                />
            </Div>

            {/* STAT CARD ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="stat-card" className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Overall index</Text>
                <DataUnit
                    label={`Latest (${latestYear})`}
                    value={latestOverallIndex != null
                        ? latestOverallIndex.toLocaleString("en-IN", { maximumFractionDigits: 2 })
                        : "—"
                    }
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Base 2011-12 = 100</Text>
            </Div>

            {/* LINE CHART ///////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="chart-cell grid-cell">
                {chart ? (
                    <Plot
                        data={chart.traces}
                        layout={chart.layout}
                        config={chart.config}
                        style={{ width: "100%", height: "100%" }}
                        useResizeHandler={true}
                    />
                ) : null}
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <IndexNumbersOfInfrastructureIndustriesGrid series={infraData.series} />
            </Div>
        </Article>
    );
};

export default IndexNumbersOfInfrastructureIndustriesPage;

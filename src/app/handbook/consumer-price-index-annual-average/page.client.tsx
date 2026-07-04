"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ConsumerPriceIndexAnnualAverageGrid from "@/components/tables/ConsumerPriceIndexAnnualAverageGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ConsumerPriceIndexAnnualAverage } from "@/lib/api/tables/consumer-price-index-annual-average";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@/components/charts/chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// STYLES ==============================================================================================================
import "./consumer-price-index-annual-average-page.css";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ConsumerPriceIndexAnnualAveragePageProps {
    cpiData : ConsumerPriceIndexAnnualAverage;
}

const ConsumerPriceIndexAnnualAveragePage : React.FC<ConsumerPriceIndexAnnualAveragePageProps> = ({ cpiData }) => {
    const { series } = cpiData;

    // The data is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...series.new_cpi.data ].reverse(), [ series.new_cpi.data ]);

    const x = useMemo(() => chartData.map(d => d.year), [ chartData ]);

    // Latest row for stat cards (index 0 = newest).
    const latestNewCpi = series.new_cpi.data[0];
    const latestAl     = series.cpi_al.data[0];

    const stats = useMemo(() => ({
        latestYear    : latestNewCpi?.year || "—",
        latestCombined: latestNewCpi?.combined != null
            ? latestNewCpi.combined.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })
            : "—",
        latestAl      : latestAl?.index != null
            ? latestAl.index.toLocaleString("en-IN")
            : "—",
        latestAlYear  : latestAl?.year || "—",
    }), [ latestNewCpi, latestAl ]);

    // Plotly traces — three lines on a single y-axis.
    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x,
            y             : chartData.map(d => d.rural),
            name          : "Rural",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.greenMid, width: 2 },
            hovertemplate : "<b>Rural</b><br>%{x}<br>%{y:.2f}<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.urban),
            name          : "Urban",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.blueMid, width: 2 },
            hovertemplate : "<b>Urban</b><br>%{x}<br>%{y:.2f}<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.combined),
            name          : "Combined",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.orangeMid, width: 2.5 },
            hovertemplate : "<b>Combined</b><br>%{x}<br>%{y:.2f}<extra></extra>",
        },
    ], [ chartData, x ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle("New CPI — rural, urban and combined (base 2012=100)", 18),
        xaxis  : createAxis("Year", { type: "category" }),
        yaxis  : createAxis("Index (base 2012=100)", { rangemode: "tozero" }),
        height : 480,
        margin : { t: 80, b: 80, l: 80, r: 40 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : -0.25,
            xanchor     : "center",
            x           : 0.5,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("consumer_price_index_annual_average_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "consumer_price_index_annual_average_chart",
            height   : 900,
            width    : 1400,
            scale    : 2,
        },
    });

    return (
        <Article id="consumer-price-index-annual-average-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Consumer price index — annual average
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        CPI for agricultural labourers, industrial workers, and new CPI (rural/urban/combined)
                    </Heading6>
                </Div>

                <Text>
                    Annual average consumer price indices across three series: CPI for Agricultural Labourers
                    (CPI-AL), CPI for Industrial Workers (CPI-IW), and the New CPI with rural, urban, and
                    combined sub-indices on base 2012=100.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="NSO / Labour Bureau / RBI"
                />

                <DataUnit
                    label="Latest year (new CPI)"
                    value={stats.latestYear}
                />

                <DataUnit
                    label="New CPI records"
                    value={`${series.new_cpi.data.length} years`}
                />
            </Div>

            {/* STAT CARDS ///////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell cpi-stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">New CPI — combined</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={stats.latestCombined}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Base 2012=100; annual average</Text>
            </Div>

            <Div className="grid-cell cpi-stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">CPI - Agricultural labourers</Text>
                <DataUnit
                    label={`Latest (${stats.latestAlYear})`}
                    value={stats.latestAl}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Base 1986-87=100; annual average</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="cpi-chart grid-cell">
                <Plot
                    data={traces}
                    layout={layout}
                    config={config}
                    style={{ width: "100%", height: "100%" }}
                    useResizeHandler={true}
                />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="cpi-grid grid-cell">
                <Text weight="600" size="small" marginBottom="nano">
                    New CPI — rural, urban and combined (base 2012=100)
                </Text>
                <ConsumerPriceIndexAnnualAverageGrid data={series.new_cpi.data} />
            </Div>
        </Article>
    );
};

export default ConsumerPriceIndexAnnualAveragePage;

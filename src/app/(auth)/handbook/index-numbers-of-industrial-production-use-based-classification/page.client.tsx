"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import IndexNumbersOfIndustrialProductionUseBasedGrid from "@/components/tables/IndexNumbersOfIndustrialProductionUseBasedGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { IndexNumbersOfIndustrialProductionUseBased } from "@/lib/api/tables/index-numbers-of-industrial-production-use-based-classification";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@/components/charts/chartConfig";

// STYLES ==============================================================================================================
import "./iip-use-based-page.css";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface IIPUseBasedPageProps {
    iipData : IndexNumbersOfIndustrialProductionUseBased;
}

// Colour palette for the 6 use-based categories.
const CATEGORY_COLOURS = [
    CHART_COLORS.blueMid,
    CHART_COLORS.orangeMid,
    CHART_COLORS.greenMid,
    CHART_COLORS.purpleDark,
    CHART_COLORS.redMid,
    CHART_COLORS.yellowDark,
];

const IIPUseBasedPage : React.FC<IIPUseBasedPageProps> = ({ iipData }) => {
    const { series } = iipData;

    // Primary display series is base 2011-12 (series[0]).
    const primarySeries = series[0];
    const latestRow     = primarySeries?.data[0];
    const latestYear    = latestRow?.year ?? "—";

    const stats = useMemo(() => {
        if (!latestRow) return [];
        return primarySeries.columns.map((col, i) => ({
            label : col,
            value : latestRow.values[i] != null
                ? latestRow.values[i]!.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                : "—",
        }));
    }, [ latestRow, primarySeries ]);

    // Bar chart: one bar per category, for the latest year.
    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => {
        if (!latestRow) return [];
        return [
            {
                x             : primarySeries.columns,
                y             : latestRow.values,
                type          : "bar",
                marker        : {
                    color : primarySeries.columns.map((_, i) => CATEGORY_COLOURS[i % CATEGORY_COLOURS.length]),
                },
                hovertemplate : "<b>%{x}</b><br>Index: %{y:.1f}<extra></extra>",
            },
        ];
    }, [ latestRow, primarySeries ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(`IIP use-based classification — ${latestYear} (base 2011-12 = 100)`, 18),
        xaxis  : createAxis("Category", { type: "category" }),
        yaxis  : createAxis("Index (base 2011-12 = 100)", { rangemode: "tozero" }),
        height : 480,
        margin : { t: 80, b: 120, l: 80, r: 40 },
        showlegend : false,
    });

    const config : Partial<Plotly.Config> = getBaseConfig("iip_use_based_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "iip_use_based_chart",
            height   : 900,
            width    : 1400,
            scale    : 2,
        },
    });

    return (
        <Article id="iip-use-based-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Index numbers of industrial production: use-based classification
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Base 2011-12 = 100 (also includes series for base years 2004-05, 1993-94, 1980-81)
                    </Heading6>
                </Div>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="National Statistics Office (NSO), Government of India"
                />

                <DataUnit
                    label="Latest year"
                    value={latestYear}
                />

                <DataUnit
                    label="Categories"
                    value="6 use-based categories"
                />
            </Div>

            {/* STAT CARDS — one per use-based category /////////////////////////////////////////////////////////// */}
            {stats.map((stat, i) => (
                <Div key={i} className="grid-cell iip-use-based-stat-card" padding="micro">
                    <Text weight="600" marginBottom="nano">{stat.label}</Text>
                    <DataUnit
                        label={`Latest (${latestYear})`}
                        value={stat.value}
                        size="large"
                        align="right"
                    />
                    <Text size="tiny" opacity="60">Base 2011-12 = 100</Text>
                </Div>
            ))}

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="iip-use-based-chart grid-cell">
                <Plot
                    data={traces}
                    layout={layout}
                    config={config}
                    style={{ width: "100%", height: "100%" }}
                    useResizeHandler={true}
                />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="iip-use-based-grid grid-cell">
                <Text weight="600" size="small" marginBottom="nano">
                    IIP use-based classification — base 2011-12 = 100
                </Text>
                <IndexNumbersOfIndustrialProductionUseBasedGrid series={series} />
            </Div>
        </Article>
    );
};

export default IIPUseBasedPage;

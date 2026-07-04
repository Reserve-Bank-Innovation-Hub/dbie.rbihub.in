"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import PatternOfLandUseGrid from "@/components/tables/PatternOfLandUseGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { LandUseData } from "@/lib/api/tables/pattern-of-land-use-and-select-inputs-for-agricultural-production";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@/components/charts/chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// STYLES ==============================================================================================================

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface PatternOfLandUsePageProps {
    landUseData : LandUseData;
}

const PatternOfLandUsePage : React.FC<PatternOfLandUsePageProps> = ({ landUseData }) => {
    // The file is newest-first; the first row is the latest year.
    const latest = landUseData.data[0];

    const stats = useMemo(() => {
        const lakh = (v : number | null) => (v == null ? "—" : `${v.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} lakh ha`);
        return {
            latestYear      : latest?.year || "—",
            latestNetSown   : lakh(latest?.net_sown_area ?? null),
            latestGrossSown : lakh(latest?.gross_sown_area ?? null),
        };
    }, [ latest ]);

    // Reverse to oldest-first so the chart reads left-to-right chronologically.
    const chartData = useMemo(() => [ ...landUseData.data ].reverse(), [ landUseData.data ]);

    const x = useMemo(() => chartData.map(d => d.year), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x,
            y             : chartData.map(d => d.net_sown_area),
            name          : "Net sown area",
            type          : "scatter",
            mode          : "lines",
            yaxis         : "y",
            line          : { color: CHART_COLORS.greenMid, width: 2 },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "%{y:.1f} lakh ha<br>" +
                "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.gross_sown_area),
            name          : "Gross sown area",
            type          : "scatter",
            mode          : "lines",
            yaxis         : "y",
            line          : { color: CHART_COLORS.blueMid, width: 2 },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "%{y:.1f} lakh ha<br>" +
                "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.fertiliser_consumption),
            name          : "Fertiliser consumption",
            type          : "scatter",
            mode          : "lines",
            yaxis         : "y2",
            line          : { color: CHART_COLORS.orangeMid, width: 2, dash: "dot" },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "%{y:.2f} lakh t<br>" +
                "<extra></extra>",
        },
    ], [ chartData, x ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle("Net sown area, gross sown area and fertiliser consumption over time", 18),
        xaxis  : createAxis("Year"),
        yaxis  : createAxis("Area (lakh hectares)", { rangemode: "tozero" }),
        yaxis2 : createAxis("Fertiliser (lakh tonnes)", {
            overlaying : "y",
            side       : "right",
            rangemode  : "tozero",
        }),
        height : 520,
        margin : { t: 80, b: 160, l: 80, r: 80 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : -0.40,
            xanchor     : "center",
            x           : 0.5,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("pattern_of_land_use_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "pattern_of_land_use_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <Article id="pattern-of-land-use-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Pattern of land use and select inputs for agricultural production
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Area in lakh hectares
                    </Heading6>
                </Div>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Ministry of Agriculture & Farmers Welfare, Government of India"
                />

                <DataUnit
                    label="Latest year"
                    value={stats.latestYear}
                />

                <DataUnit
                    label="Total records"
                    value={`${landUseData.data.length.toLocaleString()} years`}
                />
            </Div>

            {/* STAT CARDS ///////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="stat-cell grid-cell" padding="micro">
                <DataUnit
                    label={`Net sown area (${stats.latestYear})`}
                    value={stats.latestNetSown}
                    size="large"
                    align="right"
                />
            </Div>

            <Div className="stat-cell grid-cell" padding="micro">
                <DataUnit
                    label={`Gross sown area (${stats.latestYear})`}
                    value={stats.latestGrossSown}
                    size="large"
                    align="right"
                />
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="chart-cell grid-cell">
                <Plot
                    data={traces}
                    layout={layout}
                    config={config}
                    style={{ width: "100%", height: "100%" }}
                    useResizeHandler={true}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <PatternOfLandUseGrid data={landUseData.data} />
            </Div>
        </Article>
    );
};

export default PatternOfLandUsePage;

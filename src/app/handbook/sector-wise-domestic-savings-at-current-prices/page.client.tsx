"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import SectorWiseDomesticSavingsGrid from "@/components/tables/SectorWiseDomesticSavingsGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { SectorWiseDomesticSavings } from "@/lib/api/tables/sector-wise-domestic-savings-at-current-prices";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@/components/charts/chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// STYLES ==============================================================================================================

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface SectorWiseDomesticSavingsPageProps {
    data : SectorWiseDomesticSavings;
}

const SectorWiseDomesticSavingsPage : React.FC<SectorWiseDomesticSavingsPageProps> = ({ data }) => {
    // Newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data.data ].reverse(), [ data.data ]);

    const latest = data.data[0];

    const latestSavings = useMemo(() => {
        if (latest?.gross_savings == null) return "—";
        return `₹${Math.round(latest.gross_savings).toLocaleString("en-IN")} cr`;
    }, [ latest ]);

    const xValues = useMemo(() => chartData.map(d => d.year), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x             : xValues,
            y             : chartData.map(d => d.household_sector),
            name          : "Household sector",
            type          : "bar",
            marker        : { color: CHART_COLORS.yellowMid },
            hovertemplate : "<b>%{x}</b><br>%{fullData.name}<br>₹%{y:,.0f} cr<extra></extra>",
        },
        {
            x             : xValues,
            y             : chartData.map(d => d.non_financial_corporations),
            name          : "Non-financial corporations",
            type          : "bar",
            marker        : { color: CHART_COLORS.blueMid },
            hovertemplate : "<b>%{x}</b><br>%{fullData.name}<br>₹%{y:,.0f} cr<extra></extra>",
        },
        {
            x             : xValues,
            y             : chartData.map(d => d.financial_corporations),
            name          : "Financial corporations",
            type          : "bar",
            marker        : { color: CHART_COLORS.greenMid },
            hovertemplate : "<b>%{x}</b><br>%{fullData.name}<br>₹%{y:,.0f} cr<extra></extra>",
        },
        {
            x             : xValues,
            y             : chartData.map(d => d.general_government),
            name          : "General government",
            type          : "bar",
            marker        : { color: CHART_COLORS.purpleDark },
            hovertemplate : "<b>%{x}</b><br>%{fullData.name}<br>₹%{y:,.0f} cr<extra></extra>",
        },
    ], [ chartData, xValues ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title   : createTitle("Gross domestic savings by sector (current prices)", 18),
        xaxis   : createAxis("Year"),
        yaxis   : createAxis("₹ Crores", { rangemode: "tozero" }),
        barmode : "stack",
        height  : 500,
        margin  : { t: 80, b: 140, l: 80, r: 40 },
        legend  : {
            orientation : "h",
            yanchor     : "bottom",
            y           : -0.45,
            xanchor     : "center",
            x           : 0.5,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("sector_wise_domestic_savings_chart");

    return (
        <Article id="sector-wise-domestic-savings-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Sector-wise domestic savings at current prices (base year 2011-12)
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Rupees Crores; base year 2011–12; source: National Statistical Office (NSO)
                    </Heading6>
                </Div>

                <Text>
                    Annual gross domestic savings broken down by institutional sector — non-financial corporations,
                    financial corporations, general government and households — at current prices.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="National Statistical Office (NSO)"
                />

                <DataUnit
                    label="Latest year"
                    value={latest?.year ?? "—"}
                />

                <DataUnit
                    label="Total records"
                    value={`${data.data.length} years`}
                />
            </Div>

            {/* STAT CARD ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Gross domestic savings</Text>
                <DataUnit
                    label={`Latest (${latest?.year ?? "—"})`}
                    value={latestSavings}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{data.unit}</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="chart-cell">
                <Plot
                    data={traces}
                    layout={layout}
                    config={config}
                    style={{ width: "100%", height: "100%" }}
                    useResizeHandler={true}
                />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <SectorWiseDomesticSavingsGrid data={data.data} />
            </Div>
        </Article>
    );
};

export default SectorWiseDomesticSavingsPage;

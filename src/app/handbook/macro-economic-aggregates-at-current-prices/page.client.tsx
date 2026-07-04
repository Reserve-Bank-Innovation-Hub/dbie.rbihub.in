"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import MacroEconomicAggregatesCurrentPricesGrid from "@/components/tables/MacroEconomicAggregatesCurrentPricesGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { MacroEconomicAggregatesCurrentPrices } from "@/lib/api/tables/macro-economic-aggregates-at-current-prices";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@/components/charts/chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// STYLES ==============================================================================================================
import "./macro-economic-aggregates-at-current-prices-page.css";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface MacroEconomicAggregatesCurrentPricesPageProps {
    data : MacroEconomicAggregatesCurrentPrices;
}

const MacroEconomicAggregatesCurrentPricesPage : React.FC<MacroEconomicAggregatesCurrentPricesPageProps> = ({ data }) => {
    // Newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data.data ].reverse(), [ data.data ]);

    const latest = data.data[0];

    const latestGdp = useMemo(() => {
        if (latest?.gross_domestic_product == null) return "—";
        return `₹${latest.gross_domestic_product.toLocaleString("en-IN")} cr`;
    }, [ latest ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x             : chartData.map(d => d.year),
            y             : chartData.map(d => d.gross_domestic_product),
            name          : "GDP",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.orangeMid, width: 2 },
            hovertemplate : "<b>%{x}</b><br>₹%{y:,.0f} cr<extra></extra>",
        },
    ], [ chartData ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle("Gross domestic product (current prices)", 18),
        xaxis  : createAxis("Year"),
        yaxis  : createAxis("₹ Crores", { rangemode: "tozero" }),
        height : 500,
        margin : { t: 80, b: 100, l: 80, r: 40 },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("macro_economic_aggregates_current_prices_chart");

    return (
        <Article id="macro-economic-aggregates-current-prices-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Macro-economic aggregates at current prices (base year 2011-12)
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Rupees Crores; base year 2011–12; source: National Statistical Office (NSO)
                    </Heading6>
                </Div>

                <Text>
                    Annual national accounts aggregates compiled by NSO at current prices. Covers GDP, GNI, NNI,
                    gross saving, capital formation and per-capita measures.
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
            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Gross domestic product</Text>
                <DataUnit
                    label={`Latest (${latest?.year ?? "—"})`}
                    value={latestGdp}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{data.unit}</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="macro-economic-aggregates-current-prices-chart">
                <Plot
                    data={traces}
                    layout={layout}
                    config={config}
                    style={{ width: "100%", height: "100%" }}
                    useResizeHandler={true}
                />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="macro-economic-aggregates-current-prices-grid">
                <MacroEconomicAggregatesCurrentPricesGrid data={data.data} />
            </Div>
        </Article>
    );
};

export default MacroEconomicAggregatesCurrentPricesPage;

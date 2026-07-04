"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import AveragePriceOfGoldAndSilverGrid from "@/components/tables/AveragePriceOfGoldAndSilverGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { AveragePriceOfGoldAndSilver } from "@/lib/api/tables/average-price-of-gold-and-silver-in-domestic-and-foreign-markets";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@/components/charts/chartConfig";


// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface AveragePriceOfGoldAndSilverPageProps {
    pricesData : AveragePriceOfGoldAndSilver;
}

const AveragePriceOfGoldAndSilverPage : React.FC<AveragePriceOfGoldAndSilverPageProps> = ({ pricesData }) => {
    // The file is newest-first, so the first row is the latest year.
    const latest = pricesData.data[0];

    const stats = useMemo(() => {
        const rupees = (v : number | null) => (v == null ? "—" : `₹${v.toLocaleString("en-IN")}`);
        return {
            latestYear    : latest?.year || "—",
            latestGold    : rupees(latest?.gold_mumbai ?? null),
            latestSilver  : rupees(latest?.silver_mumbai ?? null),
        };
    }, [ latest ]);

    // Reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...pricesData.data ].reverse(), [ pricesData.data ]);

    const x = useMemo(() => chartData.map(d => d.year), [ chartData ]);

    // Gold (Mumbai ₹) on the left axis; silver (Mumbai ₹) on the right axis.
    // The two series differ enough in magnitude that a shared axis would flatten one of them.
    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x,
            y             : chartData.map(d => d.gold_mumbai),
            name          : "Gold Mumbai",
            type          : "scatter",
            mode          : "lines",
            yaxis         : "y",
            line          : {
                color : CHART_COLORS.yellowMid,
                width : 2,
            },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "₹%{y:,.2f}<br>" +
                "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.silver_mumbai),
            name          : "Silver Mumbai",
            type          : "scatter",
            mode          : "lines",
            yaxis         : "y2",
            line          : {
                color : CHART_COLORS.blueMid,
                width : 2,
            },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "₹%{y:,.2f}<br>" +
                "<extra></extra>",
        },
    ], [ chartData, x ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle("Average price of gold and silver in Mumbai", 20),
        xaxis  : createAxis("Year"),
        yaxis  : createAxis(`Gold Mumbai (${pricesData.units.goldMumbai})`, {
            rangemode : "tozero",
        }),
        yaxis2 : createAxis(`Silver Mumbai (${pricesData.units.silverMumbai})`, {
            overlaying : "y",
            side       : "right",
            rangemode  : "tozero",
        }),
        height : 600,
        margin : { t: 80, b: 150, l: 80, r: 80 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : -0.35,
            xanchor     : "center",
            x           : 0.5,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig(
        "average_price_of_gold_and_silver_chart",
        {
            toImageButtonOptions : {
                format   : "png",
                filename : "average_price_of_gold_and_silver_chart",
                height   : 1000,
                width    : 1600,
                scale    : 2,
            },
        },
    );

    return (
        <Article id="average-price-of-gold-and-silver-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Average price of gold and silver in domestic and foreign markets
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Gold in {pricesData.units.goldMumbai.toLowerCase()} (Mumbai) and {pricesData.units.goldLondon.toLowerCase()} (London);
                        silver in {pricesData.units.silverMumbai.toLowerCase()} (Mumbai) and {pricesData.units.silverNY.toLowerCase()} (New York)
                    </Heading6>
                </Div>

                <Text>
                    Annual average bullion prices comparing domestic (Mumbai) and international (London/New York)
                    markets for gold and silver. Spreads show the domestic-over-international premium in rupee terms.
                    Negative spreads indicate periods when domestic prices fell below the international equivalent.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest year"
                    value={stats.latestYear}
                />

                <DataUnit
                    label="Total records"
                    value={`${pricesData.data.length.toLocaleString()} years`}
                />
            </Div>

            {/* LATEST PRICE STATS ///////////////////////////////////////////////////////////////////////////////// */}
            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Gold (Mumbai)</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={stats.latestGold}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{pricesData.units.goldMumbai}</Text>
            </Div>

            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Silver (Mumbai)</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={stats.latestSilver}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{pricesData.units.silverMumbai}</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="chart-cell grid-cell">
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
                <AveragePriceOfGoldAndSilverGrid
                    data={pricesData.data}
                    units={pricesData.units}
                />
            </Div>
        </Article>
    );
};

export default AveragePriceOfGoldAndSilverPage;

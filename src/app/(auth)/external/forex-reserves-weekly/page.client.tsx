"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ForexReservesWeeklyGrid from "@/components/tables/ForexReservesWeeklyGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ForexReservesWeekly } from "@/lib/api/tables/forex-reserves-weekly";

// DATA VIZ ============================================================================================================
import type * as Plotly from "plotly.js";
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@/components/charts/chartConfig";

// STYLES ==============================================================================================================
import "./forex-reserves-weekly-page.css";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface ForexReservesWeeklyPageProps {
    reservesData : ForexReservesWeekly;
}

const ForexReservesWeeklyPage : React.FC<ForexReservesWeeklyPageProps> = ({ reservesData }) => {
    // Newest-first — first row is the latest week.
    const latest = reservesData.data[0];

    const stats = useMemo(() => {
        const fmtUSD = (v : number | null) =>
            v == null ? "—" : `$${v.toLocaleString("en-IN")} mn.`;
        return {
            latestWeek      : latest?.weekEnded || "—",
            totalReservesUSD: fmtUSD(latest?.totalReservesUSD ?? null),
            goldUSD         : fmtUSD(latest?.goldUSD ?? null),
        };
    }, [ latest ]);

    // Chart: last 52 weeks, reversed to chronological order.
    const chartData = useMemo(() => [ ...reservesData.data.slice(0, 52) ].reverse(), [ reservesData.data ]);

    const traces = useMemo(() : Plotly.Data[] => {
        const weekLabels = chartData.map((_, i) => `${chartData.length - 1 - i}w`);
        const weekEnded  = chartData.map((d) => d.weekEnded);
        return [
            {
                x             : weekLabels,
                y             : chartData.map((d) => d.goldUSD),
                name          : "Gold",
                type          : "bar",
                marker        : { color : CHART_COLORS.yellowMid },
                customdata    : weekEnded,
                hovertemplate : "<b>Gold</b><br>Week: %{customdata}<br>$%{y:,.0f} mn.<extra></extra>",
            },
            {
                x             : weekLabels,
                y             : chartData.map((d) => d.foreignCurrencyUSD),
                name          : "Foreign currency assets",
                type          : "scatter",
                mode          : "lines",
                line          : { color : CHART_COLORS.blueLight, width : 2 },
                customdata    : weekEnded,
                hovertemplate : "<b>Foreign currency assets</b><br>Week: %{customdata}<br>$%{y:,.0f} mn.<extra></extra>",
            },
            {
                x             : weekLabels,
                y             : chartData.map((d) => d.totalReservesUSD),
                name          : "Total reserves",
                type          : "scatter",
                mode          : "lines+markers",
                line          : { color : CHART_COLORS.purpleLight, width : 3 },
                marker        : { size : 4, color : CHART_COLORS.purpleDark },
                customdata    : weekEnded,
                hovertemplate : "<b>Total reserves</b><br>Week: %{customdata}<br>$%{y:,.0f} mn.<extra></extra>",
            },
        ];
    }, [ chartData ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title   : createTitle("Foreign exchange reserves — last 52 weeks"),
        barmode : "overlay",
        xaxis   : createAxis("Weeks ago", { type : "category" }),
        yaxis   : createAxis("US $Millions"),
    });

    const config : Partial<Plotly.Config> = getBaseConfig("forex_reserves_weekly_chart");

    return (
        <Article id="forex-reserves-weekly-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Foreign exchange reserves — weekly
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Official reserve assets including foreign currency, gold, SDRs and reserve tranche
                    </Heading6>
                </Div>

                <Text>
                    India's official foreign exchange reserves reported every Friday by the Reserve Bank of India.
                    Figures are given in both Indian rupees (₹ crores) and US dollars (millions).
                    Amounts include foreign currency assets, gold, SDRs and the reserve tranche position with the IMF.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest week"
                    value={stats.latestWeek}
                />

                <DataUnit
                    label="Total records"
                    value={`${reservesData.data.length.toLocaleString()} weeks`}
                />
            </Div>

            {/* STAT CARDS ///////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Total reserves</Text>
                <DataUnit
                    label={`Latest (${stats.latestWeek})`}
                    value={stats.totalReservesUSD}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">US $Millions</Text>
            </Div>

            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Gold</Text>
                <DataUnit
                    label={`Latest (${stats.latestWeek})`}
                    value={stats.goldUSD}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">US $Millions</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="forex-reserves-weekly-chart grid-cell">
                <Plot
                    data={traces}
                    layout={layout}
                    config={config}
                    style={{ width : "100%", height : "100%" }}
                    useResizeHandler={true}
                />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="forex-reserves-weekly-grid grid-cell">
                <ForexReservesWeeklyGrid data={reservesData.data} />
            </Div>
        </Article>
    );
};

export default ForexReservesWeeklyPage;

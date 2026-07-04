"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import WholesalePriceIndexAnnualAverageGrid from "@/components/tables/WholesalePriceIndexAnnualAverageGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { WpiAnnualAverage } from "@/lib/api/tables/wholesale-price-index-annual-average";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@components/charts/chartConfig";

// STYLES ==============================================================================================================

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface WholesalePriceIndexAnnualAveragePageProps {
    wpiData : WpiAnnualAverage;
}

const WholesalePriceIndexAnnualAveragePage : React.FC<WholesalePriceIndexAnnualAveragePageProps> = ({ wpiData }) => {
    // The file is newest-first; the first row is the latest available year.
    const latest = wpiData.data[0];

    const stats = useMemo(() => {
        const fmt = (v : number | null) => (v == null ? "—" : v.toFixed(1));
        return {
            latestYear  : latest?.year ?? "—",
            latestAC    : fmt(latest?.ac ?? null),
            latestPA    : fmt(latest?.pa ?? null),
            totalYears  : wpiData.data.length,
        };
    }, [ latest, wpiData.data.length ]);

    // Line chart — AC, PA, F&P, MP over time; oldest-first on x-axis.
    const chart = useMemo(() => {
        // Reverse the newest-first array so the x-axis runs left-to-right.
        const rows = [ ...wpiData.data ].reverse();
        const years = rows.map((r) => r.year);

        const makeLine = (
            key   : keyof typeof rows[0],
            name  : string,
            color : string,
            width : number = 2,
        ) : Partial<Plotly.PlotData> => ({
            x             : years,
            y             : rows.map((r) => r[key] as number | null),
            name,
            type          : "scatter",
            mode          : "lines",
            line          : { color, width },
            hovertemplate : `<b>${name}</b><br>%{x}<br>Index: %{y:.1f}<extra></extra>`,
            connectgaps   : false,
        });

        const traces : Partial<Plotly.PlotData>[] = [
            makeLine("ac", "All commodities (AC)",        CHART_COLORS.purpleDark,  3),
            makeLine("pa", "Primary articles (PA)",       CHART_COLORS.blueMid,     2),
            makeLine("fp", "Fuel & power (F&P)",          CHART_COLORS.orangeMid,   2),
            makeLine("mp", "Manufactured products (MP)",  CHART_COLORS.greenMid,    2),
        ];

        const layout : Partial<Plotly.Layout> = getBaseLayout({
            title  : createTitle("Wholesale price index — annual average (2011-12 = 100)"),
            xaxis  : createAxis("Year", { showgrid: false }),
            yaxis  : createAxis("Index", { showgrid: true, gridcolor: "#e5e7eb" }),
            margin : { t: 60, b: 100, l: 80, r: 40 },
            legend : {
                orientation : "h",
                x           : 0.5,
                xanchor     : "center",
                y           : -0.25,
            },
        });

        const config : Partial<Plotly.Config> = getBaseConfig(
            "wholesale_price_index_annual_average",
        );

        return { traces, layout, config };
    }, [ wpiData.data ]);

    return (
        <Article id="wholesale-price-index-annual-average-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Wholesale price index — annual average
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Base: 2011-12 = 100
                    </Heading6>
                </Div>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Office of the Economic Adviser, Ministry of Commerce"
                />

                <DataUnit
                    label="Latest year"
                    value={stats.latestYear}
                />

                <DataUnit
                    label="Total records"
                    value={`${stats.totalYears} years`}
                />
            </Div>

            {/* STAT CARDS ///////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="stat-cell grid-cell" padding="micro">
                <DataUnit
                    label={`All commodities — latest (${stats.latestYear})`}
                    value={stats.latestAC}
                    size="large"
                    align="right"
                />
            </Div>

            <Div className="stat-cell grid-cell" padding="micro">
                <DataUnit
                    label={`Primary articles — latest (${stats.latestYear})`}
                    value={stats.latestPA}
                    size="large"
                    align="right"
                />
            </Div>

            {/* LINE CHART ///////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="chart-cell">
                <Plot
                    data={chart.traces}
                    layout={chart.layout}
                    config={chart.config}
                    style={{ width: "100%", height: "100%" }}
                    useResizeHandler={true}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <WholesalePriceIndexAnnualAverageGrid data={wpiData.data} />
            </Div>
        </Article>
    );
};

export default WholesalePriceIndexAnnualAveragePage;

"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// DATA VIZ ============================================================================================================
import type * as Plotly from "plotly.js";

// LOCAL COMPONENTS ====================================================================================================
import CommercialPaperGrid from "@/components/tables/CommercialPaperGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { CommercialPaper } from "@/lib/api/tables/commercial-paper";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@/components/charts/chartConfig";

// STYLES ==============================================================================================================

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface CommercialPaperPageProps {
    paperData : CommercialPaper;
}

// "31-Mar-26" -> "2026-03-31" (ISO date string so Plotly can use a time axis).
const MONTH_MAP : Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

function fortnightToISO(label : string) : string {
    const m = label.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
    if (!m) return label;
    const mm = MONTH_MAP[m[2]];
    if (!mm) return label;
    const dd   = String(m[1]).padStart(2, "0");
    const yyyy = 2000 + parseInt(m[3], 10);
    return `${yyyy}-${mm}-${dd}`;
}

const CommercialPaperPage : React.FC<CommercialPaperPageProps> = ({ paperData }) => {
    // The file is newest-first, so the first row is the latest fortnight.
    const latest = paperData.data[0];

    const stats = useMemo(() => {
        const crores = (v : number | null) =>
            v == null ? "—" : `₹${v.toLocaleString("en-IN")} Cr`;
        return {
            latestFortnight   : latest?.fortnightEnded || "—",
            latestOutstanding : crores(latest?.amountOutstanding ?? null),
            latestMinRate     : latest?.minRate == null ? "—" : `${latest.minRate.toFixed(2)}%`,
        };
    }, [ latest ]);

    // The file is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...paperData.data ].reverse(), [ paperData.data ]);

    const x = useMemo(() => chartData.map(d => fortnightToISO(d.fortnightEnded)), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => {
        const labels = chartData.map(d => d.fortnightEnded);
        return [
            {
                x,
                y             : chartData.map(d => d.amountOutstanding),
                name          : "Amount outstanding",
                type          : "scatter",
                mode          : "lines",
                yaxis         : "y",
                line          : {
                    color : CHART_COLORS.blueMid,
                    width : 2,
                },
                customdata    : labels,
                hovertemplate :
                    "<b>%{fullData.name}</b><br>" +
                    "%{customdata}<br>" +
                    "₹%{y:,.0f} Cr<br>" +
                    "<extra></extra>",
            },
        ];
    }, [ chartData, x ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle("Commercial paper — amount outstanding over time", 20),
        xaxis  : createAxis("Fortnight ended", {
            type          : "date",
            rangeslider   : { visible : true },
            rangeselector : {
                buttons : [
                    { count : 1, label : "1Y", step : "year", stepmode : "backward" },
                    { count : 3, label : "3Y", step : "year", stepmode : "backward" },
                    { count : 5, label : "5Y", step : "year", stepmode : "backward" },
                    { step  : "all", label : "All" },
                ],
            },
        }),
        yaxis  : createAxis("Amount outstanding (₹ crores)", {
            rangemode : "tozero",
        }),
        height : 600,
        margin : { t : 80, b : 150, l : 80, r : 40 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : -0.35,
            xanchor     : "center",
            x           : 0.5,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("commercial_paper_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "commercial_paper_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <Article id="commercial-paper-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Commercial paper
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Rupees crores; rate in per cent — fortnightly
                    </Heading6>
                </Div>

                <Text>
                    Fortnightly commercial paper issuance data from the RBI: amount outstanding,
                    amount reported during the fortnight, and minimum rate of interest on issues.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest fortnight"
                    value={stats.latestFortnight}
                />

                <DataUnit
                    label="Total records"
                    value={`${paperData.data.length.toLocaleString()} fortnights`}
                />
            </Div>

            {/* SUMMARY STAT CARDS ///////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Amount outstanding</Text>
                <DataUnit
                    label={`Latest (${stats.latestFortnight})`}
                    value={stats.latestOutstanding}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Rupees crores</Text>
            </Div>

            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Minimum rate of interest</Text>
                <DataUnit
                    label={`Latest (${stats.latestFortnight})`}
                    value={stats.latestMinRate}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Per cent per annum</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="chart-cell grid-cell">
                <Plot
                    data={traces}
                    layout={layout}
                    config={config}
                    style={{ width : "100%", height : "100%" }}
                    useResizeHandler={true}
                />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <CommercialPaperGrid data={paperData.data} />
            </Div>
        </Article>
    );
};

export default CommercialPaperPage;

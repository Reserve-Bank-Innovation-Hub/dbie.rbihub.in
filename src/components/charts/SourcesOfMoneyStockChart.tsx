"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { SourcesOfMoneyStockDataRow } from "@/lib/api/tables/sources-of-money-stock";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface SourcesOfMoneyStockChartProps {
    data     : SourcesOfMoneyStockDataRow[];
    title  ? : string;
    height ? : number;
}

const SourcesOfMoneyStockChart : React.FC<SourcesOfMoneyStockChartProps> = ({
    data,
    title = "Sources of money stock (M3) — major components",
    height = 600,
}) => {
    // Data is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const x = useMemo(() => chartData.map(d => d.date), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x,
            y             : chartData.map(d => d.values["m3"]),
            name          : "M3 (total)",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.blueDark, width: 2.5 },
            hovertemplate : "<b>M3</b><br>%{x}<br>₹%{y:,.0f} cr<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.values["netBankCreditToGovernment"]),
            name          : "Net bank credit to government",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.greenMid, width: 1.5 },
            hovertemplate : "<b>Net bank credit to government</b><br>%{x}<br>₹%{y:,.0f} cr<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.values["bankCreditToCommercialSector"]),
            name          : "Bank credit to commercial sector",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.orangeMid, width: 1.5 },
            hovertemplate : "<b>Bank credit to commercial sector</b><br>%{x}<br>₹%{y:,.0f} cr<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.values["netForeignExchangeAssetsOfBankingSector"]),
            name          : "Net foreign exchange assets",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.purpleDark, width: 1.5 },
            hovertemplate : "<b>Net foreign exchange assets</b><br>%{x}<br>₹%{y:,.0f} cr<extra></extra>",
        },
    ], [ chartData, x ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 18),
        xaxis  : createAxis("Date", {
            type          : "date",
            rangeslider   : { visible: true },
            rangeselector : {
                buttons : [
                    { count: 1,  label: "1Y",  step: "year", stepmode: "backward" },
                    { count: 5,  label: "5Y",  step: "year", stepmode: "backward" },
                    { count: 10, label: "10Y", step: "year", stepmode: "backward" },
                    { step: "all", label: "All" },
                ],
            },
        }),
        yaxis  : createAxis("₹ crores", { rangemode: "tozero" }),
        height,
        margin : { t: 80, b: 150, l: 90, r: 40 },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("sources_of_money_stock_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "sources_of_money_stock_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="sources-of-money-stock-chart">
            <Plot
                data={traces}
                layout={layout}
                config={config}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler={true}
            />
        </div>
    );
};

export default SourcesOfMoneyStockChart;

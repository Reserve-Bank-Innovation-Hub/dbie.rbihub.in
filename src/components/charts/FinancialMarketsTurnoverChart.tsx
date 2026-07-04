"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { FinancialMarket, FinancialMarketsTurnoverRow } from "@/lib/api/tables/financial-markets-turnover";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// "Jan 30, 2026" -> "2026-01-30" so Plotly can use a time axis.
const periodToISO = (label : string) : string => {
    const MONTHS : Record<string, string> = {
        Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
        Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
    };
    const m = label.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
    if (!m) return label;
    const month = MONTHS[m[1]];
    if (!month) return label;
    return `${m[3]}-${month}-${String(m[2]).padStart(2, "0")}`;
};

// Headline markets shown in the chart — a readable cross-section of the table.
const HEADLINE_MARKET_KEYS = ["call_money", "triparty_repo", "market_repo", "gsec_dated"] as const;

const HEADLINE_COLORS = [
    CHART_COLORS.blueMid,
    CHART_COLORS.greenMid,
    CHART_COLORS.yellowDark,
    CHART_COLORS.purpleDark,
];

interface FinancialMarketsTurnoverChartProps {
    data     : FinancialMarketsTurnoverRow[];
    markets  : FinancialMarket[];
    title  ? : string;
    height ? : number;
}

const FinancialMarketsTurnoverChart : React.FC<FinancialMarketsTurnoverChartProps> = ({
    data,
    markets,
    title  = "Average daily turnover in select financial markets",
    height = 600,
}) => {
    // Data is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const x = useMemo(() => chartData.map(d => periodToISO(d.period)), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => {
        return HEADLINE_MARKET_KEYS.map((key, i) => {
            const market = markets.find(m => m.key === key);
            return {
                x,
                y             : chartData.map(d => d.values[key]),
                name          : market?.label ?? key,
                type          : "scatter",
                mode          : "lines",
                line          : {
                    color : HEADLINE_COLORS[i],
                    width : 2,
                },
                customdata    : chartData.map(d => d.period),
                hovertemplate :
                    "<b>%{fullData.name}</b><br>" +
                    "%{customdata}<br>" +
                    "₹%{y:,.2f} Cr<br>" +
                    "<extra></extra>",
            };
        });
    }, [ chartData, x, markets ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 18),
        xaxis  : createAxis("Week ended", {
            type          : "date",
            rangeslider   : { visible: true },
            rangeselector : {
                x       : 1,
                xanchor : "right",
                y       : 1.02,
                yanchor : "bottom",
                buttons : [
                    { count: 1,  label: "1Y",  step: "year",  stepmode: "backward" },
                    { count: 5,  label: "5Y",  step: "year",  stepmode: "backward" },
                    { count: 10, label: "10Y", step: "year",  stepmode: "backward" },
                    { step: "all", label: "All" },
                ],
            },
        }),
        yaxis  : createAxis("Rupees Crores", { rangemode: "tozero" }),
        height,
        margin : { t: 80, b: 40, l: 90, r: 40 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : 1.02,
            xanchor     : "left",
            x           : 0,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("financial_markets_turnover_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "financial_markets_turnover_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="financial-markets-turnover-chart">
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

export default FinancialMarketsTurnoverChart;

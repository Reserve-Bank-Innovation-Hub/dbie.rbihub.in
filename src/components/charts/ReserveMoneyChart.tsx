"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { ReserveMoneyRow } from "@/lib/api/tables/reserve-money";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// "31 Mar 2026" -> "2026-03-31" (ISO date, so Plotly can use a time axis).
const dateToISO = (label : string) : string => {
    const m = label.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
    if (!m) return label;
    const day  = m[1].padStart(2, "0");
    const mIdx = MONTH_NAMES.indexOf(m[2]);
    if (mIdx < 0) return label;
    return `${m[3]}-${String(mIdx + 1).padStart(2, "0")}-${day}`;
};

interface ReserveMoneyChartProps {
    data     : ReserveMoneyRow[];
    title  ? : string;
    height ? : number;
}

const ReserveMoneyChart : React.FC<ReserveMoneyChartProps> = ({
    data,
    title = "Reserve money and currency in circulation over time",
    height = 600,
}) => {
    // The file is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const x          = useMemo(() => chartData.map(d => dateToISO(d.date)), [ chartData ]);
    const dateLabels = useMemo(() => chartData.map(d => d.date), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x,
            y             : chartData.map(d => d.values[0]),   // RM — reserve money total
            name          : "Reserve money",
            type          : "scatter",
            mode          : "lines",
            line          : { color : CHART_COLORS.purpleDark, width : 2 },
            customdata    : dateLabels,
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{customdata}<br>" +
                "₹%{y:,.2f}M<br>" +
                "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.values[1]),   // 1.1 — currency in circulation
            name          : "Currency in circulation",
            type          : "scatter",
            mode          : "lines",
            line          : { color : CHART_COLORS.blueMid, width : 2 },
            customdata    : dateLabels,
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{customdata}<br>" +
                "₹%{y:,.2f}M<br>" +
                "<extra></extra>",
        },
    ], [ chartData, x, dateLabels ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 20),
        xaxis  : createAxis("Date", {
            type          : "date",
            rangeslider   : { visible : true },
            rangeselector : {
                x       : 1,
                xanchor : "right",
                y       : 1.02,
                yanchor : "bottom",
                buttons : [
                    { count : 1,  label : "1Y",  step : "year", stepmode : "backward" },
                    { count : 5,  label : "5Y",  step : "year", stepmode : "backward" },
                    { count : 10, label : "10Y", step : "year", stepmode : "backward" },
                    { step : "all", label : "All" },
                ],
            },
        }),
        yaxis  : createAxis("Rupees millions", { rangemode : "tozero" }),
        height,
        margin : { t : 80, b : 40, l : 80, r : 40 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : 1.02,
            xanchor     : "left",
            x           : 0,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("reserve_money_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "reserve_money_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="reserve-money-chart">
            <Plot
                data={traces}
                layout={layout}
                config={config}
                style={{ width : "100%", height : "100%" }}
                useResizeHandler={true}
            />
        </div>
    );
};

export default ReserveMoneyChart;

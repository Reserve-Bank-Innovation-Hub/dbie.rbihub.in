"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { ReerAndNeerRow } from "@/lib/api/tables/reer-and-neer";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), {ssr : false});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "Jan 2026" -> "2026-01-01" (a real date, so Plotly can use a time axis).
const monthToISO = (label : string) : string => {
    const m = label.match(/^([A-Za-z]{3})\.?\s+(\d{4})$/);
    if (!m) return label;
    const idx = MONTHS.indexOf(m[1]);
    if (idx < 0) return label;
    return `${m[2]}-${String(idx + 1).padStart(2, "0")}-01`;
};

interface ReerAndNeerChartProps {
    data     : ReerAndNeerRow[];
    title  ? : string;
    height ? : number;
}

const ReerAndNeerChart : React.FC<ReerAndNeerChartProps> = ({
    data,
    title = "NEER and REER of the Indian rupee",
    height = 600,
}) => {
    // The file is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const x = useMemo(() => chartData.map(d => monthToISO(d.month)), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => {
        const monthLabels = chartData.map(d => d.month);

        return [
            {
                x,
                y             : chartData.map(d => d.trade_neer),
                name          : "Trade NEER",
                type          : "scatter",
                mode          : "lines",
                yaxis         : "y",
                line          : {
                    color : CHART_COLORS.purpleDark,
                    width : 2,
                },
                customdata    : monthLabels,
                hovertemplate :
                    "<b>%{fullData.name}</b><br>" +
                    "%{customdata}<br>" +
                    "%{y:.2f}<br>" +
                    "<extra></extra>",
            },
            {
                x,
                y             : chartData.map(d => d.trade_reer),
                name          : "Trade REER",
                type          : "scatter",
                mode          : "lines",
                yaxis         : "y",
                line          : {
                    color : CHART_COLORS.purpleLight,
                    width : 2,
                },
                customdata    : monthLabels,
                hovertemplate :
                    "<b>%{fullData.name}</b><br>" +
                    "%{customdata}<br>" +
                    "%{y:.2f}<br>" +
                    "<extra></extra>",
            },
            {
                x,
                y             : chartData.map(d => d.export_neer),
                name          : "Export NEER",
                type          : "scatter",
                mode          : "lines",
                yaxis         : "y",
                line          : {
                    color : CHART_COLORS.blueDark,
                    width : 2,
                },
                customdata    : monthLabels,
                hovertemplate :
                    "<b>%{fullData.name}</b><br>" +
                    "%{customdata}<br>" +
                    "%{y:.2f}<br>" +
                    "<extra></extra>",
            },
            {
                x,
                y             : chartData.map(d => d.export_reer),
                name          : "Export REER",
                type          : "scatter",
                mode          : "lines",
                yaxis         : "y",
                line          : {
                    color : CHART_COLORS.blueLight,
                    width : 2,
                },
                customdata    : monthLabels,
                hovertemplate :
                    "<b>%{fullData.name}</b><br>" +
                    "%{customdata}<br>" +
                    "%{y:.2f}<br>" +
                    "<extra></extra>",
            },
        ];
    }, [ chartData, x ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 20),
        xaxis  : createAxis("Month", {
            type          : "date",
            rangeslider   : {visible : true},
            rangeselector : {
                buttons : [
                    {count : 1, label : "1Y", step : "year", stepmode : "backward"},
                    {count : 5, label : "5Y", step : "year", stepmode : "backward"},
                    {count : 10, label : "10Y", step : "year", stepmode : "backward"},
                    {step : "all", label : "All"},
                ],
            },
        }),
        yaxis  : createAxis("Index (2015-16 = 100)", {
            rangemode : "tozero",
        }),
        height,
        margin : {t : 80, b : 150, l : 80, r : 40},
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : -0.35,
            xanchor     : "center",
            x           : 0.5,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("reer_and_neer_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "reer_and_neer_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="reer-and-neer-chart">
            <Plot
                data={traces}
                layout={layout}
                config={config}
                style={{width : "100%", height : "100%"}}
                useResizeHandler={true}
            />
        </div>
    );
};

export default ReerAndNeerChart;

"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { LRSDataRow } from "@/lib/api/tables/outward-remittances-lrs";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "Jan 2026" → "2026-01-01"
const monthToISO = (label : string) : string => {
    const m = label.match(/^([A-Za-z]{3})\.?\s+(\d{4})$/);
    if (!m) return label;
    const idx = MONTHS.indexOf(m[1]);
    if (idx < 0) return label;
    return `${m[2]}-${String(idx + 1).padStart(2, "0")}-01`;
};

interface OutwardRemittancesLRSChartProps {
    data     : LRSDataRow[];
    unit     : string;
    title  ? : string;
    height ? : number;
}

const OutwardRemittancesLRSChart : React.FC<OutwardRemittancesLRSChartProps> = ({
    data,
    unit,
    title  = "Outward remittances under the LRS",
    height = 500,
}) => {
    // Data is newest-first; reverse for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const x = useMemo(() => chartData.map(d => monthToISO(d.month)), [ chartData ]);

    // Show the four largest sub-categories and the total; Studies Abroad (index 9)
    // and Others (10) dominate, so they go on a secondary axis to preserve scale.
    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => {
        const months = chartData.map(d => d.month);

        const makeTrace = (
            name      : string,
            valueIdx  : number,
            color     : string,
            yaxis     : "y" | "y2" = "y",
        ) : Partial<Plotly.PlotData> => ({
            x,
            y             : chartData.map(d => d.values[valueIdx]),
            name,
            type          : "scatter",
            mode          : "lines",
            yaxis,
            line          : { color, width : 2 },
            customdata    : months,
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{customdata}<br>" +
                "US$ %{y:,.2f}M<br>" +
                "<extra></extra>",
        });

        return [
            // Small-magnitude series on primary y-axis
            makeTrace("Total LRS",               0, CHART_COLORS.blueDark,  "y"),
            makeTrace("Travel",                  6, CHART_COLORS.greenMid,  "y"),
            makeTrace("Maintenance of relatives", 7, CHART_COLORS.orangeMid, "y"),
            makeTrace("Gift",                    4, CHART_COLORS.yellowMid,  "y"),
            // Large-magnitude series (studies, others) on secondary axis
            makeTrace("Studies abroad",          9, CHART_COLORS.purpleDark, "y2"),
            makeTrace("Others",                 10, CHART_COLORS.redMid,     "y2"),
        ];
    }, [ chartData, x ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 18),
        xaxis  : createAxis("Month", {
            type          : "date",
            rangeslider   : { visible : true },
            rangeselector : {
                x       : 1,
                xanchor : "right",
                y       : 1.02,
                yanchor : "bottom",
                buttons : [
                    { count : 2,  label : "2Y",  step : "year", stepmode : "backward" },
                    { count : 5,  label : "5Y",  step : "year", stepmode : "backward" },
                    { count : 10, label : "10Y", step : "year", stepmode : "backward" },
                    { step : "all", label : "All" },
                ],
            },
        }),
        yaxis  : createAxis(`${unit} (smaller series)`, { rangemode : "tozero" }),
        yaxis2 : createAxis(`${unit} (studies & others)`, {
            overlaying : "y",
            side       : "right",
            rangemode  : "tozero",
        }),
        height,
        margin : { t : 80, b : 40, l : 80, r : 80 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : 1.02,
            xanchor     : "left",
            x           : 0,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("outward_remittances_lrs_chart");

    return (
        <div className="outward-remittances-lrs-chart">
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

export default OutwardRemittancesLRSChart;

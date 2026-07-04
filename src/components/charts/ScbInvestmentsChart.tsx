"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { ScbInvestmentsRow } from "@/lib/api/tables/scb-investments";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ScbInvestmentsChartProps {
    data    : ScbInvestmentsRow[];
    title ? : string;
    height? : number;
}

const ScbInvestmentsChart : React.FC<ScbInvestmentsChartProps> = ({
    data,
    title  = "SLR securities holdings over time",
    height = 600,
}) => {
    // The file is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const x = useMemo(() => chartData.map(d => d.fortnight), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => ([
        {
            x,
            y             : chartData.map(d => d.slr),
            name          : "SLR securities",
            type          : "scatter",
            mode          : "lines",
            line          : {
                color : CHART_COLORS.blueDark,
                width : 2,
            },
            customdata    : chartData.map(d => d.fortnight),
            hovertemplate :
                "<b>SLR securities</b><br>" +
                "%{customdata}<br>" +
                "₹%{y:,.2f} Cr<br>" +
                "<extra></extra>",
        },
    ]), [ chartData, x ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 20),
        xaxis  : createAxis("Fortnight ended", {
            type          : "date",
            rangeslider   : { visible: true },
            rangeselector : {
                x       : 1,
                xanchor : "right",
                y       : 1.02,
                yanchor : "bottom",
                buttons : [
                    { count: 1,  label: "1Y",  step: "year", stepmode: "backward" },
                    { count: 5,  label: "5Y",  step: "year", stepmode: "backward" },
                    { count: 10, label: "10Y", step: "year", stepmode: "backward" },
                    { step: "all", label: "All" },
                ],
            },
        }),
        yaxis  : createAxis("₹ Crores", {
            rangemode : "tozero",
        }),
        height,
        margin : { t: 80, b: 40, l: 80, r: 40 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : 1.02,
            xanchor     : "left",
            x           : 0,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("scb_investments_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "scb_investments_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="scb-investments-chart">
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

export default ScbInvestmentsChart;

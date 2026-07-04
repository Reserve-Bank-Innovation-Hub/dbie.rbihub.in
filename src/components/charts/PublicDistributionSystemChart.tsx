"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { PDSRow } from "@/lib/api/tables/public-distribution-system-procurement-off-take-and-stocks";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface PublicDistributionSystemChartProps {
    data     : PDSRow[];
    title  ? : string;
    height ? : number;
}

const PublicDistributionSystemChart : React.FC<PublicDistributionSystemChartProps> = ({
    data,
    title = "Public distribution system — procurement, off-take and stocks",
    height = 600,
}) => {
    // Data is newest-first; reverse to oldest-first for a left-to-right x-axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const x = useMemo(() => chartData.map(d => d.year), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x,
            y             : chartData.map(d => d.proc_total),
            name          : "Total procurement",
            type          : "scatter",
            mode          : "lines",
            connectgaps   : false,
            line          : {
                color : CHART_COLORS.yellowDark,
                width : 2,
            },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "%{y} lakh T<br>" +
                "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.offt_total),
            name          : "Total off-take",
            type          : "scatter",
            mode          : "lines",
            connectgaps   : false,
            line          : {
                color : CHART_COLORS.greenMid,
                width : 2,
            },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "%{y} lakh T<br>" +
                "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.stck_total),
            name          : "Total stocks",
            type          : "scatter",
            mode          : "lines",
            connectgaps   : false,
            line          : {
                color : CHART_COLORS.blueMid,
                width : 2,
            },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "%{y} lakh T<br>" +
                "<extra></extra>",
        },
    ], [ chartData, x ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 20),
        xaxis  : createAxis("Year", {
            type          : "category",
            rangeselector : {
                x       : 1,
                xanchor : "right",
                y       : 1.02,
                yanchor : "bottom",
                buttons : [
                    {
                        count    : 10,
                        label    : "10Y",
                        step     : "all",
                        stepmode : "backward",
                    } as any,
                    {
                        count    : 25,
                        label    : "25Y",
                        step     : "all",
                        stepmode : "backward",
                    } as any,
                    { step: "all", label: "All" },
                ],
            },
        }),
        yaxis  : createAxis("Lakhs tonnes", {
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

    const config : Partial<Plotly.Config> = getBaseConfig("public_distribution_system_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "public_distribution_system_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="pds-chart">
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

export default PublicDistributionSystemChart;

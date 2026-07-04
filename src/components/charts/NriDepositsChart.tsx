"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { NriDepositsRow } from "@/lib/api/tables/nri-deposits";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// "YYYY-MM" → "YYYY-MM-01" (ISO date string for Plotly time axis).
function monthToISO(key : string) : string {
    return key.length === 7 ? `${key}-01` : key;
}

interface NriDepositsChartProps {
    data     : NriDepositsRow[];
    unit     : string;
    title  ? : string;
    height ? : number;
}

const NriDepositsChart : React.FC<NriDepositsChartProps> = ({
    data,
    unit,
    title  = "NRI deposits — outstanding balances",
    height = 500,
}) => {
    // File is newest-first; reverse for left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [data]);

    const x = useMemo(() => chartData.map(r => monthToISO(r.month)), [chartData]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => {
        const monthLabels = chartData.map(r => r.month);

        return [
            {
                x,
                y             : chartData.map(r => r.outstanding_fcnrb),
                name          : "FCNR(B)",
                type          : "scatter",
                mode          : "lines",
                stackgroup    : "outstanding",
                line          : { color: CHART_COLORS.blueMid },
                customdata    : monthLabels,
                hovertemplate : "<b>FCNR(B)</b><br>%{customdata}<br>%{y:,.1f}<extra></extra>",
            },
            {
                x,
                y             : chartData.map(r => r.outstanding_nrera),
                name          : "NR(E)RA",
                type          : "scatter",
                mode          : "lines",
                stackgroup    : "outstanding",
                line          : { color: CHART_COLORS.greenMid },
                customdata    : monthLabels,
                hovertemplate : "<b>NR(E)RA</b><br>%{customdata}<br>%{y:,.1f}<extra></extra>",
            },
            {
                x,
                y             : chartData.map(r => r.outstanding_nro),
                name          : "NRO",
                type          : "scatter",
                mode          : "lines",
                stackgroup    : "outstanding",
                line          : { color: CHART_COLORS.purpleLight },
                customdata    : monthLabels,
                hovertemplate : "<b>NRO</b><br>%{customdata}<br>%{y:,.1f}<extra></extra>",
            },
        ];
    }, [chartData, x]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 18),
        xaxis  : createAxis("Month", {
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
        yaxis  : createAxis(`${unit}`, { rangemode: "tozero" }),
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

    const config : Partial<Plotly.Config> = getBaseConfig("nri_deposits_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "nri_deposits_chart",
            height   : 800,
            width    : 1400,
            scale    : 2,
        },
    });

    return (
        <div className="nri-deposits-chart">
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

export default NriDepositsChart;

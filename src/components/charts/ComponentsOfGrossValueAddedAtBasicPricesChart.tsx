"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { ComponentsOfGrossValueAddedAtBasicPricesRow } from "@/lib/api/tables/components-of-gross-value-added-at-basic-prices";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ComponentsOfGrossValueAddedAtBasicPricesChartProps {
    data     : ComponentsOfGrossValueAddedAtBasicPricesRow[];
    title  ? : string;
    height ? : number;
}

const ComponentsOfGrossValueAddedAtBasicPricesChart : React.FC<ComponentsOfGrossValueAddedAtBasicPricesChartProps> = ({
    data,
    title  = "Components of gross value added at basic prices (constant prices)",
    height = 600,
}) => {
    // The file is newest-first; reverse to oldest-first for left-to-right axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const years = useMemo(() => chartData.map(d => d.year), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x             : years,
            y             : chartData.map(d => d.agri_const),
            name          : "Agriculture, forestry & fishing",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.greenMid, width: 2 },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "₹%{y:,.0f} cr<br>" +
                "<extra></extra>",
        },
        {
            x             : years,
            y             : chartData.map(d => d.industry_const),
            name          : "Industry",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.blueMid, width: 2 },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "₹%{y:,.0f} cr<br>" +
                "<extra></extra>",
        },
        {
            x             : years,
            y             : chartData.map(d => d.services_const),
            name          : "Services",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.purpleDark, width: 2 },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "₹%{y:,.0f} cr<br>" +
                "<extra></extra>",
        },
        {
            x             : years,
            y             : chartData.map(d => d.gva_const),
            name          : "GVA at basic prices",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.yellowMid, width: 2.5 },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "₹%{y:,.0f} cr<br>" +
                "<extra></extra>",
        },
    ], [ chartData, years ]);

    // Range selector buttons using slice indices (category axis)
    const totalYears = chartData.length;

    const makeRangeButton = (label : string, count : number | null) : any => {
        if (count === null || count >= totalYears) {
            return { label: "All", step: "all" };
        }
        return {
            label,
            method : "relayout",
            args   : [ { "xaxis.range": [ totalYears - count - 1, totalYears - 1 ] } ],
        };
    };

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 18),
        xaxis  : createAxis("Year", {
            type          : "category",
            rangeselector : {
                x       : 1,
                xanchor : "right",
                y       : 1.02,
                yanchor : "bottom",
                buttons : [
                    makeRangeButton("10Y", 10),
                    makeRangeButton("25Y", 25),
                    makeRangeButton("50Y", 50),
                    makeRangeButton("All", null),
                ],
            },
            tickangle     : -45,
            nticks        : 20,
        }),
        yaxis  : createAxis("Rupees crore", { rangemode: "tozero" }),
        height,
        margin : { t: 80, b: 40, l: 100, r: 40 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : 1.02,
            xanchor     : "left",
            x           : 0,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("gva_components_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "gva_components_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="components-of-gross-value-added-at-basic-prices-chart">
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

export default ComponentsOfGrossValueAddedAtBasicPricesChart;

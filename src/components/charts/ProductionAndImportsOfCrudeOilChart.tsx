"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { CrudeOilPetroleumRow } from "@/lib/api/tables/production-and-imports-of-crude-oil-and-petroleum-products";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ProductionAndImportsOfCrudeOilChartProps {
    data    : CrudeOilPetroleumRow[];
    title  ?: string;
    height ?: number;
}

const ProductionAndImportsOfCrudeOilChart : React.FC<ProductionAndImportsOfCrudeOilChartProps> = ({
    data,
    title  = "Production and imports of crude oil and petroleum products",
    height = 600,
}) => {
    // Data arrives newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const x = useMemo(() => chartData.map(d => d.year), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x,
            y             : chartData.map(d => d.crude_prod),
            name          : "Production — crude oil",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.blueDark, width: 2 },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "%{y:.2f} MMT<br>" +
                "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.pol_prod),
            name          : "Production — POL products",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.blueMid, width: 2 },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "%{y:.2f} MMT<br>" +
                "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.crude_imp),
            name          : "Imports — crude oil",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.greenDark, width: 2 },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "%{y:.2f} MMT<br>" +
                "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.pol_imp),
            name          : "Imports — POL products",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.greenMid, width: 2 },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "%{y:.2f} MMT<br>" +
                "<extra></extra>",
        },
    ], [ chartData, x ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 18),
        xaxis  : createAxis("Year", { type: "category" }),
        yaxis  : createAxis("MMT", { rangemode: "tozero" }),
        height,
        margin : { t: 80, b: 120, l: 80, r: 40 },
        legend : {
            orientation: "h",
            yanchor    : "bottom",
            y          : -0.30,
            xanchor    : "center",
            x          : 0.5,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig(
        "production_and_imports_of_crude_oil_and_petroleum_products_chart",
        {
            toImageButtonOptions: {
                format  : "png",
                filename: "production_and_imports_of_crude_oil_and_petroleum_products_chart",
                height  : 1000,
                width   : 1600,
                scale   : 2,
            },
        },
    );

    return (
        <div className="crude-oil-chart">
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

export default ProductionAndImportsOfCrudeOilChart;

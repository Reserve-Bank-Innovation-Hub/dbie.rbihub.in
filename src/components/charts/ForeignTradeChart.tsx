"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { ForeignTradeRow } from "@/lib/api/tables/foreign-trade";

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

interface ForeignTradeChartProps {
    data     : ForeignTradeRow[];
    title  ? : string;
    height ? : number;
}

const ForeignTradeChart : React.FC<ForeignTradeChartProps> = ({
    data,
    title  = "India foreign trade — exports, imports and trade balance",
    height = 600,
}) => {
    // File is newest-first; reverse for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [data]);

    const x = useMemo(() => chartData.map(r => monthToISO(r.month)), [chartData]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => {
        const monthLabels = chartData.map(r => r.month);

        return [
            {
                x,
                y             : chartData.map(r => r.exports_usd),
                name          : "Exports",
                type          : "scatter",
                mode          : "lines",
                line          : { color: CHART_COLORS.greenMid, width: 2 },
                customdata    : monthLabels,
                hovertemplate : "<b>Exports</b><br>%{customdata}<br>US$ %{y:,.1f} mn<extra></extra>",
            },
            {
                x,
                y             : chartData.map(r => r.imports_usd),
                name          : "Imports",
                type          : "scatter",
                mode          : "lines",
                line          : { color: CHART_COLORS.orangeMid, width: 2 },
                customdata    : monthLabels,
                hovertemplate : "<b>Imports</b><br>%{customdata}<br>US$ %{y:,.1f} mn<extra></extra>",
            },
            {
                x,
                y             : chartData.map(r => r.trade_balance_usd),
                name          : "Trade balance",
                type          : "scatter",
                mode          : "lines",
                yaxis         : "y2",
                line          : { color: CHART_COLORS.redMid, width: 2, dash: "dot" },
                customdata    : monthLabels,
                hovertemplate : "<b>Trade balance</b><br>%{customdata}<br>US$ %{y:,.1f} mn<extra></extra>",
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
        yaxis  : createAxis("US$ millions", { rangemode: "tozero" }),
        yaxis2 : createAxis("Trade balance (US$ mn)", {
            overlaying : "y",
            side       : "right",
        }),
        height,
        margin : { t: 80, b: 40, l: 80, r: 80 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : 1.02,
            xanchor     : "left",
            x           : 0,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("foreign_trade_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "foreign_trade_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="foreign-trade-chart">
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

export default ForeignTradeChart;

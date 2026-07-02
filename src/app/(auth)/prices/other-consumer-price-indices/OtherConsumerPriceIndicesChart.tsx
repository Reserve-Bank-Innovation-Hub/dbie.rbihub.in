"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { OtherCPIRow } from "@/lib/api/tables/other-consumer-price-indices";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@/components/charts/chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface OtherConsumerPriceIndicesChartProps {
    data       : OtherCPIRow[];
    seriesKey  : string;
    title    ? : string;
    height   ? : number;
}

// Line chart of a single headline series (default: CPI for Industrial Workers,
// 2016 = 100) over time. Months where the series is unpublished (null) are
// dropped so the line spans only the base's live window.
const OtherConsumerPriceIndicesChart : React.FC<OtherConsumerPriceIndicesChartProps> = ({
    data,
    seriesKey,
    title = "Consumer Price Index for Industrial Workers (2016 = 100)",
    height = 600,
}) => {
    // Oldest -> newest, keeping only months where the headline series is published.
    const points = useMemo(() => {
        return [ ...data ]
            .reverse()
            .map(row => ({ month : row.month, value : row.values[seriesKey] }))
            .filter(p => p.value != null);
    }, [ data, seriesKey ]);

    const traces = useMemo(() => [
        {
            x             : points.map(p => p.month),
            y             : points.map(p => p.value as number),
            type          : "scatter" as const,
            mode          : "lines" as const,
            name          : "Index value",
            line          : {
                color : CHART_COLORS.purpleDark,
                width : 2,
            },
            hovertemplate :
                "<b>%{x|%b %Y}</b><br>" +
                "Index: %{y:.1f}<br>" +
                "<extra></extra>",
        },
    ], [ points ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 18),
        xaxis  : createAxis("Month", {
            type          : "date",
            rangeslider   : { visible : true },
            rangeselector : {
                buttons : [
                    { count : 1, label : "1Y", step : "year", stepmode : "backward" },
                    { count : 5, label : "5Y", step : "year", stepmode : "backward" },
                    { count : 10, label : "10Y", step : "year", stepmode : "backward" },
                    { step : "all", label : "All" },
                ],
            },
        }),
        yaxis  : createAxis("Index value"),
        height,
        margin : { t : 80, b : 150, l : 60, r : 40 },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("other_consumer_price_indices_chart");

    return (
        <div className="other-consumer-price-indices-chart-plot">
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

export default OtherConsumerPriceIndicesChart;

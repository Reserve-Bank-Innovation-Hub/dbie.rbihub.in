"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { CPISeries } from "@/lib/api/tables/consumer-price-index";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ConsumerPriceIndexChartProps {
    series : CPISeries; // the selected base period
}

// Headline series: the General Index (Rural / Urban / Combined) over time.
const GENERAL_INDEX = "A) General Index";

const ConsumerPriceIndexChart : React.FC<ConsumerPriceIndexChartProps> = ({ series }) => {
    const chartData = useMemo(() => {
        // Oldest-first for a left-to-right time axis.
        const months = [ ...series.months ].reverse();
        const byMonth = new Map(
            series.rows.filter((r) => r.commodity === GENERAL_INDEX).map((r) => [ r.month, r ]),
        );

        const pick = (key: "ruralIndex" | "urbanIndex" | "combinedIndex") =>
            months.map((m) => {
                const r = byMonth.get(m);
                return r ? r[key] : null;
            });

        const rural : Plotly.Data = {
            x    : months,
            y    : pick("ruralIndex"),
            type : "scatter",
            mode : "lines",
            name : "Rural",
            line : { color: CHART_COLORS.greenMid, width: 2 },
        };

        const urban : Plotly.Data = {
            x    : months,
            y    : pick("urbanIndex"),
            type : "scatter",
            mode : "lines",
            name : "Urban",
            line : { color: CHART_COLORS.blueMid, width: 2 },
        };

        const combined : Plotly.Data = {
            x    : months,
            y    : pick("combinedIndex"),
            type : "scatter",
            mode : "lines",
            name : "Combined",
            line : { color: CHART_COLORS.purpleDark, width: 3 },
        };

        return [ rural, urban, combined ];
    }, [ series ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(`General Index over time (base ${series.base})`),
        xaxis  : createAxis("Month", { showgrid: false, type: "date" }),
        yaxis  : createAxis("Index", { showgrid: true, gridcolor: "#e5e7eb" }),
        margin : { t: 60, b: 80, l: 80, r: 40 },
        legend : {
            orientation : "h",
            x           : 0.5,
            xanchor     : "center",
            y           : -0.2,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("consumer_price_index_chart", {
        displayModeBar : false,
    });

    return (
        <Plot
            data={chartData}
            layout={layout}
            config={config}
            useResizeHandler
            style={{ width: "100%", height: "100%" }}
        />
    );
};

export default ConsumerPriceIndexChart;

"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { ExternalDebtRow } from "@/lib/api/publications";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

const Plot = dynamic(() => import("react-plotly.js"), {ssr : false});

interface ExternalDebtChartProps {
        data : ExternalDebtRow[];
}

const ExternalDebtChart : React.FC<ExternalDebtChartProps> = ({data}) => {
    const chartData = useMemo(() => {
        // Create traces for stacked area chart showing components
        const years = data.map(d => d.year).reverse();

        const trace1 : Plotly.Data = {
            x          : years,
            y          : data.map(d => d.multilateralTotal).reverse(),
            type       : "scatter",
            mode       : "lines",
            stackgroup : "one",
            name       : "Multilateral",
            line       : {width : 0},
            fillcolor  : CHART_COLORS.purpleDark,
        };

        const trace2 : Plotly.Data = {
            x          : years,
            y          : data.map(d => d.bilateralTotal).reverse(),
            type       : "scatter",
            mode       : "lines",
            stackgroup : "one",
            name       : "Bilateral",
            line       : {width : 0},
            fillcolor  : CHART_COLORS.greenLight,
        };

        const trace3 : Plotly.Data = {
            x          : years,
            y          : data.map(d => d.commercialBorrowing).reverse(),
            type       : "scatter",
            mode       : "lines",
            stackgroup : "one",
            name       : "Commercial borrowing",
            line       : {width : 0},
            fillcolor  : CHART_COLORS.redMid,
        };

        const trace4 : Plotly.Data = {
            x          : years,
            y          : data.map(d => d.shortTermDebt).reverse(),
            type       : "scatter",
            mode       : "lines",
            stackgroup : "one",
            name       : "Short-term debt",
            line       : {width : 0},
            fillcolor  : CHART_COLORS.yellowMid,
        };

        // Total line overlay
        const trace5 : Plotly.Data = {
            x      : years,
            y      : data.map(d => d.grossExternalDebt).reverse(),
            type   : "scatter",
            mode   : "lines+markers",
            name   : "Gross external debt",
            line   : {color : CHART_COLORS.blueLight, width : 3},
            marker : {size : 6, color : CHART_COLORS.blueDark},
        };

        return [ trace1, trace2, trace3, trace4, trace5 ];
    }, [ data ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle("India’s external debt trends"),
        xaxis  : createAxis("Year", {showgrid : false}),
        yaxis  : createAxis("Amount (₹ crores)", {
            showgrid  : true,
            gridcolor : "#e5e7eb",
        }),
        margin : {t : 60, b : 80, l : 100, r : 40},
        legend : {
            orientation : "h",
            x           : 0.5,
            xanchor     : "center",
            y           : -0.2,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("external_debt_chart", {
        displayModeBar : false,
    });

    return (
        <Plot
            data={chartData}
            layout={layout}
            config={config}
            useResizeHandler
            style={{width : "100%", height : "100%"}}
        />
    );
};

export default ExternalDebtChart;

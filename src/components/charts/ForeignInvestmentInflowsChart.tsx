"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { ForeignInvestmentInflowsRow } from "@/lib/api/indicators";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), {ssr : false});

interface ForeignInvestmentInflowsChartProps {
    data     : ForeignInvestmentInflowsRow[];
    title  ? : string;
    height ? : number;
}

const ForeignInvestmentInflowsChart : React.FC<ForeignInvestmentInflowsChartProps> = ({
    data,
    title = "Foreign investment inflows — last 12 months",
}) => {
    // Prepare data (reverse to show oldest to newest)
    const chartData = useMemo(() => {
        return [ ...data ].reverse();
    }, [ data ]);

    // Create relative time labels with 'm' suffix for months
    const relativeLabels = useMemo(() => {
        return chartData.map((_, index) => {
            const monthsAgo = chartData.length - 1 - index;
            return `${monthsAgo}m`;
        });
    }, [ chartData ]);

    // Create line traces for investment flows
    const traces = useMemo(() => {
        const months = chartData.map(d => d.month);

        return [
            // Net FDI
            {
                x             : relativeLabels,
                y             : chartData.map(d => d.netFdi * 10), // Convert crores to millions
                name          : "Net FDI",
                type          : "scatter" as const,
                mode          : "lines+markers" as const,
                line          : {
                    color : CHART_COLORS.purpleLight,
                    width : 3,
                },
                marker        : {
                    size   : 6,
                    color  : CHART_COLORS.purpleDark,
                    symbol : "circle" as const,
                },
                customdata    : months,
                hovertemplate : "<b>%{fullData.name}</b><br>" +
                    "Month: %{customdata}<br>" +
                    "Value: $%{y:,.0f} million<br>" +
                    "<extra></extra>",
            },
            // Net Portfolio Investment
            {
                x             : relativeLabels,
                y             : chartData.map(d => d.netPortfolioInvestment * 10), // Convert crores to millions
                name          : "Net portfolio investment",
                type          : "scatter" as const,
                mode          : "lines+markers" as const,
                line          : {
                    color : CHART_COLORS.greenMid,
                    width : 3,
                },
                marker        : {
                    size   : 6,
                    color  : CHART_COLORS.greenDark,
                    symbol : "square" as const,
                },
                customdata    : months,
                hovertemplate : "<b>%{fullData.name}</b><br>" +
                    "Month: %{customdata}<br>" +
                    "Value: $%{y:,.0f} million<br>" +
                    "<extra></extra>",
            },
            // Total Investment Inflows
            {
                x             : relativeLabels,
                y             : chartData.map(d => d.totalInvestmentInflows * 10), // Convert crores to millions
                name          : "Total investment inflows",
                type          : "scatter" as const,
                mode          : "lines+markers" as const,
                line          : {
                    color : CHART_COLORS.redLight,
                    width : 4,
                },
                marker        : {
                    size   : 8,
                    color  : CHART_COLORS.redDark,
                    symbol : "diamond" as const,
                },
                customdata    : months,
                hovertemplate : "<b>%{fullData.name}</b><br>" +
                    "Month: %{customdata}<br>" +
                    "Total: $%{y:,.0f} million<br>" +
                    "<extra></extra>",
            },
        ];
    }, [ chartData, relativeLabels ]);

    // Layout configuration
    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title : createTitle(title),
        xaxis : createAxis("Months ago", {type : "category"}),
        yaxis : createAxis("USD millions"),
    });

    // Config for Plotly controls
    const config : Partial<Plotly.Config> = getBaseConfig("foreign_investment_inflows_chart");

    return (
        <div className="foreign-investment-inflows-chart">
            <Plot
                data={traces}
                layout={layout}
                config={config}
                style={{width : "100%", height : "100%"}}
                useResizeHandler={true}
            />
        </div>
    );
};

export default ForeignInvestmentInflowsChart;

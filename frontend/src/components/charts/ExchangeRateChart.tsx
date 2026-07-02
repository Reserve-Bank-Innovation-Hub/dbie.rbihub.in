"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";

// UTILS ===============================================================================================================
import { ExchangeRateData, ParsedExchangeRates } from "@/utils/exchangeRateParser";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), {ssr : false});

interface ExchangeRateChartProps {
        parsedData   : ParsedExchangeRates;
        title      ? : string;
        height     ? : number;
}

const ExchangeRateChart : React.FC<ExchangeRateChartProps> = ({
    parsedData,
    title = "Daily exchange rate of Indian rupee",
    height = 600,
}) => {
    const [ selectedCurrencies, setSelectedCurrencies ] = useState<string[]>([
        "usDollar",
        "poundSterling",
        "euro",
        "japaneseYen",
    ]);

    // Color palette for currencies
    const colorMap : Record<string, string> = {
        usDollar      : CHART_COLORS.purpleDark,
        poundSterling : CHART_COLORS.redMid,
        euro          : CHART_COLORS.greenMid,
        japaneseYen   : CHART_COLORS.orangeMid,
    };

    // Create traces for each currency
    const traces = useMemo(() => {
        return parsedData.currencies
            .filter(currency => selectedCurrencies.includes(currency.name))
            .map(currency => ({
                x             : parsedData.data.map(d => d.date),
                y             : parsedData.data.map(d => d[currency.key as keyof ExchangeRateData]),
                type          : "scatter" as const,
                mode          : "lines" as const,
                name          : currency.displayName,
                line          : {
                    color : colorMap[currency.name],
                    width : 2,
                },
                hovertemplate :
                    "<b>%{fullData.name}</b><br>" +
                    "Date: %{x|%d-%b-%Y}<br>" +
                    "Rate: ₹%{y:.4f}<br>" +
                    "<extra></extra>",
            }));
    }, [ parsedData, selectedCurrencies ]);

    // Layout configuration
    const layout: Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 20),
        xaxis  : createAxis("Date", {
            type          : "date",
            rangeslider   : {visible : true},
            rangeselector : {
                buttons : [
                    {count : 1, label : "1M", step : "month", stepmode : "backward"},
                    {count : 3, label : "3M", step : "month", stepmode : "backward"},
                    {count : 6, label : "6M", step : "month", stepmode : "backward"},
                    {count : 1, label : "1Y", step : "year", stepmode : "backward"},
                    {step : "all", label : "All"},
                ],
            },
        }),
        yaxis  : createAxis("₹ per unit of foreign currency"),
        height,
        margin : {t : 80, b : 150, l : 60, r : 40},
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : -0.3,
            xanchor     : "center",
            x           : 0.5,
        },
    });

    // Config for Plotly controls
    const config: Partial<Plotly.Config> = getBaseConfig("exchange_rate_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "exchange_rate_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="exchange-rate-chart">
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

export default ExchangeRateChart;

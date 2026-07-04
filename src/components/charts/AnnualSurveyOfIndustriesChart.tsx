"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { ASICharacteristic, ASIDataRow } from "@/lib/api/tables/annual-survey-of-industries-principal-characteristics";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Key series to display by default (codes and their chart colours).
const KEY_SERIES = [
    { code: "21", color: CHART_COLORS.purpleDark },  // Net value added
    { code: "19", color: CHART_COLORS.blueMid },     // Value of output
    { code: "17", color: CHART_COLORS.greenMid },    // Total inputs
    { code: "12", color: CHART_COLORS.orangeMid },   // Total emoluments
] as const;

interface AnnualSurveyOfIndustriesChartProps {
    data            : ASIDataRow[];
    characteristics : ASICharacteristic[];
    title         ? : string;
    height        ? : number;
}

const AnnualSurveyOfIndustriesChart : React.FC<AnnualSurveyOfIndustriesChartProps> = ({
    data,
    characteristics,
    title  = "Annual survey of industries — key metrics",
    height = 560,
}) => {
    // Build a lookup from code to label.
    const labelByCode = useMemo<Record<string, string>>(() => {
        const map : Record<string, string> = {};
        characteristics.forEach((ch) => { map[ch.code] = ch.label; });
        return map;
    }, [ characteristics ]);

    // The dataset is newest-first; a time series reads oldest → newest.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const x = useMemo(() => chartData.map((d) => d.year), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => {
        return KEY_SERIES.map(({ code, color }) => ({
            x,
            y             : chartData.map((d) => d.values[code] ?? null),
            name          : labelByCode[code] ?? code,
            type          : "scatter",
            mode          : "lines",
            line          : { color, width: 2 },
            hovertemplate :
                `<b>${labelByCode[code] ?? code}</b><br>` +
                "%{x}<br>" +
                "₹%{y:,.2f} crores<br>" +
                "<extra></extra>",
        }));
    }, [ chartData, x, labelByCode ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 18),
        xaxis  : createAxis("Year", { type: "category", autorange: "reversed" }),
        yaxis  : createAxis("₹ crores", { rangemode: "tozero" }),
        height,
        margin : { t: 80, b: 40, l: 90, r: 40 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : 1.02,
            xanchor     : "left",
            x           : 0,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig(
        "annual_survey_of_industries_chart",
        {
            toImageButtonOptions : {
                format   : "png",
                filename : "annual_survey_of_industries_chart",
                height   : 900,
                width    : 1400,
                scale    : 2,
            },
        },
    );

    return (
        <div className="annual-survey-of-industries-chart">
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

export default AnnualSurveyOfIndustriesChart;

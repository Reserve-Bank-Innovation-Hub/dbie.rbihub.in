"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { CertificatesOfDepositRow } from "@/lib/api/tables/certificates-of-deposit";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), {ssr : false});

// "Mar 31, 2026" -> "2026-03-31" (a real date, so Plotly can use a time axis).
const fortnightToISO = (label : string) : string => {
    const MONTHS : Record<string, string> = {
        Jan : "01", Feb : "02", Mar : "03", Apr : "04",
        May : "05", Jun : "06", Jul : "07", Aug : "08",
        Sep : "09", Oct : "10", Nov : "11", Dec : "12",
    };
    const m = label.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/);
    if (!m) return label;
    const mon = MONTHS[m[1]];
    if (!mon) return label;
    return `${m[3]}-${mon}-${String(m[2]).padStart(2, "0")}`;
};

interface CertificatesOfDepositChartProps {
    data     : CertificatesOfDepositRow[];
    title  ? : string;
    height ? : number;
}

const CertificatesOfDepositChart : React.FC<CertificatesOfDepositChartProps> = ({
    data,
    title = "Amount outstanding over time",
    height = 600,
}) => {
    // The file is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const x = useMemo(() => chartData.map(d => fortnightToISO(d.fortnightEnded)), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => {
        const labels = chartData.map(d => d.fortnightEnded);

        return [
            {
                x,
                y             : chartData.map(d => d.amountOutstanding),
                name          : "Amount outstanding",
                type          : "scatter",
                mode          : "lines",
                line          : {
                    color : CHART_COLORS.blueMid,
                    width : 2,
                },
                customdata    : labels,
                hovertemplate :
                    "<b>%{fullData.name}</b><br>" +
                    "%{customdata}<br>" +
                    "₹%{y:,.0f} Cr<br>" +
                    "<extra></extra>",
            },
        ];
    }, [ chartData, x ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 20),
        xaxis  : createAxis("Fortnight ended", {
            type          : "date",
            rangeslider   : {visible : true},
            rangeselector : {
                x       : 1,
                xanchor : "right",
                y       : 1.02,
                yanchor : "bottom",
                buttons : [
                    {count : 1, label : "1Y", step : "year", stepmode : "backward"},
                    {count : 5, label : "5Y", step : "year", stepmode : "backward"},
                    {count : 10, label : "10Y", step : "year", stepmode : "backward"},
                    {step : "all", label : "All"},
                ],
            },
        }),
        yaxis  : createAxis("Amount outstanding (₹ Crores)", {
            rangemode : "tozero",
        }),
        height,
        margin : {t : 80, b : 40, l : 80, r : 40},
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : 1.02,
            xanchor     : "left",
            x           : 0,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("certificates_of_deposit_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "certificates_of_deposit_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="certificates-of-deposit-chart">
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

export default CertificatesOfDepositChart;

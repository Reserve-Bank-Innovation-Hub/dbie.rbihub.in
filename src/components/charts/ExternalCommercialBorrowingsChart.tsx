"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { ECBRow } from "@/lib/api/tables/external-commercial-borrowings";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

// Map month abbreviation to a numeric index within the FY (Apr=0 … Mar=11).
const FY_MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

// Build a display label like "2025-26 Apr" for use on the x-axis.
const periodLabel = (fy : string, month : string) : string => `${fy.slice(0, 7)} ${month}`;

interface ExternalCommercialBorrowingsChartProps {
    rows     : ECBRow[];
    unit     : string;
    title  ? : string;
    height ? : number;
}

const ExternalCommercialBorrowingsChart : React.FC<ExternalCommercialBorrowingsChartProps> = ({
    rows,
    unit,
    title  = "ECB registrations — automatic vs. approval route",
    height = 500,
}) => {
    // Sort oldest-first (rows come oldest-first from the processor, but confirm).
    const sorted = useMemo(() => {
        return [ ...rows ].sort((a, b) => {
            const fyA = a.fy.trim(), fyB = b.fy.trim();
            if (fyA !== fyB) return fyA < fyB ? -1 : 1;
            return FY_MONTHS.indexOf(a.month) - FY_MONTHS.indexOf(b.month);
        });
    }, [ rows ]);

    const x = useMemo(() => sorted.map(r => periodLabel(r.fy, r.month)), [ sorted ]);

    // values indices: [1]=auto amount, [3]=approval amount, [5]=total amount, [4]=total no.
    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => {
        const makeTrace = (
            name     : string,
            valIdx   : number,
            color    : string,
            yaxis    : "y" | "y2" = "y",
            mode     : string = "lines",
        ) : Partial<Plotly.PlotData> => ({
            x,
            y             : sorted.map(r => r.values[valIdx]),
            name,
            type          : "scatter",
            mode          : mode as any,
            yaxis,
            line          : { color, width : 2 },
            customdata    : sorted.map(r => `${r.fy}  ${r.month}`),
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{customdata}<br>" +
                "US$ %{y:,.0f}M<br>" +
                "<extra></extra>",
        });

        const countTrace = (
            name   : string,
            valIdx : number,
            color  : string,
        ) : Partial<Plotly.PlotData> => ({
            x,
            y             : sorted.map(r => r.values[valIdx]),
            name,
            type          : "scatter",
            mode          : "lines+markers",
            yaxis         : "y2",
            line          : { color, width : 2, dash : "dot" },
            marker        : { size : 4, color },
            customdata    : sorted.map(r => `${r.fy}  ${r.month}`),
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{customdata}<br>" +
                "%{y} registrations<br>" +
                "<extra></extra>",
        });

        return [
            makeTrace("Automatic route (amount)",  1, CHART_COLORS.blueMid),
            makeTrace("Approval route (amount)",   3, CHART_COLORS.greenMid),
            makeTrace("Total amount",              5, CHART_COLORS.blueDark),
            countTrace("Total registrations (no.)", 4, CHART_COLORS.purpleDark),
        ];
    }, [ sorted, x ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 18),
        xaxis  : createAxis("Period", {
            tickangle : -45,
            tickmode  : "auto",
            nticks    : 24,
        }),
        yaxis  : createAxis(unit, { rangemode : "tozero" }),
        yaxis2 : createAxis("Number of registrations", {
            overlaying : "y",
            side       : "right",
            rangemode  : "tozero",
        }),
        height,
        margin : { t : 80, b : 160, l : 80, r : 80 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : -0.45,
            xanchor     : "center",
            x           : 0.5,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("external_commercial_borrowings_chart");

    return (
        <div className="external-commercial-borrowings-chart">
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

export default ExternalCommercialBorrowingsChart;

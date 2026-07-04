"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { EmploymentRow } from "@/lib/api/tables/employment-in-public-and-organised-private-sectors";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface EmploymentInPublicAndOrganisedPrivateSectorsChartProps {
    data     : EmploymentRow[];
    title  ? : string;
    height ? : number;
}

const EmploymentInPublicAndOrganisedPrivateSectorsChart : React.FC<EmploymentInPublicAndOrganisedPrivateSectorsChartProps> = ({
    data,
    title = "Employment in public and organised private sectors",
    height = 600,
}) => {
    // Data is newest-first; reverse to oldest-first for left-to-right x-axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const x = useMemo(() => chartData.map(d => d.year), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x,
            y             : chartData.map(d => d.public_sector),
            name          : "Public sector",
            type          : "scatter",
            mode          : "lines",
            connectgaps   : false,
            line          : {
                color : CHART_COLORS.blueMid,
                width : 2,
            },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "%{y} lakhs<br>" +
                "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.private_sector),
            name          : "Private sector",
            type          : "scatter",
            mode          : "lines",
            connectgaps   : false,
            line          : {
                color : CHART_COLORS.greenMid,
                width : 2,
            },
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{x}<br>" +
                "%{y} lakhs<br>" +
                "<extra></extra>",
        },
    ], [ chartData, x ]);

    const totalYears = chartData.length;

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 20),
        xaxis  : createAxis("Year", {
            type          : "category",
            rangeselector : {
                x       : 1,
                xanchor : "right",
                y       : 1.02,
                yanchor : "bottom",
                buttons : [
                    {
                        // 10Y: show last 10 categories from the right
                        count    : 10,
                        label    : "10Y",
                        step     : "all",
                        stepmode : "backward",
                    } as any,
                    {
                        count    : 25,
                        label    : "25Y",
                        step     : "all",
                        stepmode : "backward",
                    } as any,
                    { step: "all", label: "All" },
                ],
            },
        }),
        yaxis  : createAxis("Employment (lakhs)", {
            rangemode : "tozero",
        }),
        height,
        margin : { t: 80, b: 40, l: 80, r: 40 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : 1.02,
            xanchor     : "left",
            x           : 0,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("employment_public_private_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "employment_public_private_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="employment-public-private-chart">
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

export default EmploymentInPublicAndOrganisedPrivateSectorsChart;

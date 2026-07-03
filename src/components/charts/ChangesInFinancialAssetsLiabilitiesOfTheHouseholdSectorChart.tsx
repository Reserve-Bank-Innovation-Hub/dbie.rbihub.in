"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorRow } from "@/lib/api/tables/changes-in-financial-assets-liabilities-of-the-household-sector";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorChartProps {
    data     : ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorRow[];
    title  ? : string;
    height ? : number;
}

const ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorChart : React.FC<ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorChartProps> = ({
    data,
    title  = "Changes in financial assets/liabilities of the household sector",
    height = 600,
}) => {
    // The file is newest-first; reverse to oldest-first for a left-to-right axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const x = useMemo(() => chartData.map(d => d.year), [ chartData ]);

    // Range button helper — returns a slice of x covering the last N years (by count).
    const rangeEnd   = x[x.length - 1];
    const range10    = x.length > 10  ? x[x.length - 10]  : x[0];
    const range25    = x.length > 25  ? x[x.length - 25]  : x[0];

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x,
            y             : chartData.map(d => d.changes_in_financial_assets),
            name          : "Changes in financial assets",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.yellowMid, width: 2.5 },
            connectgaps   : false,
            hovertemplate :
                "<b>Changes in financial assets</b><br>" +
                "%{x}<br>" +
                "₹%{y:,.0f} cr<br>" +
                "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.bank_deposits),
            name          : "Bank deposits",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.blueMid, width: 2 },
            connectgaps   : false,
            hovertemplate :
                "<b>Bank deposits</b><br>" +
                "%{x}<br>" +
                "₹%{y:,.0f} cr<br>" +
                "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.bank_advances),
            name          : "Bank advances",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.redMid, width: 2 },
            connectgaps   : false,
            hovertemplate :
                "<b>Bank advances</b><br>" +
                "%{x}<br>" +
                "₹%{y:,.0f} cr<br>" +
                "<extra></extra>",
        },
    ], [ chartData, x ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 18),
        xaxis  : createAxis("Year", {
            type          : "category",
            rangeselector : {
                buttons : [
                    {
                        label  : "10Y",
                        step   : "all" as any,
                        count  : 1,
                        // Use visible range — handled below via range prop
                    },
                    { step: "all", label: "All" },
                ],
            },
        }),
        yaxis  : createAxis("Rupees crores", { rangemode: "normal" }),
        height,
        margin : { t: 80, b: 80, l: 80, r: 40 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : -0.25,
            xanchor     : "center",
            x           : 0.5,
        },
    });

    // Override xaxis with proper range buttons using category indices
    const totalPoints = x.length;
    const layoutWithButtons : Partial<Plotly.Layout> = {
        ...layout,
        xaxis : {
            ...layout.xaxis,
            rangeselector : {
                buttons : [
                    {
                        label  : "10Y",
                        step   : "all" as any,
                        count  : 1,
                    },
                    {
                        label  : "25Y",
                        step   : "all" as any,
                        count  : 1,
                    },
                    { step: "all", label: "All" },
                ],
                // Use category range directly
                activecolor : "#f0f0f0",
            },
            // Default to showing all — user can click buttons to narrow
        },
        updatemenus : [
            {
                type      : "buttons",
                direction : "right",
                x         : 0,
                y         : 1.12,
                showactive: true,
                buttons   : [
                    {
                        label  : "10Y",
                        method : "relayout",
                        args   : [ { "xaxis.range": [ Math.max(0, totalPoints - 10), totalPoints - 1 ] } ],
                    },
                    {
                        label  : "25Y",
                        method : "relayout",
                        args   : [ { "xaxis.range": [ Math.max(0, totalPoints - 25), totalPoints - 1 ] } ],
                    },
                    {
                        label  : "All",
                        method : "relayout",
                        args   : [ { "xaxis.range": [ 0, totalPoints - 1 ] } ],
                    },
                ],
            },
        ],
    };

    const config : Partial<Plotly.Config> = getBaseConfig("household_financial_assets_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "household_financial_assets_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="changes-in-financial-assets-liabilities-chart">
            <Plot
                data={traces}
                layout={layoutWithButtons}
                config={config}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler={true}
            />
        </div>
    );
};

export default ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorChart;

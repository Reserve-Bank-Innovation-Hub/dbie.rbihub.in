"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import MonetarySurveyGrid from "@/components/tables/MonetarySurveyGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { MonetarySurvey } from "@/lib/api/tables/monetary-survey";

// CHART ===============================================================================================================
import type * as Plotly from "plotly.js";
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@/components/charts/chartConfig";

const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

// STYLES ==============================================================================================================
import "./monetary-survey-page.css";

interface MonetarySurveyPageProps {
    data : MonetarySurvey;
}

const MonetarySurveyPage : React.FC<MonetarySurveyPageProps> = ({ data }) => {
    // Latest period (index 0 — newest-first).
    const latestPeriod = data.periods[0] ?? "—";

    // Index of the NM3 column (broad money supply — the headline aggregate).
    const nm3Idx  = data.columns.findIndex(c => c.code === "NM3");
    const nm1Idx  = data.columns.findIndex(c => c.code === "NM1");

    const latestNM3 = nm3Idx >= 0 ? data.values[0]?.[nm3Idx] : null;
    const latestNM1 = nm1Idx >= 0 ? data.values[0]?.[nm1Idx] : null;

    const fmt = (v : number | null) =>
        v == null ? "—" : `₹${v.toLocaleString("en-IN", { maximumFractionDigits : 0 })} cr.`;

    // Chart traces — NM3 (broad money) over all periods, oldest to newest.
    const chartTraces = useMemo(() => {
        if (nm3Idx < 0 || nm1Idx < 0) return [];

        const reversed   = [ ...data.periods ].reverse();
        const nm3Values  = [ ...data.values ].reverse().map(row => row[nm3Idx]);
        const nm1Values  = [ ...data.values ].reverse().map(row => row[nm1Idx]);

        return [
            {
                x             : reversed,
                y             : nm3Values,
                name          : "NM3 (broad money)",
                type          : "scatter" as const,
                mode          : "lines" as const,
                line          : { color : CHART_COLORS.blueMid, width : 2 },
                hovertemplate : "<b>NM3</b><br>Period: %{x}<br>Value: ₹%{y:,.0f} cr.<extra></extra>",
            },
            {
                x             : reversed,
                y             : nm1Values,
                name          : "NM1 (narrow money)",
                type          : "scatter" as const,
                mode          : "lines" as const,
                line          : { color : CHART_COLORS.orangeMid, width : 2 },
                hovertemplate : "<b>NM1</b><br>Period: %{x}<br>Value: ₹%{y:,.0f} cr.<extra></extra>",
            },
        ];
    }, [ data, nm3Idx, nm1Idx ]);

    const chartLayout : Partial<Plotly.Layout> = useMemo(() => getBaseLayout({
        title  : createTitle("Money stock — NM1 and NM3"),
        xaxis  : createAxis("Period", { type : "date" }),
        yaxis  : createAxis("Rupees Crores"),
    }), []);

    const chartConfig : Partial<Plotly.Config> = useMemo(
        () => getBaseConfig("monetary_survey_chart"),
        [],
    );

    return (
        <Article id="monetary-survey-page" className="page-grid">
            {/* HEADER ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Monetary survey
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Money stock aggregates and components; amounts in {data.unit.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Fortnightly monetary survey covering money stock measures (NM1, NM2, NM3) and their
                    components — currency with the public, aggregate deposits, domestic credit (net bank credit
                    to the government and commercial sector) and net foreign exchange assets. Source: Reserve
                    Bank of India Monthly Bulletin, Table 8.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest period"
                    value={latestPeriod}
                />

                <DataUnit
                    label="Total periods"
                    value={`${data.periods.length.toLocaleString("en-IN")} fortnights`}
                />

                <DataUnit
                    label={`NM3 (${latestPeriod})`}
                    value={fmt(latestNM3)}
                />

                <DataUnit
                    label={`NM1 (${latestPeriod})`}
                    value={fmt(latestNM1)}
                />
            </Div>

            {/* CHART /////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="monetary-survey-chart grid-cell">
                <Plot
                    data={chartTraces}
                    layout={chartLayout}
                    config={chartConfig}
                    style={{ width : "100%", height : "100%" }}
                    useResizeHandler={true}
                />
            </Div>

            {/* DATA GRID /////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="monetary-survey-grid grid-cell">
                <MonetarySurveyGrid data={data} />
            </Div>
        </Article>
    );
};

export default MonetarySurveyPage;

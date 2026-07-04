"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import RbiSurveyGrid from "@/components/tables/RbiSurveyGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { RbiSurvey } from "@/lib/api/tables/rbi-survey";

// CHART ===============================================================================================================
import type * as Plotly from "plotly.js";
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@/components/charts/chartConfig";

const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });



interface RbiSurveyPageProps {
    data : RbiSurvey;
}

const RbiSurveyPage : React.FC<RbiSurveyPageProps> = ({ data }) => {
    // Latest period (index 0 — newest-first).
    const latestPeriod = data.periods[0] ?? "—";

    // C.IV = Reserve Money (the headline aggregate); C.I = Currency in Circulation.
    const reserveMoneyIdx    = data.columns.findIndex(c => c.code === "C.IV");
    const currencyCircIdx    = data.columns.findIndex(c => c.code === "C.I");
    const foreignAssetsIdx   = data.columns.findIndex(c => c.code === "S.III");

    const latestReserveMoney  = reserveMoneyIdx >= 0 ? data.values[0]?.[reserveMoneyIdx]  : null;
    const latestCurrencyCirc  = currencyCircIdx >= 0 ? data.values[0]?.[currencyCircIdx]  : null;

    const fmt = (v : number | null) =>
        v == null ? "—" : `₹${v.toLocaleString("en-IN", { maximumFractionDigits : 0 })} cr.`;

    // Chart traces — Reserve Money (C.IV) and Currency in Circulation (C.I).
    const chartTraces = useMemo(() => {
        if (reserveMoneyIdx < 0) return [];

        const reversed = [ ...data.periods ].reverse();

        const traces : Plotly.Data[] = [
            {
                x             : reversed,
                y             : [ ...data.values ].reverse().map(row => row[reserveMoneyIdx]),
                name          : "Reserve money (C.IV)",
                type          : "scatter",
                mode          : "lines",
                line          : { color : CHART_COLORS.blueMid, width : 2 },
                hovertemplate : "<b>Reserve money</b><br>Period: %{x}<br>Value: ₹%{y:,.0f} cr.<extra></extra>",
            },
            {
                x             : reversed,
                y             : [ ...data.values ].reverse().map(row => row[currencyCircIdx]),
                name          : "Currency in circulation (C.I)",
                type          : "scatter",
                mode          : "lines",
                line          : { color : CHART_COLORS.orangeMid, width : 2 },
                hovertemplate : "<b>Currency in circulation</b><br>Period: %{x}<br>Value: ₹%{y:,.0f} cr.<extra></extra>",
            },
        ];

        if (foreignAssetsIdx >= 0) {
            traces.push({
                x             : reversed,
                y             : [ ...data.values ].reverse().map(row => row[foreignAssetsIdx]),
                name          : "Net foreign exchange assets (S.III)",
                type          : "scatter",
                mode          : "lines",
                line          : { color : CHART_COLORS.greenMid, width : 2 },
                hovertemplate : "<b>Net foreign exchange assets</b><br>Period: %{x}<br>Value: ₹%{y:,.0f} cr.<extra></extra>",
            });
        }

        return traces;
    }, [ data, reserveMoneyIdx, currencyCircIdx, foreignAssetsIdx ]);

    const chartLayout : Partial<Plotly.Layout> = useMemo(() => getBaseLayout({
        title  : createTitle("Reserve money and selected RBI components"),
        xaxis  : createAxis("Period", { type : "date" }),
        yaxis  : createAxis("Rupees Crores"),
    }), []);

    const chartConfig : Partial<Plotly.Config> = useMemo(
        () => getBaseConfig("rbi_survey_chart"),
        [],
    );

    return (
        <Article id="rbi-survey-page" className="page-grid">
            {/* HEADER ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Reserve Bank of India survey
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Reserve money and RBI balance-sheet components; amounts in {data.unit.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Fortnightly RBI balance-sheet survey covering reserve money (C.IV) and its components —
                    currency in circulation, bankers' deposits with the RBI, RBI domestic credit (net credit
                    to the government, claims on banks and credit to the commercial sector), government's
                    currency liabilities, net foreign exchange assets and capital account. Source: Reserve
                    Bank of India Monthly Bulletin, Table 10.
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
                    label={`Reserve money (${latestPeriod})`}
                    value={fmt(latestReserveMoney)}
                />

                <DataUnit
                    label={`Currency in circulation (${latestPeriod})`}
                    value={fmt(latestCurrencyCirc)}
                />
            </Div>

            {/* CHART /////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="chart-cell grid-cell">
                <Plot
                    data={chartTraces}
                    layout={chartLayout}
                    config={chartConfig}
                    style={{ width : "100%", height : "100%" }}
                    useResizeHandler={true}
                />
            </Div>

            {/* DATA GRID /////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <RbiSurveyGrid data={data} />
            </Div>
        </Article>
    );
};

export default RbiSurveyPage;

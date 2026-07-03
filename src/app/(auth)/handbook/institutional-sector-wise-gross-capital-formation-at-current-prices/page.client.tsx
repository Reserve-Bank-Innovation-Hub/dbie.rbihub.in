"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import InstitutionalSectorGrossCapitalFormationGrid from "@/components/tables/InstitutionalSectorGrossCapitalFormationGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { InstitutionalSectorGrossCapitalFormation } from "@/lib/api/tables/institutional-sector-wise-gross-capital-formation-at-current-prices";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@/components/charts/chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// STYLES ==============================================================================================================
import "./institutional-sector-wise-gross-capital-formation-at-current-prices-page.css";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface InstitutionalSectorGrossCapitalFormationPageProps {
    data : InstitutionalSectorGrossCapitalFormation;
}

const InstitutionalSectorGrossCapitalFormationPage : React.FC<InstitutionalSectorGrossCapitalFormationPageProps> = ({ data }) => {
    // Newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data.data ].reverse(), [ data.data ]);

    const latest = data.data[0];

    const latestGcf = useMemo(() => {
        if (latest?.gross_capital_formation == null) return "—";
        return `₹${Math.round(latest.gross_capital_formation).toLocaleString("en-IN")} cr`;
    }, [ latest ]);

    const xValues = useMemo(() => chartData.map(d => d.year), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x             : xValues,
            y             : chartData.map(d => d.public_non_financial_corporations),
            name          : "Public non-financial corporations",
            type          : "bar",
            marker        : { color: CHART_COLORS.blueDark },
            hovertemplate : "<b>%{x}</b><br>%{fullData.name}<br>₹%{y:,.0f} cr<extra></extra>",
        },
        {
            x             : xValues,
            y             : chartData.map(d => d.private_non_financial_corporations),
            name          : "Private non-financial corporations",
            type          : "bar",
            marker        : { color: CHART_COLORS.blueMid },
            hovertemplate : "<b>%{x}</b><br>%{fullData.name}<br>₹%{y:,.0f} cr<extra></extra>",
        },
        {
            x             : xValues,
            y             : chartData.map(d => d.public_financial_corporations),
            name          : "Public financial corporations",
            type          : "bar",
            marker        : { color: CHART_COLORS.greenDark },
            hovertemplate : "<b>%{x}</b><br>%{fullData.name}<br>₹%{y:,.0f} cr<extra></extra>",
        },
        {
            x             : xValues,
            y             : chartData.map(d => d.private_financial_corporations),
            name          : "Private financial corporations",
            type          : "bar",
            marker        : { color: CHART_COLORS.greenMid },
            hovertemplate : "<b>%{x}</b><br>%{fullData.name}<br>₹%{y:,.0f} cr<extra></extra>",
        },
        {
            x             : xValues,
            y             : chartData.map(d => d.general_government),
            name          : "General government",
            type          : "bar",
            marker        : { color: CHART_COLORS.purpleDark },
            hovertemplate : "<b>%{x}</b><br>%{fullData.name}<br>₹%{y:,.0f} cr<extra></extra>",
        },
        {
            x             : xValues,
            y             : chartData.map(d => d.households_including_npish),
            name          : "Households incl. NPISH",
            type          : "bar",
            marker        : { color: CHART_COLORS.yellowMid },
            hovertemplate : "<b>%{x}</b><br>%{fullData.name}<br>₹%{y:,.0f} cr<extra></extra>",
        },
    ], [ chartData, xValues ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title   : createTitle("Gross capital formation by institutional sector (current prices)", 18),
        xaxis   : createAxis("Year"),
        yaxis   : createAxis("₹ Crores", { rangemode: "tozero" }),
        barmode : "stack",
        height  : 500,
        margin  : { t: 80, b: 140, l: 80, r: 40 },
        legend  : {
            orientation : "h",
            yanchor     : "bottom",
            y           : -0.45,
            xanchor     : "center",
            x           : 0.5,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("institutional_sector_gcf_chart");

    return (
        <Article id="institutional-sector-gcf-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Institutional sector-wise gross capital formation at current prices (base year 2011-12)
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Rupees Crores; base year 2011–12; source: National Statistical Office (NSO)
                    </Heading6>
                </Div>

                <Text>
                    Annual breakdown of gross capital formation by institutional sector — public and private
                    corporations, general government and households — at current prices.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="National Statistical Office (NSO)"
                />

                <DataUnit
                    label="Latest year"
                    value={latest?.year ?? "—"}
                />

                <DataUnit
                    label="Total records"
                    value={`${data.data.length} years`}
                />
            </Div>

            {/* STAT CARD ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Gross capital formation</Text>
                <DataUnit
                    label={`Latest (${latest?.year ?? "—"})`}
                    value={latestGcf}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{data.unit}</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="institutional-sector-gcf-chart">
                <Plot
                    data={traces}
                    layout={layout}
                    config={config}
                    style={{ width: "100%", height: "100%" }}
                    useResizeHandler={true}
                />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="institutional-sector-gcf-grid">
                <InstitutionalSectorGrossCapitalFormationGrid data={data.data} />
            </Div>
        </Article>
    );
};

export default InstitutionalSectorGrossCapitalFormationPage;

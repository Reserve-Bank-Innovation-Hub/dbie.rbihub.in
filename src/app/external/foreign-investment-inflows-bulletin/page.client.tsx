"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ForeignInvestmentInflowsBulletinGrid from "@/components/tables/ForeignInvestmentInflowsBulletinGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ForeignInvestmentInflowsBulletin } from "@/lib/api/tables/foreign-investment-inflows-bulletin";

// DATA VIZ ============================================================================================================
import type * as Plotly from "plotly.js";
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@/components/charts/chartConfig";


// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface ForeignInvestmentInflowsBulletinPageProps {
    investmentData : ForeignInvestmentInflowsBulletin;
}

// Format a US $Millions figure with 2dp and sign.
function fmtUSD(v : number | null) : string {
    if (v == null) return "—";
    const abs = Math.abs(v).toLocaleString("en-IN", { minimumFractionDigits : 2, maximumFractionDigits : 2 });
    return `${v < 0 ? "−" : ""}$${abs} mn.`;
}

const ForeignInvestmentInflowsBulletinPage : React.FC<ForeignInvestmentInflowsBulletinPageProps> = ({ investmentData }) => {
    const latest = investmentData.data[0];

    const stats = useMemo(() => ({
        latestMonth            : latest?.month || "—",
        netFDI                 : fmtUSD(latest?.netFDI ?? null),
        netPortfolioInvestment : fmtUSD(latest?.netPortfolioInvestment ?? null),
    }), [ latest ]);

    // Chart: last 24 months reversed to chronological order.
    const chartData = useMemo(() => [ ...investmentData.data.slice(0, 24) ].reverse(), [ investmentData.data ]);

    const traces = useMemo(() : Plotly.Data[] => {
        const labels  = chartData.map((_, i) => `${chartData.length - 1 - i}m`);
        const months  = chartData.map((d) => d.month);
        return [
            {
                x             : labels,
                y             : chartData.map((d) => d.netFDI),
                name          : "Net FDI",
                type          : "scatter",
                mode          : "lines+markers",
                line          : { color : CHART_COLORS.purpleLight, width : 3 },
                marker        : { size : 5, color : CHART_COLORS.purpleDark },
                customdata    : months,
                hovertemplate : "<b>Net FDI</b><br>Month: %{customdata}<br>$%{y:,.2f} mn.<extra></extra>",
            },
            {
                x             : labels,
                y             : chartData.map((d) => d.netPortfolioInvestment),
                name          : "Net portfolio investment",
                type          : "scatter",
                mode          : "lines+markers",
                line          : { color : CHART_COLORS.greenMid, width : 3 },
                marker        : { size : 5, color : CHART_COLORS.greenDark, symbol : "square" as const },
                customdata    : months,
                hovertemplate : "<b>Net portfolio investment</b><br>Month: %{customdata}<br>$%{y:,.2f} mn.<extra></extra>",
            },
        ];
    }, [ chartData ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title : createTitle("Foreign investment inflows — last 24 months"),
        xaxis : createAxis("Months ago", { type : "category" }),
        yaxis : createAxis("US $Millions"),
    });

    const config : Partial<Plotly.Config> = getBaseConfig("foreign_investment_inflows_bulletin_chart");

    return (
        <Article id="foreign-investment-inflows-bulletin-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Foreign investment inflows — monthly
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        {investmentData.unit} — FDI and portfolio investment into and from India
                    </Heading6>
                </Div>

                <Text>
                    Monthly data on foreign direct investment (FDI) and portfolio investment flows.
                    Covers gross inflows, repatriation and net figures for FDI to India, FDI by India,
                    and portfolio investment (FPIs, GDRs/ADRs, offshore funds).
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest month"
                    value={stats.latestMonth}
                />

                <DataUnit
                    label="Total records"
                    value={`${investmentData.data.length.toLocaleString()} months`}
                />
            </Div>

            {/* STAT CARDS ///////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Net FDI</Text>
                <DataUnit
                    label={`Latest (${stats.latestMonth})`}
                    value={stats.netFDI}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">US $Millions</Text>
            </Div>

            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Net portfolio investment</Text>
                <DataUnit
                    label={`Latest (${stats.latestMonth})`}
                    value={stats.netPortfolioInvestment}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">US $Millions</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="chart-cell grid-cell">
                <Plot
                    data={traces}
                    layout={layout}
                    config={config}
                    style={{ width : "100%", height : "100%" }}
                    useResizeHandler={true}
                />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <ForeignInvestmentInflowsBulletinGrid
                    data={investmentData.data}
                    unit={investmentData.unit}
                />
            </Div>
        </Article>
    );
};

export default ForeignInvestmentInflowsBulletinPage;

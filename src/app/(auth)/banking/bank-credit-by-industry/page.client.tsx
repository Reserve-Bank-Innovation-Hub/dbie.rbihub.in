"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import BankCreditByIndustryGrid from "@/components/tables/BankCreditByIndustryGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { BankCreditByIndustry } from "@/lib/api/tables/bank-credit-by-industry";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@components/charts/chartConfig";

// STYLES ==============================================================================================================
import "./bank-credit-by-industry-page.css";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface BankCreditByIndustryPageProps {
    data : BankCreditByIndustry;
}

// Parse a period label "January,  18 2019" into a Date for the time axis.
// The table-16 format carries a comma and a different word-order from table-15.
const periodToDate = (label : string) : Date => {
    // "January,  18 2019" -> "January 18 2019" -> parse via Date constructor
    const norm = label.replace(',', '').replace(/\s+/g, ' ').trim();
    return new Date(norm);
};

const BankCreditByIndustryPage : React.FC<BankCreditByIndustryPageProps> = ({ data }) => {
    const industriesTotalItem = useMemo(
        () => data.items.find(it => it.code === "2"),
        [ data ],
    );

    const stats = useMemo(() => {
        const latestPeriod   = data.periods[data.periods.length - 1] ?? "—";
        const latestTotal    = industriesTotalItem?.values[data.periods.length - 1] ?? null;
        const fmt = (v : number | null) =>
            v == null ? "—" : `₹${(v / 100000).toLocaleString("en-IN", {
                minimumFractionDigits  : 1,
                maximumFractionDigits  : 1,
            })} lakh cr.`;
        // Normalise period label for display
        const normPeriod = latestPeriod.replace(',', '').replace(/\s+/g, ' ').trim();
        return {
            latestPeriod     : normPeriod,
            latestTotal      : fmt(latestTotal),
            industryCount    : data.items.length,
        };
    }, [ data, industriesTotalItem ]);

    // Line chart: total industries credit (code "2") over all periods.
    const chart = useMemo(() => {
        if (!industriesTotalItem) return null;

        const points = data.periods
            .map((p, pi) => ({ x : periodToDate(p), y : industriesTotalItem.values[pi] }))
            .filter(pt => pt.y != null);

        const traces : Partial<Plotly.PlotData>[] = [
            {
                x             : points.map(pt => pt.x),
                y             : points.map(pt => pt.y as number),
                name          : "Total industry credit",
                type          : "scatter",
                mode          : "lines",
                line          : { color : CHART_COLORS.greenDark, width : 2 },
                hovertemplate : "<b>Total industry credit</b><br>%{x|%b %Y}<br>₹%{y:,.2f} cr.<extra></extra>",
            },
        ];

        const layout : Partial<Plotly.Layout> = getBaseLayout({
            title : createTitle("Total industry credit outstanding"),
            xaxis : createAxis("Period", { type : "date" }),
            yaxis : createAxis("Outstanding (₹ crores)"),
        });

        const config : Partial<Plotly.Config> = getBaseConfig("bank_credit_by_industry_total");

        return { traces, layout, config };
    }, [ industriesTotalItem, data.periods ]);

    return (
        <Article id="bank-credit-by-industry-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Heading4 weight="700" marginBottom="nano">
                    Industry-wise deployment of bank credit
                </Heading4>
                <Heading6 weight="400" opacity="60">
                    Outstanding credit across 42 industry sub-sectors; amounts in{" "}
                    {data.unit.toLowerCase()} (Table 16)
                </Heading6>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest period"
                    value={stats.latestPeriod}
                />

                <DataUnit
                    label="Total industry credit"
                    value={stats.latestTotal}
                />

                <DataUnit
                    label="Industry rows"
                    value={stats.industryCount.toString()}
                />
            </Div>

            {/* LINE CHART ///////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="bank-credit-by-industry-linechart">
                {chart ? (
                    <Plot
                        data={chart.traces}
                        layout={chart.layout}
                        config={chart.config}
                        style={{ width : "100%", height : "100%" }}
                        useResizeHandler={true}
                    />
                ) : null}
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="bank-credit-by-industry-grid">
                <BankCreditByIndustryGrid data={data} />
            </Div>
        </Article>
    );
};

export default BankCreditByIndustryPage;

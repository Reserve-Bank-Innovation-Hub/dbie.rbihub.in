"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import WholesalePriceIndexGrid from "@/components/tables/WholesalePriceIndexGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { WholesalePriceIndex } from "@/lib/api/tables/wholesale-price-index";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@components/charts/chartConfig";

// STYLES ==============================================================================================================

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface WholesalePriceIndexPageProps {
    wpiData : WholesalePriceIndex;
}

// Parse "Mar-2026" / "Apr 1986" into a sortable Date for the time axis.
const monthToDate = (label : string) : Date => {
    const [ mon, yr ] = label.split(/[ -]/);
    const monthNum = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ].indexOf(mon);
    return new Date(Number(yr), monthNum < 0 ? 0 : monthNum, 1);
};

const WholesalePriceIndexPage : React.FC<WholesalePriceIndexPageProps> = ({ wpiData }) => {
    const currentBase = wpiData.bases[0];

    const stats = useMemo(() => {
        const commodityCount = wpiData.bases.reduce((max, b) => Math.max(max, b.commodities.length), 0);
        return {
            latestMonth    : currentBase?.months[0] ?? "N/A",
            commodityCount : commodityCount,
            baseYearCount  : wpiData.bases.length,
        };
    }, [ wpiData, currentBase ]);

    // Line chart: ALL COMMODITIES (code "1") for the current base, oldest -> newest.
    const chart = useMemo(() => {
        if (!currentBase) return null;
        const allCommIdx = currentBase.commodities.findIndex(c => c.code === "1");
        if (allCommIdx === -1) return null;

        // months are newest-first in the data — reverse for a left-to-right axis.
        const points = currentBase.months
            .map((month, mi) => ({ x : monthToDate(month), y : currentBase.values[mi][allCommIdx] }))
            .filter(p => p.y != null)
            .reverse();

        const traces : Partial<Plotly.PlotData>[] = [
            {
                x             : points.map(p => p.x),
                y             : points.map(p => p.y as number),
                name          : "All commodities",
                type          : "scatter",
                mode          : "lines",
                line          : { color : CHART_COLORS.purpleDark, width : 2 },
                hovertemplate : "<b>All commodities</b><br>%{x|%b %Y}<br>Index: %{y:.1f}<extra></extra>",
            },
        ];

        const layout : Partial<Plotly.Layout> = getBaseLayout({
            title : createTitle(`All commodities — base year ${currentBase.base}`),
            xaxis : createAxis("Month", { type : "date" }),
            yaxis : createAxis(`Index (base ${currentBase.base} = 100)`),
        });

        const config : Partial<Plotly.Config> = getBaseConfig("wholesale_price_index_all_commodities");

        return { traces, layout, config };
    }, [ currentBase ]);

    return (
        <Article id="wholesale-price-index-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Heading4 weight="700" marginBottom="nano">
                    Wholesale price index — monthly
                </Heading4>
                <Heading6 weight="400" opacity="60">
                    Monthly wholesale price index across the full commodity taxonomy (Table 22), with historical base
                    years back to 1947
                </Heading6>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Office of the Economic Adviser, Ministry of Commerce and Industry"
                />

                <DataUnit
                    label="Latest month"
                    value={stats.latestMonth}
                />

                <DataUnit
                    label="Commodities"
                    value={stats.commodityCount.toLocaleString()}
                />

                <DataUnit
                    label="Base years"
                    value={stats.baseYearCount.toLocaleString()}
                />
            </Div>

            {/* LINE CHART ///////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="chart-cell grid-cell">
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
            <Div className="table-cell grid-cell">
                <WholesalePriceIndexGrid bases={wpiData.bases} />
            </Div>
        </Article>
    );
};

export default WholesalePriceIndexPage;

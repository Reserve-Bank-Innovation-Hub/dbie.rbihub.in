"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import NsvaAtConstantPricesGrid from "@/components/tables/NsvaAtConstantPricesGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { NetStateValueAddedAtConstantPrices } from "@/lib/api/tables/net-state-value-added-by-economic-activity-at-constant-prices";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@components/charts/chartConfig";

// STYLES ==============================================================================================================
import "./nsva-at-constant-prices-page.css";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface NsvaAtConstantPricesPageProps {
    data : NetStateValueAddedAtConstantPrices;
}

// Index of the TOTAL NSVA column within the activities array (the last one).
const TOTAL_IDX = 11;

const NsvaAtConstantPricesPage : React.FC<NsvaAtConstantPricesPageProps> = ({ data }) => {
    const { activities, states } = data;

    // Default to the first state (Andhra Pradesh).
    const [ selectedStateName, setSelectedStateName ] = useState<string>(states[0]?.name ?? "");

    const selectedState = useMemo(
        () => states.find(s => s.name === selectedStateName) ?? states[0],
        [ states, selectedStateName ],
    );

    // Stats for the meta card: latest year total NSVA for the selected state.
    const stats = useMemo(() => {
        const latest = selectedState?.values[0];
        const latestYear = selectedState?.years[0] ?? "—";
        const latestTotal = latest?.[TOTAL_IDX] ?? null;
        const fmt = (v : number | null) =>
            v == null ? "—" : `₹${v.toLocaleString("en-IN", { maximumFractionDigits : 0 })} cr.`;
        return {
            latestYear,
            latestTotal       : fmt(latestTotal),
            yearRange         : selectedState
                ? `${selectedState.years[selectedState.years.length - 1]} – ${selectedState.years[0]}`
                : "—",
        };
    }, [ selectedState ]);

    // Line chart: total NSVA for the selected state over all available years (oldest → newest).
    const chart = useMemo(() => {
        if (!selectedState) return null;

        // Data is newest-first; reverse for the time axis.
        const pts = [ ...selectedState.years ]
            .reverse()
            .map((year, ri) => {
                const origIdx = selectedState.years.length - 1 - ri;
                return { x : year, y : selectedState.values[origIdx]?.[TOTAL_IDX] ?? null };
            })
            .filter(pt => pt.y != null);

        const traces : Partial<Plotly.PlotData>[] = [
            {
                x             : pts.map(pt => pt.x),
                y             : pts.map(pt => pt.y as number),
                name          : "Total NSVA at basic prices",
                type          : "scatter",
                mode          : "lines+markers",
                line          : { color : CHART_COLORS.greenDark, width : 2 },
                marker        : { color : CHART_COLORS.greenDark, size : 6 },
                hovertemplate : `<b>${selectedState.name}</b><br>%{x}<br>Total NSVA: ₹%{y:,.0f} cr.<extra></extra>`,
            },
        ];

        const layout : Partial<Plotly.Layout> = getBaseLayout({
            title : createTitle(`Total NSVA at basic prices — ${selectedState.name}`),
            xaxis : createAxis("Financial year"),
            yaxis : createAxis("₹ crores (constant prices, base 2011-12)"),
        });

        const config : Partial<Plotly.Config> = getBaseConfig(
            `nsva_constant_${selectedState.name.toLowerCase().replace(/\s+/g, "_")}`,
        );

        return { traces, layout, config };
    }, [ selectedState ]);

    return (
        <Article id="nsva-at-constant-prices-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Net State Value Added by economic activity at constant prices
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Base year 2011-12; amounts in {data.unit.toLowerCase()} — NAS-2011-12 series
                    </Heading6>
                </Div>

                <Div className="nsva-state-selector">
                    <label htmlFor="state-select" style={{ fontSize : 14, fontWeight : 500 }}>
                        State / UT:
                    </label>
                    <select
                        id="state-select"
                        value={selectedStateName}
                        onChange={(e) => setSelectedStateName(e.target.value)}
                    >
                        {states.map((s) => (
                            <option key={s.name} value={s.name}>
                                {s.name.charAt(0) + s.name.slice(1).toLowerCase()}
                            </option>
                        ))}
                    </select>
                </Div>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="National Statistical Office"
                />

                <DataUnit
                    label="States / UTs"
                    value={`${states.length}`}
                />

                <DataUnit
                    label="Year range"
                    value={stats.yearRange}
                />

                <DataUnit
                    label={`Total NSVA (${stats.latestYear})`}
                    value={stats.latestTotal}
                />
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="nsva-at-constant-prices-linechart">
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
            <Div className="nsva-at-constant-prices-grid">
                <NsvaAtConstantPricesGrid
                    data={data}
                    selectedState={selectedState}
                />
            </Div>
        </Article>
    );
};

export default NsvaAtConstantPricesPage;

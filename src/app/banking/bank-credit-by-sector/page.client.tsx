"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import BankCreditBySectorGrid from "@/components/tables/BankCreditBySectorGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { BankCreditBySector } from "@/lib/api/tables/bank-credit-by-sector";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "@components/charts/chartConfig";



// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface BankCreditBySectorPageProps {
    data : BankCreditBySector;
}

// Parse a period label like "January  18, 2019" into a Date for the time axis.
const periodToDate = (label : string) : Date => {
    // Normalise double spaces: "January  18, 2019" -> "January 18, 2019"
    const norm = label.replace(/\s+/g, ' ');
    return new Date(norm);
};

const BankCreditBySectorPage : React.FC<BankCreditBySectorPageProps> = ({ data }) => {
    const grossCreditItem = useMemo(
        () => data.items.find(it => it.code === "I"),
        [ data ],
    );

    const stats = useMemo(() => {
        const latestPeriod = data.periods[data.periods.length - 1] ?? "—";
        const grossItem    = data.items.find(it => it.code === "I");
        const latestGross  = grossItem?.values[data.periods.length - 1] ?? null;
        const fmt = (v : number | null) =>
            v == null ? "—" : `₹${(v / 100000).toLocaleString("en-IN", {
                minimumFractionDigits  : 0,
                maximumFractionDigits  : 1,
            })} lakh cr.`;
        return {
            latestPeriod,
            latestGrossCredit : fmt(latestGross),
            sectorCount       : data.items.filter(it => !it.parent).length,
        };
    }, [ data ]);

    // Line chart: gross bank credit (code "I") over all periods, oldest → newest.
    const chart = useMemo(() => {
        if (!grossCreditItem) return null;

        const points = data.periods
            .map((p, pi) => ({ x : periodToDate(p), y : grossCreditItem.values[pi] }))
            .filter(pt => pt.y != null);

        const traces : Partial<Plotly.PlotData>[] = [
            {
                x             : points.map(pt => pt.x),
                y             : points.map(pt => pt.y as number),
                name          : "Gross bank credit",
                type          : "scatter",
                mode          : "lines",
                line          : { color : CHART_COLORS.blueDark, width : 2 },
                hovertemplate : "<b>Gross bank credit</b><br>%{x|%b %Y}<br>₹%{y:,.0f} cr.<extra></extra>",
            },
        ];

        const layout : Partial<Plotly.Layout> = getBaseLayout({
            title : createTitle("Gross bank credit outstanding"),
            xaxis : createAxis("Period", { type : "date" }),
            yaxis : createAxis("Outstanding (₹ crores)"),
        });

        const config : Partial<Plotly.Config> = getBaseConfig("gross_bank_credit_by_sector");

        return { traces, layout, config };
    }, [ grossCreditItem, data.periods ]);

    return (
        <Article id="bank-credit-by-sector-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Heading4 weight="700" marginBottom="nano">
                    Deployment of gross bank credit by major sectors
                </Heading4>
                <Heading6 weight="400" opacity="60">
                    Outstanding credit across agriculture, industry, services, and personal loans; amounts in{" "}
                    {data.unit.toLowerCase()} (Table 15)
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
                    label="Gross bank credit"
                    value={stats.latestGrossCredit}
                />

                <DataUnit
                    label="Top-level sectors"
                    value={stats.sectorCount.toString()}
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
                <BankCreditBySectorGrid data={data} />
            </Div>
        </Article>
    );
};

export default BankCreditBySectorPage;

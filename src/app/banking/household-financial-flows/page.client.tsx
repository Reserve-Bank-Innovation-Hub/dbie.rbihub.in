"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import HouseholdFinancialFlowsGrid from "@/components/tables/HouseholdFinancialFlowsGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { HouseholdFinancialFlows } from "@/lib/api/tables/household-financial-flows";



interface HouseholdFinancialFlowsPageProps {
    data : HouseholdFinancialFlows;
}

const HouseholdFinancialFlowsPage : React.FC<HouseholdFinancialFlowsPageProps> = ({ data }) => {
    // Derive summary stats from the latest available period.
    const stats = useMemo(() => {
        // Latest year is the last distinct year in columns[].
        const years       = [ ...new Set(data.columns.map(c => c.year)) ];
        const latestYear  = years[years.length - 1] ?? "—";

        // Latest period within that year (last column entry).
        const latestCols  = data.columns.filter(c => c.year === latestYear);
        const latestPeriod = latestCols[latestCols.length - 1]?.period ?? "—";
        const latestColIdx = data.columns.lastIndexOf(
            data.columns.filter(c => c.year === latestYear && c.period === latestPeriod)[0],
        );
        // Correct index accounting for reference equality.
        const colIdxMap   = data.columns.map((_, i) => i);
        const lastColIdx  = data.columns.findIndex(
            c => c.year === latestYear && c.period === latestPeriod,
        );
        // Walk backwards to find the actual last matching index.
        let latestIdx = -1;
        for (let i = data.columns.length - 1; i >= 0; i--) {
            if (data.columns[i].year === latestYear && data.columns[i].period === latestPeriod) {
                latestIdx = i;
                break;
            }
        }

        // Net Financial Assets row.
        const netFaRow = data.data.find(r => r.item.includes("Net Financial Assets"));
        const netFaVal = netFaRow && latestIdx >= 0 ? netFaRow.values[latestIdx] : null;

        const fmt = (v : number | null) =>
            v == null ? "—" : `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 1 })} cr.`;

        return {
            latestLabel : `${latestYear} ${latestPeriod}`,
            netFaVal    : fmt(netFaVal),
            itemCount   : data.data.length,
            yearCount   : years.length,
        };
    }, [ data ]);

    return (
        <Article id="household-financial-flows-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Flow of financial assets and liabilities of households
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Quarterly and annual household financial flows by instrument, ₹ crore,
                        from the monthly RBI Bulletin
                    </Heading6>
                </Div>

                <Text>
                    Instrument-wise breakdown of household sector financial flows covering
                    deposits (bank and non-bank), life insurance funds, provident and pension funds,
                    currency, investments (mutual funds and equity), and small savings on the
                    assets side, and borrowings from financial and non-financial corporations
                    on the liabilities side. Data as a percentage of GDP are also included.
                    Source: Reserve Bank of India Bulletin, Table 52(a).
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest period"
                    value={stats.latestLabel}
                />

                <DataUnit
                    label={`Net financial assets (${stats.latestLabel})`}
                    value={stats.netFaVal}
                />

                <DataUnit
                    label="Fiscal years covered"
                    value={stats.yearCount.toString()}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <HouseholdFinancialFlowsGrid
                    columns={data.columns}
                    data={data.data}
                />
            </Div>

            {/* NOTES ////////////////////////////////////////////////////////////////////////////////////////////// */}
            {data.notes.length > 0 && (
                <Div id="notes-card" className="notes-cell grid-cell" padding="micro">
                    {data.notes.map((note, i) => (
                        <Text key={i} size="small" opacity="70">
                            {note}
                        </Text>
                    ))}
                </Div>
            )}
        </Article>
    );
};

export default HouseholdFinancialFlowsPage;

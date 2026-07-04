"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import DailyCallMoneyRatesGrid from "@/components/tables/DailyCallMoneyRatesGrid";
import TimeSeriesChart         from "@/components/charts/TimeSeriesChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { DailyCallMoneyRates } from "@/lib/api/tables/daily-call-money-rates";

// STYLES ==============================================================================================================
import "./daily-call-money-rates-page.css";

interface DailyCallMoneyRatesPageProps {
    ratesData : DailyCallMoneyRates;
}

const DailyCallMoneyRatesPage : React.FC<DailyCallMoneyRatesPageProps> = ({ ratesData }) => {
    // The file is newest-first, so the first row is the latest date.
    const latest = ratesData.data[0];

    const stats = useMemo(() => {
        const rate = (v : number | null) => (v == null ? "—" : `${Number(v).toFixed(2)}%`);
        return {
            latestDate   : latest?.date    || "—",
            latestFY     : latest?.fy      || "—",
            latestMinRate : rate(latest?.minRate ?? null),
            latestMaxRate : rate(latest?.maxRate ?? null),
        };
    }, [ latest ]);

    return (
        <Article id="daily-call-money-rates-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Daily weighted average call / notice money rates
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Minimum and maximum rates for borrowings/lendings (% per annum)
                    </Heading6>
                </Div>

                <Text>
                    Daily overnight interbank rates in India. Minimum and maximum weighted average
                    call/notice money rates for borrowings and lendings, grouped by financial year.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest date"
                    value={stats.latestDate}
                />

                <DataUnit
                    label="Total records"
                    value={`${ratesData.data.length.toLocaleString()} days`}
                />
            </Div>

            {/* LATEST RATE STATS ////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell rate-stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Minimum rate</Text>
                <DataUnit
                    label={`Latest (${stats.latestDate})`}
                    value={stats.latestMinRate}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">% per annum</Text>
            </Div>

            <Div className="grid-cell rate-stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Maximum rate</Text>
                <DataUnit
                    label={`Latest (${stats.latestDate})`}
                    value={stats.latestMaxRate}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">% per annum</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <TimeSeriesChart
                title        = "Call / notice money rates over time"
                dates        = {ratesData.data.map(d => d.date)}
                series       = {[
                    {key : "minRate", label : "Minimum rate", values : ratesData.data.map(d => d.minRate)},
                    {key : "maxRate", label : "Maximum rate", values : ratesData.data.map(d => d.maxRate)},
                ]}
                yAxisTitle   = "Per cent"
                valueDecimals = {2}
                valueSuffix  = "%"
                exportName   = "daily-call-money-rates"
                height       = {600}
            />

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="daily-call-money-rates-grid">
                <DailyCallMoneyRatesGrid
                    data={ratesData.data}
                />
            </Div>
        </Article>
    );
};

export default DailyCallMoneyRatesPage;

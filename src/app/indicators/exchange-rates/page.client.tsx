"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Header, Heading4, Heading6, Section, Card, Row, Portion, Text, Divider, Div, Footer } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import { DataUnit } from "@/components/DataUnit/DataUnit";

// UTILS ===============================================================================================================
import { ParsedExchangeRates } from "@/lib/api/indicators";

// STYLES ==============================================================================================================
import "./exchange-rates-page.css"; // retains non-layout rules (change-indicator, Plotly modebar)

interface SerializedExchangeRateData {
        date          : string | Date;
        dateString    : string;
        usDollar      : number;
        poundSterling : number;
        euro          : number;
        japaneseYen   : number;
}

interface ExchangeRatesPageProps {
        exchangeRateData : {
                data       : SerializedExchangeRateData[];
                currencies : ParsedExchangeRates["currencies"];
        };
}

const ExchangeRatesPage = ({exchangeRateData} : ExchangeRatesPageProps) => {

    // Get latest rates (first item since data is reverse chronological in the file)
    const latestData = exchangeRateData.data[exchangeRateData.data.length - 1];

    // Calculate statistics
    const getStatistics = (currencyKey : keyof typeof latestData) => {
        if (currencyKey === "date" || currencyKey === "dateString") return null;

        // Filter out invalid values (NaN, undefined, null)
        const values = exchangeRateData.data
            .map(d => d[currencyKey] as number)
            .filter(val => !isNaN(val) && isFinite(val));

        if (values.length === 0) return null;

        const current = values[values.length - 1];
        const previous = values.length > 1 ? values[values.length - 2] : current;
        const change = current - previous;
        const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;

        return {
            current,
            change,
            changePercent,
            max,
            min,
            avg,
        };
    };

    return (
        <Article id="exchange-rates-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="title-card"
                bgColour="white"
                padding="micro"
            >
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Daily exchange rate of the Indian rupee
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        ₹ per unit of foreign currency
                    </Heading6>
                </Div>

                <Text>
                    Exchange rates represent the Indian rupee value per unit of foreign currency. An increase
                    indicates depreciation of the rupee, while a decrease indicates appreciation.
                </Text>
            </Div>

            <Div
                id="meta-card"
                className="grid-cell" padding="micro"
            >
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Last updated"
                    value={latestData?.dateString || "—"}
                />

                <DataUnit
                    label="Data points"
                    value={`${exchangeRateData.data.length.toLocaleString()} daily observations`}
                />
            </Div>

            {/* CURRENCY STATS ///////////////////////////////////////////////////////////////////////////////////// */}
                {exchangeRateData.currencies.map(currency => {
                    const stats = getStatistics(currency.key);
                    if (!stats) return null;

                    return (
                        <Div
                            key={currency.name}
                            padding="micro"
                            className={`stat-cell grid-cell currency-stat-card ${stats.change > 0 ? "positive" : stats.change < 0 ? "negative" : "neutral"}`}
                        >
                            <Header>
                                <Text weight="600" marginBottom="nano">
                                    {currency.displayName}
                                </Text>

                                <DataUnit
                                    label="Current rate"
                                    value={`₹${stats.current.toFixed(4)}`}
                                    size="large"
                                    // isCopyable
                                    align="right"
                                />

                                <Text
                                    size="tiny"
                                    className={`change-indicator ${stats.change > 0 ? "up" : stats.change < 0 ? "down" : ""}`}
                                >
                                    {stats.change > 0 ? "▲" : stats.change < 0 ? "▼" : "—"}
                                    {" "}{Math.abs(stats.change).toFixed(4)}
                                    {" "}({Math.abs(stats.changePercent).toFixed(2)}%)
                                </Text>
                            </Header>

                            <Footer>
                                <DataUnit
                                    label="High"
                                    value={`₹${stats.max.toFixed(2)}`}
                                    size="small"
                                    isCopyable
                                />

                                <DataUnit
                                    label="Low"
                                    value={`₹${stats.min.toFixed(2)}`}
                                    size="small"
                                    isCopyable
                                />

                                <DataUnit
                                    label="Avg"
                                    value={`₹${stats.avg.toFixed(2)}`}
                                    size="small"
                                    isCopyable
                                />
                            </Footer>
                        </Div>
                    );
                })}

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="chart-cell grid-cell">
                <TimeSeriesChart
                    title       = "Historical exchange rates"
                    dates       = {exchangeRateData.data.map(d => (typeof d.date === "string" ? d.date : (d.date as Date).toISOString()).slice(0, 10))}
                    series      = {exchangeRateData.currencies.map(currency => ({
                        key    : currency.key,
                        label  : currency.displayName,
                        values : exchangeRateData.data.map(d => d[currency.key as keyof SerializedExchangeRateData] as number ?? null),
                    }))}
                    yAxisTitle    = "₹ per unit"
                    valueDecimals = {2}
                    exportName    = "exchange-rates"
                    height        = {600}
                />
            </Div>
        </Article>
    );
};

export default ExchangeRatesPage;

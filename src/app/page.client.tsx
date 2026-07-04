"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading6, Heading4, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import FullDataLink from "@components/FullDataLink/FullDataLink";
import { DataUnit } from "@/components/DataUnit/DataUnit";
import { FieldLines } from "@components/FieldLines/FieldLines";

// LIB =================================================================================================================
import { HomePayload } from "@/lib/api/home";

// STYLES ==============================================================================================================
import "./home.css";

interface HomePageProps {
    home : HomePayload;
}

// Presentation config per chart — data comes aligned from the home payload.
const CHART_CARDS : Array<{
    id               : string;
    chart            : keyof HomePayload["charts"];
    title            : string;
    yAxisTitle       : string;
    valueDecimals    : number;
    valueSuffix    ? : string;
    defaultVisible ? : string[];
    linkTo           : string;
}> = [
    {
        id            : "usd-inr-card",
        chart         : "usd_inr",
        title         : "USD/INR exchange rate",
        yAxisTitle    : "₹ per US$",
        valueDecimals : 2,
        linkTo        : "/indicators/exchange-rates",
    },
    {
        id            : "inflation-card",
        chart         : "inflation",
        title         : "Inflation",
        yAxisTitle    : "% year-on-year",
        valueDecimals : 2,
        valueSuffix   : "%",
        linkTo        : "/banking/select-economic-indicators",
    },
    {
        id            : "corridor-card",
        chart         : "corridor",
        title         : "Policy rate corridor",
        yAxisTitle    : "%",
        valueDecimals : 2,
        valueSuffix   : "%",
        linkTo        : "/banking/select-economic-indicators",
    },
    {
        id             : "upi-card",
        chart          : "upi",
        title          : "UPI, monthly",
        yAxisTitle     : "₹ lakh crore",
        valueDecimals  : 2,
        defaultVisible : [ "value" ],
        linkTo         : "/payments/payment-system-indicators",
    },
    {
        id            : "trade-card",
        chart         : "trade",
        title         : "Foreign trade, monthly",
        yAxisTitle    : "US$ billion",
        valueDecimals : 2,
        linkTo        : "/external/foreign-trade",
    },
    {
        id            : "reserves-card",
        chart         : "reserves",
        title         : "Foreign exchange reserves",
        yAxisTitle    : "US$ billion",
        valueDecimals : 2,
        linkTo        : "/indicators/forex-reserves",
    },
];

const HomePage : React.FC<HomePageProps> = ({home}) => {
    return (
        <Article id="home-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="title-card"
                className="grid-cell"
                padding="micro"
            >
                <img id="rbi-seal" src="/images/rbi-seal.svg" alt="RBI seal" width="96" />

                <Div>
                    <Heading4 weight="700">
                        RBI DBIE
                    </Heading4>

                    <Heading6 weight="400">
                        A database of Indian economic and financial data
                    </Heading6>
                </Div>

                <FieldLines />
            </Div>

            {/* MARKER DATA POINTS ///////////////////////////////////////////////////////////////////////////////// */}
            <Div id="markers">
                {home.markers.map((marker, index) => (
                    <Div
                        key={marker.label}
                        id={`marker${index + 1}-card`}
                        className="grid-cell marker-card"
                        padding="micro"
                    >
                        <DataUnit
                            label={`${marker.label} · ${marker.as_of}`}
                            value={marker.value}
                            size="large"
                            align="left"
                        />
                    </Div>
                ))}
            </Div>

            {/* CHARTS ///////////////////////////////////////////////////////////////////////////////////////////// */}
            {CHART_CARDS.map(card => {
                const chart = home.charts[card.chart];

                return (
                    <Div
                        key={card.id}
                        id={card.id}
                        className="grid-cell home-chart-card has-full-view"
                        padding="micro"
                    >
                        <div className="home-chart-wrapper">
                            <TimeSeriesChart
                                dates={chart.dates}
                                series={chart.series}
                                title={card.title}
                                yAxisTitle={card.yAxisTitle}
                                valueDecimals={card.valueDecimals}
                                valueSuffix={card.valueSuffix}
                                defaultVisible={card.defaultVisible}
                                exportName={card.chart.replace(/_/g, "-")}
                                height={400}
                            />
                        </div>

                        <FullDataLink fullData={card.linkTo} />
                    </Div>
                );
            })}
        </Article>
    );
};

export default HomePage;

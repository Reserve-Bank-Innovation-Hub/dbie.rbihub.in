"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ForexReservesGrid from "@/components/tables/ForexReservesGrid";
import TimeSeriesChart   from "@/components/charts/TimeSeriesChart";
import { DataUnit }      from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ParsedForexReserves } from "@/lib/api/indicators";

// STYLES ==============================================================================================================
import "./forex-reserves-page.css";

// Explicit month-name map — avoids locale-dependent Date.parse behaviour.
const MONTH_MAP : Record<string, string> = {
    Jan : "01", Feb : "02", Mar : "03", Apr : "04",
    May : "05", Jun : "06", Jul : "07", Aug : "08",
    Sep : "09", Oct : "10", Nov : "11", Dec : "12",
};

function weekEndedToISO(weekEnded : string) : string {
    const [day, mon, year] = weekEnded.split("-");
    return `${year}-${MONTH_MAP[mon]}-${day.padStart(2, "0")}`;
}

interface ForexReservesPageProps {
    forexData : ParsedForexReserves;
}

const ForexReservesPage : React.FC<ForexReservesPageProps> = ({forexData}) => {
    const stats = useMemo(() => {
        const years = [ ...new Set(forexData.data.map(row => row.year)) ].filter(y => y !== "");
        return {
            totalRecords : forexData.data.length,
            yearsCount   : years.length,
            latestWeek   : forexData.data[0]?.weekEnded || "N/A",
        };
    }, [ forexData.data ]);

    const chartDates = useMemo(
        () => forexData.data.map(row => weekEndedToISO(row.weekEnded)),
        [ forexData.data ],
    );

    const chartSeries = useMemo(() => [
        {
            key    : "total",
            label  : "Total reserves",
            values : forexData.data.map(row => row.totalReservesUSD    ?? null),
        },
        {
            key    : "fca",
            label  : "Foreign currency assets",
            values : forexData.data.map(row => row.foreignCurrencyUSD  ?? null),
        },
        {
            key    : "gold",
            label  : "Gold",
            values : forexData.data.map(row => row.goldUSD             ?? null),
        },
        {
            key    : "sdrs",
            label  : "SDRs",
            values : forexData.data.map(row => row.sdrsUSD             ?? null),
        },
        {
            key    : "rtp",
            label  : "Reserve tranche position",
            values : forexData.data.map(row => row.rtpUSD              ?? null),
        },
    ], [ forexData.data ]);

    return (
        <Article id="forex-reserves-page" className="page-grid">
            {/* HEADER */}
            <Div id="title-card" bgColour="white" padding="micro">
                <Heading4 weight="700" marginBottom="nano">
                    Foreign exchange reserves — Weekly
                </Heading4>
                <Heading6 weight="400" opacity="60">
                    Weekly data on India’s foreign exchange reserves including total reserves, foreign currency assets,
                    gold holdings, and SDRs
                </Heading6>
            </Div>

            <Div
                id="meta-card"
                className="grid-cell"
                padding="micro"
            >
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Total records"
                    value={stats.totalRecords.toLocaleString()}
                />

                <DataUnit
                    label="Latest week"
                    value={stats.latestWeek}
                />
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="forex-reserves-ts-chart grid-cell" padding="micro">
                <Heading6 weight="600" marginBottom="nano">
                    Weekly reserves (US $ million)
                </Heading6>

                <TimeSeriesChart
                    dates          = {chartDates}
                    series         = {chartSeries}
                    yAxisTitle     = "US $ million"
                    valueDecimals  = {0}
                    exportName     = "forex-reserves"
                    defaultVisible = {["total", "fca", "gold"]}
                    height         = {550}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="forex-reserves-chart">
                <ForexReservesGrid data={forexData.data} />
            </Div>
        </Article>
    );
};

export default ForexReservesPage;

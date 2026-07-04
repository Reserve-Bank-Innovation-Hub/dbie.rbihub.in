"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ReserveMoneyGrid from "@/components/tables/ReserveMoneyGrid";
import ReserveMoneyChart from "@/components/charts/ReserveMoneyChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ReserveMoney } from "@/lib/api/tables/reserve-money";



interface ReserveMoneyPageProps {
    reserveMoneyData : ReserveMoney;
}

const ReserveMoneyPage : React.FC<ReserveMoneyPageProps> = ({ reserveMoneyData }) => {
    // The file is newest-first, so the first row is the latest observation.
    const latest = reserveMoneyData.data[0];

    return (
        <Article id="reserve-money-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Reserve money — components and sources
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        {reserveMoneyData.unit}
                    </Heading6>
                </Div>

                <Text>
                    Reserve money (M0), the monetary base, broken down into its components
                    (currency in circulation, bankers&apos; deposits with RBI, and other deposits)
                    and its sources (net RBI credit to government, credit to banks, credit to the
                    commercial sector, net foreign exchange assets, and government currency liabilities).
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest date"
                    value={latest?.date || "—"}
                />

                <DataUnit
                    label="Total observations"
                    value={`${reserveMoneyData.data.length.toLocaleString("en-IN")} records`}
                />
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="chart-cell grid-cell">
                <ReserveMoneyChart
                    data={reserveMoneyData.data}
                    title="Reserve money and currency in circulation over time"
                    height={600}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <ReserveMoneyGrid
                    data={reserveMoneyData.data}
                    columns={reserveMoneyData.columns}
                />
            </Div>
        </Article>
    );
};

export default ReserveMoneyPage;

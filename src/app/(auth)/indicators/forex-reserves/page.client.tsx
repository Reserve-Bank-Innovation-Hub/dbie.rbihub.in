"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ForexReservesGrid from "@/components/tables/ForexReservesGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ParsedForexReserves } from "@/lib/api/indicators";

// STYLES ==============================================================================================================
import "./forex-reserves-page.css";

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

            {/* DATA GRID */}
            <Div className="forex-reserves-chart">
                <ForexReservesGrid data={forexData.data} />
            </Div>
        </Article>
    );
};

export default ForexReservesPage;

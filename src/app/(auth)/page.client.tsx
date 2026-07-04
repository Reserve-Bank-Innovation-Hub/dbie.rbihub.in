"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading6, Heading4, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ExternalDebtChart from "@components/charts/ExternalDebtChart";
import ForeignInvestmentInflowsChart from "@/components/charts/ForeignInvestmentInflowsChart";
import ForexReservesChart from "@/components/charts/ForexReservesChart";
import FullDataLink from "@components/FullDataLink/FullDataLink";
import { DataUnit } from "@/components/DataUnit/DataUnit";
import { FieldLines } from "@components/FieldLines/FieldLines";

// LIB =================================================================================================================
import { ExternalDebtRow } from "@/lib/api/publications";
import { ParsedForexReserves, ForeignInvestmentInflowsData } from "@/lib/api/indicators";

// ASSETS ==============================================================================================================

// STYLES ==============================================================================================================
import "./home.css";

interface HomePageProps {
    forexData        : ParsedForexReserves;
    fiiData          : ForeignInvestmentInflowsData;
    externalDebtData : ExternalDebtRow[];
    markers          : Record<string, string>;
}

const HomePage : React.FC<HomePageProps> = ({markers, forexData, fiiData, externalDebtData}) => {
    const markerKeys = Object.keys(markers);

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
            {markerKeys.map((key, index) => (
                <Div
                    key={key}
                    id={`marker${index + 1}-card`}
                    className="grid-cell marker-card"
                    padding="micro"
                >
                    <DataUnit
                        label={key}
                        value={markers[key]}
                        size="large"
                        align="left"
                    />
                </Div>
            ))}

            {/* FOREX RESERVES CHART /////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="forex-card"
                className="grid-cell has-full-view"
                padding="micro"
            >
                <div className="forex-chart-wrapper">
                    <ForexReservesChart data={forexData.data} />
                </div>

                <FullDataLink fullData="/indicators/forex-reserves" />
            </Div>

            {/* FII CHART ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="fii-card"
                className="grid-cell"
                padding="micro"
            >
                <div className="fii-chart-wrapper">
                    <ForeignInvestmentInflowsChart data={fiiData.data} />
                </div>
            </Div>

            {/* EXTERNAL DEBT CHART //////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="external-debt-card"
                className="grid-cell"
                padding="micro"
            >
                <div className="external-debt-chart-wrapper">
                    <ExternalDebtChart data={externalDebtData} />
                </div>
            </Div>
        </Article>
    );
};

export default HomePage;
"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Text, Heading6, Portion, Row, Heading4, Header, Div } from "fictoan-react";

// LIB =================================================================================================================
import { ParsedExchangeRates } from "@/lib/api/indicators";

// STYLES ==============================================================================================================
import "./indicators-page.css";

interface IndicatorsPageProps {
    exchangeRateData ? : ParsedExchangeRates;
}

const IndicatorsPage = ({exchangeRateData} : IndicatorsPageProps) => {
    return (
        <Article id="indicators-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="title-card"
                bgColour="white"
                padding="micro"
            >
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Indicators
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Key economic parameters like GDP, inflation, and financial market trends.
                    </Heading6>
                </Div>
            </Div>
        </Article>
    );
};

export default IndicatorsPage;
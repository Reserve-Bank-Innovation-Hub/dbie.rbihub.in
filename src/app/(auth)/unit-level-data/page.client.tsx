"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Text, Heading6, Portion, Row, Heading4, Header, Div } from "fictoan-react";

// STYLES ==============================================================================================================
import "./unit-level-data-page.css";

const UnitLevelDataPage = () => {
    return (
        <Article id="unit-level-data-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="title-card"
                bgColour="white"
                padding="micro"
            >
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Unit-level data
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Granular, disaggregated datasets from surveys and micro-level data for detailed analysis.
                    </Heading6>
                </Div>
            </Div>
        </Article>
    );
};

export default UnitLevelDataPage;

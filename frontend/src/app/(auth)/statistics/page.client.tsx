"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Text, Heading6, Portion, Row, Heading4, Header, Div } from "fictoan-react";

// STYLES ==============================================================================================================
import "./statistics-page.css";

const StatisticsPage = () => {
    return (
        <Article id="statistics-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="title-card"
                bgColour="white"
                padding="micro"
            >
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Statistics
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Comprehensive time-series data organised by subject areas
                    </Heading6>
                </Div>
            </Div>
        </Article>
    );
};

export default StatisticsPage;

"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// STYLES ==============================================================================================================
import "./growth-page.css";

const GrowthPage = () => {
    return (
        <Article id="growth-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="title-card"
                bgColour="white"
                padding="micro"
            >
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Growth
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        GDP, industrial production and real-sector growth indicators
                    </Heading6>
                </Div>
            </Div>
        </Article>
    );
};

export default GrowthPage;

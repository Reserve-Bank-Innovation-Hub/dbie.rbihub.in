"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// STYLES ==============================================================================================================
import "./external-page.css";

const ExternalPage = () => {
    return (
        <Article id="external-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="title-card"
                bgColour="white"
                padding="micro"
            >
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        External
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Balance of payments, foreign trade, forex reserves and external debt
                    </Heading6>
                </Div>
            </Div>
        </Article>
    );
};

export default ExternalPage;

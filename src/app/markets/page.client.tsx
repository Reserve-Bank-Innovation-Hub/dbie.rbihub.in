"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// STYLES ==============================================================================================================
import "./markets-page.css";

const MarketsPage = () => {
    return (
        <Article id="markets-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="title-card"
                bgColour="white"
                padding="micro"
            >
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Markets
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Money, government securities, equity, corporate debt and forex markets
                    </Heading6>
                </Div>
            </Div>
        </Article>
    );
};

export default MarketsPage;

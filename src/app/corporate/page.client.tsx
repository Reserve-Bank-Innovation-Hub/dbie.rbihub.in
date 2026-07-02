"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// STYLES ==============================================================================================================
import "./corporate-page.css";

const CorporatePage = () => {
    return (
        <Article id="corporate-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="title-card"
                bgColour="white"
                padding="micro"
            >
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Corporate
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Company finances, balance sheets, profitability and corporate sector performance
                    </Heading6>
                </Div>
            </Div>
        </Article>
    );
};

export default CorporatePage;

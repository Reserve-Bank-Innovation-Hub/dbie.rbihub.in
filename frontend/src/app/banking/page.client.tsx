"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// STYLES ==============================================================================================================
import "./banking-page.css";

const BankingPage = () => {
    return (
        <Article id="banking-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="title-card"
                bgColour="white"
                padding="micro"
            >
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Banking
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Bank credit, deposits, monetary aggregates and scheduled bank statistics
                    </Heading6>
                </Div>
            </Div>
        </Article>
    );
};

export default BankingPage;

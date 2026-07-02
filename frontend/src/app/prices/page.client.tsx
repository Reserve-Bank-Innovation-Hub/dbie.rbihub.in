"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// STYLES ==============================================================================================================
import "./prices-page.css";

const PricesPage = () => {
    return (
        <Article id="prices-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="title-card"
                bgColour="white"
                padding="micro"
            >
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Prices
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Consumer and wholesale price indices, inflation and commodity prices
                    </Heading6>
                </Div>
            </Div>
        </Article>
    );
};

export default PricesPage;

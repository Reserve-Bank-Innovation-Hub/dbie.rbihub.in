"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// STYLES ==============================================================================================================
import "./government-page.css";

const GovernmentPage = () => {
    return (
        <Article id="government-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="title-card"
                bgColour="white"
                padding="micro"
            >
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Government
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Central and state government finances, receipts, expenditure and deficits
                    </Heading6>
                </Div>
            </Div>
        </Article>
    );
};

export default GovernmentPage;

"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Text, Heading6, Portion, Row, Heading4, Header, Div } from "fictoan-react";

// STYLES ==============================================================================================================
import "./publications-page.css";

const PublicationsPage = () => {
    return (
        <Article id="publications-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="title-card"
                bgColour="white"
                padding="micro"
            >
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Publications
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        RBI’s regular reports and statistical releases and various sector-specific reports with context and commentary.
                    </Heading6>
                </Div>
            </Div>
        </Article>
    );
};

export default PublicationsPage;

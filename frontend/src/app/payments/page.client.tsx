"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// STYLES ==============================================================================================================
import "./payments-page.css";

const PaymentsPage = () => {
    return (
        <Article id="payments-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="title-card"
                bgColour="white"
                padding="micro"
            >
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Payments
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Payment and settlement system indicators including UPI, NEFT, RTGS and cards
                    </Heading6>
                </Div>
            </Div>
        </Article>
    );
};

export default PaymentsPage;

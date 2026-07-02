"use client";

// UI ==================================================================================================================
import { Article, Div, Heading4, Heading6, Card, Text, Spinner } from "fictoan-react";

// STYLES ==============================================================================================================
import "./exchange-rates-page.css";

export default function Loading() {
    return (
        <Article id="exchange-rates-page" className="page-grid">
            {/* HEADER - Same as actual page */}
            <Div
                id="title-card"
                bgColour="white"
                padding="micro"
            >
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Daily exchange rate of the Indian rupee
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        ₹ per unit of foreign currency
                    </Heading6>
                </Div>

                <Text>
                    Exchange rates represent the Indian rupee value per unit of foreign currency. An increase
                    indicates depreciation of the rupee, while a decrease indicates appreciation.
                </Text>
            </Div>

            {/* META CARD - Same grid position */}
            <Div id="meta-card">
                <Card padding="micro" bgColour="slate-light90" isFullHeight>
                    <Div className="flex-center">
                        <Spinner size="small" />
                    </Div>
                </Card>
            </Div>

            {/* CURRENCY STAT CARDS - Follow exact same layout */}
            {[ "US Dollar", "Pound Sterling", "Euro", "Japanese Yen" ].map((currency, idx) => (
                <Card
                    key={idx}
                    className="currency-stat-card"
                    padding="micro"
                    bgColour="slate-light90"
                >
                    <Div className="flex-center">
                        <Spinner size="small" />
                    </Div>
                </Card>
            ))}

            {/* CHART - Same grid area */}
            <Card
                className="exchange-rate-chart"
                padding="micro"
                shape="rounded"
                bgColour="white"
            >
                <Div className="flex-center">
                    <Div className="text-center">
                        <Spinner size="large" />
                        <Div marginTop="micro">
                            <Text opacity="60">Loading exchange rate data...</Text>
                        </Div>
                    </Div>
                </Div>
            </Card>
        </Article>
    );
}

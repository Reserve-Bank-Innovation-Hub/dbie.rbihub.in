"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Card, Div, Heading4, Heading6, Text, Row, Portion } from "fictoan-react";

const TABLES = [
    { linkTo : "/banking/money-stock-measures", label : "Money stock measures" },
    { linkTo : "/banking/sources-of-money-stock", label : "Sources of money stock (M3)" },
    { linkTo : "/banking/monetary-survey", label : "Monetary survey" },
    { linkTo : "/banking/liquidity-aggregates", label : "Liquidity aggregates" },
    { linkTo : "/banking/rbi-survey", label : "RBI survey" },
    { linkTo : "/banking/reserve-money", label : "Reserve money" },
    { linkTo : "/banking/commercial-bank-survey", label : "Commercial bank survey" },
    { linkTo : "/banking/scb-investments", label : "SCB investments" },
    { linkTo : "/banking/business-of-scheduled-banks", label : "Business of scheduled banks" },
    { linkTo : "/banking/bank-credit-by-sector", label : "Bank credit by sector" },
    { linkTo : "/banking/bank-credit-by-industry", label : "Bank credit by industry" },
    { linkTo : "/banking/state-cooperative-banks", label : "State co-operative banks" },
];

const SectionPage = () => {
    return (
        <Article id="banking-page" className="page-grid">
            <Div id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Banking
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Monetary aggregates, surveys and bank credit.
                    </Heading6>
                </Div>
            </Div>

            <Row marginTop="micro">
                {TABLES.map(table => (
                    <Portion key={table.linkTo} desktopSpan="half" mobileSpan="whole">
                        <Link href={table.linkTo}>
                            <Card padding="micro" shape="rounded" isFullHeight>
                                <Text weight="600">{table.label}</Text>
                            </Card>
                        </Link>
                    </Portion>
                ))}
            </Row>
        </Article>
    );
};

export default SectionPage;

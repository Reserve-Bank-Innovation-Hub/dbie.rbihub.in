"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Div, Header, Heading4, Heading6, Section, Text } from "fictoan-react";

const SECTIONS = [
    {
        title : "Reserve Bank of India",
        items : [
            { linkTo : "/banking/select-economic-indicators", label : "Select economic indicators" },
            { linkTo : "/banking/rbi-liabilities-and-assets", label : "RBI liabilities and assets" },
            { linkTo : "/banking/liquidity-operations", label : "Liquidity operations" },
            { linkTo : "/banking/usd-sale-purchase", label : "USD sale/purchase" },
            { linkTo : "/banking/rbi-standing-facilities", label : "Standing facilities" },
        ],
    },
    {
        title : "Money and banking",
        items : [
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
        ],
    },
    {
        title : "Occasional series",
        items : [
            { linkTo : "/banking/small-savings", label : "Small savings" },
            { linkTo : "/banking/household-financial-flows", label : "Household financial flows" },
            { linkTo : "/banking/household-financial-stocks", label : "Household financial stocks" },
        ],
    },
];

const BankingPage = () => {
    return (
        <Article id="banking-page" className="data-list-page">
            <Header id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Banking
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Reserve Bank operations, monetary aggregates, surveys and bank credit.
                    </Heading6>
                </Div>
            </Header>

            <Div id="sections-wrapper">
                {SECTIONS.map(section => (
                    <Section key={section.title} marginBottom="nano">
                        <Div className="grid-cell section-header" padding="micro">
                            <Heading6 weight="700" className="section-title">
                                {section.title}
                            </Heading6>
                        </Div>

                        <Div className="section-content">
                            {section.items.map(item => (
                                <Div className="grid-cell" key={item.linkTo} padding="micro">
                                    <Link href={item.linkTo}>
                                        <Text weight="600">{item.label}</Text>
                                    </Link>
                                </Div>
                            ))}
                        </Div>
                    </Section>
                ))}
            </Div>
        </Article>
    );
};

export default BankingPage;

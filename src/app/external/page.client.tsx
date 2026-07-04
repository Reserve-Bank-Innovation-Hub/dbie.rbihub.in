"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Div, Header, Heading4, Heading6, Section, Text } from "fictoan-react";

const SECTIONS = [
    {
        title : "Monthly RBI Bulletin",
        items : [
            {
                linkTo      : "/external/foreign-trade",
                label       : "Foreign trade",
                description : "Monthly India foreign trade data — exports, imports and trade balance in ₹ crore and US$ millions, with oil and non-oil breakdowns. RBI Bulletin Table 32.",
            },
            {
                linkTo      : "/external/forex-reserves-weekly",
                label       : "Forex reserves (weekly)",
                description : "Weekly snapshot of India's official foreign exchange reserves, including foreign currency assets, gold, SDRs and reserve tranche position, from 2001 onwards.",
            },
            {
                linkTo      : "/external/nri-deposits",
                label       : "NRI deposits",
                description : "Monthly NRI deposit outstandings and inflows/outflows by scheme — FCNR(B), NR(E)RA and NRO — in US$ millions. RBI Bulletin Table 34.",
            },
            {
                linkTo      : "/external/foreign-investment-inflows-bulletin",
                label       : "Foreign investment inflows",
                description : "Monthly foreign direct investment (FDI) and portfolio investment inflows into and from India in US $ Millions, from 2011 onwards.",
            },
            {
                linkTo      : "/external/outward-remittances-lrs",
                label       : "Outward remittances (LRS)",
                description : "Monthly outward remittances by resident individuals under the Liberalised Remittance Scheme (LRS), broken down by purpose — deposit, property, equity/debt, gift, travel, studies, and more. In US$ millions.",
            },
            {
                linkTo      : "/external/reer-and-neer",
                label       : "REER and NEER",
                description : "Monthly indices of NEER and REER of the Indian rupee (40-currency basket, base 2015-16=100), trade-weighted and export-weighted.",
            },
            {
                linkTo      : "/external/external-commercial-borrowings",
                label       : "External commercial borrowings",
                description : "Monthly ECB registrations by Indian entities under the automatic and approval routes — number, amount (US$ millions), weighted average maturity, interest rate, and borrower-category breakdown.",
            },
            {
                linkTo      : "/external/balance-of-payments-usd",
                label       : "Balance of payments (US$)",
                description : "Quarterly balance of payments for India (overall presentation) in US$ million — current account, merchandise trade, invisibles, capital account, and monetary movements. Source: RBI Bulletin Table 40.",
            },
            {
                linkTo      : "/external/balance-of-payments-inr",
                label       : "Balance of payments (₹)",
                description : "Quarterly balance of payments for India (overall presentation) in ₹ crore — current account, merchandise trade, invisibles, capital account, and monetary movements. Source: RBI Bulletin Table 41.",
            },
            {
                linkTo      : "/external/bop-bpm6-usd",
                label       : "BoP as per BPM6 (US$)",
                description : "Quarterly balance of payments for India as per the BPM6 standard presentation in US$ million — current account, capital account, financial account, and net errors and omissions. Source: RBI Bulletin Table 42.",
            },
            {
                linkTo      : "/external/bop-bpm6-inr",
                label       : "BoP as per BPM6 (₹)",
                description : "Quarterly balance of payments for India as per the BPM6 standard presentation in ₹ crore — current account, capital account, financial account, and net errors and omissions. Source: RBI Bulletin Table 43.",
            },
            {
                linkTo      : "/external/international-investment-position",
                label       : "International investment position",
                description : "Quarterly international investment position (IIP) of India — external assets and liabilities per IMF BPM6, in US$ millions.",
            },
        ],
    },
];

const ExternalPage = () => {
    return (
        <Article id="external-page" className="data-list-page">
            <Header id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        External
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Trade, reserves, investment flows and the balance of payments.
                    </Heading6>
                </Div>
            </Header>

            <Div id="sections-wrapper">
                {SECTIONS.map((section, idx) => (
                    <Section key={section.title || idx} marginBottom="nano">
                        {section.title && (
                            <Div className="grid-cell section-header" padding="micro">
                                <Heading6 weight="700" className="section-title">
                                    {section.title}
                                </Heading6>
                            </Div>
                        )}

                        <Div className="section-content">
                            {section.items.map(item => (
                                <Div className="grid-cell" key={item.linkTo} padding="micro">
                                    <Link href={item.linkTo}>
                                        <Text weight="600">{item.label}</Text>

                                        {item.description && (
                                            <Text size="small" opacity="80" weight="400">
                                                {item.description}
                                            </Text>
                                        )}
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

export default ExternalPage;

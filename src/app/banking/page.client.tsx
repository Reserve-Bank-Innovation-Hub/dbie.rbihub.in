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
            {
                linkTo      : "/banking/select-economic-indicators",
                label       : "Select economic indicators",
                description : "Monthly snapshot of India's key economic indicators — industrial production, money and banking, interest rates, inflation and foreign trade. Source: RBI Bulletin Table 1.",
            },
            {
                linkTo      : "/banking/rbi-liabilities-and-assets",
                label       : "RBI liabilities and assets",
                description : "Weekly balance sheet of the Reserve Bank of India — issue department and banking department liabilities and assets in Rupees Crores. Source: RBI Bulletin Table 2.",
            },
            {
                linkTo      : "/banking/liquidity-operations",
                label       : "Liquidity operations",
                description : "Daily central bank liquidity injection and absorption operations by the Reserve Bank of India, in Rupees crore. Covers repo, reverse repo, MSF, SDF, OMO, LTRO, TLTRO and other instruments. Source: RBI Monthly Bulletin Table 3.",
            },
            {
                linkTo      : "/banking/usd-sale-purchase",
                label       : "USD sale/purchase",
                description : "Monthly RBI foreign exchange intervention data — outright sale/purchase of US dollars, operations in currency forwards, and maturity breakdown of outstanding forward positions. Source: RBI Monthly Bulletin Table 4.",
            },
            {
                linkTo      : "/banking/rbi-standing-facilities",
                label       : "Standing facilities",
                description : "Fortnightly utilisation of the Reserve Bank's standing facilities — MSF, export credit refinance, liquidity facility for primary dealers, and others. Rupees crore,",
            },
        ],
    },
    {
        title : "Money and banking",
        items : [
            {
                linkTo      : "/banking/money-stock-measures",
                label       : "Money stock measures",
                description : "Fortnightly money stock components and aggregates (M1, M2, M3, M4) published by the Reserve Bank of India, from 1951 onwards.",
            },
            {
                linkTo      : "/banking/sources-of-money-stock",
                label       : "Sources of money stock (M3)",
                description : "Fortnightly sources of M3 money stock — net bank credit to government, bank credit to commercial sector, net foreign exchange assets, and non-monetary liabilities — published by the Reserve Bank of India.",
            },
            {
                linkTo      : "/banking/monetary-survey",
                label       : "Monetary survey",
                description : "Fortnightly monetary survey data covering money stock aggregates (NM1, NM2, NM3) and their components — currency, deposits, domestic credit and foreign assets. Source: RBI Bulletin Table 8.",
            },
            {
                linkTo      : "/banking/liquidity-aggregates",
                label       : "Liquidity aggregates",
                description : "Monthly liquidity aggregates (NM3, L1, L2) and sub-components including postal deposits, liabilities of financial institutions, and public deposits with NBFCs. Source: Reserve Bank of India Bulletin Table 09.",
            },
            {
                linkTo      : "/banking/rbi-survey",
                label       : "RBI survey",
                description : "Fortnightly RBI balance-sheet survey covering reserve money and its components — currency in circulation, bankers' deposits, RBI domestic credit, government securities, foreign assets and capital account. Source: RBI Bulletin Table 10.",
            },
            {
                linkTo      : "/banking/reserve-money",
                label       : "Reserve money",
                description : "Reserve money (M0) components and sources in Rupees millions, from the RBI Monthly Bulletin. Covers currency in circulation, bankers' deposits, and net foreign exchange assets.",
            },
            {
                linkTo      : "/banking/commercial-bank-survey",
                label       : "Commercial bank survey",
                description : "Fortnightly commercial bank survey data covering aggregate deposits, domestic credit, foreign-currency assets, bank reserves and capital, from 1999 onwards.",
            },
            {
                linkTo      : "/banking/scb-investments",
                label       : "SCB investments",
                description : "Fortnightly investment data for scheduled commercial banks across SLR securities, non-SLR government securities, commercial paper, shares, bonds/debentures and mutual funds. Source: RBI Bulletin Table 13.",
            },
            {
                linkTo      : "/banking/business-of-scheduled-banks",
                label       : "Business of scheduled banks",
                description : "Fortnightly balance-sheet aggregates for all scheduled banks and all scheduled commercial banks in India — liabilities, deposits, borrowings, investments and bank credit. Source: RBI Bulletin Table 14.",
            },
            {
                linkTo      : "/banking/bank-credit-by-sector",
                label       : "Bank credit by sector",
                description : "Fortnightly outstanding gross bank credit deployed by major sectors — agriculture, industry, services, and personal loans — from January 2019 to December 2025. Source: RBI Bulletin Table 15.",
            },
            {
                linkTo      : "/banking/bank-credit-by-industry",
                label       : "Bank credit by industry",
                description : "Outstanding bank credit across 43 industry categories (Table 16) spanning January 2019 to December 2025, in Rupees crores",
            },
            {
                linkTo      : "/banking/state-cooperative-banks",
                label       : "State co-operative banks",
                description : "Fortnightly balance-sheet data for state co-operative banks maintaining accounts with the Reserve Bank of India — deposits, liabilities, borrowings, investments and bank credit. Source: RBI Bulletin Table 17.",
            },
        ],
    },
    {
        title : "Occasional series",
        items : [
            {
                linkTo      : "/banking/small-savings",
                label       : "Small savings",
                description : "Monthly and annual receipts and outstanding balances across small savings schemes in India — post office deposits, saving certificates, and public provident fund. Source: RBI Bulletin Table 46.",
            },
            {
                linkTo      : "/banking/household-financial-flows",
                label       : "Household financial flows",
                description : "Quarterly and annual flow of financial assets and liabilities of Indian households by instrument — deposits, insurance, provident funds, currency, investments, and borrowings. Source: RBI Bulletin Table 52(a).",
            },
            {
                linkTo      : "/banking/household-financial-stocks",
                label       : "Household financial stocks",
                description : "Quarter-end stocks of financial assets and liabilities of households in India — bank deposits, life insurance funds, currency, mutual funds, pension funds, small savings, and borrowings. Source: RBI Bulletin Table 52(b).",
            },
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

export default BankingPage;

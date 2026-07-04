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
                linkTo      : "/markets/daily-call-money-rates",
                label       : "Daily call money rates",
                description : "Daily weighted average call/notice money rates — minimum and maximum.",
            },
            {
                linkTo      : "/markets/certificates-of-deposit",
                label       : "Certificates of deposit",
                description : "Fortnightly CD amounts outstanding, issuance and interest rates.",
            },
            {
                linkTo      : "/markets/commercial-paper",
                label       : "Commercial paper",
                description : "Fortnightly CP amounts outstanding, reported issuance and rates.",
            },
            {
                linkTo      : "/markets/financial-markets-turnover",
                label       : "Financial markets turnover",
                description : "Average daily turnover across money, G-Sec and forex markets.",
            },
            {
                linkTo      : "/markets/new-capital-issues",
                label       : "New capital issues",
                description : "New issues by non-government public limited companies, by security type.",
            },
        ],
    },
];

const MarketsPage = () => {
    return (
        <Article id="markets-page" className="data-list-page">
            <Header id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Markets
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Money market, debt instruments, turnover and primary market activity.
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
                                            <Text size="small" opacity="60" marginTop="nano">
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

export default MarketsPage;

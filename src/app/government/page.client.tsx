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
            { linkTo : "/government/union-government-accounts", label : "Union government accounts" },
            { linkTo : "/government/treasury-bills-ownership", label : "Treasury bills ownership" },
            { linkTo : "/government/treasury-bill-auctions", label : "Treasury bill auctions" },
        ],
    },
    {
        title : "Occasional series",
        items : [
            { linkTo : "/government/dated-securities-ownership", label : "Dated securities ownership" },
            { linkTo : "/government/combined-receipts-disbursements", label : "Combined receipts and disbursements" },
            { linkTo : "/government/state-financial-accommodation", label : "State financial accommodation" },
            { linkTo : "/government/state-government-investments", label : "State government investments" },
            { linkTo : "/government/state-market-borrowings", label : "State market borrowings" },
        ],
    },
];

const GovernmentPage = () => {
    return (
        <Article id="government-page" className="data-list-page">
            <Header id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Government
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Union government accounts and treasury bill statistics.
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

export default GovernmentPage;

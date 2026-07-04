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
                linkTo      : "/government/union-government-accounts",
                label       : "Union government accounts",
                description : "Monthly union government receipts, expenditure and deficits at a glance.",
            },
            {
                linkTo      : "/government/treasury-bills-ownership",
                label       : "Treasury bills ownership",
                description : "Weekly treasury bills outstanding by holder — banks, primary dealers, state governments and others.",
            },
            {
                linkTo      : "/government/treasury-bill-auctions",
                label       : "Treasury bill auctions",
                description : "Auction-wise results for 91, 182 and 364-day treasury bills — bids, cut-off prices and yields.",
            },
        ],
    },
    {
        title : "Occasional series",
        items : [
            {
                linkTo      : "/government/dated-securities-ownership",
                label       : "Dated securities ownership",
                description : "Quarterly ownership shares of central and state government securities and treasury bills.",
            },
            {
                linkTo      : "/government/combined-receipts-disbursements",
                label       : "Combined receipts and disbursements",
                description : "Consolidated fiscal position of central and state governments by year.",
            },
            {
                linkTo      : "/government/state-financial-accommodation",
                label       : "State financial accommodation",
                description : "State-wise use of special drawing, ways and means and overdraft facilities.",
            },
            {
                linkTo      : "/government/state-government-investments",
                label       : "State government investments",
                description : "State-wise investments in sinking, redemption and stabilisation funds and treasury bills.",
            },
            {
                linkTo      : "/government/state-market-borrowings",
                label       : "State market borrowings",
                description : "State-wise gross and net market borrowings, annual and monthly.",
            },
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

export default GovernmentPage;

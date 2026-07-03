"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Card, Div, Heading4, Heading6, Text, Row, Portion } from "fictoan-react";

const TABLES = [
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
];

const GovernmentPage = () => {
    return (
        <Article id="government-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Government
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Union government accounts and treasury bill statistics.
                    </Heading6>
                </Div>
            </Div>

            {/* TABLES ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Row marginTop="micro">
                {TABLES.map(table => (
                    <Portion key={table.linkTo} desktopSpan="half" mobileSpan="whole">
                        <Link href={table.linkTo}>
                            <Card padding="micro" shape="rounded" isFullHeight>
                                <Text weight="600" marginBottom="nano">{table.label}</Text>
                                <Text opacity="60" size="small">{table.description}</Text>
                            </Card>
                        </Link>
                    </Portion>
                ))}
            </Row>
        </Article>
    );
};

export default GovernmentPage;

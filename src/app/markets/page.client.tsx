"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Card, Div, Heading4, Heading6, Text, Row, Portion } from "fictoan-react";

const TABLES = [
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
];

const MarketsPage = () => {
    return (
        <Article id="markets-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Markets
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Money market, debt instruments, turnover and primary market activity.
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

export default MarketsPage;

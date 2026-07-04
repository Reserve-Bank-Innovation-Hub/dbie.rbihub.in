"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Card, Div, Heading4, Heading6, Text, Row, Portion } from "fictoan-react";

const TABLES = [
    { linkTo : "/external/foreign-trade", label : "Foreign trade" },
    { linkTo : "/external/forex-reserves-weekly", label : "Forex reserves (weekly)" },
    { linkTo : "/external/nri-deposits", label : "NRI deposits" },
    { linkTo : "/external/foreign-investment-inflows-bulletin", label : "Foreign investment inflows" },
    { linkTo : "/external/outward-remittances-lrs", label : "Outward remittances (LRS)" },
    { linkTo : "/external/reer-and-neer", label : "REER and NEER" },
    { linkTo : "/external/external-commercial-borrowings", label : "External commercial borrowings" },
    { linkTo : "/external/balance-of-payments-usd", label : "Balance of payments (US$)" },
    { linkTo : "/external/balance-of-payments-inr", label : "Balance of payments (₹)" },
    { linkTo : "/external/bop-bpm6-usd", label : "BoP as per BPM6 (US$)" },
    { linkTo : "/external/bop-bpm6-inr", label : "BoP as per BPM6 (₹)" },
    { linkTo : "/external/international-investment-position", label : "International investment position" },
];

const SectionPage = () => {
    return (
        <Article id="external-page" className="page-grid">
            <Div id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        External
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Trade, reserves, investment flows and the balance of payments.
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

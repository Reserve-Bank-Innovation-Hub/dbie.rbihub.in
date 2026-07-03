"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Card, Div, Heading4, Heading6, Text, Row, Portion } from "fictoan-react";

const TABLES = [
    {
        linkTo      : "/payments/payment-system-indicators",
        label       : "Payment system indicators",
        description : "Monthly volumes and values across settlement systems, RTGS, UPI, cards, PPIs and payment infrastructure.",
    },
];

const PaymentsPage = () => {
    return (
        <Article id="payments-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Payments
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Payment and settlement system statistics.
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

export default PaymentsPage;

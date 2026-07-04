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

export default ExternalPage;

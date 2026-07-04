"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Div, Header, Heading4, Heading6, Section, Text } from "fictoan-react";

const SECTIONS = [
    {
        title : "External sector",
        items : [
            {
                linkTo      : "/indicators/exchange-rates",
                label       : "Exchange rates",
                description : "Daily exchange rates of the Indian Rupee against major foreign currencies including US Dollar, Pound Sterling, Euro, and Japanese Yen.",
            },
            {
                linkTo      : "/indicators/forex-reserves",
                label       : "Forex reserves",
                description : "Weekly foreign exchange reserves data including total reserves, foreign currency assets, gold holdings, and SDRs",
            },
        ],
    },
];

const IndicatorsPage = () => {
    return (
        <Article id="indicators-page" className="data-list-page">
            <Header id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Indicators
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Key economic parameters like GDP, inflation, and financial market trends.
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

export default IndicatorsPage;

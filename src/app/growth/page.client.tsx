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
            { linkTo : "/growth/index-of-industrial-production", label : "Index of industrial production" },
        ],
    },
];

const GrowthPage = () => {
    return (
        <Article id="growth-page" className="data-list-page">
            <Header id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Growth
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Output and production indicators.
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

export default GrowthPage;

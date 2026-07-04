"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Div, Header, Heading4, Heading6, Section, Text } from "fictoan-react";

const SECTIONS = [
    {
        title : "Bank credit",
        items : [
            {
                linkTo      : "/stories/the-lights-came-on",
                label       : "The lights came on",
                description : "Individuals overtook companies as banks' biggest borrowers — and a third of the borrowers added since 2015 are women.",
            },
        ],
    },
    {
        title : "External debt",
        items : [
            {
                linkTo      : "/stories/debt-to-service-ratio",
                label       : "The long walk back from 1991",
                description : "India went from spending a third of its export earnings on debt service in 1991 to just 6% today.",
            },
            {
                linkTo      : "/stories/concessional-share-of-total-debt-vs-commercial-borrowings",
                label       : "From aid recipient to market borrower",
                description : "India's external debt shifted from aid-style concessional loans to market-rate commercial borrowing.",
            },
        ],
    },
];

const StoriesPage = () => {
    return (
        <Article id="stories-page" className="data-list-page">
            <Header id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Stories
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Data-led stories built on the same verified datasets as the tables — each one ends
                        with the question that matters: so what?
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

export default StoriesPage;

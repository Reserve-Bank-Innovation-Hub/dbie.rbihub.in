"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Div, Header, Heading4, Heading6, Section, Text } from "fictoan-react";

// LIB =================================================================================================================
import { slugify } from "@/lib/api/catalogue";

// OTHER ===============================================================================================================
import { HANDBOOK_SECTIONS as SECTIONS } from "./sections";


const HandbookPage = () => {
    return (
        <Article id="handbook-page" className="data-list-page">
            <Header id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Handbook of statistics
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Annual series from the RBI’s Handbook of Statistics on Indian Economy.
                    </Heading6>
                </Div>
            </Header>

            <Div id="sections-wrapper">
                {SECTIONS.map((section, idx) => (
                    <Section key={section.title || idx} id={slugify(section.title)} marginBottom="nano">
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

export default HandbookPage;

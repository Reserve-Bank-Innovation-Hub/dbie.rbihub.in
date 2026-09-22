"use client";

// The list page of a section of the site built on one of DBIE's menus — /publications, /statistics — laid out as the
// site's other list pages are (the banking page): the title card, then one section naming each of DBIE's items, which
// opens at <base>/<slug>. The names and their order come from DBIE's menu at build time (src/lib/dbie-menu.ts); what
// each item holds is counted from the data API's catalogue in the browser once it is in.

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Div, Header, Heading4, Heading6, Section, Text } from "fictoan-react";

// LIB =================================================================================================================
import { MenuOrder } from "@/lib/api/catalogue";
import { describe, useMenu } from "@/lib/api/use-menu";
import { MenuItem } from "@/lib/dbie-menu";
import { sentenceCase } from "@/lib/tables/titles";

interface SectorListPageProps {
    id         : string;         // the Article's id: publications-page, statistics-page
    menuKey    : string;         // the catalogue's key for the menu: publication, statistics
    base       : string;         // the section's route: /publications, /statistics
    title      : string;
    subtitle   : string;
    groupTitle : string;         // DBIE's name for what the items sit under
    items      : MenuItem[];     // DBIE's names, in DBIE's order
    order    ? : MenuOrder;      // DBIE's own order of sectors and sections
}

export const SectorListPage = ({ id, menuKey, base, title, subtitle, groupTitle, items, order = {} } : SectorListPageProps) => {
    const { sectors } = useMenu(menuKey, order);
    const bySlug = useMemo(() => new Map((sectors ?? []).map(s => [ s.slug, s ])), [ sectors ]);

    return (
        <Article id={id} className="data-list-page">
            <Header id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        {title}
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        {subtitle}
                    </Heading6>
                </Div>
            </Header>

            <Div id="sections-wrapper">
                <Section marginBottom="nano">
                    <Div className="grid-cell section-header" padding="micro">
                        <Heading6 weight="700" className="section-title">
                            {sentenceCase(groupTitle)}
                        </Heading6>
                    </Div>

                    <Div className="section-content">
                        {items.map(item => {
                            const sector = bySlug.get(item.slug);
                            return (
                                <Div className="grid-cell" key={item.slug} padding="micro">
                                    <Link href={`${base}/${item.slug}`}>
                                        <Text weight="600">{sentenceCase(item.label)}</Text>

                                        {sector && (
                                            <Text size="small" opacity="80" weight="400">
                                                {describe(sector)}
                                            </Text>
                                        )}
                                    </Link>
                                </Div>
                            );
                        })}
                    </Div>
                </Section>
            </Div>
        </Article>
    );
};

export default SectorListPage;

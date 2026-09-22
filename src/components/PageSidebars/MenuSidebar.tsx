"use client";

// The sidebar of a section of the site built on one of DBIE's menus: the dashboard is the section's list page, then
// DBIE's own items in DBIE's order, each at <base>/<slug> — the time-series publications of /publications, the eight
// sectors of /statistics. Names are shortened the way the tables page shortens titles (BSR, SCBs, RRBs); the full
// name is the tooltip.

// REACT CORE ==========================================================================================================
import { ReactNode } from "react";

// UI ==================================================================================================================
import { LayoutDashboard } from "lucide-react";
import { Divider } from "fictoan-react";

// LIB =================================================================================================================
import { MenuItem } from "@/lib/dbie-menu";
import { sentenceCase, shortTitle } from "@/lib/tables/titles";

// OTHER ===============================================================================================================
import { PageSidebar, LinkGroup, LinkItem } from "./PageSidebar";

interface MenuSidebarProps {
    id          : string;
    headerIcon  : ReactNode;
    headerLabel : string;
    groupTitle  : string;      // DBIE's name for what the items sit under
    itemIcon    : ReactNode;
    base        : string;      // the section's route: /publications, /statistics
    items       : MenuItem[];  // DBIE's names, in DBIE's order
}

export const MenuSidebar = ({ id, headerIcon, headerLabel, groupTitle, itemIcon, base, items } : MenuSidebarProps) => {
    return (
        <PageSidebar
            id={id}
            headerIcon={headerIcon}
            headerLabel={headerLabel}
        >
            <LinkGroup>
                <LinkItem
                    icon={<LayoutDashboard />}
                    linkTo={base}
                    label="Dashboard"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title={sentenceCase(groupTitle)}>
                {items.map(item => (
                    <LinkItem
                        key={item.slug}
                        icon={itemIcon}
                        linkTo={`${base}/${item.slug}`}
                        label={shortTitle(item.label)}
                        title={sentenceCase(item.label)}
                    />
                ))}
            </LinkGroup>
        </PageSidebar>
    );
};

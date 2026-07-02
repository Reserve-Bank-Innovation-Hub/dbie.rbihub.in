"use client";

// UI ==================================================================================================================
import { Database, FileUser, LayoutDashboard, FileText, Info } from "lucide-react";
import { Divider } from "fictoan-react";

// OTHER ===============================================================================================================
import { PageSidebar, LinkGroup, LinkItem } from "./PageSidebar";

export const UnitLevelDataSidebar = () => {
    return (
        <PageSidebar
            id="unit-level-data-sidebar"
            headerIcon={<FileUser />}
            headerLabel="Unit-level data"
        >
            <LinkGroup>
                <LinkItem
                    icon={<LayoutDashboard />}
                    linkTo="/unit-level-data"
                    label="Dashboard"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Inflation Expectations Survey of Household (IESH)">
                <LinkItem
                    icon={<Database />}
                    linkTo="/unit-level-data/iesh/unit-level-data"
                    label="Bi-monthly, Sep 2008–Sep 2025"
                />
                <LinkItem
                    icon={<Info />}
                    linkTo="/unit-level-data/iesh/metadata"
                    label="Metadata"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Rural Consumer Confidence Survey (RCCS)">
                <LinkItem
                    icon={<Database />}
                    linkTo="/unit-level-data/rccs/unit-level-data"
                    label="Bi-monthly, Sep 2023–Jul 2025"
                />
                <LinkItem
                    icon={<Info />}
                    linkTo="/unit-level-data/rccs/metadata"
                    label="Metadata"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Survey of Professional Forecasters (SPF)">
                <LinkItem
                    icon={<Database />}
                    linkTo="/unit-level-data/spf/individual-level-data"
                    label="Bi-monthly, Nov 2019–Sep 2025"
                />
                <LinkItem
                    icon={<Info />}
                    linkTo="/unit-level-data/spf/metadata"
                    label="Metadata"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Urban Consumer Confidence Survey (UCCS)">
                <LinkItem
                    icon={<Database />}
                    linkTo="/unit-level-data/uccs/unit-level-data-bimonthly"
                    label="Bi-monthly, Mar 2015–Sep 2025"
                />
                <LinkItem
                    icon={<Database />}
                    linkTo="/unit-level-data/uccs/unit-level-data-quarterly"
                    label="Quarterly, Sep 2012–Dec 2014"
                />
                <LinkItem
                    icon={<Info />}
                    linkTo="/unit-level-data/uccs/metadata"
                    label="Metadata"
                />
                <LinkItem
                    icon={<Info />}
                    linkTo="/unit-level-data/uccs/metadata-2012-2014"
                    label="Metadata, Sep 2012–Dec 2014"
                />
            </LinkGroup>
        </PageSidebar>
    );
};

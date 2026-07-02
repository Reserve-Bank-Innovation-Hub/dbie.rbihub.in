"use client";

// UI ==================================================================================================================
import { Factory, LayoutDashboard, TrendingUp } from "lucide-react";
import { Divider } from "fictoan-react";

// OTHER ===============================================================================================================
import { PageSidebar, LinkGroup, LinkItem } from "./PageSidebar";

export const GrowthSidebar = () => {
    return (
        <PageSidebar
            id="growth-sidebar"
            headerIcon={<TrendingUp />}
            headerLabel="Growth"
        >
            <LinkGroup>
                <LinkItem
                    icon={<LayoutDashboard />}
                    linkTo="/growth"
                    label="Dashboard"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Monthly RBI Bulletin">
                <LinkItem
                    icon={<Factory />}
                    linkTo="/growth/index-of-industrial-production"
                    label="Index of industrial production"
                />
            </LinkGroup>
        </PageSidebar>
    );
};

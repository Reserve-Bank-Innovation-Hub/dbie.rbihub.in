"use client";

// UI ==================================================================================================================
import { Divider } from "fictoan-react";
import { Building2, LayoutDashboard, ArrowRightLeft, Banknote } from "lucide-react";

// OTHER ===============================================================================================================
import { PageSidebar, LinkGroup, LinkItem } from "./PageSidebar";

export const IndicatorsSidebar = () => {
    return (
        <PageSidebar
            id="bfs-sidebar"
            headerIcon={<Building2 />}
            headerLabel="Indicators"
        >
            <LinkGroup>
                <LinkItem
                    icon={<LayoutDashboard />}
                    linkTo="/indicators"
                    label="Dashboard"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="External Sector">
                <LinkItem
                    icon={<ArrowRightLeft />}
                    linkTo="/indicators/exchange-rates"
                    label="Exchange rates"
                />
                <LinkItem
                    icon={<Banknote />}
                    linkTo="/indicators/forex-reserves"
                    label="Forex reserves"
                />
            </LinkGroup>
        </PageSidebar>
    );
};

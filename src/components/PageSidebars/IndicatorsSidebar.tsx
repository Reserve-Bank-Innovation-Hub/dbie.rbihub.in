"use client";

// UI ==================================================================================================================
import { Divider } from "fictoan-react";
import { FlagTriangleLeft, LayoutDashboard, Table2 } from "lucide-react";

// OTHER ===============================================================================================================
import { PageSidebar, LinkGroup, LinkItem } from "./PageSidebar";

export const IndicatorsSidebar = () => {
    return (
        <PageSidebar
            id="indicators-sidebar"
            headerIcon={<FlagTriangleLeft />}
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

            <LinkGroup title="External sector">
                <LinkItem
                    icon={<Table2 />}
                    linkTo="/indicators/exchange-rates"
                    label="Exchange rates"
                />
                <LinkItem
                    icon={<Table2 />}
                    linkTo="/indicators/forex-reserves"
                    label="Forex reserves"
                />
            </LinkGroup>
        </PageSidebar>
    );
};

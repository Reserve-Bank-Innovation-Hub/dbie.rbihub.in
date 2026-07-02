"use client";

// UI ==================================================================================================================
import { Divider } from "fictoan-react";
import { ScrollText, Building2, Megaphone, LayoutDashboard, BookUser, Handshake, GraduationCap, Calendar, Sprout, MessagesSquare, Braces, Building, Users, ArrowRightLeft, Banknote, Landmark, HandCoins, Percent, TableProperties } from "lucide-react";

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

            <Divider />

            <LinkGroup title="Financial Sector">
                <LinkItem
                    icon={<Landmark />}
                    linkTo="/indicators/business-of-scheduled-banks"
                    label="Business of scheduled banks"
                />
                <LinkItem
                    icon={<HandCoins />}
                    linkTo="/indicators/daily-laf-operation"
                    label="Daily LAF operation"
                />
                <LinkItem
                    icon={<Percent />}
                    linkTo="/indicators/central-govt-market-borrowings"
                    label="Central govt market borrowings"
                />
                <LinkItem
                    icon={<Banknote />}
                    linkTo="/indicators/reserve-money"
                    label="Reserve money"
                />
                <LinkItem
                    icon={<Building />}
                    linkTo="/indicators/payment-system-indicators"
                    label="Payment system indicators"
                />
                <LinkItem
                    icon={<TableProperties />}
                    linkTo="/indicators/rbi-balance-sheet"
                    label="RBI balance sheet"
                />
                <LinkItem
                    icon={<Percent />}
                    linkTo="/indicators/key-rates"
                    label="Key rates"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="G-Sec market">
                <LinkItem
                    icon={<Building />}
                    linkTo="/indicators/g-sec-turnover"
                    label="G-Sec turnover"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Money market">
                <LinkItem
                    icon={<Building />}
                    linkTo="/indicators/money-market"
                    label="Money market"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Real Sector">
                <LinkItem
                    icon={<Building />}
                    linkTo="/indicators/gross-value-added"
                    label="GVA at basic prices"
                />
                <LinkItem
                    icon={<Building />}
                    linkTo="/indicators/index-of-industrial-production"
                    label="Index of industrial production (IIP)"
                />
                <LinkItem
                    icon={<Building />}
                    linkTo="/indicators/consumer-price-index"
                    label="Consumer price index (CPI)"
                />
            </LinkGroup>
        </PageSidebar>
    );
};

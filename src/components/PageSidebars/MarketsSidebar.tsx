"use client";

// UI ==================================================================================================================
import { Banknote, FileStack, LayoutDashboard, LineChart, Receipt, Repeat, TrendingUpDown } from "lucide-react";
import { Divider } from "fictoan-react";

// OTHER ===============================================================================================================
import { PageSidebar, LinkGroup, LinkItem } from "./PageSidebar";

export const MarketsSidebar = () => {
    return (
        <PageSidebar
            id="markets-sidebar"
            headerIcon={<LineChart />}
            headerLabel="Markets"
        >
            <LinkGroup>
                <LinkItem
                    icon={<LayoutDashboard />}
                    linkTo="/markets"
                    label="Dashboard"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Monthly RBI Bulletin">
                <LinkItem
                    icon={<TrendingUpDown />}
                    linkTo="/markets/daily-call-money-rates"
                    label="Daily call money rates"
                />

                <LinkItem
                    icon={<Receipt />}
                    linkTo="/markets/certificates-of-deposit"
                    label="Certificates of deposit"
                />

                <LinkItem
                    icon={<FileStack />}
                    linkTo="/markets/commercial-paper"
                    label="Commercial paper"
                />

                <LinkItem
                    icon={<Repeat />}
                    linkTo="/markets/financial-markets-turnover"
                    label="Financial markets turnover"
                />

                <LinkItem
                    icon={<Banknote />}
                    linkTo="/markets/new-capital-issues"
                    label="New capital issues"
                />
            </LinkGroup>
        </PageSidebar>
    );
};

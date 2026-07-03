"use client";

// UI ==================================================================================================================
import { Building2, Gavel, LayoutDashboard, PieChart, Table2, Wallet } from "lucide-react";
import { Divider } from "fictoan-react";

// OTHER ===============================================================================================================
import { PageSidebar, LinkGroup, LinkItem } from "./PageSidebar";

export const GovernmentSidebar = () => {
    return (
        <PageSidebar
            id="government-sidebar"
            headerIcon={<Building2 />}
            headerLabel="Government"
        >
            <LinkGroup>
                <LinkItem
                    icon={<LayoutDashboard />}
                    linkTo="/government"
                    label="Dashboard"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Monthly RBI Bulletin">
                <LinkItem
                    icon={<Wallet />}
                    linkTo="/government/union-government-accounts"
                    label="Union government accounts"
                />

                <LinkItem
                    icon={<PieChart />}
                    linkTo="/government/treasury-bills-ownership"
                    label="Treasury bills ownership"
                />

                <LinkItem
                    icon={<Gavel />}
                    linkTo="/government/treasury-bill-auctions"
                    label="Treasury bill auctions"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Occasional series">
                <LinkItem
                    icon={<Table2 />}
                    linkTo="/government/dated-securities-ownership"
                    label="Dated securities ownership"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/government/combined-receipts-disbursements"
                    label="Combined receipts and disbursements"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/government/state-financial-accommodation"
                    label="State financial accommodation"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/government/state-government-investments"
                    label="State government investments"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/government/state-market-borrowings"
                    label="State market borrowings"
                />
            </LinkGroup>
        </PageSidebar>
    );
};

"use client";

// UI ==================================================================================================================
import { Landmark, LayoutDashboard, Table2 } from "lucide-react";
import { Divider } from "fictoan-react";

// OTHER ===============================================================================================================
import { PageSidebar, LinkGroup, LinkItem } from "./PageSidebar";

export const BankingSidebar = () => {
    return (
        <PageSidebar
            id="banking-sidebar"
            headerIcon={<Landmark />}
            headerLabel="Banking"
        >
            <LinkGroup>
                <LinkItem
                    icon={<LayoutDashboard />}
                    linkTo="/banking"
                    label="Dashboard"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Monthly RBI Bulletin">
                <LinkItem
                    icon={<Table2 />}
                    linkTo="/banking/money-stock-measures"
                    label="Money stock measures"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/banking/sources-of-money-stock"
                    label="Sources of money stock (M3)"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/banking/monetary-survey"
                    label="Monetary survey"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/banking/liquidity-aggregates"
                    label="Liquidity aggregates"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/banking/rbi-survey"
                    label="RBI survey"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/banking/reserve-money"
                    label="Reserve money"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/banking/commercial-bank-survey"
                    label="Commercial bank survey"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/banking/scb-investments"
                    label="SCB investments"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/banking/business-of-scheduled-banks"
                    label="Business of scheduled banks"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/banking/bank-credit-by-sector"
                    label="Bank credit by sector"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/banking/bank-credit-by-industry"
                    label="Bank credit by industry"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/banking/state-cooperative-banks"
                    label="State co-operative banks"
                />
            </LinkGroup>
        </PageSidebar>
    );
};

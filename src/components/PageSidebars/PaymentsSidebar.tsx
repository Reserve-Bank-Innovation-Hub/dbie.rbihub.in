"use client";

// UI ==================================================================================================================
import { CreditCard, LayoutDashboard, Table2 } from "lucide-react";
import { Divider } from "fictoan-react";

// OTHER ===============================================================================================================
import { PageSidebar, LinkGroup, LinkItem } from "./PageSidebar";

export const PaymentsSidebar = () => {
    return (
        <PageSidebar
            id="payments-sidebar"
            headerIcon={<CreditCard />}
            headerLabel="Payments"
        >
            <LinkGroup>
                <LinkItem
                    icon={<LayoutDashboard />}
                    linkTo="/payments"
                    label="Dashboard"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Monthly RBI Bulletin">
                <LinkItem
                    icon={<Table2 />}
                    linkTo="/payments/payment-system-indicators"
                    label="Payment system indicators"
                />
            </LinkGroup>
        </PageSidebar>
    );
};

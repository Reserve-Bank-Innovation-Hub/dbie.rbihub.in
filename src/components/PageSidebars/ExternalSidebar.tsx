"use client";

// UI ==================================================================================================================
import { Globe, LayoutDashboard, Table2 } from "lucide-react";
import { Divider } from "fictoan-react";

// OTHER ===============================================================================================================
import { PageSidebar, LinkGroup, LinkItem } from "./PageSidebar";

export const ExternalSidebar = () => {
    return (
        <PageSidebar
            id="external-sidebar"
            headerIcon={<Globe />}
            headerLabel="External"
        >
            <LinkGroup>
                <LinkItem
                    icon={<LayoutDashboard />}
                    linkTo="/external"
                    label="Dashboard"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Monthly RBI Bulletin">
                <LinkItem
                    icon={<Table2 />}
                    linkTo="/external/foreign-trade"
                    label="Foreign trade"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/external/forex-reserves-weekly"
                    label="Forex reserves (weekly)"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/external/nri-deposits"
                    label="NRI deposits"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/external/foreign-investment-inflows-bulletin"
                    label="Foreign investment inflows"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/external/outward-remittances-lrs"
                    label="Outward remittances (LRS)"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/external/reer-and-neer"
                    label="REER and NEER"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/external/external-commercial-borrowings"
                    label="External commercial borrowings"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/external/balance-of-payments-usd"
                    label="Balance of payments (US$)"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/external/balance-of-payments-inr"
                    label="Balance of payments (₹)"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/external/bop-bpm6-usd"
                    label="BoP as per BPM6 (US$)"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/external/bop-bpm6-inr"
                    label="BoP as per BPM6 (₹)"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/external/international-investment-position"
                    label="International investment position"
                />
            </LinkGroup>
        </PageSidebar>
    );
};

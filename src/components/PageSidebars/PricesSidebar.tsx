"use client";

// UI ==================================================================================================================
import { Coins, FileDigit, LayoutDashboard, ReceiptIndianRupee, Tags, Warehouse } from "lucide-react";
import { Divider } from "fictoan-react";

// OTHER ===============================================================================================================
import { PageSidebar, LinkGroup, LinkItem } from "./PageSidebar";

export const PricesSidebar = () => {
    return (
        <PageSidebar
            id="prices-sidebar"
            headerIcon={<Tags />}
            headerLabel="Prices"
        >
            <LinkGroup>
                <LinkItem
                    icon={<LayoutDashboard />}
                    linkTo="/prices"
                    label="Dashboard"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Monthly RBI Bulletin">
                <LinkItem
                    icon={<ReceiptIndianRupee />}
                    linkTo="/prices/consumer-price-index"
                    label="Consumer price index"
                />

                <LinkItem
                    icon={<FileDigit />}
                    linkTo="/prices/other-consumer-price-indices"
                    label="Other consumer price indices"
                />

                <LinkItem
                    icon={<Coins />}
                    linkTo="/prices/gold-and-silver-prices"
                    label="Gold and silver prices"
                />

                <LinkItem
                    icon={<Warehouse />}
                    linkTo="/prices/wholesale-price-index"
                    label="Wholesale price index"
                />
            </LinkGroup>
        </PageSidebar>
    );
};

"use client";

// UI ==================================================================================================================
import { BookOpenText, Feather, LayoutDashboard } from "lucide-react";
import { Divider } from "fictoan-react";

// OTHER ===============================================================================================================
import { PageSidebar, LinkGroup, LinkItem } from "./PageSidebar";

export const StoriesSidebar = () => {
    return (
        <PageSidebar
            id="stories-sidebar"
            headerIcon={<Feather />}
            headerLabel="Stories"
        >
            <LinkGroup>
                <LinkItem
                    icon={<LayoutDashboard />}
                    linkTo="/stories"
                    label="Dashboard"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup>
                <LinkItem
                    icon={<BookOpenText />}
                    linkTo="/stories/the-lights-came-on"
                    label="The lights came on"
                />

                <LinkItem
                    icon={<BookOpenText />}
                    linkTo="/stories/debt-to-service-ratio"
                    label="The long walk back from 1991"
                />

                <LinkItem
                    icon={<BookOpenText />}
                    linkTo="/stories/concessional-share-of-total-debt-vs-commercial-borrowings"
                    label="From aid recipient to market borrower"
                />
            </LinkGroup>
        </PageSidebar>
    );
};

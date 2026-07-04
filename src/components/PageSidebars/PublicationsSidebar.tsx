"use client";

// UI ==================================================================================================================
import { LayoutDashboard, Newspaper, Table2 } from "lucide-react";
import { Divider } from "fictoan-react";

// OTHER ===============================================================================================================
import { PageSidebar, LinkGroup, LinkItem } from "./PageSidebar";

export const PublicationsSidebar = () => {
    return (
        <PageSidebar
            id="publications-sidebar"
            headerIcon={<Newspaper />}
            headerLabel="Publications"
        >
            <LinkGroup>
                <LinkItem
                    icon={<LayoutDashboard />}
                    linkTo="/publications"
                    label="Dashboard"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup>
                <LinkItem
                    icon={<Table2 />}
                    linkTo="/publications/abc"
                    label="Outstanding credit of SCBs"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/publications/external-debt"
                    label="External debt"
                />
            </LinkGroup>
        </PageSidebar>
    );
};

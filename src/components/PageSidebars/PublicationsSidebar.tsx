"use client";

// UI ==================================================================================================================
import { BookOpen, LayoutDashboard, Newspaper } from "lucide-react";
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
                    icon={<BookOpen />}
                    linkTo="/publications/abc"
                    label="Outstanding credit of SCBs"
                />

                <LinkItem
                    icon={<BookOpen />}
                    linkTo="/publications/external-debt"
                    label="External debt"
                />
            </LinkGroup>
        </PageSidebar>
    );
};

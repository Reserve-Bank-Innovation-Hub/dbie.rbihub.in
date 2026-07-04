"use client";

// UI ==================================================================================================================
import { BookMarked, Bot, Compass, LayoutDashboard, Pickaxe } from "lucide-react";
import { Divider } from "fictoan-react";

// OTHER ===============================================================================================================
import { PageSidebar, LinkGroup, LinkItem } from "./PageSidebar";

export const DocsSidebar = () => {
    return (
        <PageSidebar
            id="docs-sidebar"
            headerIcon={<BookMarked />}
            headerLabel="Docs"
        >
            <LinkGroup>
                <LinkItem
                    icon={<LayoutDashboard />}
                    linkTo="/docs"
                    label="Overview"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup>
                <LinkItem
                    icon={<Compass />}
                    linkTo="/docs/using-the-site"
                    label="Using the site"
                />

                <LinkItem
                    icon={<Bot />}
                    linkTo="/docs/mcp"
                    label="AI access via MCP"
                />

                <LinkItem
                    icon={<Pickaxe />}
                    linkTo="/docs/how-to-scrape"
                    label="How to scrape"
                />
            </LinkGroup>
        </PageSidebar>
    );
};

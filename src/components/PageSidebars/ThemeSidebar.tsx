"use client";

// The sidebar of a theme — Banking, Prices and the rest: the dashboard is the theme's own page, then every table
// the theme covers under the DBIE section it belongs to (src/lib/api/use-menu.ts gathers them from the data API's
// catalogue in the browser). A table's link opens it in place on the theme's page; the item is highlighted there,
// and on the site's curated page for that table too, which is a route of its own. The dashboard is the theme's
// page with no table asked for.

// REACT CORE ==========================================================================================================
import React, { ReactNode, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// UI ==================================================================================================================
import { LayoutDashboard, Table2 } from "lucide-react";
import { Divider } from "fictoan-react";

// LIB =================================================================================================================
import { curatedKeys, tableKey } from "@/lib/api/catalogue";
import { themeKeys, useTheme } from "@/lib/api/use-menu";
import { sentenceCase, shortTitle } from "@/lib/tables/titles";

// OTHER ===============================================================================================================
import { PageSidebar, LinkGroup, LinkItem } from "./PageSidebar";

interface ThemeSidebarProps {
    id          : string;
    headerIcon  : ReactNode;
    headerLabel : string;
    path        : string;                    // the theme's route: /banking
    curated     : Record<string, string>;    // "report:<id>" or "dsd:<code>" → the site's curated page
}

export const ThemeSidebar = ({ id, headerIcon, headerLabel, path, curated } : ThemeSidebarProps) => {
    const pathname     = usePathname();
    const searchParams = useSearchParams();
    const requested    = searchParams.get("table");

    const keys = useMemo(() => themeKeys(curated, path), [ curated, path ]);
    const { sector } = useTheme(keys, headerLabel, path);

    return (
        <PageSidebar
            id={id}
            headerIcon={headerIcon}
            headerLabel={headerLabel}
        >
            <LinkGroup>
                <LinkItem
                    icon={<LayoutDashboard />}
                    linkTo={path}
                    label="Dashboard"
                    isActive={pathname === path && !requested}
                />
            </LinkGroup>

            {/* THE THEME'S TABLES, UNDER DBIE'S OWN SECTIONS ////////////////////////////////////////////////////// */}
            {sector?.sections.map(section => (
                <React.Fragment key={section.slug}>
                    <Divider />

                    <LinkGroup title={sentenceCase(section.label)}>
                        {section.entries.map(entry => {
                            const key   = tableKey(entry)!;
                            const route = curatedKeys(entry).map(k => curated[k]).find(Boolean);
                            return (
                                <LinkItem
                                    key={entry.entry_id}
                                    icon={<Table2 />}
                                    label={shortTitle(entry.title)}
                                    title={sentenceCase(entry.title)}
                                    linkTo={`${path}?table=${key}`}
                                    isActive={(pathname === path && requested === key) || pathname === route}
                                />
                            );
                        })}
                    </LinkGroup>
                </React.Fragment>
            ))}
        </PageSidebar>
    );
};

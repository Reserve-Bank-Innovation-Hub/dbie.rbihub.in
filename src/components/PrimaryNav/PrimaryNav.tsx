"use client";

// REACT CORE ==========================================================================================================
import Link from "next/link";
import React, { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// UI ==================================================================================================================
import { Aside, Div, Text } from "fictoan-react";
import {
    BookMarked,
    BookOpen,
    Building2,
    CreditCard,
    Feather,
    FlagTriangleLeft,
    Globe,
    Landmark,
    LineChart,
    Newspaper,
    Search,
    Table2,
    Tags,
    TrendingUp,
} from "lucide-react";

// LOCAL COMPONENTS ====================================================================================================
import { SiteSearch } from "@components/SiteSearch/SiteSearch";

// STYLES ==============================================================================================================
import "./primary-nav.css";

// NAV ITEM ////////////////////////////////////////////////////////////////////////////////////////////////////////////
interface NavItemProps {
    icon : ReactNode;
    label : string;
    linkTo? : string;
    isLogo? : boolean;
    onClick? : () => void;
}

export const NavItem = ({icon, label, linkTo, isLogo, onClick} : NavItemProps) => {
    const pathname = usePathname();

    // For home ("/"), use exact match. For others, use startsWith to match subroutes
    const isActive = linkTo
        ? linkTo === "/"
            ? pathname === "/"
            : pathname.startsWith(linkTo)
        : false;

    const content = (
        <Div className="nav-item">
            <Div className={`nav-icon ${isLogo ? "is-logo" : ""}`}>
                {icon}
            </Div>

            <Div className="nav-label">
                <Text weight="600">{label}</Text>
            </Div>
        </Div>
    );

    // Action items (no route) render as a button-like div instead of a Link
    if (!linkTo && onClick) {
        return (
            <Div className="link" onClick={onClick} role="button" tabIndex={0}>
                {content}
            </Div>
        );
    }

    return (
        <Link href={linkTo || "#"} className={`link ${isActive ? "active" : ""}`}>
            {content}
        </Link>
    );
};

// NAV GROUP ///////////////////////////////////////////////////////////////////////////////////////////////////////////
interface NavGroupProps {
    children : ReactNode;
}

export const NavGroup = ({children} : NavGroupProps) => {
    return <Div className="links-group">{children}</Div>;
};

// PRIMARY NAV /////////////////////////////////////////////////////////////////////////////////////////////////////////
export const PrimaryNav = () => {
    const [ isSearchOpen, setIsSearchOpen ] = useState(false);

    // Cmd+/ (or Ctrl+/) opens search from anywhere
    useEffect(() => {
        const handleShortcut = (e : KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "/") {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        document.addEventListener("keydown", handleShortcut);
        return () => document.removeEventListener("keydown", handleShortcut);
    }, []);

    return (
        <Aside id="primary-nav">
            <NavGroup>
                <NavItem
                    icon={<img src="/images/rbi-seal.svg" alt="" />}
                    linkTo="/"
                    label="RBI DBIE"
                />
            </NavGroup>

            <NavGroup>
                <NavItem
                    icon={<Search />}
                    label="Search"
                    onClick={() => setIsSearchOpen(true)}
                />
            </NavGroup>

            <NavGroup>
                <NavItem
                    icon={<FlagTriangleLeft />}
                    linkTo="/indicators"
                    label="Indicators"
                />

                <NavItem
                    icon={<Newspaper />}
                    linkTo="/publications"
                    label="Publications"
                />

                <NavItem
                    icon={<BookOpen />}
                    linkTo="/handbook"
                    label="Handbook"
                />

                <NavItem
                    icon={<Tags />}
                    linkTo="/prices"
                    label="Prices"
                />

                <NavItem
                    icon={<TrendingUp />}
                    linkTo="/growth"
                    label="Growth"
                />

                <NavItem
                    icon={<LineChart />}
                    linkTo="/markets"
                    label="Markets"
                />

                <NavItem
                    icon={<Landmark />}
                    linkTo="/banking"
                    label="Banking"
                />

                <NavItem
                    icon={<Globe />}
                    linkTo="/external"
                    label="External"
                />

                <NavItem
                    icon={<Building2 />}
                    linkTo="/government"
                    label="Government"
                />

                <NavItem
                    icon={<CreditCard />}
                    linkTo="/payments"
                    label="Payments"
                />

            </NavGroup>

            <NavGroup>
                <NavItem
                    icon={<Feather />}
                    linkTo="/stories"
                    label="Stories"
                />
            </NavGroup>

            <NavGroup>
                <NavItem
                    icon={<BookMarked />}
                    linkTo="/docs"
                    label="Docs"
                />


                <NavItem
                    icon={<Table2 />}
                    linkTo="/tables"
                    label="Tables"
                />
            </NavGroup>

            <SiteSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </Aside>
    );
};

"use client";

// REACT CORE ==========================================================================================================
import Link from "next/link";
import React, { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// UI ==================================================================================================================
import { Aside, Div, Divider, Main, Text, useTheme } from "fictoan-react";
import {
    Building2,
    ChartColumn,
    CreditCard,
    Feather,
    Globe,
    Landmark,
    LineChart,
    Moon,
    Newspaper,
    Search,
    Sun,
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
    label : ReactNode;
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
        const onKeyDown = (e : React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
            }
        };
        return (
            <Div className="link" onClick={onClick} onKeyDown={onKeyDown} role="button" tabIndex={0}>
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
// A title names a group the way the page sidebar's link groups are named; it shows only when the rail is expanded,
// but its space is kept in both states so the rail does not jump.
interface NavGroupProps {
    title  ? : string;
    children : ReactNode;
}

export const NavGroup = ({title, children} : NavGroupProps) => {
    return (
        <Div className="links-group">
            {title && <Text className="group-title">{title}</Text>}
            {children}
        </Div>
    );
};

// PRIMARY NAV /////////////////////////////////////////////////////////////////////////////////////////////////////////
export const PrimaryNav = () => {
    const [ isSearchOpen, setIsSearchOpen ] = useState(false);
    const [ , setTheme ] = useTheme();

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
            <Div id="primary-nav-wrapper" className="shadow-soft">
                <NavGroup>
                    <NavItem
                        icon={<img src="/images/rbi-seal.svg" alt="" />}
                        linkTo="/"
                        label="RBI DBIE"
                        isLogo
                    />
                </NavGroup>

                <Main>
                    <NavGroup>
                        <NavItem
                            icon={<Search />}
                            label="Search"
                            onClick={() => setIsSearchOpen(true)}
                        />
                    </NavGroup>

                    <Divider />

                    <NavGroup title="Database">
                        <NavItem
                            icon={<ChartColumn />}
                            linkTo="/statistics"
                            label="Statistics"
                        />

                        <NavItem
                            icon={<Newspaper />}
                            linkTo="/publications"
                            label="Publications"
                        />
                    </NavGroup>

                    <Divider />

                    <NavGroup title="Themes">
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

                    <Divider />

                    <NavGroup>
                        <NavItem
                            icon={<Feather />}
                            linkTo="/stories"
                            label="Stories"
                        />
                    </NavGroup>
                </Main>

                {/* The theme toggle, where the Docs and Tables links were. fictoan's ThemeProvider keeps the theme as
                    a class on <html> and in localStorage; the toggle flips between the two the provider lists
                    (layout.client.tsx). Both icons and both labels are in the DOM and the theme class shows one of
                    each (primary-nav.css), so the server, which knows no stored theme, and the browser, which does,
                    render the same markup and nothing is patched at hydration. */}
                <NavGroup>
                    <NavItem
                        icon={<><Moon className="in-light-theme" /><Sun className="in-dark-theme" /></>}
                        label={<><span className="in-light-theme">Dark theme</span><span className="in-dark-theme">Light theme</span></>}
                        onClick={() => setTheme(current => (current === "theme-dark" ? "theme-light" : "theme-dark"))}
                    />
                </NavGroup>

                <SiteSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            </Div>
        </Aside>
    );
};

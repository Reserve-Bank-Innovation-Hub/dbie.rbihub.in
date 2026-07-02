"use client";

// REACT CORE ==========================================================================================================
import Link from "next/link";
import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";

// UI ==================================================================================================================
import { Aside, Div, Text } from "fictoan-react";
import { FlagTriangleLeft, Newspaper, Table2 } from "lucide-react";

// ASSETS ==============================================================================================================
import RBISeal from "@assets/images/logos/rbi-seal.svg";

// STYLES ==============================================================================================================
import "./primary-nav.css";

// NAV ITEM ////////////////////////////////////////////////////////////////////////////////////////////////////////////
interface NavItemProps {
    icon     : ReactNode;
    label    : string;
    linkTo ? : string;
    isLogo ? : boolean;
}

export const NavItem = ({ icon, label, linkTo, isLogo }: NavItemProps) => {
    const pathname = usePathname();

    // For home ("/"), use exact match. For others, use startsWith to match subroutes
    const isActive = linkTo
        ? linkTo === "/"
            ? pathname === "/"
            : pathname.startsWith(linkTo)
        : false;

    return (
        <Link href={linkTo || "#"} className={`link ${isActive ? "active" : ""}`}>
            <Div className="nav-item">
                <Div className={`nav-icon ${isLogo ? "is-logo" : ""}`}>
                    {icon}
                </Div>

                <Div className="nav-label">
                    <Text weight="600">{label}</Text>
                </Div>
            </Div>
        </Link>
    );
};

// NAV GROUP ///////////////////////////////////////////////////////////////////////////////////////////////////////////
interface NavGroupProps {
    children : ReactNode;
}

export const NavGroup = ({ children }: NavGroupProps) => {
    return <Div className="links-group">{children}</Div>;
};

// PRIMARY NAV /////////////////////////////////////////////////////////////////////////////////////////////////////////
export const PrimaryNav = () => {
    return (
        <Aside id="primary-nav">
            <NavGroup>
                <NavItem
                    icon={<RBISeal />}
                    linkTo="/"
                    label="RBI DBIE"
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
                    icon={<Table2 />}
                    linkTo="/tables"
                    label="Tables"
                />
            </NavGroup>
        </Aside>
    );
};

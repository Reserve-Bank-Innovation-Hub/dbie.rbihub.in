// REACT CORE ==========================================================================================================
import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

// UI ==================================================================================================================
import { Aside, Div, Header, Text } from "fictoan-react";

// STYLES ==============================================================================================================
import "./page-sidebar.css";

// LINK ITEM ///////////////////////////////////////////////////////////////////////////////////////////////////////////
interface LinkItemProps {
    icon       : ReactNode;
    label      : string;
    linkTo     : string;
    isActive ? : boolean;   // an item is active when the path matches; links that differ by query string say so themselves
    title    ? : string;    // the tooltip, for a label that is a short form of the name
}

export const LinkItem = ({ icon, label, linkTo, isActive, title }: LinkItemProps) => {
    const pathname = usePathname();
    const active   = isActive ?? pathname === linkTo;

    return (
        <Link
            href={linkTo}
            className={`link-item ${active ? "active" : ""}`}
            title={title}
        >
            {icon}
            <Text>{label}</Text>
        </Link>
    );
};

// LINK GROUP //////////////////////////////////////////////////////////////////////////////////////////////////////////
interface LinkGroupProps {
    title    ? : string;
    children   : ReactNode;
}

export const LinkGroup = ({ title, children }: LinkGroupProps) => {
    return (
        <Div className="links-group">
            {title && <Text className="group-title">{title}</Text>}
            {children}
        </Div>
    );
};

// PAGE SIDEBAR ////////////////////////////////////////////////////////////////////////////////////////////////////////
interface PageSidebarProps {
    id          : string;
    headerIcon  : ReactNode;
    headerLabel : string;
    children    : ReactNode;
}

export const PageSidebar = ({ id, headerIcon, headerLabel, children }: PageSidebarProps) => {
    return (
        <Aside id={id} className="page-sidebar">
            <Header id="sidebar-header">
                {headerIcon}
                <Text weight="600">{headerLabel}</Text>
            </Header>
            {children}
        </Aside>
    );
};
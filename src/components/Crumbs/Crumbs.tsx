"use client";

// The trail above a table's heading: each step a link to the page and the anchor where that level is drawn, or plain
// text where the site has none. The table itself is the heading, so it is not in the trail.

// REACT CORE ==========================================================================================================
import Link from "next/link";

// UI ==================================================================================================================
import { Breadcrumbs } from "fictoan-react";

// STYLES ==============================================================================================================
import "./crumbs.css";

// One step of the trail: a link where the site has a page or an anchor for that level; the tooltip carries a name
// the label shortens.
export interface Crumb {
    label   : string;
    href  ? : string;
    title ? : string;
}

export const Crumbs = ({ crumbs } : { crumbs : Crumb[] }) => {
    if (crumbs.length === 0) return null;

    return (
        <Breadcrumbs separator="›" marginBottom="nano" className="table-crumbs">
            {crumbs.map((crumb, i) => (crumb.href
                ? <Link key={i} href={crumb.href} title={crumb.title}>{crumb.label}</Link>
                : <span key={i} title={crumb.title}>{crumb.label}</span>))}
        </Breadcrumbs>
    );
};

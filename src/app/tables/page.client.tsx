"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Div, Heading4, Heading6, Text, Row, Portion, Card, Badge } from "fictoan-react";

// STYLES ==============================================================================================================
import "./tables-page.css";

export interface TableGroup {
    sector    : string;
    subGroups : {
        subSector : string;
        tables    : { label : string; frequency : string; linkTo ? : string }[];
    }[];
}

interface TablesPageProps {
    groups    : TableGroup[];
    total     : number;
    liveCount : number;
}

const TablesPage = ({ groups, total, liveCount } : TablesPageProps) => {
    return (
        <Article id="tables-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="title-card"
                bgColour="white"
                padding="micro"
            >
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Tables
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        All {total} data tables on the platform, grouped by sector — {liveCount} live so far.
                    </Heading6>
                </Div>
            </Div>

            {/* LIST /////////////////////////////////////////////////////////////////////////////////////////////// */}
            {groups.map(group => (
                <Div key={group.sector} className="sector-group" marginBottom="micro">
                    <Heading6 weight="700" marginBottom="nano">
                        {group.sector}
                    </Heading6>

                    {group.subGroups.map(subGroup => (
                        <Card
                            key={subGroup.subSector || group.sector}
                            className="sub-sector-card"
                            padding="micro"
                            marginBottom="nano"
                        >
                            {subGroup.subSector && (
                                <Text weight="600" marginBottom="nano">
                                    {subGroup.subSector}
                                </Text>
                            )}

                            <ul className="table-list">
                                {subGroup.tables.map(table => (
                                    <li key={`${subGroup.subSector}-${table.label}-${table.frequency}`}>
                                        <Row marginBottom="none">
                                            <Portion desktopSpan="two-third" mobileSpan="whole">
                                                {table.linkTo ? (
                                                    <Link href={table.linkTo} className="table-link">
                                                        <Text weight="400">
                                                            {table.label}
                                                            {" "}
                                                        </Text>
                                                    </Link>
                                                ) : (
                                                    <Text>{table.label}</Text>
                                                )}
                                            </Portion>

                                            <Portion desktopSpan="one-third" mobileSpan="whole">
                                                <Text>{table.frequency}</Text>
                                            </Portion>
                                        </Row>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    ))}
                </Div>
            ))}
        </Article>
    );
};

export default TablesPage;

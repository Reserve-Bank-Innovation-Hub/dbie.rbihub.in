"use client";

// REACT CORE ==========================================================================================================
import Link from "next/link";
import React from "react";

// UI ==================================================================================================================
import { Text, Header, Div, Card, Footer } from "fictoan-react";

// ASSETS ==============================================================================================================
import RBISeal from "@assets/images/logos/rbi-seal.svg";

// STYLES ==============================================================================================================
import "./site-header.css";

export const SiteHeader = () => {
    return (
        <Header
            id="site-header"
            verticallyCentreItems
            pushItemsToEnds
            horizontalPadding="nano"
        >
            <Link href="/">
                <Div verticallyCentreItems>
                    <RBISeal id="rbi-seal" width="32px" />
                    <Text marginLeft="nano" className="font-anek">RBI</Text>
                </Div>
            </Link>
        </Header>
    );
};

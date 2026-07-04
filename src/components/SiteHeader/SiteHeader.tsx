"use client";

// REACT CORE ==========================================================================================================
import Link from "next/link";
import React from "react";

// UI ==================================================================================================================
import { Text, Header, Div, Card, Footer } from "fictoan-react";

// ASSETS ==============================================================================================================

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
                    <img id="rbi-seal" src="/images/rbi-seal.svg" alt="RBI seal" width="32" />
                    <Text marginLeft="nano" className="font-anek">RBI</Text>
                </Div>
            </Link>
        </Header>
    );
};

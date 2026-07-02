"use client";

// FRAMEWORK ===========================================================================================================
import Link from "next/link";
import React, { useState, useEffect } from "react";

// FICTOAN =============================================================================================================
import {
    Article,
    Portion,
    Row, Heading5,
} from "fictoan-react";

// STYLES ==============================================================================================================
import "./page-template.css";

const PageTemplate = () => {
    return (
        <Article id="page-template" paddingTop="small">
            <Row horizontalPadding="large">
                <Portion>
                    <Heading5>Page title</Heading5>
                </Portion>
            </Row>
        </Article>
    );
};

export default PageTemplate;

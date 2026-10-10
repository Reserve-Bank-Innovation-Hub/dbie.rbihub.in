"use client";

// REACT CORE ==========================================================================================================
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading1, Heading4, Text } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";

// DATA ================================================================================================================
import { HEADLINE, MACHINES, PAY_MONTHS, USERS } from "./data.gen";

// STYLES ==============================================================================================================
import "./cash-didnt-die.css";

// The stages load only in the browser and only on this story (three.js with them).
const TitleStage = dynamic(() => import("./CashStage").then(m => m.TitleStage), {
    ssr     : false,
    loading : () => <div className="cash-stage is-title is-loading" aria-hidden="true" />,
});
const GridsStage = dynamic(() => import("./CashStage").then(m => m.GridsStage), {
    ssr     : false,
    loading : () => <div className="grids is-loading" aria-hidden="true" />,
});
const RainStage = dynamic(() => import("./CashStage").then(m => m.RainStage), {
    ssr     : false,
    loading : () => <div className="cash-stage is-rain is-loading" aria-hidden="true" />,
});

const lakhCrore = (crore : number) => (crore / 1e5).toFixed(1);
const monthYear = (ym : string) => new Date(`${ym}-01T00:00:00`).toLocaleString("en-GB", { month : "long", year : "numeric" });
// the month micro-ATMs were most numerous
const MICRO_PEAK = MACHINES.micro.indexOf(Math.max(...MACHINES.micro));
const times = Math.round(HEADLINE.upi.times);
const fmtCr = (v : number) => Math.round(v).toLocaleString("en-IN");

// A prototype of the 3D layer: the title and the rain. The rest of the storyboard follows once the 3D is agreed.
export const CashDidntDiePage = () => (
    <Article id="cash-didnt-die-page">
        <section className="opening is-intro">
            <TitleStage />
            <div className="hero">
                <PageCrumbs />
                <Text className="kicker" weight="600" marginBottom="nano">PAYMENTS</Text>
                <Heading1 className="hero-title" fontStyle="serif" weight="700" marginBottom="micro">
                    Cash didn’t <span>die</span>
                </Heading1>
                <Text className="hero-dek" fontStyle="serif">
                    Indians made {times} times as many UPI payments in July 2026 as in November 2019. Over the same years
                    the cash they hold kept growing: ₹{lakhCrore(HEADLINE.cash.last)} lakh crore in March 2026, against
                    ₹{lakhCrore(HEADLINE.cash.march2016)} lakh crore in March 2016.
                </Text>
            </div>
            <Text className="prototype-note" size="tiny">Prototype · the 3D title, the taps and the machines</Text>
        </section>

        <section className="rain is-split">
            <RainStage>
                <Text className="kicker" weight="600" marginBottom="nano">THE TAPS</Text>
                <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">
                    More people pay by UPI, and each pays more often
                </Heading4>
                <Text fontStyle="serif" marginBottom="micro">
                    About {Math.round(USERS[0])} crore people had UPI in November 2019 and {USERS[USERS.length - 1].toFixed(1)} crore
                    by June 2026. Payments grew faster: from about {HEADLINE.perUser.from.toFixed(0)} a user a month to
                    about {HEADLINE.perUser.to.toFixed(0)}.
                </Text>
            </RainStage>
        </section>

        <section className="rain is-grids">
            <GridsStage view="machines">
                <Text className="kicker" weight="600" marginBottom="nano">THE MACHINES</Text>
                <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">
                    Five times as many micro-ATMs as ATMs, a quarter of the withdrawals
                </Heading4>
                <Text className="grids-dek" fontStyle="serif">
                    “Increase in digitalisation of payments has reduced the customers’ requirement of transacting with
                    ATMs,” the RBI noted in <a href="https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=23639">December 2025</a>.
                    Micro-ATMs peaked at {MACHINES.micro[MICRO_PEAK].toFixed(1)} lakh in {monthYear(PAY_MONTHS[MICRO_PEAK])} and
                    numbered {MACHINES.micro[MACHINES.micro.length - 1].toFixed(1)} lakh by {monthYear(PAY_MONTHS[PAY_MONTHS.length - 1])};
                    the RBI <a href="https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=23813">records the fall</a> but
                    has not said why.
                </Text>
            </GridsStage>
        </section>

        <section className="rain is-grids">
            <GridsStage view="value">
                <Text className="kicker" weight="600" marginBottom="nano">THE CASH</Text>
                <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">
                    Fewer trips to the ATM, more taken out each time
                </Heading4>
            </GridsStage>
        </section>
    </Article>
);

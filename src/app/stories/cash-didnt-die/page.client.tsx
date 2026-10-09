"use client";

// REACT CORE ==========================================================================================================
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading1, Heading4, Text } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";

// DATA ================================================================================================================
import { HEADLINE, USERS } from "./data.gen";

// STYLES ==============================================================================================================
import "./cash-didnt-die.css";

// three.js loads only in the browser and only on this story.
const TitleStage = dynamic(() => import("./CashStage").then(m => m.TitleStage), {
    ssr     : false,
    loading : () => <div className="cash-stage is-title is-loading" aria-hidden="true" />,
});
const MachinesStage = dynamic(() => import("./CashStage").then(m => m.MachinesStage), {
    ssr     : false,
    loading : () => <div className="cash-stage is-machines is-loading" aria-hidden="true" />,
});
const RainStage = dynamic(() => import("./CashStage").then(m => m.RainStage), {
    ssr     : false,
    loading : () => <div className="cash-stage is-rain is-loading" aria-hidden="true" />,
});

const lakhCrore = (crore : number) => (crore / 1e5).toFixed(1);
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

        <section className="rain is-machines">
            <div className="rain-words">
                <Text className="kicker" weight="600" marginBottom="nano">THE MACHINES</Text>
                <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">
                    More cash machines, shorter queues
                </Heading4>
                <Text fontStyle="serif">
                    ATMs barely grew in number, and each is visited less. Micro-ATMs, carried by banking agents, more than
                    tripled; each is used lightly, but together they took {(HEADLINE.micro.to / HEADLINE.micro.from).toFixed(1)} times
                    as many withdrawals in July 2026 as in November 2019.
                </Text>
            </div>
            <MachinesStage />
        </section>
    </Article>
);

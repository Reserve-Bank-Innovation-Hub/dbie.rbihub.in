"use client";

// REACT CORE ==========================================================================================================
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading1, Heading4, Text } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";
import { GuessStep, TideStep } from "./Steps";
import { useSlidePaging } from "./paging";

// DATA ================================================================================================================
import { HEADLINE, MACHINES, PAY_MONTHS, TIDE, TIDE_FYS, USERS } from "./data.gen";

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

const monthYear = (ym : string) => new Date(`${ym}-01T00:00:00`).toLocaleString("en-GB", { month : "long", year : "numeric" });
// the month micro-ATMs were most numerous
// the tide: the ebb year, the decade before it, and the last year it was as low
const EBB_FY = "2016-17", EBB = TIDE_FYS.indexOf(EBB_FY);
const DECADE = TIDE.slice(EBB - 10, EBB);
const LOWER_FY = (() => { for (let k = EBB - 1; k >= 0; k--) if (TIDE[k] <= TIDE[EBB]) return TIDE_FYS[k]; return TIDE_FYS[0]; })();
const MICRO_PEAK = MACHINES.micro.indexOf(Math.max(...MACHINES.micro));
const times = Math.round(HEADLINE.upi.times);
const fmtCr = (v : number) => Math.round(v).toLocaleString("en-IN");

// A prototype of the 3D layer: the title and the rain. The rest of the storyboard follows once the 3D is agreed.
export const CashDidntDiePage = () => {
    useSlidePaging("#cash-didnt-die-page");
    return (
        <Article id="cash-didnt-die-page">
            <section className="opening is-intro" data-slide>
                <TitleStage />
                <div className="hero">
                    <PageCrumbs />
                    <Text className="kicker" weight="600" marginBottom="nano">PAYMENTS</Text>
                    <Heading1 className="hero-title" fontStyle="serif" weight="700" marginBottom="micro">
                        Cash didn’t <span>die</span>
                    </Heading1>
                    <Text className="hero-dek" fontStyle="serif">
                        UPI has changed how India pays: {times} times as many UPI payments in July 2026 as in November 2019.
                        Has it changed how much cash India keeps?
                    </Text>
                </div>
                <Text className="prototype-note" size="tiny">Prototype · in progress</Text>
            </section>

            <section className="rain is-split is-step" data-slide>
                <GuessStep>
                    <Text className="kicker" weight="600" marginBottom="nano">FIRST, A GUESS</Text>
                    <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">
                        UPI now carries over {fmtCr(Math.floor(HEADLINE.upi.to / 1000) * 1000)} crore payments a month. What happened to cash?
                    </Heading4>
                    <Text fontStyle="serif" marginBottom="micro">
                        Since March 2016, has the currency in circulation, the notes and coins out in the economy, gone up or down?
                    </Text>
                </GuessStep>
            </section>

            <section className="rain is-split is-step" data-slide>
                <TideStep upto="2016-17">
                    <Text className="kicker" weight="600" marginBottom="nano">THE EBB</Text>
                    <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">
                        November 2016: the tide of cash went out
                    </Heading4>
                    <Text fontStyle="serif" marginBottom="micro">
                        For a decade, the cash people held had stayed between {Math.min(...DECADE).toFixed(1)}% and {Math.max(...DECADE).toFixed(1)}% of
                        GDP. On 8 November 2016 the ₹500 and ₹1,000 notes <a href="https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=38520">stopped
                        being legal tender</a>. In {EBB_FY} the share fell to {TIDE[EBB].toFixed(1)}%, its lowest since {LOWER_FY}.
                    </Text>
                    <Text fontStyle="serif" marginBottom="micro">
                        The same years brought a new way to pay.
                    </Text>
                    <Text className="step-note" size="small">
                        Currency with the public, the average over each financial year, as a share of nominal GDP on the
                        2011-12 base. DBIE, macro-economic aggregates.
                    </Text>
                </TideStep>
            </section>

            <section className="rain is-split" data-slide>
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

            <section className="rain is-grids" data-slide>
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

            <section className="rain is-grids" data-slide>
                <GridsStage view="value">
                    <Text className="kicker" weight="600" marginBottom="nano">THE CASH</Text>
                    <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">
                        Fewer trips to the ATM, more taken out each time
                    </Heading4>
                </GridsStage>
            </section>
        </Article>
    );
};

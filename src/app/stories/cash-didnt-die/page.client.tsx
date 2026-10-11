"use client";

// REACT CORE ==========================================================================================================
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading1, Heading4, Text } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";
import { CloseStep, GuessStep, NoteWallStep, PayStep, TideStep } from "./Steps";
import { useSlidePaging } from "./paging";

// DATA ================================================================================================================
import { CIC, CIC_MONTHS, HEADLINE, MACHINES, NOTE_YEARS, PAY_MONTHS, TIDE, TIDE_FYS, USERS } from "./data.gen";

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
// the tide's return: the first year after the ebb back at the decade's level, and the highest year
const BACK = TIDE.findIndex((v, k) => k > EBB && v >= Math.min(...DECADE)), BACK_FY = TIDE_FYS[BACK];
const PEAK = TIDE.indexOf(Math.max(...TIDE)), PEAK_FY = TIDE_FYS[PEAK];
// cash in circulation at end-March 2016 and the latest March, for the close
const CASH_2016 = CIC[CIC_MONTHS.indexOf("2016-03")];
const LAST_MARCH_K = CIC_MONTHS.map(m => m.endsWith("-03")).lastIndexOf(true);
const CASH_LAST = CIC[LAST_MARCH_K], LAST_MARCH_YEAR = CIC_MONTHS[LAST_MARCH_K].slice(0, 4);
// the notes: ₹500 and ₹1,000 in March 2016, and the ₹500 in the latest March, as shares of the value of banknotes
const NOTES_16 = (NOTE_YEARS ?? []).find(y => y.march === "2016-03");
const NOTES_2016 = NOTES_16?.total ?? 1;
const valueOf = (y : typeof NOTES_16, d : string) => y?.notes.filter(n => n.denom === d).reduce((a, n) => a + n.value, 0) ?? 0;
const BIG_2016 = (valueOf(NOTES_16, "500") + valueOf(NOTES_16, "1000")) / NOTES_2016 * 100;
const LAST_NOTES = (NOTE_YEARS ?? [])[(NOTE_YEARS ?? []).length - 1];
const SHARE_500 = LAST_NOTES ? valueOf(LAST_NOTES, "500") / LAST_NOTES.total * 100 : 0;
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
                <TideStep upto="2016-17" marks={[ { fy : TIDE_FYS[0], at : "under-right" }, { fy : EBB_FY, at : "right", accent : true, pulse : true } ]}>
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

            <section className="rain is-split is-step" data-slide>
                <PayStep>
                    <Text className="kicker" weight="600" marginBottom="nano">THE CARD WENT FIRST</Text>
                    <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">
                        As UPI grew, debit-card payments shrank
                    </Heading4>
                    <Text fontStyle="serif" marginBottom="micro">
                        Debit-card payments, at shops and online, fell from {HEADLINE.debit.from.toFixed(1)} crore a month in
                        {" "}{monthYear(HEADLINE.payFirst)} to {HEADLINE.debit.to.toFixed(1)} crore in {monthYear(HEADLINE.payLast)}, while
                        UPI payments grew {times} times. The first thing UPI took over looks like the card, not the note.
                    </Text>
                    <Text className="step-note" size="small">
                        DBIE, payment system indicators. The series start at the November 2019 change in how they are
                        counted, and are not joined to earlier data.
                    </Text>
                </PayStep>
            </section>

            <section className="rain is-split is-step" data-slide>
                <TideStep upto={TIDE_FYS[TIDE_FYS.length - 1]} from={EBB_FY} marks={[
                    { fy : EBB_FY, at : "below" },
                    { fy : PEAK_FY, at : "above", note : `${PEAK_FY}, the pandemic year` },
                    { fy : TIDE_FYS[TIDE_FYS.length - 1], at : "right", accent : true, pulse : true },
                ]}>
                    <Text className="kicker" weight="600" marginBottom="nano">THE TIDE RETURNS</Text>
                    <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">
                        Yet the cash came back
                    </Heading4>
                    <Text fontStyle="serif" marginBottom="micro">
                        By {BACK_FY} the cash people held was back to {TIDE[BACK].toFixed(1)}% of GDP, where it had been before
                        November 2016. In {PEAK_FY}, the pandemic year, it reached {TIDE[PEAK].toFixed(1)}%, the highest since
                        the series began in {TIDE_FYS[0]}, and it was {TIDE[TIDE.length - 1].toFixed(1)}% in {TIDE_FYS[TIDE_FYS.length - 1]}.
                    </Text>
                    <Text fontStyle="serif" marginBottom="micro">
                        How people paid changed. How much cash they held did not shrink. So where does cash still move?
                    </Text>
                    <Text className="step-note" size="small">
                        Currency with the public, the average over each financial year, as a share of nominal GDP on the
                        2011-12 base. DBIE, macro-economic aggregates.
                    </Text>
                </TideStep>
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
            <section className="rain is-split is-step" data-slide>
                <NoteWallStep>
                    <Text className="kicker" weight="600" marginBottom="nano">THE NOTES</Text>
                    <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">
                        The ₹500 note carries India’s cash
                    </Heading4>
                    <Text fontStyle="serif" marginBottom="micro">
                        In March 2016, ₹500 and ₹1,000 notes were {BIG_2016.toFixed(1)}% of the value of banknotes. After
                        November 2016 the ₹1,000 note was gone and a ₹2,000 note came; the RBI <a href="https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=55707">withdrew
                        it from circulation</a> on 19 May 2023. By March {LAST_NOTES?.march.slice(0, 4)}, the ₹500 alone was {SHARE_500.toFixed(1)}% of
                        the value, of a pile {(LAST_NOTES ? LAST_NOTES.total / NOTES_2016 : 0).toFixed(1)} times as large.
                    </Text>
                    <Text className="step-note" size="small">
                        Banknotes in circulation at the end of March, by value. RBI <a href={LAST_NOTES?.url}>Annual Report</a>,
                        Table VIII.1 (not on DBIE). Coins are not included.
                    </Text>
                </NoteWallStep>
            </section>

            <section className="rain is-close" data-slide>
                <CloseStep
                    paying={<>
                        <span className="close-label">Paying</span>
                        <b>{fmtCr(HEADLINE.upi.to)} crore</b>
                        <span>UPI payments in {monthYear(HEADLINE.payLast)}, {times} times {monthYear(HEADLINE.payFirst)}’s</span>
                    </>}
                    keeping={<>
                        <span className="close-label">Keeping</span>
                        <b>₹{(CASH_LAST / 1e5).toFixed(1)} lakh crore</b>
                        <span>currency in circulation in March {LAST_MARCH_YEAR}, {(CASH_LAST / CASH_2016).toFixed(1)} times March 2016’s</span>
                    </>}>
                    <Text className="kicker" weight="600" marginBottom="nano">PAYING AND KEEPING</Text>
                    <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">Two different jobs</Heading4>
                    <Text fontStyle="serif" marginBottom="micro">
                        RBI researchers find the demand for currency “influenced by the precautionary and store-of-value
                        motives”, while “the use of cash as a payment medium continues to fall” (<a href="https://www.rbi.org.in/Scripts/bs_viewcontent.aspx?Id=4344">RBI
                        Occasional Papers</a>). A 2025 study in the <a href="https://www.rbi.org.in/scripts/BS_ViewBulletin.aspx?Id=23646">RBI
                        Bulletin</a> links more UPI use to lower cash demand, adding that its estimates “do not necessarily
                        imply causality”.
                    </Text>
                    <p className="close-line">India pays with the phone. It keeps the cash.</p>
                </CloseStep>
            </section>

            <section className="story-notes">
                <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">About the data</Heading4>
                <ul>
                    <li>
                        <b>Payments</b>: DBIE, payment system indicators (report 612), {monthYear(HEADLINE.payFirst)} to {monthYear(HEADLINE.payLast)}:
                        UPI, debit cards at shops and online, ATM and micro-ATM withdrawals, and the number of ATMs and micro-ATMs.
                        The series begin at the November 2019 change in how they are counted and are not joined to earlier data.
                    </li>
                    <li>
                        <b>Cash</b>: currency in circulation, end of month (DBIE, reserve money components), which includes the cash
                        banks hold. The tide uses currency with the public, which leaves it out, averaged over each financial year,
                        as a share of nominal GDP (DBIE, macro-economic aggregates).
                    </li>
                    <li>
                        <b>GDP base</b>: the shares of GDP use the 2011-12 base that DBIE carries. MoSPI moved GDP to a{" "}
                        <a href="https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/feb/doc2026227806401.pdf">2022-23 base</a> on
                        27 February 2026; the shares will be recomputed when its back series is published.
                    </li>
                    <li>
                        <b>Banknotes by denomination</b>: RBI Annual Reports, Table VIII.1, at the end of each March. The colours of
                        the notes in the withdrawal grids follow the mix of ₹100 and larger notes in circulation; the RBI does not
                        publish which notes machines pay out.
                    </li>
                    <li>
                        <b>UPI users</b>: unique users onboarded, as counted by NPCI and reported by PIB, the RBI and Parliament at
                        eight dates, joined by straight lines; not monthly active users.
                    </li>
                    <li>
                        Monthly figures move with festivals and elections, and March 2017 is the low just after demonetisation, not a
                        settled level. A month of UPI payments is a flow; the cash in circulation is a stock: the two are shown
                        side by side, never as one share of the other.
                    </li>
                </ul>
            </section>
        </Article>
    );
};

"use client";

// REACT CORE ==========================================================================================================
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading1, Heading4, Text } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";
import { CloseStep, EventList, FestiveStep, GuessStep, PatternList, LineStep, NoteWallStep, PayStep, SeasonStep, TideStep } from "./Steps";
import { eventsFor, eventsForYears, patternsFor } from "./record";
import { useSlidePaging } from "./paging";

// DATA ================================================================================================================
import { CIC, CIC_MONTHS, FESTIVE, HEADLINE, MACHINES, NOTE_YEARS, PAY, PAY_MONTHS, TIDE, TIDE_FYS, USERS } from "./data.gen";

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
// the refill: currency in circulation month by month around November 2016, from April 2015 to March 2019
const REFILL_FROM = CIC_MONTHS.indexOf("2015-04"), REFILL_TO = CIC_MONTHS.indexOf("2019-03") + 1;
const REFILL_MONTHS = CIC_MONTHS.slice(REFILL_FROM, REFILL_TO), REFILL = CIC.slice(REFILL_FROM, REFILL_TO).map(v => v / 1e5);
const OCT16 = REFILL[REFILL_MONTHS.indexOf("2016-10")];
const REFILL_LOW = REFILL_MONTHS[REFILL.indexOf(Math.min(...REFILL))];
const REFILL_BACK = REFILL_MONTHS.find((m, i) => m > REFILL_LOW && REFILL[i] >= OCT16) ?? REFILL_MONTHS[REFILL_MONTHS.length - 1];
const monthsBetween = (a : string, b : string) => (+b.slice(0, 4) - +a.slice(0, 4)) * 12 + (+b.slice(5) - +a.slice(5));
// small payments: the average UPI payment, each month, in rupees
const UPI_AVG = PAY.upi.value.map((v, i) => v / PAY.upi.volume[i]);
const UPI_AVG_PEAK = PAY_MONTHS[UPI_AVG.indexOf(Math.max(...UPI_AVG))];
// the season: the average change in currency in circulation from one month's end to the next, by month of the year,
// from 2018 (after the refill) to the latest month, ordered June to May
const SEASON_ORDER = [ "06", "07", "08", "09", "10", "11", "12", "01", "02", "03", "04", "05" ];
const SEASON = SEASON_ORDER.map(mm => {
    const ch = CIC_MONTHS.map((m, k) => k && m >= "2018-01" && m.slice(5) === mm ? (CIC[k] / CIC[k - 1] - 1) * 100 : NaN).filter(v => !isNaN(v));
    return ch.reduce((a, b) => a + b, 0) / ch.length;
});
const SEASON_LABELS = SEASON_ORDER.map(mm => new Date(`2020-${mm}-01T00:00:00`).toLocaleString("en-GB", { month : "short" }));
const SEASON_PEAK = new Date(`2020-${SEASON_ORDER[SEASON.indexOf(Math.max(...SEASON))]}-01T00:00:00`).toLocaleString("en-GB", { month : "long" });
const SEASON_YEARS = `2018 to ${CIC_MONTHS[CIC_MONTHS.length - 1].slice(0, 4)}`;
// the official record for each step that has one
const CARD_EVENTS = eventsFor("card"), SMALL_EVENTS = eventsFor("small");
const REFILL_EVENTS = eventsFor("refill", REFILL_MONTHS), TIDE_EVENTS = eventsForYears("tide"), SEASON_RECORD = patternsFor("season");
// the festive weeks: the extra cash drawn before Diwali, averaged over the first four years and the last four
const FEST_EARLY = FESTIVE.years.slice(0, 4), FEST_LATE = FESTIVE.years.slice(-4);
const festAvg = (ys : typeof FESTIVE.years, k : "before" | "crore") => ys.reduce((a, y) => a + y[k], 0) / ys.length;
const festSpan = (ys : typeof FESTIVE.years) => `${ys[0].year}–${String(ys[ys.length - 1].year).slice(2)}`;
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
                        Then, month by month, the notes came back.
                    </Text>
                    <Text className="step-note" size="small">
                        Currency with the public, the average over each financial year, as a share of nominal GDP on the
                        2011-12 base. DBIE, macro-economic aggregates.
                    </Text>
                </TideStep>
            </section>

            <section className="rain is-split is-step" data-slide>
                <LineStep months={REFILL_MONTHS} values={REFILL} fmt={v => `₹${v.toFixed(1)}`} ticks={[ 5, 10, 15, 20 ]} lo={0} hi={22}
                    tone="terracotta" axis="Currency in circulation, ₹ lakh crore, end of month" events={REFILL_EVENTS}
                    level={{ value : OCT16, label : "October 2016 level" }}
                    marks={[ { month : "2016-10", at : "above", note : "October 2016" }, { month : REFILL_LOW, at : "right", accent : true, pulse : true, note : monthYear(REFILL_LOW) }, { month : REFILL_BACK, at : "below", note : monthYear(REFILL_BACK) } ]}>
                    <Text className="kicker" weight="600" marginBottom="nano">THE REFILL</Text>
                    <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">
                        Half the cash went, and all of it came back
                    </Heading4>
                    <Text fontStyle="serif" marginBottom="micro">
                        Currency in circulation was ₹{OCT16.toFixed(1)} lakh crore at the end of October 2016. By the end of
                        {" "}{monthYear(REFILL_LOW)} it was ₹{Math.min(...REFILL).toFixed(1)} lakh crore. As new notes went out it climbed
                        back, and in {monthYear(REFILL_BACK)}, {monthsBetween("2016-10", REFILL_BACK)} months on, it passed its October 2016 level.
                    </Text>
                    <Text fontStyle="serif" marginBottom="micro">
                        The RBI put ₹5.54 lakh crore of new notes into circulation by the end of December 2016, and lifted the
                        limits on withdrawals between January and March 2017. By June 2017, notes in circulation were about 85%
                        of their level on 4 November 2016. Then the rain began.
                    </Text>
                    <EventList events={REFILL_EVENTS} />
                    <Text className="step-note" size="small">Currency in circulation at the end of each month, notes and coins. DBIE, reserve money components.</Text>
                </LineStep>
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
                <PayStep events={CARD_EVENTS}>
                    <Text className="kicker" weight="600" marginBottom="nano">THE CARD WENT FIRST</Text>
                    <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">
                        As UPI grew, debit-card payments shrank
                    </Heading4>
                    <Text fontStyle="serif" marginBottom="micro">
                        Debit-card payments, at shops and online, fell from {HEADLINE.debit.from.toFixed(1)} crore a month in
                        {" "}{monthYear(HEADLINE.payFirst)} to {HEADLINE.debit.to.toFixed(1)} crore in {monthYear(HEADLINE.payLast)}, while
                        UPI payments grew {times} times. The first thing UPI took over looks like the card, not the note. The
                        RBI says the fall is “potentially driven by the rise of digital wallets, UPI, and credit card adoption”.
                    </Text>
                    <EventList events={CARD_EVENTS} />
                    <Text className="step-note" size="small">
                        DBIE, payment system indicators. The series start at the November 2019 change in how they are
                        counted, and are not joined to earlier data.
                    </Text>
                </PayStep>
            </section>

            <section className="rain is-split is-step" data-slide>
                <LineStep months={PAY_MONTHS} values={UPI_AVG} fmt={v => `₹${fmtCr(v)}`} ticks={[ 1000, 1200, 1400, 1600, 1800 ]} lo={900} hi={1900}
                    tone="neem" axis="The average UPI payment, ₹, each month" events={SMALL_EVENTS}
                    marks={[ { month : PAY_MONTHS[0], at : "under-right", note : monthYear(PAY_MONTHS[0]) }, { month : UPI_AVG_PEAK, at : "under-right", note : monthYear(UPI_AVG_PEAK) }, { month : PAY_MONTHS[PAY_MONTHS.length - 1], at : "right", accent : true, pulse : true, note : monthYear(PAY_MONTHS[PAY_MONTHS.length - 1]) } ]}>
                    <Text className="kicker" weight="600" marginBottom="nano">SMALL PAYMENTS</Text>
                    <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">
                        The average UPI payment got smaller
                    </Heading4>
                    <Text fontStyle="serif" marginBottom="micro">
                        It was ₹{fmtCr(UPI_AVG[0])} in {monthYear(PAY_MONTHS[0])}, rose to ₹{fmtCr(Math.max(...UPI_AVG))} by {monthYear(UPI_AVG_PEAK)}, and
                        has fallen since, to ₹{fmtCr(UPI_AVG[UPI_AVG.length - 1])} in {monthYear(PAY_MONTHS[PAY_MONTHS.length - 1])}. A falling average means small payments grew fastest: the chai, the auto ride, the vegetables. These are
                        the payments small notes used to make. In the RBI’s words, “UPI is mainly used for small value transactions”.
                    </Text>
                    <Text fontStyle="serif" marginBottom="micro">
                        That is also where a new fee stops. From 15 October 2026, merchants pay 0.4% on UPI payments above ₹2,000,
                        capped at ₹300; payments up to ₹2,000, more than 95% of merchant payments by number, stay free, a design
                        meant “to protect daily micro-purchases like tea stalls” (<a href="https://financialservices.gov.in/sites/default/files/2026-09/FAQs---Merchant-Discount-Rate--MDR--on-Select-UPI--P2M--Transactions_0.pdf">Ministry
                        of Finance, 15-09-2026</a>). The fee starts after these figures end, so its effect is not yet in them.
                    </Text>
                    <EventList events={SMALL_EVENTS} />
                    <Text className="step-note" size="small">
                        The value of UPI payments in the month divided by their number; includes transfers between people.
                        DBIE, payment system indicators.
                    </Text>
                </LineStep>
            </section>

            <section className="rain is-split is-step" data-slide>
                <TideStep upto={TIDE_FYS[TIDE_FYS.length - 1]} from={EBB_FY} events={TIDE_EVENTS} marks={[
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
                        The RBI ties the high to “a panic-driven surge in precautionary demand for cash” in 2020 and to the fall
                        in GDP in the pandemic, and the easing since to “the ebbing of pandemic uncertainty and the increasing
                        usage of digital payments”. How people paid changed; how much cash they held did not shrink.
                    </Text>
                    <EventList events={TIDE_EVENTS} />
                    <Text className="step-note" size="small">
                        Currency with the public, the average over each financial year, as a share of nominal GDP on the
                        2011-12 base. DBIE, macro-economic aggregates.
                    </Text>
                </TideStep>
            </section>

            <section className="rain is-split is-step" data-slide>
                <SeasonStep labels={SEASON_LABELS} values={SEASON}>
                    <Text className="kicker" weight="600" marginBottom="nano">CASH HAS A SEASON</Text>
                    <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">
                        Cash swells from October to May, and ebbs in the monsoon
                    </Heading4>
                    <Text fontStyle="serif" marginBottom="micro">
                        On average from {SEASON_YEARS}, the currency in circulation grew every month from October to May,
                        most in {SEASON_PEAK}, and barely moved or shrank from June to September. People draw cash out and put
                        it back through the year. The RBI ties the rise to “festivals and kharif harvest” at the end of the year
                        and to “the harvest of rabi crops, various festivals and the wedding season” at its start, and the
                        monsoon dip to a “seasonal slack in economic activity in cash-intensive sectors such as construction and
                        agriculture”.
                    </Text>
                    <PatternList items={SEASON_RECORD} />
                    <Text fontStyle="serif" marginBottom="micro">Some of the year’s pull comes in a few weeks, with the festivals.</Text>
                    <Text className="step-note" size="small">
                        Change in currency in circulation from the end of one month to the end of the next, averaged over
                        {" "}{SEASON_YEARS}. DBIE, reserve money components.
                    </Text>
                </SeasonStep>
            </section>

            <section className="rain is-split is-step" data-slide>
                <FestiveStep>
                    <Text className="kicker" weight="600" marginBottom="nano">THE FESTIVE WEEKS</Text>
                    <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">
                        Every Diwali, cash is drawn out, and the pull has weakened
                    </Heading4>
                    <Text fontStyle="serif" marginBottom="micro">
                        The festive season runs from Dussehra to Diwali. In the three weeks up to Diwali, cash went out faster than
                        its usual pace in every year measured. In {festSpan(FEST_EARLY)} the extra came to about {festAvg(FEST_EARLY, "before").toFixed(1)}% of all
                        the currency in circulation; in {festSpan(FEST_LATE)}, about {festAvg(FEST_LATE, "before").toFixed(1)}%. After Diwali, some of it comes back.
                    </Text>
                    <Text fontStyle="serif" marginBottom="micro">
                        The pull weakened in the same years UPI spread through everyday spending. The data alone cannot say one
                        caused the other. So where do people draw their cash?
                    </Text>
                    <Text className="step-note" size="small">
                        Currency in circulation each Friday (DBIE, reserve money components, weekly), the three weeks up to the
                        week of Diwali against that year’s usual weekly growth. Diwali as gazetted for Central Government offices.
                        {" "}{FESTIVE.leftOut.slice(0, -1).join(", ")} and {FESTIVE.leftOut[FESTIVE.leftOut.length - 1]} are left out: demonetisation, the refill after it, and the pandemic.
                    </Text>
                </FestiveStep>
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
                        the value, of a pile {(LAST_NOTES ? LAST_NOTES.total / NOTES_2016 : 0).toFixed(1)} times as large. By 30 April 2026, 98.47% of
                        the ₹2,000 notes <a href="https://www.rbi.org.in/SCRIPTS/BS_ViewCurrencyPressRelease.aspx?Id=62669">had come back</a>; they remain legal tender.
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
                        <b>The festive weeks</b>: currency in circulation each Friday (DBIE, reserve money components, weekly), the
                        three weeks up to the week of Diwali against that year’s usual weekly growth, using the dates gazetted for
                        Central Government offices in each year’s DoPT holiday list. Measured the same way, Dussehra usually falls two
                        or three weeks before Diwali and cannot be told apart from it, and the weeks before Id-ul-Fitr show no
                        consistent change in the national total, which does not rule out effects in particular places.
                    </li>
                    <li>
                        <b>The events</b>: the numbered events on the charts and the sliders, and the RBI’s explanations in the words,
                        come from RBI and Government of India documents (annual reports, circulars, press releases, the Payment
                        Systems Report and the RBI Bulletin), each linked. Where the RBI speaks of currency in circulation as a share
                        of GDP, the story quotes its reasons but not its ratios, since the tide uses currency with the public.
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

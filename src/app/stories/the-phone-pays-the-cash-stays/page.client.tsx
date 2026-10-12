"use client";

// REACT CORE ==========================================================================================================
import dynamic from "next/dynamic";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Div, Divider, Heading1, Heading4, Portion, Row, Section, Text } from "fictoan-react";
import { Download } from "lucide-react";

// LOCAL COMPONENTS ====================================================================================================
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";
import { CloseStep, FestiveStep, GuessStep, LineStep, NoteWallStep, PayStep, SeasonStep, TideStep } from "./Steps";
import { SectionRail } from "./SectionRail";
import { NoteIcon } from "./Note";
import { HandImage } from "./HandImage";
import { eventsFor, eventsForYears, patternsFor } from "./record";
import { useSlidePaging } from "./paging";

// DATA ================================================================================================================
import { CIC, CIC_MONTHS, FESTIVE, HEADLINE, MACHINES, NOTE_YEARS, PAY, PAY_MONTHS, TIDE, TIDE_FYS, USER_POINTS } from "./data.gen";

// STYLES ==============================================================================================================
import "./the-phone-pays-the-cash-stays.css";

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

// THE FIGURES IN THE HEADERS ==========================================================================================
// Every number the headers state is worked out here from the generated data, to the precision it is printed at.
const monthYear = (ym : string) => new Date(`${ym}-01T00:00:00`).toLocaleString("en-GB", { month : "long", year : "numeric" });
const fmtCr = (v : number) => Math.round(v).toLocaleString("en-IN");
const pct = (v : number) => v.toFixed(1);
const times = (a : number, b : number) => (b / a).toFixed(1);               // "2.5" for 2.5 times
const PAY_FIRST = PAY_MONTHS[0], PAY_LAST = PAY_MONTHS[PAY_MONTHS.length - 1], LAST = PAY_MONTHS.length - 1;
const UPI_TIMES = HEADLINE.upi.times.toFixed(1);

// cash against GDP: the year before the ebb, the ebb, the latest year, and the highest
const EBB_FY = "2016-17", EBB = TIDE_FYS.indexOf(EBB_FY);
const PEAK = TIDE.indexOf(Math.max(...TIDE));

// demonetisation: currency in circulation at the end of October and December 2016, and the month it was back
const REFILL_FROM = CIC_MONTHS.indexOf("2015-04"), REFILL_TO = CIC_MONTHS.indexOf("2019-03") + 1;
const REFILL_MONTHS = CIC_MONTHS.slice(REFILL_FROM, REFILL_TO), REFILL = CIC.slice(REFILL_FROM, REFILL_TO).map(v => v / 1e5);
const OCT16 = REFILL[REFILL_MONTHS.indexOf("2016-10")];
const REFILL_LOW = REFILL_MONTHS[REFILL.indexOf(Math.min(...REFILL))];
const REFILL_FALL = (1 - Math.min(...REFILL) / OCT16) * 100;
const REFILL_BACK = REFILL_MONTHS.find((m, i) => m > REFILL_LOW && REFILL[i] >= OCT16) ?? REFILL_MONTHS[REFILL_MONTHS.length - 1];

// UPI users, between the first official count inside the payments months and the latest; payments per user over the
// same months
const U0 = USER_POINTS.find(p => p.month >= PAY_FIRST && !p.approximate)!, U1 = USER_POINTS[USER_POINTS.length - 1];
const upiIn = (ym : string) => PAY.upi.volume[PAY_MONTHS.indexOf(ym)];
const USERS_TIMES = times(U0.users, U1.users);
const PER_USER_TIMES = times(upiIn(U0.month) / U0.users, upiIn(U1.month) / U1.users);

// debit cards, and the average UPI payment
const DEBIT_FALL = (1 - HEADLINE.debit.to / HEADLINE.debit.from) * 100;
const UPI_AVG = PAY.upi.value.map((v, i) => v / PAY.upi.volume[i]);
const UPI_AVG_PEAK = UPI_AVG.indexOf(Math.max(...UPI_AVG));
const UPI_AVG_FALL = (1 - UPI_AVG[LAST] / UPI_AVG[UPI_AVG_PEAK]) * 100;

// the season: the average change in currency in circulation from one month's end to the next, by month of the year,
// from 2018 (after the refill) to the latest month
const SEASON_MONTHS = [ "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12" ];
const SEASON_BY_MONTH = Object.fromEntries(SEASON_MONTHS.map(mm => {
    const ch = CIC_MONTHS.map((m, k) => k && m >= "2018-01" && m.slice(5) === mm ? (CIC[k] / CIC[k - 1] - 1) * 100 : NaN).filter(v => !isNaN(v));
    return [ mm, ch.reduce((a, b) => a + b, 0) / ch.length ];
}));
const SEASON_PEAK_MM = SEASON_MONTHS.reduce((a, m) => (SEASON_BY_MONTH[m] > SEASON_BY_MONTH[a] ? m : a));
const SEASON_PEAK = new Date(`2020-${SEASON_PEAK_MM}-01T00:00:00`).toLocaleString("en-GB", { month : "long" });
const SEASON_YEARS = `2018 to ${CIC_MONTHS[CIC_MONTHS.length - 1].slice(0, 4)}`;
const SEASON_RECORD = patternsFor("season");
const recordOf = (label : string) => SEASON_RECORD.find(e => e.label === label);
const SEASON_PARTS = ([ [ 4, 6, "Summer, weddings, sowing", "Summer, weddings, sowing" ], [ 7, 9, "The monsoon slack", "The monsoon slack" ],
    [ 10, 12, "Festivals, harvests, weddings", "Festivals, kharif harvest" ], [ 1, 3, "Festivals, harvests, weddings", "Rabi harvest, festivals, weddings" ] ] as const)
    .map(([ from, to, key, label ]) => ({ from, to, label, note : recordOf(key)?.note ?? "", source : recordOf(key)?.source ?? "", url : recordOf(key)?.url ?? "" }))
    .filter(p => p.url);

// the Diwali weeks: the extra cash drawn in the three weeks before, averaged over the first four years and the last four
const FEST_EARLY = FESTIVE.years.slice(0, 4), FEST_LATE = FESTIVE.years.slice(-4);
const festAvg = (ys : typeof FESTIVE.years) => ys.reduce((a, y) => a + y.before, 0) / ys.length;
const festSpan = (ys : typeof FESTIVE.years) => `${ys[0].year}–${String(ys[ys.length - 1].year).slice(2)}`;

// the machines, and the cash taken out at ATMs
const ATM_N = MACHINES.atm[LAST], MICRO_N = MACHINES.micro[LAST];
const ATM_FALL = (1 - HEADLINE.atm.to / HEADLINE.atm.from) * 100;
const ATM_TICKET_RISE = (HEADLINE.atmTicket.to / HEADLINE.atmTicket.from - 1) * 100;
const MICRO_TICKET = PAY.micro.value[LAST] / PAY.micro.volume[LAST];

// the notes: the ₹500's share of the value of banknotes in March 2016 and in the latest March
const NOTE_LIST = NOTE_YEARS ?? [];
const share500 = (y? : (typeof NOTE_LIST)[number]) => y ? y.notes.filter(n => n.denom === "500").reduce((a, n) => a + n.value, 0) / y.total * 100 : 0;
const NOTES_16 = NOTE_LIST.find(y => y.march === "2016-03"), NOTES_LAST = NOTE_LIST[NOTE_LIST.length - 1];
const NOTES_LAST_YEAR = NOTES_LAST?.march.slice(0, 4);

// cash in circulation, March 2016 and the latest March
const CASH_2016 = CIC[CIC_MONTHS.indexOf("2016-03")];
const LAST_MARCH_K = CIC_MONTHS.map(m => m.endsWith("-03")).lastIndexOf(true);
const CASH_LAST = CIC[LAST_MARCH_K], LAST_MARCH_YEAR = CIC_MONTHS[LAST_MARCH_K].slice(0, 4);
const CASH_TIMES = times(CASH_2016, CASH_LAST);

// the blink on the UPI wall: the latest month's payments in a third of a second
const DAYS_LAST = new Date(+PAY_LAST.slice(0, 4), +PAY_LAST.slice(5), 0).getDate();
const PER_SECOND = PAY.upi.volume[LAST] * 1e7 / (DAYS_LAST * 86400);

// the official record for each step that has one
const CARD_EVENTS = eventsFor("card"), SMALL_EVENTS = eventsFor("small");
const REFILL_EVENTS = eventsFor("refill", REFILL_MONTHS), TIDE_EVENTS = eventsForYears("tide");

// A slide's header and its one line of words. Every slide says its message in the header; the line under it adds one
// fact or the RBI's own words.
const Head = ({ children } : { children : React.ReactNode }) => (
    <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">{children}</Heading4>
);
const Line = ({ children } : { children : React.ReactNode }) => <Text className="step-line" fontStyle="serif">{children}</Text>;
const Source = ({ children } : { children : React.ReactNode }) => <Text className="step-note" size="small">{children}</Text>;

const DOWNLOADS = [
    [ "payments-monthly.csv", "Payments and withdrawals by month (CSV)" ],
    [ "cash-in-circulation-monthly.csv", "Currency in circulation by month (CSV)" ],
    [ "cash-and-gdp-yearly.csv", "Currency with the public and GDP by year (CSV)" ],
    [ "banknotes-by-denomination.csv", "Banknotes by denomination, end-March (CSV)" ],
    [ "upi-users.csv", "UPI users, official counts (CSV)" ],
] as const;

export const PhonePaysPage = () => {
    useSlidePaging("#the-phone-pays-the-cash-stays-page");
    return (
        <Article id="the-phone-pays-the-cash-stays-page">
            <SectionRail />

            <section className="opening is-intro" data-slide>
                <TitleStage />
                <div className="hero">
                    <PageCrumbs />
                    <Heading1 className="hero-title" fontStyle="serif" weight="700" marginBottom="micro">
                        The phone pays, <span>the cash stays</span>
                    </Heading1>
                    <Text className="hero-dek" fontStyle="serif">
                        UPI payments grew {UPI_TIMES}x between {monthYear(PAY_FIRST)} and {monthYear(PAY_LAST)}. What happened to cash?
                    </Text>
                </div>
            </section>

            {/* 1 · UPI AND CASH ======================================================================================== */}
            <section className="rain is-split is-step" data-slide data-section="1">
                <GuessStep layout="left">
                    <Head>Since March 2016, has the currency in circulation risen or fallen?</Head>
                </GuessStep>
            </section>

            <section className="rain is-split is-step" data-slide data-section="1">
                <TideStep layout="top" breakAt={EBB_FY} events={TIDE_EVENTS} marks={[
                    { fy : TIDE_FYS[0], at : "under-right" },
                    { fy : EBB_FY, at : "below", accent : true },
                    { fy : TIDE_FYS[TIDE_FYS.length - 1], at : "right", accent : true, pulse : true },
                ]}>
                    <Head>
                        Measured against GDP, cash with the public fell from {pct(TIDE[EBB - 1])}% to {pct(TIDE[EBB])}% in {EBB_FY}, and
                        was {pct(TIDE[TIDE.length - 1])}% by {TIDE_FYS[TIDE_FYS.length - 1]}
                    </Head>
                    <Line>
                        It peaked at {pct(TIDE[PEAK])}% in {TIDE_FYS[PEAK]}, which the RBI links to “a panic-driven surge in
                        precautionary demand for cash” and the fall in GDP.
                    </Line>
                    <Source>Currency with the public, financial-year average, as % of nominal GDP (2011-12 base). DBIE.</Source>
                </TideStep>
            </section>

            <section className="rain is-split is-step" data-slide data-section="1">
                <LineStep months={REFILL_MONTHS} values={REFILL} fmt={v => `₹${v.toFixed(1)}`} read={i => [ `₹${REFILL[i].toFixed(2)} lakh crore in circulation`, i ? `${REFILL[i] >= REFILL[i - 1] ? "+" : ""}${((REFILL[i] / REFILL[i - 1] - 1) * 100).toFixed(1)}% on the month before` : "" ].filter(Boolean)} ticks={[ 5, 10, 15, 20 ]} lo={0} hi={22}
                    tone="terracotta" axis="Currency in circulation, ₹ lakh crore, end of month" events={REFILL_EVENTS}
                    level={{ value : OCT16, label : "October 2016 level" }}
                    marks={[ { month : "2016-10", at : "above", note : "October 2016" }, { month : REFILL_LOW, at : "right", accent : true, pulse : true, note : monthYear(REFILL_LOW) }, { month : REFILL_BACK, at : "below", note : monthYear(REFILL_BACK) } ]}>
                    <Head>
                        After demonetisation, currency in circulation fell {pct(REFILL_FALL)}% by {monthYear(REFILL_LOW)}, and was back
                        at its October 2016 level by {monthYear(REFILL_BACK)}
                    </Head>
                    <Line>The RBI put ₹5.54 lakh crore of new notes into circulation by the end of December 2016, and lifted withdrawal limits between January and March 2017.</Line>
                    <Source>Currency in circulation, end of month, notes and coins. DBIE, reserve money components.</Source>
                </LineStep>
            </section>

            <section className="rain is-taps" data-slide data-section="1">
                <RainStage>
                    <Head>From {monthYear(U0.month)} to {monthYear(U1.month)}, UPI users grew {USERS_TIMES}x and payments per user {PER_USER_TIMES}x</Head>
                </RainStage>
            </section>

            <section className="rain is-split is-step" data-slide data-section="1">
                <PayStep layout="left" events={CARD_EVENTS}>
                    <Head>As UPI payments grew {UPI_TIMES}x, debit-card payments fell {pct(DEBIT_FALL)}%</Head>
                    <Line>The RBI says the fall is “potentially driven by the rise of digital wallets, UPI, and credit card adoption”.</Line>
                    <Source>Payments a month, {monthYear(PAY_FIRST)} to {monthYear(PAY_LAST)}. DBIE, payment system indicators.</Source>
                </PayStep>
            </section>

            <section className="rain is-split is-step" data-slide data-section="1">
                <LineStep layout="top" months={PAY_MONTHS} values={UPI_AVG} fmt={v => `₹${fmtCr(v)}`} read={i => [ `₹${fmtCr(UPI_AVG[i])} the average payment`, `${fmtCr(PAY.upi.volume[i])} crore payments in the month` ]} ticks={[ 1000, 1250, 1500, 1750, 2000 ]} lo={900} hi={Math.ceil(Math.max(...UPI_AVG) / 250) * 250 + 150}
                    tone="neem" axis="The average UPI payment, ₹, each month" events={SMALL_EVENTS}
                    marks={[ { month : PAY_FIRST, at : "under-right", note : monthYear(PAY_FIRST) }, { month : PAY_MONTHS[UPI_AVG_PEAK], at : "under-right", note : monthYear(PAY_MONTHS[UPI_AVG_PEAK]) }, { month : PAY_LAST, at : "right", accent : true, pulse : true, note : monthYear(PAY_LAST) } ]}>
                    <Head>
                        The average UPI payment fell {pct(UPI_AVG_FALL)}% from its {monthYear(PAY_MONTHS[UPI_AVG_PEAK])} peak, to
                        ₹{fmtCr(UPI_AVG[LAST])} in {monthYear(PAY_LAST)}
                    </Head>
                    <Line>
                        In the RBI’s words, “UPI is mainly used for small value transactions”. A merchant fee on payments above ₹2,000
                        starts on 15 October 2026 (<a href="https://financialservices.gov.in/sites/default/files/2026-09/FAQs---Merchant-Discount-Rate--MDR--on-Select-UPI--P2M--Transactions_0.pdf">Ministry
                        of Finance</a>), after these figures.
                    </Line>
                    <Source>The value of UPI payments in the month divided by their number. DBIE, payment system indicators.</Source>
                </LineStep>
            </section>

            {/* 2 · DRAWING CASH ======================================================================================== */}
            <section className="rain is-split is-step" data-slide data-section="2">
                <SeasonStep values={SEASON_BY_MONTH} parts={SEASON_PARTS}>
                    <Head>
                        Currency in circulation grows from October to May and falls from July to September; {SEASON_PEAK} adds
                        {" "}{pct(SEASON_BY_MONTH[SEASON_PEAK_MM])}% on average
                    </Head>
                    <Line>The RBI links the rise to festivals, harvests and weddings, and the fall to a seasonal slack in construction and agriculture.</Line>
                    <Source>Change from the end of one month to the next, averaged over {SEASON_YEARS}. DBIE, reserve money components.</Source>
                </SeasonStep>
            </section>

            <section className="rain is-split is-step" data-slide data-section="2">
                <FestiveStep layout="left">
                    <Head>
                        The extra cash drawn in the three weeks before Diwali fell from {pct(festAvg(FEST_EARLY))}% of circulation
                        ({festSpan(FEST_EARLY)}) to {pct(festAvg(FEST_LATE))}% ({festSpan(FEST_LATE)})
                    </Head>
                    <Line>These are the years UPI spread; the data alone cannot show that one caused the other.</Line>
                    <Source>
                        Weekly currency in circulation against each year’s usual pace (DBIE); Diwali as in DoPT holiday lists.
                        {" "}{FESTIVE.leftOut.join(", ")} left out.
                    </Source>
                </FestiveStep>
            </section>

            <section className="rain is-grids" data-slide data-section="2">
                <GridsStage view="machines">
                    <Head>
                        In {monthYear(PAY_LAST)}, micro-ATMs outnumbered ATMs {times(ATM_N, MICRO_N)} to 1, but handled {pct(PAY.micro.volume[LAST])} crore
                        withdrawals against ATMs’ {pct(PAY.atm.volume[LAST])} crore
                    </Head>
                    <Line>
                        “Increase in digitalisation of payments has reduced the customers’ requirement of transacting with ATMs”
                        (<a href="https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=23639">RBI, December 2025</a>).
                    </Line>
                </GridsStage>
            </section>

            {/* 3 · THE NOTES =========================================================================================== */}
            <section className="rain is-grids" data-slide data-section="3">
                <GridsStage view="value">
                    <Head>
                        ATM withdrawals fell {pct(ATM_FALL)}% from {monthYear(PAY_FIRST)} to {monthYear(PAY_LAST)}, while the average
                        withdrawal rose {pct(ATM_TICKET_RISE)}%, to ₹{fmtCr(HEADLINE.atmTicket.to)}
                    </Head>
                    <Line>At a micro-ATM, the average withdrawal was ₹{fmtCr(MICRO_TICKET)} in {monthYear(PAY_LAST)}.</Line>
                </GridsStage>
            </section>

            <section className="rain is-split is-step" data-slide data-section="3">
                <NoteWallStep>
                    <Head>
                        ₹500 notes are {pct(share500(NOTES_LAST))}% of the value of banknotes in March {NOTES_LAST_YEAR}, up from
                        {" "}{pct(share500(NOTES_16))}% in March 2016
                    </Head>
                    <Line>
                        ₹1,000 notes ceased to be legal tender in November 2016. ₹2,000 notes were <a href="https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=55707">withdrawn
                        from circulation</a> from May 2023 and remain legal tender.
                    </Line>
                    <Source>Banknotes in circulation at the end of March, by value. RBI <a href={NOTES_LAST?.url}>Annual Report</a>, Table VIII.1.</Source>
                </NoteWallStep>
            </section>

            <section className="rain is-close" data-slide>
                <CloseStep
                    sides={[
                        { tone : "paying", times : HEADLINE.upi.to / HEADLINE.upi.from, icon : <HandImage width={110} />, unit : w => <HandImage width={w} />, unitWidth : 22,
                            each : `Each small phone: ${fmtCr(HEADLINE.upi.from)} crore payments, ${monthYear(PAY_FIRST)}’s month`,
                            caption : `UPI payments a month, ${monthYear(PAY_FIRST)} to ${monthYear(PAY_LAST)}: ${fmtCr(HEADLINE.upi.from)} crore to ${fmtCr(HEADLINE.upi.to)} crore` },
                        { tone : "keeping", times : CASH_LAST / CASH_2016, icon : <NoteIcon denom="500" value="500" width={200} />, unit : w => <NoteIcon denom="500" value="500" width={w} />, unitWidth : 64,
                            each : `Each small note: ₹${(CASH_2016 / 1e5).toFixed(1)} lakh crore, the currency in circulation in March 2016`,
                            caption : `Currency in circulation, March 2016 to March ${LAST_MARCH_YEAR}: ₹${(CASH_2016 / 1e5).toFixed(1)} lakh crore to ₹${(CASH_LAST / 1e5).toFixed(1)} lakh crore` },
                    ]}
                    facts={[
                        { value : `${pct(TIDE[TIDE.length - 1])}%`, label : `cash with the public as a share of GDP, ${TIDE_FYS[TIDE_FYS.length - 1]}` },
                        { value : `${USERS_TIMES}x`, label : `UPI users, ${monthYear(U0.month)} to ${monthYear(U1.month)}` },
                        { value : `−${pct(DEBIT_FALL)}%`, label : `debit-card payments a month, ${monthYear(PAY_FIRST)} to ${monthYear(PAY_LAST)}` },
                        { value : `${pct(festAvg(FEST_EARLY))}% → ${pct(festAvg(FEST_LATE))}%`, label : `extra cash drawn before Diwali, ${festSpan(FEST_EARLY)} to ${festSpan(FEST_LATE)}` },
                        { value : `₹${fmtCr(HEADLINE.atmTicket.to)}`, label : `the average ATM withdrawal, ${monthYear(PAY_LAST)}, up ${pct(ATM_TICKET_RISE)}%` },
                        { value : `${pct(share500(NOTES_LAST))}%`, label : `of the value of banknotes in ₹500 notes, March ${NOTES_LAST_YEAR}` },
                    ]}
                    note={<Line>
                        RBI research finds the demand for currency “influenced by the precautionary and store-of-value motives”,
                        while “the use of cash as a payment medium continues to fall” (<a href="https://www.rbi.org.in/Scripts/bs_viewcontent.aspx?Id=4344">RBI
                        Occasional Papers</a>).
                    </Line>}>
                    <Head>UPI payments grew {UPI_TIMES}x; currency in circulation grew {CASH_TIMES}x</Head>
                </CloseStep>
            </section>

            {/* SOURCES, METHOD, DOWNLOADS ============================================================================ */}
            <div className="page-foot">
                <Section id="phone-pays-sources">
                    <Row horizontalPadding="small" marginTop="none" allowUltraWide>
                        <Portion desktopSpan="24"><Divider kind="secondary" verticalMargin="micro" /></Portion>
                        <Portion desktopSpan="12">
                            <Text weight="600" size="tiny" verticalMargin="micro">SOURCES</Text>
                            <Text size="tiny" marginBottom="micro">
                                Reserve Bank of India, payment system indicators (new format), {monthYear(PAY_FIRST)} to {monthYear(PAY_LAST)}:
                                UPI, debit cards, ATM and micro-ATM withdrawals, and the number of ATMs and micro-ATMs. Reserve Bank of India,
                                reserve money components, monthly and weekly (currency in circulation), and average monetary aggregates
                                (currency with the public). Ministry of Statistics and Programme Implementation, nominal GDP on the 2011-12
                                base, as macro-economic aggregates. All as published on DBIE.
                            </Text>
                            <Text size="tiny" marginBottom="micro">
                                Not on DBIE: banknotes in circulation by denomination, RBI Annual Reports, Table VIII.1; UPI users, NPCI’s
                                counts as reported by PIB, the RBI and the Lok Sabha at eight dates; the dates of Diwali, DoPT holiday lists
                                for Central Government offices; and the events marked on the charts, from RBI and Government of India
                                documents, each linked where it is shown.
                            </Text>

                            <Text weight="600" size="tiny" className="downloads-head" verticalMargin="micro">DOWNLOADS</Text>
                            {DOWNLOADS.map(([ file, label ]) => (
                                <Link key={file} href={`/stories/the-phone-pays-the-cash-stays/${file}`} download className="download-link">
                                    <Div verticallyCentreItems>
                                        <Download size="16px" />
                                        <Text weight="600" marginLeft="nano" size="tiny">{label}</Text>
                                    </Div>
                                </Link>
                            ))}
                        </Portion>
                        <Portion desktopSpan="12">
                            <Text weight="600" size="tiny" verticalMargin="micro">METHOD</Text>
                            <Text size="tiny" marginBottom="nano">
                                Payments. The series begin in {monthYear(PAY_FIRST)}, when the RBI changed how they are counted, and are not
                                joined to earlier data. UPI includes transfers between people. Multiples (“{UPI_TIMES}x”) compare the first
                                month with the last.
                            </Text>
                            <Text size="tiny" marginBottom="nano">
                                Cash. Currency in circulation is all notes and coins issued, including the cash banks hold; currency with
                                the public leaves that out, and is used for the share of GDP. The shares use the 2011-12 GDP base that DBIE
                                carries; MoSPI moved GDP to a <a href="https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/feb/doc2026227806401.pdf">2022-23
                                base</a> on 27 February 2026, and they will be recomputed when its back series is published. A month of UPI
                                payments is a flow and the cash in circulation a stock: the two are shown side by side, never one as a
                                share of the other.
                            </Text>
                            <Text size="tiny" marginBottom="nano">
                                UPI users. Unique users onboarded, not monthly active users. The header compares official counts only,
                                {" "}{monthYear(U0.month)} ({U0.users} crore) and {monthYear(U1.month)} ({U1.users} crore); the wall joins the
                                counts with straight lines and holds the latest after it.
                            </Text>
                            <Text size="tiny" marginBottom="nano">
                                The blink. {fmtCr(PAY.upi.volume[LAST])} crore UPI payments in {monthYear(PAY_LAST)} over {DAYS_LAST} days is
                                about {fmtCr(PER_SECOND)} a second, or {fmtCr(PER_SECOND / 3)} in a blink, taken as a third of a second; the
                                wall rounds it to the thousand above.
                            </Text>
                            <Text size="tiny" marginBottom="nano">
                                Diwali. Currency in circulation each Friday; the three weeks up to the week of Diwali against that year’s
                                usual weekly growth, the mean over the 52 weeks ending ten weeks before. {FESTIVE.leftOut.slice(0, -1).join(", ")} and
                                {" "}{FESTIVE.leftOut[FESTIVE.leftOut.length - 1]} are left out (demonetisation, the refill and the pandemic).
                                Dussehra usually falls two or three weeks before Diwali and cannot be told apart from it.
                            </Text>
                            <Text size="tiny" marginBottom="nano">
                                Machines and notes. Each icon stands for a fixed amount, given under the grids. The notes in the cash grids
                                are coloured in the mix of ₹100 and larger banknotes in circulation that March, by number; the RBI does not
                                publish which notes machines pay out. The RBI prints one ₹500 row: the old series to March 2016, the new
                                from March 2017.
                            </Text>
                        </Portion>
                    </Row>
                </Section>
            </div>
        </Article>
    );
};


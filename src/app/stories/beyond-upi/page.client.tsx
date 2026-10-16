"use client";

// REACT CORE ==========================================================================================================
import Link from "next/link";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Div, Divider, Heading1, Heading4, Portion, Row, Section, Text } from "fictoan-react";
import { Download } from "lucide-react";

// LOCAL COMPONENTS ====================================================================================================
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";
import { SectionRail } from "./SectionRail";
import { CardWallStep, ChequeWallStep, CounterStep, GuessStep, PrepaidStep, SizesStep, TiltStep, TollStep, WallsStep } from "./Steps";
import { ChequebookStep } from "./Chequebook";
import { RtgsFlowStep } from "./RtgsFlow";
import { NeftClockStep } from "./NeftClock";
import { useSlidePaging } from "./paging";
import { LADDER, inr, monthName, rupees } from "./methods";

// DATA ================================================================================================================
import { FYS, HEADLINE, MONTHS, POS } from "./data.gen";

// the 3D stages load on their own, with three.js
const stage = (name : "TitleStage" | "TowerStage", cls : string) => dynamic(() => import("./Stages").then(m => m[name]), { ssr : false, loading : () => <div className={cls} /> });
const TitleStage = stage("TitleStage", "title-stage"), TowerStage = stage("TowerStage", "tower-stage");

// STYLES ==============================================================================================================
import "./beyond-upi.css";

// THE FIGURES IN THE HEADERS ==========================================================================================
// Every number the headers state comes from the generated data, printed at the precision the processor checked.
const H = HEADLINE, L = FYS.length - 1;
const RTGS = LADDER.find(r => r.key === "rtgs")!;
const pct = (v : number, dp = 1) => `${v.toFixed(dp)}%`;

const Head = ({ children } : { children : React.ReactNode }) => (
    <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">{children}</Heading4>
);
const Line = ({ children } : { children : React.ReactNode }) => <Text className="step-line" fontStyle="serif">{children}</Text>;
const Source = ({ children } : { children : React.ReactNode }) => <Text className="step-note" size="small">{children}</Text>;

const DOWNLOADS = [
    [ "payments-by-method-yearly.csv", "Payments by method, each year from 2015-16 (CSV)" ],
    [ "payments-by-method-monthly.csv", "Payments by method, each month from November 2019 (CSV)" ],
    [ "cheques-yearly.csv", "Cheques and other paper instruments since 1970-71 (CSV)" ],
    [ "cards-and-terminals-monthly.csv", "Cards, PoS machines and UPI QR codes by month (CSV)" ],
] as const;
const PSI = "DBIE, payment system indicators";

export const BeyondUpiPage = () => {
    useSlidePaging("#beyond-upi-page");
    return (
        <Article id="beyond-upi-page">
            <SectionRail />

            <section className="opening is-intro" data-slide>
                <TitleStage />
                <div className="hero">
                    <PageCrumbs />
                    <Heading1 className="hero-title" fontStyle="serif" weight="700" marginBottom="micro">
                        Beyond UPI: <span>everything else India pays with</span>
                    </Heading1>
                    <Text className="hero-dek" fontStyle="serif">
                        UPI made {pct(H.all.upiShareNumber)} of India’s payments in {H.fy}. Everything else, from a ₹{H.small.netcAvg} toll to bank transfers worth lakhs, carried {pct(100 - H.all.upiShareValue)} of the money.
                    </Text>
                </div>
                <span className="hero-cue" aria-hidden="true">↓</span>
            </section>

            {/* 1 · SIZES ============================================================================================== */}
            <section className="slide is-step" data-slide data-section="1">
                <GuessStep layout="left">
                    <Head>What does the average RTGS payment come to?</Head>
                    <Line>RTGS (Real Time Gross Settlement) is how banks move large sums, one payment at a time. How large is the average one? Pick the closest.</Line>
                </GuessStep>
            </section>

            <section className="slide is-sizes" data-slide data-section="1">
                <SizesStep>
                    <Head>Average payments in {H.fy} ran from ₹{H.small.netcAvg} for a toll to {rupees(RTGS.avg)} for RTGS</Head>
                    <Line>Each bar ends at the method’s average payment; each gridline is ten times the last. The thicker the bar, the larger the method’s share of all money paid.</Line>
                    <Source>Each method’s value over its number of payments, {H.fy}. {PSI}.</Source>
                </SizesStep>
            </section>

            <section className="slide is-stage" data-slide data-section="1">
                <TowerStage />
                <div className="stage-words">
                    <Head>The average RTGS payment was {inr(H.times)} times the average UPI payment in {H.fy}</Head>
                    <Line>Each average payment is laid out in ₹500 notes, a bundle being 100 notes, ₹50,000.</Line>
                    <Source>Each method’s value over its number of payments, {H.fy}; notes and coins of the current series. {PSI}.</Source>
                </div>
            </section>

            <section className="slide is-walls" data-slide data-section="1">
                <WallsStep>
                    <Head>RTGS carried {pct(H.rtgs.shareValue)} of payment value in {H.fy}, in {pct(H.rtgs.shareNumber, 2)} of payments</Head>
                    <Line>UPI made {pct(H.all.upiShareNumber)} of payments but carried {pct(H.all.upiShareValue)} of the money. The two walls play each month from November 2019.</Line>
                </WallsStep>
            </section>

            {/* 2 · LARGE TRANSFERS ==================================================================================== */}
            <section className="slide is-stage" data-slide data-section="2">
                <RtgsFlowStep>
                    <Head>RTGS moved ₹{H.day.rtgsValueLakhCrore.toFixed(2)} lakh crore a day in {H.fy}, in {H.day.rtgsLakh.toFixed(1)} lakh payments</Head>
                    <Line>Each RTGS payment settles on its own, at once, between the sending and receiving banks’ accounts at the RBI.</Line>
                    <Source>RTGS value and number for the year over 365 days. {PSI}.</Source>
                </RtgsFlowStep>
            </section>

            <section className="slide is-step" data-slide data-section="2">
                <NeftClockStep layout="left">
                    <Head>NEFT settled {H.day.neftCrore.toFixed(2)} crore payments a day in {H.fy}, in 48 half-hourly batches</Head>
                    <Line>
                        NEFT (National Electronic Funds Transfer) gathers payments and settles them every half hour; a NEFT payment averaged {rupees(H.neftAvg.to)}.
                        IMPS (Immediate Payment Service) credits each one at once; its average rose {H.impsAvg.times}x from {FYS[0]}, to {rupees(H.impsAvg.to)}.
                    </Line>
                    <Source>NEFT and IMPS by financial year, over 365 days. {PSI}.</Source>
                </NeftClockStep>
            </section>

            {/* 3 · PAPER ============================================================================================== */}
            <section className="slide is-step is-white" data-slide data-section="3">
                <ChequeWallStep layout="left">
                    <Head>Cheques peaked at {H.cheque.peak.toFixed(1)} crore in {H.cheque.peakFy}; there were {H.cheque.last.toFixed(1)} crore in {H.fy}</Head>
                    <Line>In {H.cheque.firstFy} there were {H.cheque.first.toFixed(1)} crore. Cheques and other paper were {pct(H.all.paperShareFrom)} of all payments in {FYS[0]}, and {pct(H.all.paperShareTo, 2)} in {H.fy}.</Line>
                </ChequeWallStep>
            </section>

            <section className="slide is-step" data-slide data-section="3">
                <ChequebookStep>
                    <Head>The average cheque has risen every year since {H.chequeAvg.risingSince}, to {rupees(H.chequeAvg.to)}</Head>
                    <Line>It was {rupees(H.chequeAvg.low)} in {H.chequeAvg.lowFy}. Cheques and drafts carried ₹{H.cheque.vLast.toFixed(1)} lakh crore in {H.fy}, all cleared through the cheque truncation system (CTS).</Line>
                    <Source>Paper-based instruments by financial year: value over number. {PSI}.</Source>
                </ChequebookStep>
            </section>

            {/* 4 · CARDS ============================================================================================== */}
            <section className="slide is-step" data-slide data-section="4">
                <CardWallStep layout="left">
                    <Head>Debit cards outnumber credit cards {H.cardRatio.held} to 1, but credit cards are used for {H.cardRatio.payments} times the payments</Head>
                    <Line>Credit-card payments first passed debit-card payments in {monthName(H.cardRatio.crossMonth)} and have stayed ahead every month since.</Line>
                </CardWallStep>
            </section>

            <section className="slide is-step" data-slide data-section="4">
                <CounterStep>
                    <Head>There were {H.qrPerPos} UPI QR codes for every PoS machine in March 2026</Head>
                    <Line>Point-of-sale (PoS) machines, where cards are tapped or swiped at a shop, rose from {H.pos.fromLakh.toFixed(1)} lakh in March 2021 to {H.pos.toLakh.toFixed(1)} lakh in March 2026, and stood at {(POS[POS.length - 1] ?? 0).toFixed(1)} lakh in {monthName(MONTHS[MONTHS.length - 1])}.</Line>
                    <Source>PoS machines and UPI QR codes, end of month. {PSI}.</Source>
                </CounterStep>
            </section>

            {/* 5 · SMALL PAYMENTS ===================================================================================== */}
            <section className="slide is-step" data-slide data-section="5">
                <PrepaidStep layout="left">
                    <Head>A Prepaid Payment Instrument (PPI) payment averaged ₹{H.small.ppiAvg} in {H.fy}, across {inr(H.small.ppiVolume / 100)} crore payments</Head>
                    <Line>PPIs are wallets and prepaid cards, loaded first and spent later: gift cards, metro cards, meal cards and app wallets.</Line>
                    <Source>Prepaid Payment Instruments (PPI): payments by financial year; instruments in issue at the month’s end. {PSI}.</Source>
                </PrepaidStep>
            </section>

            <section className="slide is-step" data-slide data-section="5">
                <TollStep>
                    <Head>A toll paid from a bank account averaged ₹{H.small.netcAvg} in {H.fy}, {H.day.tollLakh.toFixed(2)} lakh tolls a day</Head>
                    <Line>These are National Electronic Toll Collection (NETC) payments from a bank account, read off a FASTag at the toll; tolls paid from FASTag wallets count as PPI payments.</Line>
                    <Source>NETC (linked to a bank account) by financial year, over 365 days. {PSI}.</Source>
                </TollStep>
            </section>

            {/* THE CLOSE ============================================================================================== */}
            <section className="slide is-close" data-slide>
                <TiltStep>
                    <Head>From {FYS[0]} the average debit-card payment rose {H.debitAvg.times}x and the average cheque {H.chequeAvg.times}x</Head>
                    <Line>
                        Each line runs from a method’s average in {FYS[0]} (or its first year with a count) to {FYS[L]}. UPI and cash are the subject of <Link href="/stories/the-phone-pays-the-cash-stays">The phone pays, the cash stays</Link>;
                        bank credit to households, of <Link href="/stories/how-households-took-over-the-bank-loan-book">How households took over the bank loan book</Link>.
                    </Line>
                </TiltStep>
            </section>

            {/* SOURCES, METHOD, DOWNLOADS ============================================================================ */}
            <div className="page-foot">
                <Section id="beyond-upi-sources">
                    <Row horizontalPadding="small" marginTop="none" allowUltraWide>
                        <Portion desktopSpan="24"><Divider kind="secondary" verticalMargin="micro" /></Portion>
                        <Portion desktopSpan="12">
                            <Text weight="600" size="tiny" verticalMargin="micro">SOURCES</Text>
                            <Text size="tiny" marginBottom="micro">
                                Reserve Bank of India, payment system indicators, as published on DBIE: the annual table (new format) for
                                payments by method, {FYS[0]} to {H.fy}; the annual table (old format) for cheque clearances, 1970-71 to 2014-15;
                                and the monthly table, from November 2019, for payments by method, cards, PoS machines and UPI QR codes.
                            </Text>
                            <Text size="tiny" marginBottom="micro">
                                Dates and quotations: RBI press releases and circulars on RTGS (2004 and 2020), NEFT (2019) and the cheque
                                truncation system (2021); the RBI’s RTGS FAQ for the 30 minutes a receiving bank has to credit a payment; the RBI’s Payment System Report, December 2025; and the Ministry of Road Transport and
                                Highways on FASTag (Press Information Bureau, 14-02-2021). Each is linked where it is shown.
                            </Text>
                            <Text weight="600" size="tiny" className="downloads-head" verticalMargin="micro">DOWNLOADS</Text>
                            {DOWNLOADS.map(([ file, label ]) => (
                                <Link key={file} href={`/stories/beyond-upi/${file}`} download className="download-link">
                                    <Div verticallyCentreItems><Download size="16px" /><Text weight="600" marginLeft="nano" size="tiny">{label}</Text></Div>
                                </Link>
                            ))}
                        </Portion>
                        <Portion desktopSpan="12">
                            <Text weight="600" size="tiny" verticalMargin="micro">METHOD</Text>
                            <Text size="tiny" marginBottom="nano">
                                Averages. A method’s average payment is the year’s value over the year’s number. Volumes are in lakh payments
                                and values in ₹ crore as DBIE prints them. An average day is the year’s total over 365 days, and NEFT’s batch is
                                that day over its 48 batches.
                            </Text>
                            <Text size="tiny" marginBottom="nano">
                                Notes and walls. The note tower pays each average in the fewest notes and coins of the current series, with
                                ₹500 notes in bundles of 100; loose notes are drawn twice their thickness so one alone shows. On the walls a
                                tile is 10 crore payments or ₹1 lakh crore in the month; turned over, the same number of tiles is shared out by
                                value. A card on the card wall is one crore cards at the month’s end, a flash five crore payments. A leaf on the
                                cheque wall is one crore cheques; each bundle in the air over the RTGS banks, ₹10,000 crore. The cars at the
                                toll plaza are a picture, not a count.
                            </Text>
                            <Text size="tiny" marginBottom="nano">
                                Cheques. The old table’s cheque clearances run to 2014-15 and the new table’s paper-based instruments from
                                2015-16; both report the same number for 2015-16 (1,096 million, 10,964 lakh). DBIE does not split cheques from
                                drafts and other paper. The average cheque before 2015-16 is not shown: it is in each year’s rupees.
                            </Text>
                            <Text size="tiny" marginBottom="nano">
                                Cards. Cards, PoS machines and QR codes are month-end stocks and are never added across months. The RBI notes
                                that card data from November 2019 may not compare with earlier months. DBIE prints no PPI payment count
                                for September 2023; that month’s PPI tiles count as other.
                            </Text>
                            <Text size="tiny" marginBottom="nano">
                                Left out. Cash withdrawals are in “The phone pays, the cash stays”. DBIE has no separate series for bill
                                payments (BBPS), the e-rupee or FASTag wallets. Methods are shown side by side; nothing here says one caused a
                                change in another.
                            </Text>
                        </Portion>
                    </Row>
                </Section>
            </div>
        </Article>
    );
};

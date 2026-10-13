"use client";

// REACT CORE ==========================================================================================================
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Div, Divider, Heading1, Heading4, Portion, Row, Section, Text } from "fictoan-react";
import { Download } from "lucide-react";

// LOCAL COMPONENTS ====================================================================================================
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";
import { Board, type BoardRow } from "./Board";
import { TitleCoins } from "./TitleCoins";
import { GuessStep, HistoryStep, SlopeStep, SpreadStep } from "./StepsIn";
import { LandingStep } from "./Landing";
import { VaultStep, WINDOW_2026 } from "./StepsKept";
import { PackStep, StairsStep, StudyStep, TickerStep } from "./StepsOut";
import { CloseStep, ScaleStep } from "./Balance";
import { SectionRail } from "./SectionRail";
import { eventsFor, fyOf } from "./record";
import { useSlidePaging } from "./paging";
import { pct, usd } from "./stage";

// DATA ================================================================================================================
import { HEADLINE, LRS_FY, LRS_FYS, LRS_MONTHS, NRI, NRI_MONTHS, PRIVATE, PRIVATE_FYS, SURVEY } from "./data.gen";

// STYLES ==============================================================================================================
import "./money-in-money-out.css";

// THE FIGURES IN THE HEADERS ==========================================================================================
// Every number the headers state is worked out here from the generated data, to the precision it is printed at.
const H = HEADLINE;
const monthYear = (ym : string) => new Date(`${ym}-01T00:00:00`).toLocaleString("en-GB", { month : "long", year : "numeric" });
const at = (fy : string) => PRIVATE[PRIVATE_FYS.indexOf(fy)];
const lrs = (fy : string) => LRS_FY[LRS_FYS.indexOf(fy)];
const LAST = lrs(H.lastFy);
const share = (v : number) => pct(v / LAST.total * 100);
const LRS_TIMES = (H.lrsLast / H.lrsFirst).toFixed(1);
const STUDY_PEAK = LRS_FYS.reduce((b, fy) => (lrs(fy).study > lrs(b).study ? fy : b), LRS_FYS[0]);
const country = (s : string) => SURVEY.countries.find(c => c.short === s)!;
const STATES_5 = SURVEY.states.reduce((a, s) => a + (s.shares[2] ?? 0), 0);
const NRI_LAST = NRI_MONTHS.length - 1;
const NRI_NOW = NRI.nre[NRI_LAST] + NRI.fcnr[NRI_LAST] + NRI.nro[NRI_LAST];
const N = (s : string) => NRI_MONTHS.indexOf(s);

// the official record for each step that has one, placed in its series
const HISTORY_EVENTS = eventsFor("history", d => PRIVATE_FYS.indexOf(fyOf(d)));
const VAULT_EVENTS = eventsFor("vault", d => { const k = N(d.slice(0, 7)); return k >= 0 ? k : d > NRI_MONTHS[NRI_LAST] ? NRI_MONTHS.length : null; });
const STAIRS_EVENTS = eventsFor("stairs", () => 0);
const TICKER_EVENTS = eventsFor("ticker", d => { const k = LRS_MONTHS.indexOf(d.slice(0, 7)); return k >= 0 ? k : null; });

// the board: a row of three fields, the last flush right
const COLS = 36;
const line = (a : string, b : string, c : string) => { const left = `${a.padEnd(17)}${b}`; return left + c.padStart(COLS - left.length); };
const bn = (v : number) => `$${v.toFixed(1)} BN`;
const NRI_MARCH = `${H.nri.month.slice(5)}-${H.nri.month.slice(0, 4)}`;
const ROWS_IN : BoardRow[] = [
    { tag : "ARRIVALS", tone : "in", text : line("SENT HOME", H.lastFy, bn(H.privateLast)), short : `SENT HOME ${bn(H.privateLast)}` },
    { tone : "in", text : `FROM US ${country("US").shares[2]}%  UAE ${country("UAE").shares[2]}%  UK ${country("UK").shares[2]}%` },
    { tag : "KEPT", tone : "kept", text : line("NRI DEPOSITS", NRI_MARCH, bn(H.nri.total)), short : `NRI DEPOSITS ${bn(H.nri.total)}` },
    { tag : "DEPARTURES", tone : "out", text : line("SENT ABROAD", H.lastFy, bn(H.lrsLast)), short : `SENT ABROAD ${bn(H.lrsLast)}` },
    { tone : "out", text : `TRAVEL ${share(LAST.travel)}  FAMILY ${share(LAST.relatives)}  GIFTS ${share(LAST.gifts)}` },
];
const ROWS_CLOSE : BoardRow[] = [ ROWS_IN[0], ROWS_IN[2], ROWS_IN[3], { tag : "BALANCE", tone : "plain", text : `$${H.balance} OUT FOR EVERY $100 IN`, short : `$${H.balance} OUT PER $100 IN` } ];

// A slide's header and its one line of words. Every slide says its message in the header; the line under it adds one
// fact or an official document's own words.
const Head = ({ children } : { children : React.ReactNode }) => (
    <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">{children}</Heading4>
);
const Line = ({ children } : { children : React.ReactNode }) => <Text className="step-line" fontStyle="serif">{children}</Text>;
const Source = ({ children } : { children : React.ReactNode }) => <Text className="step-note" size="small">{children}</Text>;

const DOWNLOADS = [
    [ "money-in-yearly.csv", "Money sent home and gross FDI by year (CSV)" ],
    [ "nri-deposits-monthly.csv", "NRI deposits by month and account (CSV)" ],
    [ "lrs-by-purpose-yearly.csv", "Money sent abroad under the LRS, by purpose and year (CSV)" ],
    [ "lrs-monthly.csv", "Money sent abroad under the LRS, by month (CSV)" ],
    [ "remittance-survey-shares.csv", "Shares by country and state, RBI survey (CSV)" ],
] as const;

export const MoneyPage = () => {
    useSlidePaging("#money-in-money-out-page");
    return (
        <Article id="money-in-money-out-page">
            <SectionRail />

            <section className="opening" data-slide>
                <div className="title-stage"><TitleCoins /></div>
                <div className="hero">
                    <PageCrumbs />
                    <Heading1 className="hero-title" fontStyle="serif" weight="700" marginBottom="micro">
                        <span className="hero-line is-in">{"Money in,".split("").map((ch, i) => <span key={i} className="hero-ch" style={{ animationDelay : `${1.6 + i * 0.05}s` }}>{ch}</span>)}</span>
                        <span className="hero-line is-out">{"money out".split("").map((ch, i) => <span key={i} className="hero-ch" style={{ animationDelay : `${2.1 + i * 0.05}s` }}>{ch}</span>)}</span>
                    </Heading1>
                    <Text className="hero-dek" fontStyle="serif">
                        Indians abroad send money home. Indians at home send money out. Both cross the same border.
                    </Text>
                </div>
                <span className="hero-cue" aria-hidden="true">↓</span>
            </section>

            {/* THE BOARD ========================================================================================== */}
            <section className="slide is-board" data-slide>
                <div className="arrivals">
                    <Head>
                        In {H.lastFy}, Indians abroad sent home {usd(H.privateLast)}, and Indians at home sent {usd(H.lrsLast)} abroad
                    </Head>
                    <Board rows={ROWS_IN} big head={[ "✈ MONEY IN, MONEY OUT", "DBIE · RESERVE BANK OF INDIA" ]} label={`Arrivals: money sent home, ${usd(H.privateLast)} in ${H.lastFy}. Kept: NRI deposits, ${usd(H.nri.total)} in ${monthYear(H.nri.month)}. Departures: sent abroad under the LRS, ${usd(H.lrsLast)} in ${H.lastFy}.`} />
                    <Line>
                        US: the United States; UAE: the United Arab Emirates; UK: the United Kingdom. NRI: non-resident Indian. Sent
                        abroad: under the Liberalised Remittance Scheme (LRS), which lets residents send money out each year.
                    </Line>
                    <Source>
                        Private transfers received, NRI deposits outstanding and LRS remittances, Database on Indian Economy (DBIE);
                        shares of money sent home by country, <a href={SURVEY.url}>Reserve Bank of India (RBI) Bulletin</a>, 19-03-2025.
                        Tap the board to flip it again.
                    </Source>
                </div>
            </section>

            {/* 1 · MONEY IN ============================================================================================ */}
            <section className="slide is-step" data-slide data-section="1">
                <GuessStep layout="left">
                    <Head>Which brought India more foreign money in {H.bothFy}: foreign companies investing, or Indians abroad sending money home?</Head>
                </GuessStep>
            </section>

            <section className="slide is-step" data-slide data-section="1">
                <HistoryStep layout="top" events={HISTORY_EVENTS}>
                    <Head>
                        Money sent home rose from {usd(H.seventies.from)} in 1973-74 to {usd(H.seventies.to)} in 1980-81, and
                        to {usd(H.privateLast)} by {H.lastFy}
                    </Head>
                    <Line>
                        It rose {pct(H.record.rise)} in {H.record.fy} alone, to {usd(H.record.value)}. For 1991, see <Link href="/stories/debt-to-service-ratio">The long walk back from 1991</Link>.
                    </Line>
                    <Source>Private transfers received, US$, by financial year. DBIE, invisibles by category of transactions.</Source>
                </HistoryStep>
            </section>

            <section className="slide is-step" data-slide data-section="1">
                <SpreadStep layout="top">
                    <Head>
                        Over {H.steady.years} years, money sent home moved {pct(H.steady.private)} in a typical year and FDI {pct(H.steady.fdi)};
                        {" "}in the pandemic year 2020-21 it dipped {pct(-H.pandemic.private)}
                    </Head>
                    <Line>It fell in {H.steady.privateFalls} of the {H.steady.years} years, FDI in {H.steady.fdiFalls}. In 2020-21 money sent abroad under the LRS fell {pct(-H.pandemic.lrs)}.</Line>
                    <Source>Standard deviation of the change on the year before, {H.steady.from} to {H.steady.to}. Private transfers and gross FDI inflows, DBIE.</Source>
                </SpreadStep>
            </section>

            <section className="slide is-step" data-slide data-section="1">
                <SlopeStep layout="left">
                    <Head>
                        In {SURVEY.rounds[2]} the US sent {pct(country("US").shares[2]!)} of India’s remittances and the UAE {pct(country("UAE").shares[2]!)};
                        {" "}in {SURVEY.rounds[0]} the UAE led, with {pct(country("UAE").shares[0]!)}
                    </Head>
                    <Line>The RBI’s survey finds that the Gulf countries “together contributed {SURVEY.gcc} per cent” in {SURVEY.rounds[2]}.</Line>
                    <Source>Shares of inward remittances by source country. <a href={SURVEY.url}>RBI Bulletin</a>, 19-03-2025, rounds 4 and 6 of the remittances survey.</Source>
                </SlopeStep>
            </section>

            <section className="slide is-step" data-slide data-section="1">
                <LandingStep layout="top">
                    <Head>
                        It landed first in Maharashtra ({pct(SURVEY.states[0].shares[2]!)}) and Kerala ({pct(SURVEY.states[1].shares[2]!)});
                        {" "}five states received {pct(STATES_5)}
                    </Head>
                    <Line>
                        Move through the survey’s rounds: in {SURVEY.rounds[1]}, Maharashtra received {pct(SURVEY.states[0].shares[1]!)} and
                        {" "}Kerala {pct(SURVEY.states[1].shares[1]!)}.
                    </Line>
                    <Source>
                        Shares of inward remittances by source country and by state. <a href={SURVEY.url}>RBI Bulletin</a>, 19-03-2025,
                        rounds 4 to 6 of the remittances survey. The survey does not say who sends to which state.
                    </Source>
                </LandingStep>
            </section>

            {/* 2 · MONEY KEPT ========================================================================================== */}
            <section className="slide is-step" data-slide data-section="2">
                <VaultStep mode="all" events={[]}>
                    <Head>
                        Indians abroad kept {usd(H.nri.total)} in Indian bank deposits at the end of {monthYear(H.nri.month)}, {H.nri.times.toFixed(2)}x a
                        year’s money sent home
                    </Head>
                    <Line>By {monthYear(NRI_MONTHS[NRI_LAST])} it was {usd(NRI_NOW)}.</Line>
                    <Source>NRI deposits outstanding, end of month, the three accounts summed. DBIE.</Source>
                </VaultStep>
            </section>

            <section className="slide is-step" data-slide data-section="2">
                <VaultStep mode="fcnr" layout="left" events={VAULT_EVENTS}>
                    <Head>
                        Twice the RBI opened a window for dollar deposits: FCNR(B) deposits rose {usd(H.window2013.rise)} after September 2013,
                        {" "}and the 2026 window drew {usd(WINDOW_2026, 2)} in under eleven weeks
                    </Head>
                    <Line>Between the two, as the 2013 swaps unwound in September to November 2016, FCNR(B) deposits fell {usd(H.unwind2016.fall)}.</Line>
                    <Source>
                        FCNR(B) deposits, end of month, DBIE (to {monthYear(NRI_MONTHS[NRI_LAST])}). The 2026 block is the Ministry of Finance’s figure
                        as on 21-08-2026 (<a href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2302879">PIB, 24-08-2026</a>), not DBIE data.
                    </Source>
                </VaultStep>
            </section>

            {/* 3 · MONEY OUT =========================================================================================== */}
            <section className="slide is-step" data-slide data-section="3">
                <StairsStep layout="top" events={STAIRS_EVENTS}>
                    <Head>
                        One resident may send $250,000 abroad a year; the limit began at $25,000 on 04-02-2004 and was cut once,
                        to $75,000 on 14-08-2013
                    </Head>
                    <Line>The cut came three weeks before the RBI opened the 2013 window for dollar deposits.</Line>
                    <Source>The Liberalised Remittance Scheme limit, per person per financial year. <a href="https://rbi.org.in/scripts/BS_ViewMasDirections.aspx?id=10192">RBI Master Direction</a>, list of circulars.</Source>
                </StairsStep>
            </section>

            <section className="slide is-step" data-slide data-section="3">
                <PackStep layout="top">
                    <Head>
                        Indians sent {usd(H.lrsLast)} abroad under the LRS in {H.lastFy}, {LRS_TIMES}x {H.lrsFirstFy}; travel was
                        {" "}{usd(LAST.travel)} of it, {pct(H.travelShare)}
                    </Head>
                    <Line>
                        Card spending abroad up to ₹7 lakh a year is kept outside the LRS (<a href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=1925592">Ministry
                        of Finance, 19-05-2023</a>), so this is not all travel spending.
                    </Line>
                    <Source>Outward remittances under the LRS by purpose, {H.lastFy}. DBIE.</Source>
                </PackStep>
            </section>

            <section className="slide is-step" data-slide data-section="3">
                <StudyStep layout="left">
                    <Head>Money sent for study abroad peaked at {usd(lrs(STUDY_PEAK).study)} in {STUDY_PEAK} and was {usd(LAST.study)} in {H.lastFy}</Head>
                    <Line>
                        From 01-04-2025, no tax is collected at source on remittances for study paid from an education loan
                        (<a href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2098362">Budget 2025-26</a>).
                    </Line>
                    <Source>Outward remittances under the LRS for studies abroad, by financial year. DBIE.</Source>
                </StudyStep>
            </section>

            <section className="slide is-step" data-slide data-section="3">
                <TickerStep layout="top" events={TICKER_EVENTS}>
                    <Head>
                        In the month tax collected at source began, and in the month it rose, money sent abroad fell: {pct(H.tcs.y2020)} in
                        October 2020, {pct(H.tcs.y2023)} in October 2023
                    </Head>
                    <Line>The figures sit side by side; the data alone cannot say how much of each fall the tax explains.</Line>
                    <Source>Outward remittances under the LRS, each month, {monthYear(LRS_MONTHS[0])} to {monthYear(LRS_MONTHS[LRS_MONTHS.length - 1])}. DBIE.</Source>
                </TickerStep>
            </section>

            {/* 4 · THE BALANCE ========================================================================================= */}
            <section className="slide is-step" data-slide data-section="4">
                <ScaleStep>
                    <Head>For every $100 that came into India from Indians abroad in {H.lastFy}, ${H.balance} went out of India under the LRS</Head>
                    <Line>{usd(H.privateLast)} came in as private transfers; {usd(H.lrsLast)} left as remittances under the LRS.</Line>
                    <Source>Private transfers received and LRS remittances, {H.lastFy}, US$. DBIE.</Source>
                </ScaleStep>
            </section>

            <section className="slide is-close" data-slide>
                <CloseStep rows={ROWS_CLOSE}
                    facts={[
                        { value : `${H.times.toFixed(2)}x`, label : `money sent home against gross FDI, ${H.bothFy}` },
                        { value : `${pct(H.steady.private)} vs ${pct(H.steady.fdi)}`, label : `a typical year’s move, money sent home against FDI` },
                        { value : pct(country("US").shares[2]!), label : `of remittances from the US, ${SURVEY.rounds[2]}` },
                        { value : usd(WINDOW_2026, 2), label : "FCNR(B) deposits drawn by the 2026 window, to 21-08-2026" },
                        { value : pct(H.travelShare), label : `of money sent abroad under the LRS went on travel, ${H.lastFy}` },
                        { value : `−${pct(H.tcs.y2023)}`, label : "money sent abroad in October 2023, the month the higher tax began" },
                    ]}
                    note={<Line>
                        The Ministry of Finance said the 2026 window showed that the diaspora “have reposed faith in the Indian banking
                        system” (<a href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2302879">PIB, 24-08-2026</a>).
                    </Line>}>
                    <Head>{usd(H.privateLast)} in; {usd(H.nri.total)} kept; {usd(H.lrsLast)} out</Head>
                </CloseStep>
            </section>

            {/* SOURCES, METHOD, DOWNLOADS ============================================================================ */}
            <div className="page-foot">
                <Section id="money-sources">
                    <Row horizontalPadding="small" marginTop="none" allowUltraWide>
                        <Portion desktopSpan="24"><Divider kind="secondary" verticalMargin="micro" /></Portion>
                        <Portion desktopSpan="12">
                            <Text weight="600" size="tiny" verticalMargin="micro">SOURCES</Text>
                            <Text size="tiny" marginBottom="micro">
                                Reserve Bank of India, as published on DBIE: invisibles by category of transactions (private transfers
                                received, {PRIVATE_FYS[0]} to {H.lastFy}); foreign investment inflows (gross FDI); outward remittances under the
                                Liberalised Remittance Scheme, by purpose, monthly; NRI deposits outstanding, monthly, by account.
                            </Text>
                            <Text size="tiny" marginBottom="micro">
                                Not on DBIE: the shares by source country and destination state, from the RBI’s remittances survey
                                (<a href={SURVEY.url}>RBI Bulletin, 19-03-2025</a>); the FCNR(B) deposits drawn by the 2026 window, from the
                                Ministry of Finance (Press Information Bureau, PIB, 24-08-2026); the LRS limits, from the RBI’s circulars; and the events marked on
                                the charts, from RBI and Government of India documents, each linked where it is shown.
                            </Text>

                            <Text weight="600" size="tiny" className="downloads-head" verticalMargin="micro">DOWNLOADS</Text>
                            {DOWNLOADS.map(([ file, label ]) => (
                                <Link key={file} href={`/stories/money-in-money-out/${file}`} download className="download-link">
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
                                Money sent home. The story uses private transfers received in India’s balance of payments, which the
                                Ministry of Finance reports as inward remittances. It includes local withdrawals from NRI deposits.
                                Compensation of employees ({usd(H.comp)} in {H.lastFy}) is counted as income, not here.
                            </Text>
                            <Text size="tiny" marginBottom="nano">
                                Steadiness. The typical year’s move is the standard deviation of the change on the year before, over
                                {" "}{H.steady.from} to {H.steady.to}, the years DBIE carries gross FDI for both a year and the one before.
                            </Text>
                            <Text size="tiny" marginBottom="nano">
                                The survey. Shares come from banks’ reports to the RBI. For {SURVEY.rounds[2]} they cover transfers for family
                                maintenance and savings and local withdrawals from NRI accounts. The survey gives countries and states
                                separately, so no country is joined to a state.
                            </Text>
                            <Text size="tiny" marginBottom="nano">
                                NRI deposits. Non-Resident External (NRE), Foreign Currency Non-Resident (Banks) (FCNR(B)) and
                                Non-Resident Ordinary (NRO) accounts summed. DBIE’s own yearly total for March 2026 reads five
                                times that sum, so it is not used; its monthly total agrees with the sum in every month shown.
                            </Text>
                            <Text size="tiny" marginBottom="nano">
                                Money sent abroad. Before June 2015 several purposes had limits of their own and are missing from the
                                LRS figures; they were folded into the LRS on 26-05-2015, so monthly figures start in June 2015 and
                                purposes in {LRS_FYS[0]}. The falls in October 2020 and October 2023 compare each month with the month
                                before.
                            </Text>
                        </Portion>
                    </Row>
                </Section>
            </div>
        </Article>
    );
};

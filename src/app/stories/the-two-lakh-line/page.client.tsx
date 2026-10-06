"use client";

// REACT CORE ==========================================================================================================
import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";

// UI ==================================================================================================================
import { Article, Button, Card, Div, Divider, Heading1, Heading4, Heading6, Portion, Row, Section, Table, Text } from "fictoan-react";
import { BookOpen, Download, Table2 } from "lucide-react";
import { MotionConfig } from "framer-motion";

// LOCAL COMPONENTS ====================================================================================================
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";
import { Figure } from "./chartKit";
import { DistrictsChart } from "./DistrictsChart";
import { HBars } from "./HBars";
import { LineStage } from "./LineStage";
import { CountUp, LetterRise, Reveal, WordReveal } from "./Motion";
import { PyramidChart } from "./PyramidChart";
import { SaveBorrowChart } from "./SaveBorrowChart";
import { SeriesPanels } from "./SeriesPanels";
import { SmallCardsChart } from "./SmallCardsChart";
import { SmallGroupsChart } from "./SmallGroupsChart";
import { TileMap, type TileDatum } from "./TileMap";
import type { SceneId } from "./stageLayout";

// DATA ================================================================================================================
import {
    BAND_NAMES, BANDS, BANK_GROUPS, BELOW, BELOW_BANDS, BOOK, DISTRICT_HISTORY, DISTRICT_SHARES, DISTRICTS, DOTS_BELOW, ENTRY,
    LOAN_DOTS, MUMBAI_IN_MAHARASHTRA, PEAK_INDEX, PRICE, Q_FIRST, Q_LAST, Q_PEAK, RATE_2014, RATE_OCCUPATIONS, SANCTION,
    SAVE_BORROW, SERIES, SERIES_DOTS, SMALL_CARDS, SMALL_PURPOSE, SMALL_PURPOSE_CHANGE, SMALL_SERIES, SMALLEST, STAGE_GROUPS,
    STATE_SMALL, STATES, TOP, TO_FIVE_LAKH, WALR, WHERE_THEY_WENT, WOMEN, WOMEN_DISTRICTS_FALLS, WOMEN_STATES, bandShares,
    crore, croreN, in100, inr, lakhCrore, list, monthName, monthsWords, numberWord, pct, rupees, seriesAt, shareOf, span,
    stateNamed, timesWords,
} from "./data";

// STYLES ==============================================================================================================
import "./the-two-lakh-line.css";

// THE WORDS ===========================================================================================================
// The sentences are template strings over the derived figures, so a refresh of the data rewrites them; prose()
// folds the line breaks of the source into single spaces and keeps a figure on the same line as its unit.
const prose = (s : string) => s.replace(/\s+/g, " ").trim().replace(/(\d) (lakh|crore)\b/g, "$1 $2");
const cap = (s : string) => s.charAt(0).toUpperCase() + s.slice(1);
const yearOf = (quarter : string) => quarter.split(" ")[1];
const sum = (xs : number[]) => xs.reduce((s, v) => s + v, 0);
// A count in crore to one decimal even below a crore: 6915478 → "0.7 crore".
const croreAbout = (n : number) => `${(n / 1e7).toFixed(1)} crore`;

const N = SERIES_DOTS.length;
const rural = STAGE_GROUPS[0], metro = STAGE_GROUPS[3];
const perLoan = Math.round(SAVE_BORROW.depositAccounts / SAVE_BORROW.creditAccounts);
const perPerson = SAVE_BORROW.perPerson >= 1.75 && SAVE_BORROW.perPerson < 2 ? "nearly two" : `about ${SAVE_BORROW.perPerson.toFixed(1)}`;
const widestInVillages = STAGE_GROUPS.every(g => g.ratio <= rural.ratio);
const q17 = seriesAt(Q_FIRST.key), q20 = seriesAt("2020-03"), qLast = seriesAt(Q_LAST.key);
const first = SERIES_DOTS[0], at2020 = SERIES_DOTS[q20.index], peak = SERIES_DOTS[PEAK_INDEX], last = SERIES_DOTS[N - 1];
const lowestBorrowers = SERIES_DOTS.every(q => q.borrowers >= last.borrowers - 1e-9);
const lowestShare = SERIES_DOTS.every(q => q.share >= last.share - 1e-9);
const ACTUAL = Math.round(BELOW.outstandingShare);
// The guess against the answer, once the reader has locked one in.
const guessVerdict = (g : number) => {
    if (g === ACTUAL) return `Your guess of ₹${g} was exactly right.`;
    if (g === 0) return `Your guess was ₹0. The answer is ₹${ACTUAL}.`;
    const r = g > ACTUAL ? g / ACTUAL : ACTUAL / g;
    if (r < 1.5) return `Your guess of ₹${g} was close to the answer, ₹${ACTUAL}.`;
    return g > ACTUAL ? `Your guess of ₹${g} was ${timesWords(r)} the answer, ₹${ACTUAL}.` : `The answer, ₹${ACTUAL}, is ${timesWords(r)} your guess of ₹${g}.`;
};
const since2017 = yearOf(q17.quarter);
// "the end of 2024" when the high point is a December, else the month itself
const peakWhen = Q_PEAK.quarter.startsWith("Dec") ? `the end of ${yearOf(Q_PEAK.quarter)}` : monthName(Q_PEAK.quarter);
const fallIn = monthsWords(SERIES.fallMonths);

// Below the line, the money lent at 7 to 9% a year (Table 2.1's "7–8%" and "8–9%" ranges), much of it crop loans at
// the subsidised 7%.
const belowMoneyByRange = BELOW_BANDS.map(i => BANDS[i].rateOutstanding).reduce((acc, r) => acc.map((v, k) => v + r[k]), Array<number>(10).fill(0));
const below7to9 = 100 * (belowMoneyByRange[3] + belowMoneyByRange[4]) / sum(belowMoneyByRange);
// Credit cards among the loans at 13% or more, the share of the other loans at that rate, and the share of card
// balances that sit in the open top range (Table 3.3).
const cardsOfAt13   = 100 * PRICE.cardsAt13 / PRICE.allAt13;
const othersAt13    = 100 * (PRICE.allAt13 - PRICE.cardsAt13) / (sum(RATE_OCCUPATIONS.total.accounts) - sum(RATE_OCCUPATIONS.creditCards.accounts));
const cardMoneyAt13 = 100 * RATE_OCCUPATIONS.creditCards.outstanding[9] / sum(RATE_OCCUPATIONS.creditCards.outstanding);
// What the small borrowal accounts are for (Table 1.13): farm loans and personal loans as shares of them all.
const smallFor = (name : string) => {
    const r = SMALL_PURPOSE.find(x => x.occupation === name);
    if (!r) throw new Error(`no ${name} in SMALL_PURPOSE`);
    return r.rural.accounts + r.semiUrban.accounts + r.urban.accounts;
};
const farmShareOfSmall     = 100 * smallFor("Agriculture") / smallFor("Total");
const personalShareOfSmall = 100 * smallFor("Personal loans") / smallFor("Total");
// The regional rural banks' small loans: the yearly March 2026 count, which includes them, less the quarterly one.
const qMarch26 = seriesAt("2026-03");
const RRB = { small : BELOW.accounts - qMarch26.total.small, money : BELOW.outstanding - qMarch26.total.smallOutstanding };
// Loans above the line: their rise in the same span before the peak as after it, and their growth since 2017; and
// loans of every size, peak to latest.
const aboveLine = (s : typeof SMALL_SERIES[number]) => s.total.accounts - s.total.small;
const beforePeak = SMALL_SERIES[Math.max(0, PEAK_INDEX - (N - 1 - PEAK_INDEX))];
const aboveRiseBefore = aboveLine(Q_PEAK) - aboveLine(beforePeak);
const aboveGrowth = aboveLine(Q_LAST) / aboveLine(Q_FIRST);
const allSizesChange = Q_LAST.total.accounts - Q_PEAK.total.accounts;
// Credit cards below the line in every kind of place, peak to latest (Table 3.5a); when they grew, the other kinds of
// small loan fell by more than the total did.
const cardRows = SMALL_PURPOSE_CHANGE.filter(r => r.purpose === "Credit cards");
const cardsChange = sum(cardRows.map(r => r.accountsNow)) - sum(cardRows.map(r => r.accountsThen));
const nonCardFall = SERIES.fewer + cardsChange;
// Credit cards as a share of all small loans in the latest quarter of the same table.
const cardsNowQuarter = SMALL_SERIES.find(s => s.quarter === cardRows[0]?.to) ?? Q_LAST;
const cardShareOfSmallNow = 100 * sum(cardRows.map(r => r.accountsNow)) / cardsNowQuarter.total.small;
// The peak's year: its March quarter, whether the quarters between ran below it, and for how long.
const marchIndex = SMALL_SERIES.findIndex(s => s.key === `${Q_PEAK.key.slice(0, 4)}-03`);
const marchOfPeakYear = marchIndex >= 0 && marchIndex < PEAK_INDEX ? SMALL_SERIES[marchIndex] : null;
const flatBeforePeak = marchOfPeakYear !== null && SMALL_SERIES.slice(marchIndex + 1, PEAK_INDEX).every(s => s.total.small < marchOfPeakYear.total.small);
const flatFor = monthsWords(3 * (PEAK_INDEX - marchIndex));
// The one-quarter entry of a fintech's loans in December 2024 (ENTRY): the small finance banks' urban small loans and
// Assam's loan accounts step up by about 0.7 crore in the same quarter, more than the peak's margin over March.
const entryStep = ENTRY.sfbUrbanSmallStep;
const peakOnEntry = Q_PEAK.key === ENTRY.key && marchOfPeakYear !== null && Q_PEAK.total.small - marchOfPeakYear.total.small < entryStep;
// Small loans in the big cities: the quarter they peaked.
const metroPeak = SMALL_SERIES.reduce((b, s) => (s.metro.small > b.metro.small ? s : b), SMALL_SERIES[0]);
// Consumer-durable accounts in the big cities: the money on them, peak to latest.
const durRow = SMALL_PURPOSE_CHANGE.find(r => r.group === "metro" && r.purpose === "Consumer durables");
const durMoneyChange = durRow ? 100 * (durRow.outstandingNow - durRow.outstandingThen) / durRow.outstandingThen : 0;
const durMoneyWords = Math.abs(durMoneyChange) < 5 ? "hardly moved" : `${durMoneyChange < 0 ? "fell" : "rose"} by ${pct(Math.abs(durMoneyChange), 0)}`;
// The bank groups (Table 2.1): the small finance banks' share of the rise in small loans since the series began, and
// the villages' loans, peak to latest, at the public-sector banks against the private and small finance banks.
const smallRise = Q_LAST.total.small - Q_FIRST.total.small;
const sfbShareOfRise = 100 * (BANK_GROUPS.find(b => b.key === Q_LAST.key)?.smallFinance.total?.small ?? 0) / smallRise;
const bgPeak = BANK_GROUPS.find(b => b.key === Q_PEAK.key), bgLast = BANK_GROUPS.find(b => b.key === Q_LAST.key);
type BankGroup = "public" | "private" | "smallFinance" | "foreign";
const ruralChange = (g : BankGroup) => (bgLast?.[g].rural?.accounts ?? 0) - (bgPeak?.[g].rural?.accounts ?? 0);
const ruralSmallChange = (g : BankGroup) => (bgLast?.[g].rural?.small ?? 0) - (bgPeak?.[g].rural?.small ?? 0);
const ruralPublicChange = ruralChange("public");
const ruralPrivateSfbFall = -(ruralChange("private") + ruralChange("smallFinance"));
const ruralSmallPrivateSfbFall = -(ruralSmallChange("private") + ruralSmallChange("smallFinance"));
// Credit cards (Table 3.5a) as a share of the rise in small loans since the series began.
const cardsShareOfRise = 100 * (SMALL_CARDS[SMALL_CARDS.length - 1].accounts - SMALL_CARDS[0].accounts) / smallRise;
// The Reserve Bank's own weighted rate on credit cards (Table 1.9), the March 2026 quarter.
const cardRate = WALR.find(w => w.key === "2026-03")?.creditCards ?? WALR[0].creditCards;
// The district return in 2010 (DISTRICT_HISTORY runs from 2010).
const in2010 = DISTRICT_HISTORY[0];
// The regional rural banks' share of a state's loans: the yearly return (with them) against the quarterly (without),
// March 2026.
const rrbShare = (name : string) => {
    const annual = STATE_SMALL.find(x => x.name === name), quarterly = stateNamed(name);
    return annual ? 100 * (1 - quarterly.accounts / (annual.accounts * 1e3)) : 0;
};

// THE OPENING =========================================================================================================
const STEPS : SceneId[] = [
    "hero", "save", "borrow", "groups", "accounts", "guess", "money", "top", "priceMoney", "priceAccounts",
    "seriesStart", "seriesGrowth", "seriesPeak", "seriesFall", "seriesCards",
];
const SERIES_STEPS : { id : SceneId; pos : number }[] = [
    { id : "seriesStart", pos : 0 }, { id : "seriesGrowth", pos : q20.index }, { id : "seriesPeak", pos : PEAK_INDEX }, { id : "seriesFall", pos : N - 1 }, { id : "seriesCards", pos : N - 1 },
];
const clamp = (v : number, lo : number, hi : number) => Math.max(lo, Math.min(hi, v));

// A hundred coins, the rupees of every ₹100 lent: `filled` lit, `guess` outlined.
const Coins = ({ filled, guess, tone } : { filled : number; guess ? : number | null; tone : "guess" | "actual" }) => (
    <div className={`coins tone-${tone}`} role="img" aria-label={guess != null ? `₹${filled} of ₹100, against a guess of ₹${guess}` : `₹${filled} of ₹100`}>
        {Array.from({ length : 100 }, (_, i) => (
            <i key={i} className={`coin ${i < filled ? "is-filled" : ""} ${guess != null && i < guess ? "is-guess" : ""}`} style={{ transitionDelay : `${i * 5}ms` }} />
        ))}
    </div>
);

const StepCard = ({ active, kicker, big, title, children } : { active : boolean; kicker : string; big ? : ReactNode; title : ReactNode; children ? : ReactNode }) => (
    <Card className={`step-card ${active ? "is-active" : ""}`} padding="micro">
        <Text className="step-kicker" weight="600" size="small" marginBottom="nano">{kicker}</Text>
        {big && <div className="step-big">{big}</div>}
        <Heading6 className="step-title" fontStyle="serif" weight="600" marginBottom="nano">{title}</Heading6>
        {children}
    </Card>
);

const Say = ({ children, marginTop, marginBottom } : { children : string; marginTop ? : "nano"; marginBottom ? : "nano" }) => <Text fontStyle="serif" marginTop={marginTop} marginBottom={marginBottom}>{prose(children)}</Text>;

const TheOpening = () => {
    const [ scene, setScene ] = useState<SceneId>("hero");
    const [ seriesPos, setSeriesPos ] = useState(0);
    const [ guess, setGuess ] = useState(30);
    const [ locked, setLocked ] = useState<number | null>(null);
    const stepRefs = useRef<Record<string, HTMLElement | null>>({});

    // Each step claims the stage as it crosses the middle of the screen.
    useEffect(() => {
        const io = new IntersectionObserver((entries) => {
            for (const e of entries) if (e.isIntersecting) setScene((e.target as HTMLElement).dataset.scene as SceneId);
        }, { rootMargin : "-45% 0px -45% 0px", threshold : 0 });
        Object.values(stepRefs.current).forEach(el => el && io.observe(el));
        return () => io.disconnect();
    }, []);

    // In the quarterly scenes the playhead is continuous: card i is at the middle of the screen exactly when the
    // playhead is on its quarter, and between two cards it moves in step with the scroll.
    useEffect(() => {
        let raf = 0;
        const compute = () => {
            const centre = window.innerHeight / 2;
            const centres = SERIES_STEPS.map(({ id }) => {
                const el = stepRefs.current[id];
                if (!el) return Number.POSITIVE_INFINITY;
                const r = el.getBoundingClientRect();
                return r.top + r.height / 2;
            });
            let i = -1;
            for (let k = 0; k < centres.length; k++) if (centres[k] <= centre) i = k;
            const lastStep = SERIES_STEPS.length - 1;
            if (i < 0) setSeriesPos(SERIES_STEPS[0].pos);
            else if (i >= lastStep) setSeriesPos(SERIES_STEPS[lastStep].pos);
            else {
                const spanPx = centres[i + 1] - centres[i];
                const t = spanPx ? clamp((centre - centres[i]) / spanPx, 0, 1) : 0;
                setSeriesPos(SERIES_STEPS[i].pos + t * (SERIES_STEPS[i + 1].pos - SERIES_STEPS[i].pos));
            }
        };
        const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(compute); };
        compute();
        window.addEventListener("scroll", onScroll, { passive : true });
        window.addEventListener("resize", onScroll);
        return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
    }, []);

    const ref = (id : SceneId) => (el : HTMLElement | null) => { stepRefs.current[id] = el; };
    const on = (id : SceneId) => scene === id;
    const lockIn = () => {
        setLocked(guess);
        stepRefs.current.money?.scrollIntoView({ behavior : matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block : "center" });
    };

    return (
        <Div className="act">
            <Div className="stage">
                <LineStage scene={scene} seriesPos={seriesPos} />
            </Div>

            <Div className="steps">
                {/* THE TITLE ================================================================================ */}
                <Div className="step is-hero" data-scene="hero" ref={ref("hero")}>
                    <Div className="title-card">
                        <PageCrumbs />
                        <Text className="hero-kicker" weight="600" marginBottom="nano">BANK CREDIT</Text>
                        <Heading1 className="hero-title" marginBottom="micro">
                            The <span className="accent">₹2 lakh</span> line
                        </Heading1>
                        <Text className="hero-sub" fontStyle="serif" size="large">
                            {prose(`${cap(shareOf(BELOW.accountShare, "bank loans"))} in India have a limit of ₹2 lakh or less.
                                The Reserve Bank calls them small borrowal accounts, and they include crop loans, working capital
                                for small shops, vehicle loans and credit cards. Using the Reserve Bank’s Basic Statistical
                                Returns, we ask how much bank credit they hold, what they cost, and how their number has
                                changed since ${peakWhen}.`)}
                        </Text>
                        <Text size="small" className="hero-cue" marginTop="small">The story continues below</Text>
                    </Div>
                </Div>

                {/* SAVING AND BORROWING ===================================================================== */}
                <Div className="step" data-scene="save" ref={ref("save")}>
                    <StepCard active={on("save")} kicker="WHERE PEOPLE SAVE" title="deposit accounts" big={<CountUp start={on("save")} to={SAVE_BORROW.depositAccounts / 1e7} format={v => `${v.toFixed(1)} crore`} />}>
                        <Say>{`Each dot on this screen is ten lakh bank deposit accounts: savings accounts, fixed deposits and
                            current accounts. The Reserve Bank’s Handbook of Statistics counts ${crore(SAVE_BORROW.depositAccounts)}
                            of them in March ${SAVE_BORROW.year}, ${perPerson} for every person in India.`}</Say>
                    </StepCard>
                </Div>

                <Div className="step" data-scene="borrow" ref={ref("borrow")}>
                    <StepCard active={on("borrow")} kicker="WHERE PEOPLE BORROW" title="loans" big={<CountUp start={on("borrow")} to={SAVE_BORROW.creditAccounts / 1e7} format={v => `${v.toFixed(1)} crore`} />}>
                        <Say>{`The dots now lit are the loan accounts. Banks had ${crore(SAVE_BORROW.creditAccounts)} loan accounts in March
                            ${SAVE_BORROW.year}, one for every ${numberWord(perLoan)} deposit accounts.`}</Say>
                    </StepCard>
                </Div>

                <Div className="step" data-scene="groups" ref={ref("groups")}>
                    <StepCard active={on("groups")} kicker="VILLAGE AND CITY" title={widestInVillages ? "The gap is widest in the villages" : "The gap differs from place to place"}>
                        <Say>{`The same dots are now sorted by place, with deposit accounts counted at the branch that holds
                            them and loans where the money is used. While villages have ${numberWord(Math.round(rural.ratio))}
                            deposit accounts for every loan, the big cities have ${numberWord(Math.round(metro.ratio))}.`}</Say>
                    </StepCard>
                </Div>

                {/* THE LINE ================================================================================= */}
                <Div className="step" data-scene="accounts" ref={ref("accounts")}>
                    <StepCard
                        active={on("accounts")} kicker="THE LINE"
                        big={<><CountUp start={on("accounts")} to={DOTS_BELOW.accounts} format={v => `${Math.round(v)}`} /><span className="big-of"> of {LOAN_DOTS}</span></>}
                        title={`${cap(shareOf(BELOW.accountShare, "loans"))} were below ₹2 lakh`}
                    >
                        <Say>{`One person can hold several credit accounts, and each credit card counts as one account.
                            Farm loans are ${pct(farmShareOfSmall, 0)} of them, and personal loans—which includes credit cards—${pct(personalShareOfSmall, 0)}. Loans from finance companies, microfinance companies
                            and lending apps are not in these figures, and most of those would fall below the ₹2-lakh line.`}</Say>
                    </StepCard>
                </Div>

                <Div className="step" data-scene="guess" ref={ref("guess")}>
                    <StepCard active={on("guess")} kicker="BEFORE THE ANSWER" title="Of every ₹100 that banks have lent, how much do you think goes to these small loans?">
                        <Coins filled={guess} tone="guess" />
                        <Div className="slider-row">
                            <input
                                type="range" min={0} max={100} step={1} value={guess} onChange={e => setGuess(+e.target.value)}
                                aria-label="Your guess, in rupees of every ₹100 lent"
                            />
                            <Text className="guess-value" weight="700">₹{guess}</Text>
                        </Div>
                        <Button kind="primary" size="small" marginTop="nano" onClick={lockIn}>Lock in my guess ↓</Button>
                    </StepCard>
                </Div>

                <Div className="step" data-scene="money" ref={ref("money")}>
                    <StepCard
                        active={on("money")} kicker="THE ANSWER"
                        big={<CountUp start={on("money")} to={ACTUAL} format={v => `₹${Math.round(v)}`} />}
                        title="of every ₹100"
                    >
                        <Coins filled={on("money") || locked !== null ? ACTUAL : 0} guess={locked} tone="actual" />
                        {locked !== null && <Text className="guess-verdict" weight="600" marginBottom="nano">{guessVerdict(locked)}</Text>}
                        <Say marginTop="nano">{`Each dot is now an equal share of all bank credit outstanding. Loans of ₹2 lakh or less, hold ₹${ACTUAL} of every ₹100 that banks have
                            lent.`}</Say>
                    </StepCard>
                </Div>

                <Div className="step" data-scene="top" ref={ref("top")}>
                    <StepCard
                        active={on("top")} kicker="THE OTHER END"
                        big={<CountUp start={on("top")} to={TOP.accounts} format={v => inr(Math.round(v))} />}
                        title={`loans hold ₹${Math.round(TOP.outstandingShare)} of every ₹100`}
                    >
                        <Say>{`These are the ${inr(TOP.accounts)} loans of more than ₹100 crore each in March 2026. 
                            They hold ${timesWords(TOP.outstanding / TO_FIVE_LAKH.outstanding)}
                            as much money as all ${crore(TO_FIVE_LAKH.accounts)} loans of ₹5 lakh or less put together.`}</Say>
                    </StepCard>
                </Div>

                {/* THE PRICE ================================================================================ */}
                <Div className="step" data-scene="priceMoney" ref={ref("priceMoney")}>
                    <p className="sr-only">{prose(`Interest rates fall as loans get larger. Blue dots are money lent at under
                        8% a year: on loans above ₹100 crore, ₹${Math.round(PRICE.topMoneyUnder8)} of every ₹100. Red dots
                        are money lent at 13% or more: below the line, ₹${Math.round(PRICE.belowMoneyAt13)} of every ₹100.
                        ₹${Math.round(below7to9)} of every ₹100 below the line is lent at 7% to 9%, much of it crop loans
                        at a subsidised 7%. Loans up to ₹25,000 carry at least ${SMALLEST.weightedRate.toFixed(1)}% a year
                        on average, and the table’s top range holds credit cards at ${pct(cardRate, 0)}.`)}</p>
                </Div>

                <Div className="step" data-scene="priceAccounts" ref={ref("priceAccounts")}>
                    <StepCard
                        active={on("priceAccounts")} kicker="WHO PAYS THE MOST"
                        big={<><CountUp start={on("priceAccounts")} to={PRICE.accountsAt13} format={v => `${Math.round(v)}`} /><span className="big-of"> in 100</span></>}
                        title="loans carry a rate of 13% or more"
                    >
                        <Say marginBottom="nano">{`The loans with the highest rates sit at the bottom of the
                            stack. ${cap(shareOf(PRICE.accountsAt13, "loans"))} carry a rate of 13% or more, and together they
                            hold only ₹${Math.round(PRICE.moneyAt13)} of every ₹100 lent. Credit cards are
                            ${crore(PRICE.cardsAt13)} of them, ${pct(cardsOfAt13, 0)}, each counted at its contract rate whether
                            or not its holder ever pays interest.`}</Say>
                        <Say>{`The credit bureau TransUnion CIBIL counted about two cards a holder in March 2026. Excluding
                            cards, that rate applies to ${shareOf(othersAt13, "of the other loans")}.`}</Say>
                    </StepCard>
                </Div>

                {/* OVER TIME ================================================================================ */}
                <Div className="step" data-scene="seriesStart" ref={ref("seriesStart")}>
                    <StepCard active={on("seriesStart")} kicker={`OVER TIME · ${monthName(q17.quarter).toUpperCase()}`} title="Small loans, counted every quarter">
                        <Say marginBottom="nano">{`Each dot represents one crore small loan accounts. In ${monthName(q17.quarter)} there were
                            ${crore(q17.total.small)}, ${shareOf(first.borrowers, "loans")}, and they held
                            ₹${in100(first.share)} of every ₹100 lent.`}</Say>
                        <Say>{`None of them were yet at the small finance banks, most of them former microfinance
                            lenders. Those banks begin reporting the next quarter, and ${pct(sfbShareOfRise, 0)} of the
                            rise since then is theirs.`}</Say>
                    </StepCard>
                </Div>

                <Div className="step" data-scene="seriesGrowth" ref={ref("seriesGrowth")}>
                    <StepCard active={on("seriesGrowth")} kicker={monthName(q20.quarter).toUpperCase()} title="The number of small loans rose while their share of the money stood still">
                        <Say>{`By ${monthName(q20.quarter)} there were ${crore(q20.total.small)} small loan accounts. Villages had added
                            ${crore(q20.rural.small - q17.rural.small)} since ${since2017}, and the big cities
                            ${crore(q20.metro.small - q17.metro.small)}. ${Math.abs(at2020.share - first.share) < 1
                                ? `Their share of the money stayed close to where it began, at ₹${in100(at2020.share)} of every ₹100.`
                                : `Their share of the money went from ₹${in100(first.share)} to ₹${in100(at2020.share)} of every ₹100.`}`}</Say>
                    </StepCard>
                </Div>

                <Div className="step" data-scene="seriesPeak" ref={ref("seriesPeak")}>
                    <StepCard
                        active={on("seriesPeak")} kicker={monthName(Q_PEAK.quarter).toUpperCase()}
                        big={<CountUp start={on("seriesPeak")} to={Q_PEAK.total.small / 1e7} format={v => `${v.toFixed(1)} crore`} />}
                        title="small loans—at their peak"
                    >
                        <Say marginBottom="nano">{`In ${monthName(Q_PEAK.quarter)} there were ${timesWords(SERIES.growth)} as many
                            small loan accounts as in ${since2017}, and they were ${shareOf(peak.borrowers, "loans")}.
                            ${peak.share < first.share
                                ? `They held only ₹${in100(peak.share)} of every ₹100 lent, less than when there were far fewer of them.`
                                : `They held ₹${in100(peak.share)} of every ₹100 lent.`}`}</Say>
                        {marchOfPeakYear !== null && flatBeforePeak && (
                            <Say marginBottom={peakOnEntry ? "nano" : undefined}>{`The count had changed little for ${flatFor}: it was
                                ${crore(marchOfPeakYear.total.small)} in ${monthName(marchOfPeakYear.quarter)} and slipped in
                                the two quarters after.`}</Say>
                        )}
                        {peakOnEntry && marchOfPeakYear !== null && (
                            <Say>{`Note: December stands above March only because of a merger in October 2024, when a fintech
                                lender’s loans were folded into a small finance bank. About ${croreAbout(entryStep)} small
                                app-based credit accounts, booked in Guwahati, entered the bank figures in that one
                                quarter. Without them, the high point would be ${monthName(marchOfPeakYear.quarter)}.`}</Say>
                        )}
                    </StepCard>
                </Div>

                <Div className="step" data-scene="seriesFall" ref={ref("seriesFall")}>
                    <StepCard
                        active={on("seriesFall")} kicker={monthName(qLast.quarter).toUpperCase()}
                        big={<CountUp start={on("seriesFall")} to={SERIES.fewer / 1e7} format={v => `${v.toFixed(1)} crore`} />}
                        title={`fewer small loans in ${fallIn}`}
                    >
                        <Prose last>
                            {prose(`By ${monthName(qLast.quarter)} there were ${crore(qLast.total.small)} small loans, down from
                                ${crore(Q_PEAK.total.small)} in ${monthName(Q_PEAK.quarter)}.${lowestBorrowers && lowestShare
                                ? ` They were a smaller share of all bank loans, and of all the money lent, than at any time since ${since2017}.` : ""}
                                This was not due to small loans simply getting bigger and crossing ₹2 lakh. Loans above
                                ₹2 lakh ${SERIES.aboveRise >= 0 ? "grew" : "fell"} by ${crore(Math.abs(SERIES.aboveRise))}${SERIES.aboveRise >= 0 && aboveRiseBefore >= 0
                                ? `, which is almost exactly their normal rate of growth: they had grown by ${crore(aboveRiseBefore)} in the ${fallIn} before` : ""}.
                                If millions of small loans had crossed over, that number would have jumped. That didn’t
                                happen. Instead, the data show that bank loans of`)}
                            {" "}<em>every</em>{" "}
                            {prose(`size ${allSizesChange < 0 ? `fell by ${crore(-allSizesChange)}` : `rose by ${crore(allSizesChange)}`}.`)}
                        </Prose>
                    </StepCard>
                </Div>

                <Div className="step" data-scene="seriesCards" ref={ref("seriesCards")}>
                    <StepCard active={on("seriesCards")} kicker="CREDIT CARDS" title={cardsChange >= 0 ? "Cards grew while every other small loan shrank" : "Cards fell with the rest"}>
                        <Say marginBottom="nano">{`It is interesting to note that credit cards—which are counted as small loans—${cardsChange >= 0 ? "kept growing" : "fell too"}.
                            Small loans apart from credit cards fell by a whopping ${crore(nonCardFall)}, from
                            ${crore(Q_PEAK.total.small - cardRows.reduce((t, r) => t + r.accountsThen, 0))} in ${monthName(Q_PEAK.quarter)} to
                            ${crore(qLast.total.small - cardRows.reduce((t, r) => t + r.accountsNow, 0))} in ${monthName(qLast.quarter)}.`}</Say>
                        <SmallCardsChart active={on("seriesCards")} />
                    </StepCard>
                </Div>
            </Div>
        </Div>
    );
};

// THE CHAPTERS ========================================================================================================
const [ ruralWent, , , metroWent ] = WHERE_THEY_WENT.groups;
const [ farm, durables, cards ] = WHERE_THEY_WENT.purposes;
const fall = (r : { then : number; now : number }) => r.then - r.now;
const placesFell = WHERE_THEY_WENT.groups.filter(g => g.now < g.then);
const [ firstFaller, ...otherFallers ] = WOMEN.fallers;
const EAST = [ "Bihar", "Jharkhand", "Odisha", "West Bengal" ];
const mostlyEast = WOMEN.fallers.filter(s => EAST.includes(s.name)).length > WOMEN.fallers.length / 2;
const [ d1, d2, d3 ] = DISTRICT_SHARES.shares;
const maharashtra = stateNamed("Maharashtra"), bihar = stateNamed("Bihar");
const lakh = (thousands : number) => (thousands / 100).toFixed(1);
const signed = (v : number, dp = 0) => `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(dp)}%`;

// Mumbai's two districts, New Delhi, and the districts of Delhi in the district return.
const mumbaiSuburban = DISTRICT_SHARES.shares.find(d => d.district === "Mumbai Suburban");
const mumbaiTwoShare = d1.outstandingShare + (mumbaiSuburban?.outstandingShare ?? 0);
const newDelhi = DISTRICTS.find(d => d.district === "New Delhi");
const delhiDistricts = DISTRICTS.filter(d => d.state === "Delhi").length;
// A state counted where the money is used and with the regional rural banks: the district return summed by state,
// over the population derived from the state's income series.
const byUse = (name : string) => {
    const s = stateNamed(name), ds = DISTRICTS.filter(d => d.state === name);
    return { accountsPer100 : 100 * sum(ds.map(d => d.accounts)) / (s.population ?? NaN), creditPerHead : sum(ds.map(d => d.outstanding)) * 1e7 / (s.population ?? NaN) };
};
const mhByUse = byUse("Maharashtra"), brByUse = byUse("Bihar");
// Loans to women: the money lent to them across the comparable states, whether it rose in each of the states that
// fell, and Maharashtra outside Mumbai's two districts.
const womenMoney = (s : { womenOutstanding2024 : number; womenOutstanding2026 : number }) => 100 * (s.womenOutstanding2026 - s.womenOutstanding2024) / s.womenOutstanding2024;
const comparableStates = WOMEN_STATES.filter(s => s.comparable);
const womenMoneyRise = womenMoney({ womenOutstanding2024 : sum(comparableStates.map(s => s.womenOutstanding2024)), womenOutstanding2026 : sum(comparableStates.map(s => s.womenOutstanding2026)) });
const fallersMoneyRose = WOMEN.fallers.length > 0 && WOMEN.fallers.every(f => womenMoney(WOMEN.state(f.name)) > 0);
const otherFallersMoneyRose = otherFallers.length > 0 && otherFallers.every(f => womenMoney(WOMEN.state(f.name)) > 0);
const mumbaiRows = WOMEN_DISTRICTS_FALLS.filter(d => /^Mumbai/.test(d.district));
const mhWomen = WOMEN.state("Maharashtra");
const mhOutsideMumbai = mumbaiRows.length === 2 && WOMEN.fallers.some(f => f.name === "Maharashtra")
    ? 100 * ((mhWomen.women2026 - sum(mumbaiRows.map(d => d.women2026))) - (mhWomen.women2024 - sum(mumbaiRows.map(d => d.women2024)))) / (mhWomen.women2024 - sum(mumbaiRows.map(d => d.women2024)))
    : null;
// The districts outside Mumbai that lost the most loans to women and where women hold most of the loans.
const bookingHubs = WOMEN_DISTRICTS_FALLS.filter(d => !/^Mumbai/.test(d.district) && d.womenShare2026 >= 50).slice(0, 5).map(d => d.district);

const womenTiles : Record<string, TileDatum> = Object.fromEntries(WOMEN_STATES.map(s => {
    const change = s.comparable ? 100 * (s.women2026 - s.women2024) / s.women2024 : null;
    return [ s.name, {
        value : change,
        label : change === null ? "–" : signed(change),
        lines : change === null
            ? [ `${lakh(s.women2026)} lakh loans to women in ${WOMEN.now.quarter}`, "not compared: a merger in October 2024 changed its lenders" ]
            : [ `from ${lakh(s.women2024)} lakh to ${lakh(s.women2026)} lakh loans to women`, `${signed(change, 1)} since ${WOMEN.then.quarter}` ],
    } ];
}));
const accessTiles : Record<string, TileDatum> = Object.fromEntries(STATES.map(s => [ s.name, {
    value : s.accountsPer100,
    label : s.accountsPer100 === null ? "–" : `${Math.round(s.accountsPer100)}`,
    lines : s.accountsPer100 === null
        ? [ "no income figures to count its people" ]
        : [ `${s.accountsPer100.toFixed(1)} loans for every 100 people`, `${rupees(s.creditPerHead ?? 0)} of bank credit per person`, `about ${crore(s.population ?? 0)} people, from ${s.populationYear} income figures` ],
} ]));

const Chapter = ({ kicker, title, children, id } : { kicker : string; title : string; children : ReactNode; id : string }) => (
    <Reveal>
        <Text className="kicker" weight="600" marginBottom="nano" id={id}>{kicker}</Text>
        <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">{title}</Heading4>
        {children}
    </Reveal>
);

const Para = ({ children, last = false } : { children : string; last ? : boolean }) => <Text fontStyle="serif" marginBottom={last ? undefined : "nano"}>{prose(children)}</Text>;
// A paragraph with links in it: the text is written as strings around the links, so no space is lost at a join.
const Prose = ({ children, last = false } : { children : ReactNode; last ? : boolean }) => <Text fontStyle="serif" marginBottom={last ? undefined : "nano"}>{children}</Text>;
const Cite = ({ href, children } : { href : string; children : ReactNode }) => <a href={href} target="_blank" rel="noopener" className="cite-link">{children}</a>;

const SOURCES : [ string, string ][] = [
    [ "credit-by-size-of-limit-march-2026.csv", "loans by size and what they cost, March 2026" ],
    [ "small-borrowal-accounts-quarterly.csv", "small loans in villages, towns and cities, every quarter" ],
    [ "women-borrowers-by-state.csv", "loans to women by state" ],
    [ "credit-by-district-march-2026.csv", "bank credit by district, March 2026" ],
    [ "credit-by-state-march-2026.csv", "bank credit and population by state, March 2026" ],
];

const READING : { title : string; href : string; note : string }[] = [
    { title : "Demirgüç-Kunt, Beck and Honohan (2008). Finance for all? Policies and pitfalls in expanding access. World Bank.", href : "https://www.ecb.europa.eu/events/pdf/conferences/ecbcfs_cmfi2/Demirgeuc_Kunt_paper.pdf", note : "Access against use, and how many people borrow against how much: the distinction the closing section rests on." },
    { title : "World Bank (2025). The Little Data Book on Financial Inclusion 2025 (Global Findex).", href : "https://thedocs.worldbank.org/en/doc/be6615202d1f08a25855c8ac2d615122-0050012025/related/Little-Data-Book-2025-Web.pdf", note : "India’s page: 89% of adults with an account in 2024 and 15% having borrowed formally in the past year, the person-level counterpart to account counts." },
    { title : "Reserve Bank of India (2011). Survey of small borrowal accounts: 2008. RBI Bulletin, May 2011.", href : "https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx?Id=12183", note : "The Reserve Bank’s own sample of small accounts: what they were for, what they cost, and the history of the cut-off since 1972." },
    { title : "Rosenberg, Gonzalez and Narain (2009). The new moneylenders. CGAP Occasional Paper 15.", href : "https://www.cgap.org/sites/default/files/CGAP-Occasional-Paper-The-New-Moneylenders-Are-the-Poor-Being-Exploited-by-High-Microcredit-Interest-Rates-Feb-2009.pdf", note : "Why tiny loans carry high rates and how to judge whether a rate is exploitation, in plain terms (full title: The new moneylenders: are the poor being exploited by high microcredit interest rates?)." },
    { title : "Chavan (2016). Inclusion of small borrowers by Indian banks. Reserve Bank of India.", href : "https://rbi.org.in/scripts/Bs_viewcontent.aspx?Id=3279", note : "The long series behind the ₹2 lakh line, when the line was set, and the caveat that comes with a cut-off fixed in rupees." },
    { title : "Sriram (2021). Banking system and financial inclusion. Inclusive Finance India Report 2021, chapter 3.", href : "https://accessdev.org/wp-content/uploads/2025/02/Inclusive-Finance-India-Report-2021.pdf", note : "The same small borrowal account tables read year by year, with the question whether the growth is inclusion or the splitting of credit into ever smaller loans." },
    { title : "TransUnion CIBIL (2026). Credit growth in Uttar Pradesh, Madhya Pradesh, Bihar outpaced that of traditional strongholds.", href : "https://newsroom.transunioncibil.com/credit-growth-in-uttar-pradesh-madhya-pradesh-bihar-outpaced-that-of-traditional-strongholds/", note : "What a credit bureau sees when it counts people rather than accounts: 28% of adults aged 18 to 60 credit-active in March 2026, up from 11% in March 2017." },
    { title : "Reserve Bank of India (2025). Financial Stability Report, December 2025, chapter I.", href : "https://www.rbi.org.in/Scripts/FsReports.aspx", note : "The Reserve Bank’s own account of the unsecured-retail slowdown and the microfinance contraction." },
    { title : "MFIN (2026). Micrometer for the June 2026 quarter.", href : "https://mfinindia.org/assets/upload_image/news/pdf/Micrometer%20Q1%20FY%2026-27%20Press%20Release.pdf", note : "The microfinance sector’s own numbers by lender type, with banks a quarter of the book and most of their year’s decline loans reclassified as retail." },
    { title : "slice Small Finance Bank Limited (2025). Annual Report 2024-25 (formerly North East Small Finance Bank).", href : "https://slice.bank.in/documents/corporate-governance/annual-report/annual-report-2024-25.pdf", note : "The amalgamation, effective 27 October 2024, that put a fintech’s NBFC loan book into the bank returns in a single quarter. The bank publishes no count of its loan accounts, so the step is read from the DBIE tables." },
    { title : "Goldston and Lee (2020). Measurement of small business lending using Call Reports. FDIC Staff Study 2020-04.", href : "https://www.fdic.gov/analysis/cfr/staff-studies/2020-04.pdf", note : "What a loan-size line that nobody re-bases does to a series, and how to correct it." },
    { title : "Gopal and Schnabl (2022). The rise of finance companies and FinTech lenders in small business lending. Review of Financial Studies.", href : "https://pages.stern.nyu.edu/~pschnabl/slides/SmallBusinessSlides.pdf", note : "The cleanest case of a fall in bank lending that was not a fall in lending once non-banks were counted." },
];

const MethodNote = ({ title, children, last = false } : { title : string; children : string; last ? : boolean }) => (
    <Text size="tiny" marginBottom={last ? undefined : "nano"}>
        <strong>{title}</strong>{" "}{prose(children)}
    </Text>
);

export const TheTwoLakhLinePage = () => (
    <MotionConfig reducedMotion="user">
        <Article id="the-two-lakh-line-page">
            <TheOpening />

            {/* WHERE THEY WENT ======================================================================================== */}
            <Section className="chapter">
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="8">
                        <Chapter id="where-they-went" kicker="WHERE THEY WENT" title="Villages lost loans filed as farm credit, while big cities lost durable-loan
                            accounts">
                            <Para>{`Between ${monthName(WHERE_THEY_WENT.from)} and ${monthName(WHERE_THEY_WENT.to)}
                                ${placesFell.length === WHERE_THEY_WENT.groups.length ? "every kind of place lost small loans" : `${list(placesFell.map(g => g.label.toLowerCase()))} lost small loans`},
                                counting each loan at the branch that made it. Villages lost ${crore(fall(ruralWent))},
                                ${crore(fall(farm))} of them filed under agriculture, a heading that also covers the group
                                loans banks make for dairy and livestock. ${ruralSmallPrivateSfbFall > fall(ruralWent) / 2 ? "Most" : "Part"} of
                                that loss was at private banks and small finance banks, while village loans of every size at
                                public-sector banks ${ruralPublicChange >= 0 ? `grew by ${crore(ruralPublicChange)}` : `fell by ${crore(-ruralPublicChange)}`}.`}</Para>
                            <Para>{`The big cities lost ${crore(fall(metroWent))}, ${fall(durables) >= 0.9 * fall(metroWent)
                                ? "almost all of it" : fall(durables) > fall(metroWent) / 2 ? "most of it" : "some of it"} consumer-durable
                                accounts, which fell by ${crore(fall(durables))} while the money on them ${durMoneyWords}.
                                Across all lenders, the credit bureau CRIF High Mark counts loans for household goods rising
                                from 10.3 crore to 11.3 crore in the year to June 2026, which suggests banks changed how they
                                count these accounts rather than stopped lending. Credit cards
                                ${cards.now > cards.then ? "kept growing" : "fell too"}.`}</Para>
                            <Para>{`The village losses match the retreat of microfinance from the middle of 2024, after a wave
                                of defaults. The lenders’ industry body capped each borrower’s microfinance debt at ₹2 lakh
                                and the number of lenders at four, later three. Funding to small lenders dried up, Karnataka
                                and Tamil Nadu passed laws against coercive recovery, and many bad loans were written off.
                                Across all lenders, CRIF counted 10.3 crore microfinance loans in June 2026, against 14.6
                                crore at the end of 2024.`}</Para>
                            {SERIES.totalChange.rural < 0 && (
                                <Para last>{`In the villages, bank loans of every size fell by ${crore(-SERIES.totalChange.rural)}
                                    too, so many small loans closed rather than growing past the line, though fewer people
                                    than loans lost credit.`}</Para>
                            )}
                        </Chapter>
                    </Portion>
                    <Portion desktopSpan="16">
                        <Reveal delay={0.1}>
                            <Figure
                                title="Small loans at the high point and now" units="crore loans of ₹2 lakh or less"
                                table={{
                                    head : [ "", WHERE_THEY_WENT.from, WHERE_THEY_WENT.to, "Change" ], numeric : [ false, true, true, true ],
                                    rows : [ ...WHERE_THEY_WENT.groups, ...WHERE_THEY_WENT.purposes ].map(r => [ r.label, croreN(r.then, 2), croreN(r.now, 2), `${r.now < r.then ? "−" : "+"}${croreN(Math.abs(r.now - r.then), 2)}` ]),
                                }}
                                note="From the quarterly Basic Statistical Return, Tables 2.1 and 3.5a, which count each loan at the branch that made it. All scheduled commercial banks except the regional rural banks."
                            >
                                <SmallGroupsChart />
                            </Figure>
                        </Reveal>
                    </Portion>
                </Row>
            </Section>

            {/* WHOSE LOANS CLOSED ===================================================================================== */}
            <Section className="chapter">
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="8">
                        <Chapter id="whose-loans" kicker="WHOSE LOANS CLOSED" title={mostlyEast ? "Loans to women fell, most steeply in the east" : "Loans to women fell"}>
                            <Para>{`Women held ${crore(WOMEN.thenCount)} loan accounts in
                                ${monthName(WOMEN.then.quarter)} and ${crore(WOMEN.nowCount)} by ${monthName(WOMEN.now.quarter)},
                                while the amount banks had lent to women ${womenMoneyRise >= 0 ? "rose" : "fell"} by
                                ${pct(Math.abs(womenMoneyRise), 0)}.`}</Para>
                            <Para>{`${firstFaller ? `In ${firstFaller.name}, loan accounts held by women fell by
                                ${Math.abs(firstFaller.change).toFixed(0)}%, while the money lent to women there
                                ${womenMoney(WOMEN.state(firstFaller.name)) >= 0 ? "rose" : "fell"} by
                                ${pct(Math.abs(womenMoney(WOMEN.state(firstFaller.name))), 0)}.` : ""} ${otherFallers.length > 0 ? `In
                                ${list(otherFallers.map(s => s.name))} they fell by between
                                ${Math.abs(Math.max(...otherFallers.map(s => s.change))).toFixed(0)}% and
                                ${Math.abs(Math.min(...otherFallers.map(s => s.change))).toFixed(0)}%${otherFallersMoneyRose ? ", and in each the money lent to women rose" : ""}.` : ""}
                                ${mhOutsideMumbai !== null ? `Maharashtra’s fall is mostly Mumbai’s, where lenders appear to have moved their books: outside
                                Mumbai the state ${mhOutsideMumbai < 0 ? "fell" : "rose"} by ${pct(Math.abs(mhOutsideMumbai), 0)}.` : ""}`}</Para>
                            <Para>{`${WOMEN.risers.length > 0 ? `${list(WOMEN.risers.map(s => s.name))} went the other way: loans to women
                                rose there. ` : ""}TransUnion CIBIL, which counts women rather than accounts and sees every
                                lender, put the number of women with a live loan at 16 crore in December 2025, twice the
                                2017 count and still rising.`}</Para>
                            <Para>{`Loans to women fell in ${WOMEN.districts.fell} of the ${WOMEN.districts.compared} districts
                                we can compare. Mumbai is left out of the district ranking, because its numbers move with where
                                lenders book their loans. Of the ${numberWord(WOMEN.topFallsOutsideMumbai)} districts that lost
                                the most outside Mumbai, ${numberWord(WOMEN.majorityWomenOfThem)} are places where women hold most of the loans to individuals. That pattern
                                    suggests these are the branches where banks keep their group loans to women, so
                                    the ranking says where those books are kept rather than where the borrowers live.`}</Para>
                            <Para last>{`A borrower with loans from two lenders holds two accounts, and when lenders stop renewing
                                second loans the count of accounts falls faster than the count of people. The credit bureaus,
                                which count both, report microfinance accounts falling faster than borrowers in the year to
                                March 2026: on Equifax India’s count, published by Sa-Dhan, loan accounts fell 21% while
                                borrowers fell 13%.`}</Para>
                        </Chapter>
                    </Portion>
                    <Portion desktopSpan="16">
                        <Reveal delay={0.1}>
                            <Figure
                                title={`How loans to women changed, ${monthName(WOMEN.then.quarter)} to ${monthName(WOMEN.now.quarter)}`} units="per cent, by state"
                                table={{
                                    head : [ "State", WOMEN.then.quarter, WOMEN.now.quarter, "Change" ], numeric : [ false, true, true, true ],
                                    rows : WOMEN_STATES.filter(s => s.comparable).map(s => [ s.name, `${lakh(s.women2024)} lakh`, `${lakh(s.women2026)} lakh`, signed(100 * (s.women2026 - s.women2024) / s.women2024, 1) ]),
                                }}
                                note="From the quarterly Basic Statistical Return, Table 1.10, added up across the districts of each state, including the districts the table prints on two rows. The table counts each loan at the branch that made it and leaves out the regional rural banks. Assam is not compared: a fintech’s loans booked in Guwahati entered its figures in December 2024 through a merger into a small finance bank. Each state shows its figures on hover or on keyboard focus."
                            >
                                <TileMap
                                    data={womenTiles} mode="diverging" edges={[ 5, 15, 30 ]} format={e => signed(e)}
                                    missing="not compared" ariaLabel="Tile map of the change in loans to women, by state"
                                />
                            </Figure>
                        </Reveal>
                    </Portion>
                </Row>
                <Row horizontalPadding="small" marginTop="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="half">
                        <Reveal>
                            <Figure title="Loans to women gained or lost" units="lakh loans, in states that moved by half a lakh or more">
                                <HBars
                                    rows={WOMEN.rows.map(r => ({ key : r.key, label : r.label, value : r.value, kind : r.value < 0 ? "fall" : "rise", tip : [ `from ${crore(r.then)} to ${crore(r.now)}`, signed(r.change) ] }))}
                                    diverging rowHeight={26} format={v => `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}`}
                                    ariaLabel={`Change in loans to women by state, ${monthName(WOMEN.then.quarter)} to ${monthName(WOMEN.now.quarter)}`}
                                />
                            </Figure>
                        </Reveal>
                    </Portion>
                    <Portion desktopSpan="half">
                        <Reveal delay={0.1}>
                            <Figure title="The districts that lost the most loans to women" units="loans to individuals, counted at the branch that made them">
                                <Table className="story-table women-table" bordersFor="rows" isFullWidth>
                                    <thead>
                                        <tr><th>District</th><th>State</th><th className="num">{WOMEN.then.quarter}</th><th className="num">{WOMEN.now.quarter}</th><th className="num">Change</th><th className="num">Women&rsquo;s share</th></tr>
                                    </thead>
                                    <tbody>
                                        {WOMEN_DISTRICTS_FALLS.slice(0, 10).map(d => (
                                            <tr key={`${d.state}-${d.district}`}>
                                                <td>{d.district}</td><td>{d.state}</td>
                                                <td className="num">{lakh(d.women2024)} lakh</td><td className="num">{lakh(d.women2026)} lakh</td>
                                                <td className="num">−{(100 * (d.women2024 - d.women2026) / d.women2024).toFixed(0)}%</td>
                                                <td className="num">{pct(d.womenShare2026, 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Figure>
                        </Reveal>
                    </Portion>
                </Row>
            </Section>

            {/* WHERE THE MONEY GOES =================================================================================== */}
            <Section className="chapter">
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="8">
                        <Chapter id="where-the-money-goes" kicker="WHERE THE MONEY GOES" title={`Ten districts hold ₹${Math.round(DISTRICT_SHARES.top10.outstandingShare)} of every ₹100`}>
                            <Para>{`The Reserve Bank’s annual district return for March 2026 covers ${DISTRICT_SHARES.count} districts and
                                counts each loan where the bank reports the money is used. Ten of them, led by ${d1.district}, ${d2.district} and ${d3.district}, hold
                                ${pct(DISTRICT_SHARES.top10.outstandingShare, 0)} of all bank credit and
                                ${pct(DISTRICT_SHARES.top10.accountShare, 0)} of the loans. ${d1.district}’s island city alone
                                holds ${pct(d1.outstandingShare, 0)}${mumbaiSuburban ? `, and with Mumbai Suburban ${pct(mumbaiTwoShare, 0)}` : ""}.`}</Para>
                            <Para>{`Counted instead at the branch that made the loan, the ten largest districts hold
                                ${pct(SANCTION.top10Share, 0)}, and Mumbai’s two districts ${pct(SANCTION.mumbaiTwoShare, 0)}
                                rather than ${pct(SANCTION.useMumbaiTwoShare, 0)}, because loans booked at head offices in
                                Mumbai are used across the country. Much of what they hold is credit to
                                companies, finance companies and government bodies, recorded at their offices and spent
                                    everywhere.${newDelhi ? ` New Delhi district, one of Delhi’s ${numberWord(delhiDistricts)}, carries ${lakhCrore(newDelhi.outstanding)}.` : ""}
                                Many of the ten districts’ loans are credit cards, which banks book at their head offices rather
                                than where the cardholder lives.`}</Para>
                            <Para last>{`At the other end, the ${DISTRICT_SHARES.tail.count} smallest districts share
                                ${pct(DISTRICT_SHARES.tail.outstandingShare, 0)} of the money between them, though they have
                                ${pct(DISTRICT_SHARES.tail.accountShare, 0)} of the loans. The concentration is old and easing:
                                in ${in2010.year} the ten largest districts held ${pct(in2010.top10Share, 0)} of bank credit and
                                Mumbai alone ${pct(in2010.mumbaiShare, 0)}.`}</Para>
                        </Chapter>
                    </Portion>
                    <Portion desktopSpan="16">
                        <Reveal delay={0.1}>
                            <Figure
                                title="Districts ranked by bank credit, March 2026" units="by the district the bank reports the money as used in"
                                table={{
                                    head : [ "Rank", "District", "State", "Share of credit", "Share of loans", "Running total" ], numeric : [ true, false, false, true, true, true ],
                                    rows : DISTRICT_SHARES.shares.slice(0, 20).map((d, i) => [ i + 1, d.district, d.state, pct(d.outstandingShare, 2), pct(d.accountShare, 2), pct(d.cumulative) ]),
                                }}
                                note="From the annual Basic Statistical Return, credit by district. The table view lists the top twenty, and every district is in the download."
                            >
                                <DistrictsChart />
                            </Figure>
                        </Reveal>
                    </Portion>
                </Row>
                <Row horizontalPadding="small" marginTop="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="8">
                        <Reveal>
                            <Heading6 fontStyle="serif" weight="600" marginBottom="nano">State by state</Heading6>
                            <Para>{`Counted at the branch that made the loan, ${maharashtra.name} had
                                ${Math.round(maharashtra.accountsPer100 ?? 0)} loans for every hundred people in March 2026,
                                while ${bihar.name} had ${Math.round(bihar.accountsPer100 ?? 0)}. Maharashtra had
                                ${rupees(maharashtra.creditPerHead ?? 0)} of bank credit per person and Bihar
                                ${rupees(bihar.creditPerHead ?? 0)}. Two things flatter Maharashtra in that first count.
                                    Its branches book loans that are used in other states, and of the credit used in
                                    Maharashtra, ₹${Math.round(MUMBAI_IN_MAHARASHTRA)} of every ₹100 is used in the
                                    two Mumbai districts.`}</Para>
                                    <Para>{`Many of its loans are also credit cards booked in Mumbai and held by
                                    people across the country. These quarterly figures also leave out the regional
                                    rural banks, which hold ${pct(rrbShare("Bihar"), 0)} of Bihar’s loans and
                                    ${pct(rrbShare("Maharashtra"), 0)} of Maharashtra’s.`}</Para>
                            <Para last>{`Counted where the money is used and with those banks included, Maharashtra has
                                ${Math.round(mhByUse.accountsPer100)} loans for every hundred people and Bihar
                                ${Math.round(brByUse.accountsPer100)}, ${rupees(mhByUse.creditPerHead)} of credit per person
                                against ${rupees(brByUse.creditPerHead)}. To count the people, we divide each state’s income by
                                its income per person, for the latest year both are published. The result is within 1% of
                                the official population projections for 1 March 2026.`}</Para>
                        </Reveal>
                    </Portion>
                    <Portion desktopSpan="16">
                        <Reveal delay={0.1}>
                            <Figure
                                title="Loans for every hundred people, March 2026" units="by state"
                                table={{
                                    head : [ "State", "Loans per 100 people", "Credit per person", "Population" ], numeric : [ false, true, true, true ],
                                    rows : STATES.filter(s => s.accountsPer100 !== null).map(s => [ s.name, s.accountsPer100!.toFixed(1), rupees(s.creditPerHead ?? 0), crore(s.population ?? 0) ]),
                                }}
                                note="From the quarterly Basic Statistical Return, Table 1.3, with each state’s population worked out from its income figures. The table counts each loan at the branch that made it and leaves out the regional rural banks. Credit cards are counted where the issuing bank books them, which lifts Maharashtra and Delhi. Assam’s figure is lifted by a fintech’s app-based loans, booked in Guwahati since a merger into a small finance bank in October 2024, and overstates what its own borrowers hold. The population counts everyone, not only adults, and the loans are accounts, not people."
                            >
                                <TileMap
                                    data={accessTiles} mode="sequential" edges={[ 10, 15, 20, 30, 40, 60 ]} format={e => `${e}`}
                                    missing="no income figures" ariaLabel="Tile map of loans for every hundred people, by state"
                                />
                            </Figure>
                        </Reveal>
                    </Portion>
                </Row>
            </Section>

            {/* SO WHAT ================================================================================================ */}
            <Section id="so-what">
                <Row horizontalPadding="medium" marginBottom="none" allowUltraWide>
                    <Portion>
                        <Heading1 className="so-what-title"><LetterRise text="In short" /></Heading1>
                    </Portion>
                </Row>
                <Row horizontalPadding="medium" gutters="huge" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="8">
                        <Reveal>
                            <Text className="so-what-kicker" weight="600" marginBottom="nano">WHERE INCLUSION HAPPENED</Text>
                            <Heading6 fontStyle="serif" weight="600" marginBottom="nano">{`Small loans have ${SERIES.doubling >= 1.85 && SERIES.doubling < 2.25 ? "doubled" : `grown ${timesWords(SERIES.doubling)}`} since ${since2017}`}</Heading6>
                            <Para>{`When people say more Indians can borrow now, this is the part of it that happened at banks,
                                counted in loan accounts rather than people. There were ${crore(BELOW.accounts)} small loan
                                accounts in March 2026, and the Reserve Bank’s quarterly count of them, which leaves out the
                                regional rural banks, has ${SERIES.doubling >= 1.85 && SERIES.doubling < 2.25 ? "doubled" : `grown ${timesWords(SERIES.doubling)}`}
                                since ${since2017}. Microfinance companies that joined the return when they became small
                                finance banks account for ${pct(sfbShareOfRise, 0)} of that rise, and credit cards, which
                                come nearly two to a holder, for ${pct(cardsShareOfRise, 0)}.`}</Para>
                                    <Para>{`Loans above the line grew faster still, to ${timesWords(aboveGrowth)}
                                    their ${since2017} number. TransUnion CIBIL, which counts people across every kind
                                    of lender, put credit-active adults aged 18 to 60 at 28% in March 2026 against 11%
                                    in March 2017.`}</Para>
                            <Para last>{`Banks are no longer where most of the smallest loans are made. The Fintech Association
                                for Consumer Empowerment (FACE), the digital lenders’ body, counts 13.2 crore personal loans
                                sanctioned in 2025-26 by the NBFCs that lend mainly through apps. That is 77% of all personal
                                loans sanctioned by number, though only 19% by value, and none of them are in these figures.
                                What is not in doubt is the money: the small
                                accounts hold ₹${ACTUAL} of every ₹100 banks have out on loan.`}</Para>
                        </Reveal>
                    </Portion>
                    <Portion desktopSpan="8">
                        <Reveal delay={0.12}>
                            <Text className="so-what-kicker" weight="600" marginBottom="nano">WHAT IT COSTS</Text>
                            <Heading6 fontStyle="serif" weight="600" marginBottom="nano">The smallest loans carry the highest rates in the banks’ books</Heading6>
                            <Para>{`In March 2026 the smallest loans carried at least ${Math.round(SMALLEST.weightedRate)}% a
                                year, while the biggest carried about ${Math.round(TOP.weightedRate)}%. The small-loan
                                rate is higher still once credit cards are priced at the ${pct(cardRate, 0)} the Reserve
                                Bank reports for them. ${cap(shareOf(PRICE.accountsAt13, "loans"))} carry rates of 13% or more, and
                                ${pct(cardsOfAt13, 0)} of those are credit cards. Access to credit and its cost are
                                separate questions, and on cost the smallest loans in the banks’ books carry the highest
                                rates.`}</Para>
                            <Para>{`That is a gradient of products as much as of size, with subsidised crop loans at 7% in
                                the same band as cards at ${pct(cardRate, 0)}. The figures count loans, not people, so they
                                cannot say who pays the most.`}</Para>
                            <Para last>{`The gap has widened: in ${monthName(RATE_2014.quarter)} the same tables priced loans up to
                                ₹25,000 at about ${RATE_2014.smallest.toFixed(1)}% and loans above ₹100 crore at about
                                ${RATE_2014.top.toFixed(1)}%, less than a point apart. The bank rate is also the cheapest formal price such
                                borrowers see: Sa-Dhan, the other microfinance industry body, reports its member lenders
                                outside the banks charging 22% to 24% across the quarters of 2025-26.`}</Para>
                        </Reveal>
                    </Portion>
                    <Portion desktopSpan="8">
                        <Reveal delay={0.24}>
                            <Text className="so-what-kicker" weight="600" marginBottom="nano">WHAT CHANGED</Text>
                            <Heading6 fontStyle="serif" weight="600" marginBottom="nano">{`Small loans fell by about ${croreN(SERIES.fewer, 0)} crore between ${yearOf(Q_PEAK.quarter)} and ${yearOf(Q_LAST.quarter)}`}</Heading6>
                            <Para>{`Small loans grew for ${span(SERIES.riseMonths)}, to ${monthName(Q_PEAK.quarter)}${peakOnEntry ? `, though the count changed little through ${yearOf(Q_PEAK.quarter)}. The ${monthName(Q_PEAK.quarter).split(" ")[0]} high point includes about ${croreAbout(entryStep)} accounts that arrived in one quarter when a fintech’s loans were merged into a small finance bank` : ""}.
                                In the ${fallIn} since, they have fallen by
                                ${crore(SERIES.fewer)}${peakOnEntry ? ", and by more than that among the loans that were there before" : ""}.`}</Para>
                                <Para>{`The fall is in the small loans that private banks and small finance banks file
                                under agriculture, many of them group loans of the kind microfinance lenders make. It is
                                also in a count of consumer-durable accounts that fell while the money lent on them
                                ${durMoneyWords}. It is a loss of loans more than of borrowers: the credit bureaus’
                                counts suggest many were the second or third loans of people who kept one. The fixed
                                ₹2 lakh line explains little of it.`}</Para>
                            <Para last>{`Among women the count fell most in ${list(WOMEN.fallers.slice(0, 5).map(s => s.name))}${fallersMoneyRose
                                ? ", while the money lent to women rose in every one of them" : ""}. The next figures will show
                                whether this was a pause, a retreat, or a move to lenders these figures cannot see.`}</Para>
                        </Reveal>
                    </Portion>
                </Row>
                <Row horizontalPadding="medium" marginTop="large" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="20">
                        <WordReveal
                            className="closing-line"
                            text={prose(`Banks held about ${croreN(BELOW.accounts, 0)} crore small loan accounts in March 2026, many of them credit cards and held by fewer people than that. Those accounts hold ₹${ACTUAL} of every ₹100 banks have lent, and the unsecured ones among them carry the highest rates in the banks’ books. Since ${peakWhen} there are about ${croreN(SERIES.fewer, 0)} crore fewer of them at banks, and where those borrowers went, bank figures cannot say.`)}
                        />
                    </Portion>
                </Row>
            </Section>

            {/* WHAT THE RESEARCH SAYS ================================================================================= */}
            <Section className="chapter">
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="8">
                        <Chapter id="what-the-research-says" kicker="WHAT THE RESEARCH SAYS" title="The counts hold, but they count accounts rather than people, include one merger and place loans where they are booked">
                            <Prose>
                                {"The statistical standard is one borrower per person, however many accounts they hold. India reports loan accounts, not borrowers, to the "}
                                <Cite href="https://databank.worldbank.org/metadataglossary/world-development-indicators/series/FB.CBK.BRWR.P3">IMF’s Financial Access Survey</Cite>
                                {", which notes that many countries do so for want of data on account holders. "}
                                <Cite href="https://newsroom.transunioncibil.com/half-of-indias-new-to-credit-card-consumers-are-gen-z-and-reside-beyond-metros/">TransUnion CIBIL (2026)</Cite>
                                {" counts 10.7 crore active credit cards held by 5.2 crore people, and "}
                                <Cite href="https://www.crifhighmark.com/media/7364/microlend-quarterly-report-august-2026.pdf">CRIF High Mark (2026)</Cite>
                                {` 10.3 crore microfinance loans held by 6.6 crore borrowers. On those ratios the story’s ${croreN(BELOW.accounts, 0)} crore small accounts belong to perhaps 16 to 20 crore people.`}
                            </Prose>
                            <Prose>
                                {`Re-reading the same tables by bank group, we found that the ${monthName(Q_PEAK.quarter)} high point includes about ${croreAbout(entryStep)} very small accounts. They entered in one quarter when the fintech Slice was amalgamated into North East Small Finance Bank under a scheme effective 27 October 2024, by `}
                                <Cite href="https://slice.bank.in/documents/corporate-governance/annual-report/annual-report-2024-25.pdf">the bank’s own annual report</Cite>
                                {`. The small finance banks’ urban small loans and Assam’s loan accounts step up by the same amount that quarter, and the book has since grown: Assam’s accounts stand ${croreAbout(ENTRY.assamSince)} above their September 2024 count. ${monthName(Q_PEAK.quarter)} stays the published peak, but net of the entry the count stopped growing in ${marchOfPeakYear ? monthName(marchOfPeakYear.quarter) : "early 2024"}, and the fall since is larger than ${crore(SERIES.fewer)}, not smaller.`}
                            </Prose>
                            <Prose>
                                {"The Reserve Bank’s "}
                                <Cite href="https://www.rbi.org.in/Scripts/PublicationReportDetails.aspx?UrlPage=&ID=1313">Financial Stability Report (December 2025)</Cite>
                                {` says unsecured retail lending declined sharply after its November 2023 increase in risk weights. The tables agree for the loans the rule covered: small loans in the big cities peaked in ${monthName(metroPeak.quarter)}, the month after the circular. The rule never covered farm loans, where most of the fall is, and the Reserve Bank took banks’ microfinance loans back out of it in `}
                                <Cite href="https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12786">February 2025</Cite>
                                {". "}
                                <Cite href="https://mfinindia.org/assets/upload_image/news/pdf/Micrometer%20Q1%20FY%2026-27%20Press%20Release.pdf">MFIN (2026)</Cite>
                                {" records seven quarters of microfinance contraction from mid-2024 before a turn in the March 2026 quarter. In the year to March 2026 every lender type shrank, banks most, though MFIN says much of banks’ later decline is loans reclassified as retail. It attributes the fall to curtailed funding and stricter underwriting under its guardrails."}
                            </Prose>
                            <Prose>
                                <Cite href="https://www.financialaccess.org/assets/publications/2017/Kunt-Morduch-The-Microfinance-Business-Model.pdf">Cull, Demirgüç-Kunt and Morduch (2018)</Cite>
                                {", on 1,335 microfinance institutions worldwide, find unit costs substantially higher for small loans, reflecting the fixed cost of making each loan. The Reserve Bank’s own "}
                                <Cite href="https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx?Id=12183">surveys of small borrowal accounts</Cite>
                                {` found small accounts paying slightly less than large ones on average until 2008 (11.5% against 12.3% in March 2008), before the base-rate system of 2010 removed the ceiling on their pricing. The story’s ${SMALLEST.weightedRate.toFixed(1)}% is a floor: the table’s top range is open and holds credit cards, which the Reserve Bank prices at ${pct(cardRate, 0)}. Outside banks the same loans cost 22% to 24% (`}
                                <Cite href="https://www.sa-dhan.net/wp-content/uploads/2026/07/QMR_Q4-FY-26.pdf">Sa-Dhan, 2026</Cite>
                                {")."}
                            </Prose>
                            <Prose last>
                                <Cite href="https://faceofindia.org/wp-content/uploads/2026/06/Digital-Personal-Loans_-Mar-2026_-1-June_Website-.pdf">FACE (2026)</Cite>
                                {" counts 13.2 crore personal loans sanctioned in 2025-26 by the NBFCs that lend mainly through apps, 77% of all personal loans sanctioned by number and 19% by value, none of them in the bank returns. "}
                                <Cite href="https://pages.stern.nyu.edu/~pschnabl/slides/SmallBusinessSlides.pdf">Gopal and Schnabl (2022)</Cite>
                                {" found US bank small-business lending in 2016 still 24% below its pre-crisis level, while total lending, once finance companies and fintech lenders were counted, grew no less in the counties that had depended most on banks. A bank-only count says where a fall happened at banks, not whether borrowers lost credit. The Guwahati entry shows how far one lender’s change of status can move that count."}
                            </Prose>
                        </Chapter>
                    </Portion>
                </Row>
            </Section>

            {/* THE NUMBERS BEHIND THE DOTS ============================================================================ */}
            <Section className="chapter" id="receipts">
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="half">
                        <Reveal>
                            <Text className="kicker" weight="600" marginBottom="nano">THE NUMBERS BEHIND THE DOTS</Text>
                            <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="nano">The exact figures</Heading4>
                            <Text fontStyle="serif" opacity="80">
                                The dots in the story round the figures off. These charts give them exactly, and each has a table view with every value.
                            </Text>
                        </Reveal>
                    </Portion>
                </Row>
                <Row horizontalPadding="small" marginTop="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="half">
                        <Reveal>
                            <Figure
                                title={`Deposit accounts and loans, March ${SAVE_BORROW.year}`} units="deposit accounts by the branch that holds them; loans by where the money is used"
                                table={{ head : [ "", "Deposit accounts", "Loans", "Deposit accounts per loan" ], numeric : [ false, true, true, true ], rows : SAVE_BORROW.rows.map(r => [ r.label, crore(r.depositAccounts), crore(r.creditAccounts), r.ratio.toFixed(1) ]) }}
                                note="From the Handbook of Statistics on the Indian Economy: deposits and credit by population group."
                            >
                                <SaveBorrowChart />
                            </Figure>
                        </Reveal>
                    </Portion>
                    <Portion desktopSpan="half">
                        <Reveal delay={0.1}>
                            <Figure
                                title="What loans of each size cost, March 2026" units="interest rate on the books, per cent a year, weighted by amount; a lower bound for the smallest loans, since the top range is open"
                                table={{ head : [ "Loan size", "Average rate", "Money at 13% or more", "Loans at 13% or more" ], numeric : [ false, true, true, true ], rows : BANDS.map((b, i) => [ BAND_NAMES[i], `${(b.weightedRate ?? 0).toFixed(1)}%`, pct(b.amtAtLeast13 ?? 0, 0), pct(b.accAtLeast13 ?? 0, 0) ]) }}
                                note={prose(`From the annual Basic Statistical Return, Table 2.1. Each rate is a weighted midpoint of DBIE’s
                                    rate ranges, taking 14% for “13% and above”. That top range has no upper end, and it holds ${pct(SMALLEST.amtAtLeast13, 0)}
                                        of the money in loans up to ₹25,000 and ${pct(cardMoneyAt13, 0)} of
                                        credit-card balances (Table 3.3). The rates shown for the small bands are
                                        therefore lower bounds, and the true slope is steeper. The Reserve Bank’s own
                                        weighted rate for credit cards (quarterly BSR-1, Table 1.9, March 2026) is
                                        ${pct(cardRate, 1)}, and until December 2020 DBIE’s ranges ran to “20% and above”.
                                        The rates are the contracted rates banks report, before fees.`)}
                            >
                                <HBars
                                    rows={[ ...BANDS ].map((b, i) => ({ key : b.label, label : BAND_NAMES[i], value : b.weightedRate ?? 0, note : `${pct(b.amtAtLeast13 ?? 0, 0)} at 13%+`, kind : (b.hi !== null && b.hi <= 200000 ? "accent" : "muted") as "accent" | "muted" })).reverse()}
                                    format={v => `${v.toFixed(1)}%`} max={14} noteWidth={92}
                                    ariaLabel="Interest rate on the books by size of loan, March 2026"
                                />
                            </Figure>
                        </Reveal>
                    </Portion>
                </Row>
                <Row horizontalPadding="small" marginTop="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="half">
                        <Reveal>
                            <Figure
                                title="Loans and money by size of loan, March 2026" units="share of all loans, and of all the money lent"
                                table={{ head : [ "Loan size", "Loans", "Share", "Amount", "Share" ], numeric : [ false, true, true, true, true ], rows : BANDS.map((b, i) => [ BAND_NAMES[i], crore(b.accounts), pct(bandShares(i).accounts), lakhCrore(b.outstanding), pct(bandShares(i).outstanding) ]) }}
                                note={`From the annual Basic Statistical Return, Table 1.8: all ${crore(BOOK.accounts)} loans.`}
                            >
                                <PyramidChart />
                            </Figure>
                        </Reveal>
                    </Portion>
                    <Portion desktopSpan="half">
                        <Reveal delay={0.1}>
                            <Figure
                                title="Small loans, quarter by quarter" units={`${monthName(Q_FIRST.quarter)} to ${monthName(Q_LAST.quarter)}`}
                                table={{ head : [ "Quarter", "Small loans", "Share of all loans", "₹ of every ₹100" ], numeric : [ false, true, true, true ], rows : SERIES_DOTS.map(q => [ q.quarter, `${q.value.toFixed(2)} crore`, pct(q.borrowers), `₹${q.share.toFixed(1)}` ]) }}
                                note={prose(`From the quarterly Basic Statistical Return, Table 2.1, which leaves out the regional rural banks and
                                    counts each loan at the branch that made it. The ${monthName(ENTRY.quarter)} quarter includes about
                                    ${croreAbout(entryStep)} accounts that entered when a fintech’s loans were merged into a small finance bank.`)}
                            >
                                <SeriesPanels />
                            </Figure>
                        </Reveal>
                    </Portion>
                </Row>
            </Section>

            {/* SOURCES & METHOD ======================================================================================= */}
            <Section id="ttll-sources">
                <Row horizontalPadding="medium" marginTop="large" allowUltraWide>
                    <Portion desktopSpan="half">
                        <Divider kind="secondary" verticalMargin="micro" />
                        <Text weight="600" size="tiny" verticalMargin="micro">SOURCES</Text>
                        <Text size="tiny" marginBottom="micro">
                            {prose(`Reserve Bank of India, Basic Statistical Returns of scheduled commercial banks, as published on
                                DBIE. The annual BSR-1 for March 2026, which includes the regional rural banks: Table 1.8 (credit by
                                size of limit), Table 2.1 (size of limit by interest rate), Table 3.3 (interest rate by occupation),
                                Table 1.13 (small borrowal accounts by occupation), Table 2.13 (states, by place of sanction), the
                                district-wise return (by place of utilisation, every year from 2010) and Table 2.14 (districts by
                                place of sanction). The quarterly BSR-1, March 2014 to June 2026, which leaves them out and counts
                                each loan at the branch that made it: Table 2.1 (small borrowal accounts by population group and
                                bank group), Table 1.7 (size of limit), Table 1.3 (states), Table 3.5a (small borrowal accounts by
                                occupation), Table 1.9 (the Reserve Bank’s weighted average lending rate by occupation), Table 2.5
                                in its older format (size of limit by interest rate, with ranges to “20% and above”, to December
                                2020) and Table 1.10 (credit to individuals by district and gender). The Handbook of Statistics on
                                the Indian Economy for deposit accounts and loans by population group, with credit by place of
                                utilisation, and the net state domestic product series for population. The ₹2 lakh line dates from
                                the March 1999 return, when the Reserve Bank raised the cut-off from ₹25,000 (RBI, Basic Statistical
                                Returns, volume 28, March 1999, introduction; RBI Bulletin, Survey of small borrowal accounts:
                                2008, May 2011). The November 2023 change to risk weights on consumer credit is RBI notification
                                RBI/2023-24/85; the circular of 25 February 2025 that took banks’ microfinance loans back out of it
                                is RBI/2024-25/119, and RBI/2024-25/120, issued the same day, restored the risk weights on bank
                                lending to NBFCs from 1 April 2025. The 10% yearly step-up in Kisan Credit Card limits is in the
                                RBI’s master circular on the scheme (RBI/2017-18/4), and the 7% rate is the interest subvention
                                scheme for 2025-26. The microfinance industry’s caps of ₹2 lakh per borrower and four, then three,
                                lenders are MFIN’s directives of 8 July and 25 November 2024. The merger that put a fintech’s loans
                                into the returns in December 2024 is recorded in slice Small Finance Bank’s annual report for
                                2024-25 (scheme of amalgamation effective 27 October 2024). Counts of people rather than loans,
                                and of loans at lenders outside the banks, are from TransUnion CIBIL (8 April, 8 July and 30 July
                                2026), CRIF High Mark (MicroLend, August 2026, and How India Lends, September 2026), Sa-Dhan
                                (quarterly report for January to March 2026), FACE (Digital personal loans, March 2026) and the
                                World Bank’s Global Findex 2025. The population projections are those of the Technical Group on
                                Population Projections (July 2020).`)}
                        </Text>
                        <Text weight="600" size="tiny" verticalMargin="micro">FURTHER READING</Text>
                        {READING.map(r => (
                            <Div key={r.href} marginBottom="nano">
                                <a href={r.href} target="_blank" rel="noopener" className="download-link">
                                    <Div verticallyCentreItems>
                                        <BookOpen size="16px" />
                                        <Text weight="600" marginLeft="nano" size="tiny">{r.title}</Text>
                                    </Div>
                                </a>
                                <Text size="tiny" opacity="80">{r.note}</Text>
                            </Div>
                        ))}
                        <Text weight="600" size="tiny" verticalMargin="micro">DOWNLOADS</Text>
                        {SOURCES.map(([ file, label ]) => (
                            <Div key={file}>
                                <Link href={`/stories/the-two-lakh-line/${file}`} download className="download-link">
                                    <Div verticallyCentreItems marginBottom="nano">
                                        <Download size="16px" />
                                        <Text weight="600" marginLeft="nano" size="tiny">Download {label} (CSV)</Text>
                                    </Div>
                                </Link>
                            </Div>
                        ))}
                        <Div>
                            <Link href="/publications" className="download-link">
                                <Div verticallyCentreItems marginTop="nano" marginBottom="nano">
                                    <Table2 size="16px" />
                                    <Text weight="600" marginLeft="nano" size="tiny">Go to the Basic Statistical Returns</Text>
                                </Div>
                            </Link>
                        </Div>
                    </Portion>

                    <Portion desktopSpan="half">
                        <Divider kind="secondary" verticalMargin="micro" />
                        <Text weight="600" size="tiny" verticalMargin="micro">METHOD</Text>
                        <MethodNote title="Loans, not people.">{`Every count here is of loans, strictly loan accounts: one person can have several, and
                            each credit card counts as one. The Reserve Bank publishes no count of distinct bank
                            borrowers. India reports loan accounts, not borrowers, to the IMF’s Financial Access
                            Survey, whose standard is one borrower per person however many accounts they hold.`}</MethodNote>
                        <MethodNote title="What the bureaus count.">{`Where the credit bureaus do count people, the gap is wide. In March 2026, 10.7 crore
                            active credit cards were held by 5.2 crore people, and in June 2026, 10.3 crore
                            microfinance loans by 6.6 crore borrowers. By TransUnion CIBIL’s count, 28% of adults aged
                            18 to 60 had a live retail loan in March 2026, against 11% in March 2017. On those ratios the ${crore(BELOW.accounts)} small loans
                            belong to roughly 16 to 20 crore people, and the fall since 2024 is smaller in people than
                            in loans.`}</MethodNote>
                        <MethodNote title="The line.">{`The ₹2 lakh line is the Reserve Bank’s own: a small borrowal account is a loan whose
                            sanctioned limit is ₹2 lakh or less. The Bank drew the line in the March 1999 return, when
                            it raised the cut-off from ₹25,000, and has not moved it since; the regional rural banks
                            moved to the same line in March 2002. A limit is fixed when a loan is sanctioned. A
                            loan crosses the line only when its limit is renewed higher, as a Kisan Credit Card limit
                            is by 10% a year, or when a bigger loan replaces it.`}</MethodNote>
                        <MethodNote title="Crossing the line.">{`Some loans cross the line every year as their limits are renewed. That is why the share
                            of small loans slipped from ${Math.round(at2020.borrowers)} in every hundred in
                            ${monthName(q20.quarter)} to ${Math.round(peak.borrowers)} by ${monthName(Q_PEAK.quarter)}
                            while their number was still rising. It does not explain the fall since then. Loans above the line
                            ${SERIES.aboveRise >= 0 ? "grew" : "fell"} by ${crore(Math.abs(SERIES.aboveRise))} in the
                            ${fallIn} to
                            ${monthName(Q_LAST.quarter)}${aboveRiseBefore >= 0 ? `, and grew by ${crore(aboveRiseBefore)} in the ${fallIn} before` : ""}.
                            The number of loans of every size
                            ${allSizesChange < 0 ? `fell by ${crore(-allSizesChange)}` : `rose by ${crore(allSizesChange)}`}
                            over the same ${fallIn}.`}</MethodNote>
                        <MethodNote title="About the dots.">{`At the start, each dot is ten lakh accounts, rounded so that the dots add up to the
                            totals. When the stack is counted by money, each of the ${LOAN_DOTS} loan dots stands for
                            ₹${(100 / LOAN_DOTS).toFixed(2)} of every ₹100 lent. In the scenes over time, each dot is
                            a crore small loans, and a part-lit dot shows the fraction. The charts further down give
                            the exact values.`}</MethodNote>
                        <MethodNote title="Two sets of figures.">{`The yearly figures for March 2026 include the regional rural banks. They give the stack of
                            loans, what loans cost, and the districts. The quarterly figures leave those banks out:
                            ${crore(RRB.small)} of the ${crore(BELOW.accounts)} small loans and
                            ${lakhCrore(RRB.money, 0)} of their ${lakhCrore(BELOW.outstanding)}. They give everything
                            that moves through time, the states, and the figures on women. The two are never mixed in
                            one number.`}</MethodNote>
                        <MethodNote title="Banks only.">{`The Basic Statistical Returns are filed by scheduled commercial banks: public and private
                            sector banks, foreign banks, the small finance banks and, in the yearly figures, the
                            regional rural banks. They include the loans that microfinance companies make as banks’
                            agents. Finance companies, microfinance companies lending on their own books, lending
                            apps, and cooperative banks and societies do not file them, so their loans appear nowhere
                            in this story. That is a great deal of small lending. In June 2026 CRIF High Mark counted
                            10.3 crore microfinance loans across all lenders, and in 2025-26 the NBFCs that lend mainly
                            through apps sanctioned 13.2 crore personal loans.`}</MethodNote>
                        <MethodNote title="What the bank figures cannot tell.">{`A fall in bank loans can mean borrowers moving to those lenders, or those lenders
                            shrinking too, and the bank figures cannot tell the two apart. In the year to March 2026
                            microfinance shrank at every kind of lender, while in the year to June 2026 consumer durable
                            loans grew across all lenders as they fell at banks. A lender can also join the returns:
                            when a fintech’s loans were merged into a small finance bank in October 2024, about
                            ${croreAbout(entryStep)} accounts entered them in one quarter.
                            Between ${monthName(WHERE_THEY_WENT.from)} and ${monthName(WHERE_THEY_WENT.to)},
                            ${crore(fall(durables))} consumer-durable accounts in the big cities left the return while
                            the money outstanding on them ${durMoneyWords}. That points to a reclassification rather
                            than a repayment.`}</MethodNote>
                        <MethodNote title="Breaks in the series.">{`Accounts enter the quarterly figures when a lender becomes or merges into a bank, and
                            leave when a bank closes or reclassifies them, without any loan being made or repaid. The
                            small finance banks, most of them former microfinance lenders, report from September 2017,
                            one quarter after the series here begins, and ${pct(sfbShareOfRise, 0)} of the rise since
                            then is theirs. In ${monthName(ENTRY.quarter)} about ${croreAbout(entryStep)} small app-based
                            credit accounts, booked in Guwahati, entered the return in one quarter when a fintech’s
                            loans were merged into a small finance bank. They are still on the books and have grown:
                            Assam’s loan accounts stand ${croreAbout(ENTRY.assamSince)} above their September 2024 count.
                            They lift the ${monthName(ENTRY.quarter)} count, the urban count, and Assam’s and Kamrup
                            Metropolitan’s figures from then on.${peakOnEntry && marchOfPeakYear !== null ? ` Without them the count would not have risen above ${monthName(marchOfPeakYear.quarter)}’s, and the fall since ${monthName(Q_PEAK.quarter)} would be somewhat larger than ${crore(SERIES.fewer)}.` : ""}`}</MethodNote>
                        <MethodNote title="Villages, towns and cities.">{`These are the Reserve Bank’s four population groups. Rural centres have fewer than 10,000
                            people, semi-urban centres fewer than a lakh, urban centres fewer than ten lakh, and
                            metropolitan centres ten lakh or more.`}</MethodNote>
                        <MethodNote title="Where a loan is counted.">{`The Reserve Bank records two places for every loan, the branch that sanctioned it and the
                            place where the money is used, and publishes some tables on each basis. The district
                            figures, and the deposit-and-loan counts by village and city at the start, count a loan
                            where the bank reports the money is used. Everything else, the small loans by village and
                            city over time, the states, and the figures on women, counts it at the branch that made
                            it. Even by use, a loan to a company, a finance company or a government body is placed at
                            the borrower’s office. That is why New Delhi district shows
                            ${newDelhi ? lakhCrore(newDelhi.outstanding) : "so much"} of credit.`}</MethodNote>
                        <MethodNote title="Books that move.">{`A lender that moves its loans to a central office moves them to that district, and across
                            state lines. That is the likeliest reading of what happened in Mumbai between March and
                            June 2026. Loans to individuals, men’s and women’s alike, left the books of branches in
                            Mumbai Suburban while the all-India total kept rising. The same thing happens in reverse in Assam, where a
                            fintech’s loans, made across the country through an app, are booked at the merged bank’s
                            office in Guwahati. From December 2024 they appear as Assam’s in the state figures, as
                            Kamrup Metropolitan’s in the district figures on women, and as urban in the
                            village-to-city figures.`}</MethodNote>
                        <MethodNote title="Group loans and agents.">{`Banks also book their group loans to women at a few branches. The districts that lost the
                            most loans to women${bookingHubs.length > 0 ? `, ${list(bookingHubs)} among them,` : ""}
                            are where those books are kept. Loans that microfinance institutions make as banks’
                            business correspondents are on the bank’s books (RBI circular RBI/2005-06/288) and enter
                            the return through the bank branch that holds them. For a joint account, the gender is that
                            of the first holder (RBI, Handbook of instructions for the Basic Statistical Returns, 2008).`}</MethodNote>
                        <MethodNote title="Like with like.">{`DBIE prints many districts on two rows, one carrying the older quarters and one the
                            newer. Each state’s figure adds up every row, and each district its rows by name. Districts
                            renamed or redrawn between March 2024 and June 2026, such as Ramanagara, now Bengaluru
                            South, and Ahmadnagar, now Ahilyanagar, are left out of the district comparisons. Assam is
                            left out altogether: a fintech’s loans booked in Guwahati entered its figures in December
                            2024 through a merger into a small finance bank, so its two dates would not cover the same
                            lenders. The maps show the 28 states, Delhi, and Jammu & Kashmir; the smaller union
                            territories are in the downloads.`}</MethodNote>
                        <MethodNote title="Nothing typed by hand." last>{`Every number from the returns is read from the DBIE tables by a program that checks the
                            totals and the shape of each table every time it runs. The sentences in the story use
                            those same numbers. The interest rate for each loan size is a weighted midpoint of DBIE’s rate
                            ranges. The only figures typed in are those cited from other publications, which are named
                            where they appear.`}</MethodNote>
                    </Portion>
                </Row>
            </Section>
        </Article>
    </MotionConfig>
);

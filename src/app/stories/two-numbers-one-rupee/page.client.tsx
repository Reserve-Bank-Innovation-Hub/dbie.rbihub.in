"use client";

// REACT CORE ==========================================================================================================
import Link from "next/link";
import { ReactNode, useEffect, useRef, useState, type CSSProperties } from "react";

// UI ==================================================================================================================
import { Article, Card, Div, Divider, Heading1, Heading4, Heading6, Portion, Row, Section, Text } from "fictoan-react";
import { BookOpen, Download, Table2 } from "lucide-react";
import { MotionConfig } from "framer-motion";

// LOCAL COMPONENTS ====================================================================================================
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";
import { Explorer } from "./Explorer";
import { LakhDollars } from "./LakhDollars";
import { AnimatedNumber, CountUp, Reveal } from "./Motion";
import { RupeeStage, cssOf, usePalette, type SceneId } from "./RupeeStage";

// DATA ================================================================================================================
import {
    BAND, BASKET, CENTS_FROM, CENTS_TO, HEADLINE, MONTHS, N, PARTNERS, REBASED, REGIONS, REL_RISE, SERIES, SWING_MONTHS, USD,
    YEARLY, idx1, inr, monthName, pct, weightOf,
} from "./data";

// STYLES ==============================================================================================================
import "./two-numbers-one-rupee.css";

// THE WORDS ===========================================================================================================
const prose = (s : string) => s.replace(/\s+/g, " ").trim();
const { neer, reer, usd, swing, range } = HEADLINE;
const FROM = monthName(HEADLINE.first), TO = monthName(HEADLINE.last);
const dollarFall = 100 * (1 - CENTS_TO / CENTS_FROM);
const usdHigh = Math.max(...(USD as number[]));
const usdHighMonth = MONTHS[(USD as number[]).indexOf(usdHigh)];
const reerBelow100From = MONTHS[SERIES.reer40t.findLastIndex(v => v >= 100) + 1];
const end = (l : keyof typeof REBASED) => REBASED[l][N - 1];
const realEnd = end("reer") - 100;
const TOP_SIX = PARTNERS.slice(0, 6);

// Each financial year's change, in logs, so the three add: nominal + prices = real.
const DECOMP = YEARLY.slice(1).map((y, i) => {
    const p = YEARLY[i];
    const dn = 100 * Math.log(y.neer / p.neer), dr = 100 * Math.log(y.reer / p.reer);
    return { fy : y.fy, dn, dp : dr - dn, dr };
});

// The guess against the answer, once the reader has locked one in.
const verdict = (g : number) => prose(`You guessed ${g}% cheaper. Against the 40 currencies and adjusted for prices, Indian goods
    ended ${Math.abs(realEnd).toFixed(0)}% ${realEnd >= 0 ? "dearer" : "cheaper"} than in ${FROM}: the real rate is the solid
    line, your guess the dashed one.`);

const Chapter = ({ kicker, title, children, id } : { kicker : string; title : string; children : ReactNode; id : string }) => (
    <Reveal>
        <Text className="kicker" weight="600" marginBottom="nano" id={id}>{kicker}</Text>
        <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">{title}</Heading4>
        {children}
    </Reveal>
);
const Para = ({ children, last = false } : { children : string; last ? : boolean }) => <Text fontStyle="serif" marginBottom={last ? undefined : "nano"}>{prose(children)}</Text>;
const Say = ({ children, last = false } : { children : string; last ? : boolean }) => <Text fontStyle="serif" marginBottom={last ? undefined : "nano"}>{prose(children)}</Text>;
const MethodNote = ({ title, children, last = false } : { title : string; children : string; last ? : boolean }) => (
    <Text size="tiny" marginBottom={last ? undefined : "micro"}><strong>{title}</strong> {prose(children)}</Text>
);

const StepCard = ({ active, kicker, big, title, children } : { active : boolean; kicker : string; big ? : ReactNode; title : ReactNode; children ? : ReactNode }) => (
    <Card className={`step-card ${active ? "is-active" : ""}`} padding="micro">
        <Text className="step-kicker" weight="600" size="small" marginBottom="nano">{kicker}</Text>
        {big && <div className="step-big">{big}</div>}
        <Heading6 className="step-title" fontStyle="serif" weight="600" marginBottom="nano">{title}</Heading6>
        {children}
    </Card>
);

// A ring filled to a share of the basket, per cent: whole until a region or a partner is picked out.
const ShareRing = ({ share } : { share : number }) => {
    const r = 22, c = 2 * Math.PI * r;
    return (
        <svg className="share-ring" width={56} height={56} viewBox="0 0 56 56" aria-hidden="true">
            <circle cx={28} cy={28} r={r} className="ring-track" />
            <circle cx={28} cy={28} r={r} className="ring-fill" strokeDasharray={`${(c * share / 100).toFixed(2)} ${c.toFixed(2)}`} transform="rotate(-90 28 28)" />
        </svg>
    );
};

// THE OPENING =========================================================================================================
const STEPS : SceneId[] = [ "hero", "basket", "dollar", "guess", "neer", "prices", "reer", "swing" ];
const signed = (v : number, dp = 0) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(dp)}%`;

const TheOpening = () => {
    const [ scene, setScene ] = useState<SceneId>("hero");
    const [ focus, setFocus ] = useState<{ label : string; codes : string[] } | null>(null);
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
    useEffect(() => { if (scene !== "basket") setFocus(null); }, [ scene ]);

    // The opening moves a whole step at a time: one scroll from the title settles on the basket, the next on the
    // dollar, and so on. The page snaps only while this story is open; the chapters after the opening are one tall
    // snap area, inside which the page scrolls freely. An attribute rather than a class, since the theme rewrites the
    // root's classes.
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute("data-story-snap", "");
        return () => root.removeAttribute("data-story-snap");
    }, []);

    // A wheel gesture or a key moves exactly one step. Snapping alone settles back on a small wheel turn and lets a
    // trackpad's momentum run past several steps, so within the opening the page is moved here, and the rest of a
    // gesture (its momentum included) is swallowed until the wheel has been quiet for a moment. Touch and the
    // scrollbar are left to the snapping.
    useEffect(() => {
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        let busyUntil = 0, quietUntil = 0;
        const stops = () => {
            const ys = STEPS.map(id => {
                const el = stepRefs.current[id];
                if (!el) return NaN;
                const r = el.getBoundingClientRect();
                return r.top + scrollY + (r.height - innerHeight) / 2;
            });
            const after = document.querySelector<HTMLElement>("#two-numbers-page .after-opening");
            return { ys, after : after ? after.getBoundingClientRect().top + scrollY : Infinity };
        };
        // Where one step in `dir` leads from here, or null when the page should scroll as usual.
        const next = (dir : 1 | -1) => {
            const { ys, after } = stops();
            const y = scrollY;
            if (y > after + 2) return null;                                  // in the chapters
            if (y >= after - 2) return dir < 0 ? ys[ys.length - 1] : null;   // at the chapters' top
            const i = ys.reduce((best, v, k) => (Math.abs(v - y) < Math.abs(ys[best] - y) ? k : best), 0);
            const j = Math.abs(ys[i] - y) < 4 ? i + dir : dir > 0 ? (ys[i] > y ? i : i + 1) : (ys[i] < y ? i : i - 1);
            if (j < 0) return ys[0];
            return j >= ys.length ? after : ys[j];
        };
        const go = (target : number) => {
            busyUntil = performance.now() + (reduced ? 50 : 750);
            // the stage starts its change as the page starts to move, not when the step reaches the middle
            const { ys } = stops(), k = ys.findIndex(v => Math.abs(v - target) < 2);
            if (k >= 0) setScene(STEPS[k]);
            scrollTo({ top : target, behavior : reduced ? "auto" : "smooth" });
        };
        const onWheel = (e : WheelEvent) => {
            if (Math.abs(e.deltaY) < Math.abs(e.deltaX) || e.ctrlKey) return;
            const now = performance.now();
            const fresh = now > quietUntil && now > busyUntil;
            const dir = e.deltaY > 0 ? 1 : -1;
            const target = next(dir);
            if (target === null) return;
            e.preventDefault();
            quietUntil = now + 160;
            if (fresh && Math.abs(e.deltaY) > 2) go(target);
        };
        const onKey = (e : KeyboardEvent) => {
            if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
            const t = e.target as HTMLElement | null;
            if (t && (t.closest("input, textarea, select, [contenteditable]"))) return;
            const dir = [ "ArrowDown", "PageDown" ].includes(e.key) || (e.key === " " && !e.shiftKey) ? 1
                : [ "ArrowUp", "PageUp" ].includes(e.key) || (e.key === " " && e.shiftKey) ? -1 : 0;
            if (!dir) return;
            const target = next(dir);
            if (target === null) return;
            e.preventDefault();
            if (performance.now() > busyUntil) go(target);
        };
        addEventListener("wheel", onWheel, { passive : false });
        addEventListener("keydown", onKey);
        return () => { removeEventListener("wheel", onWheel); removeEventListener("keydown", onKey); };
    }, []);

    const ref = (id : SceneId) => (el : HTMLElement | null) => { stepRefs.current[id] = el; };
    const on = (id : SceneId) => scene === id;
    const lockIn = () => {
        setLocked(guess);
        stepRefs.current.neer?.scrollIntoView({ behavior : matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block : "center" });
    };
    // A chip picks out its partners while pointed at, and stays picked on a tap until tapped again.
    const chip = (label : string, codes : string[]) => ({
        onPointerEnter : (e : React.PointerEvent) => { if (e.pointerType === "mouse") setFocus({ label, codes }); },
        onPointerLeave : (e : React.PointerEvent) => { if (e.pointerType === "mouse") setFocus(null); },
        onFocus        : () => setFocus({ label, codes }),
        onBlur         : () => setFocus(null),
        onClick        : () => setFocus(f => (f?.label === label ? null : { label, codes })),
        "aria-pressed" : focus?.label === label,
    });
    const focusWeight = focus ? weightOf(focus.codes) : 0;
    const stageGuess = scene === "guess" ? guess : locked;

    return (
        <Div className="act">
            <Div className="stage">
                <RupeeStage scene={scene} focus={focus?.codes ?? null} guess={stageGuess} />
            </Div>

            <Div className="steps">
                {/* THE TITLE ================================================================================ */}
                <Div className="step is-hero" data-scene="hero" ref={ref("hero")}>
                    <Div className="title-card">
                        <PageCrumbs />
                        <Text className="hero-kicker" weight="600" marginBottom="nano">THE RUPEE AND THE WORLD</Text>
                        <Heading1 className="hero-title" marginBottom="micro">Two numbers, <span className="accent">one rupee</span></Heading1>
                        <Text className="hero-sub" fontStyle="serif" size="large">
                            {prose(`The rupee went from ₹${usd.fy0.toFixed(2)} a dollar on average in ${HEADLINE.fy0} to ₹${usd.fyN.toFixed(2)} in
                                ${HEADLINE.fyN}, and made headlines at every step. Measured against the 40 currencies India trades in, and
                                adjusted for prices, it hardly moved. Both numbers are true. They answer different questions.`)}
                        </Text>
                        <Text size="small" className="hero-cue" marginTop="small">The story continues below</Text>
                    </Div>
                </Div>

                {/* THE BASKET =============================================================================== */}
                <Div className="step" data-scene="basket" ref={ref("basket")}>
                    <StepCard
                        active={on("basket")} kicker="THE BASKET"
                        big={(
                            <div className="share-big">
                                <ShareRing share={focus ? focusWeight : 100} />
                                {focus
                                    ? <span><AnimatedNumber value={focusWeight} format={v => v.toFixed(1)} /><span className="big-of">% of the basket</span></span>
                                    : <span>40<span className="big-of"> currencies</span></span>}
                            </div>
                        )}
                        title={focus ? focus.label : "A rupee is priced against 40 currencies at once"}
                    >
                        <Say>{`The dollar is only one of them. The Reserve Bank’s effective exchange rates weigh the rupee against
                            the currencies of 40 trading partners, each by its share of India’s trade in ${BASKET ? "2015-16" : "the base year"}.
                            The arcs run from India to each; the deeper a country’s dots, the more it counts.`}</Say>
                        <Text size="small" className="chip-hint" marginBottom="nano">Point at a region, or at a country on the globe.</Text>
                        <div className="chips" role="group" aria-label="Regions of the basket">
                            {REGIONS.map(r => (
                                <button key={r.key} type="button" className={`chip ${focus?.label === r.label ? "is-on" : ""}`} {...chip(r.label, r.codes)}>
                                    {r.label}<span>{weightOf(r.codes).toFixed(1)}%</span>
                                </button>
                            ))}
                        </div>
                        <div className="chips is-partners" role="group" aria-label="The six largest partners">
                            {TOP_SIX.map(p => (
                                <button key={p.iso} type="button" className={`chip ${focus?.label === p.country ? "is-on" : ""}`} {...chip(p.country, [ p.iso ])}>
                                    {p.country}<span>{p.weight.toFixed(1)}%</span>
                                </button>
                            ))}
                        </div>
                    </StepCard>
                </Div>

                {/* THE DOLLAR =============================================================================== */}
                <Div className="step" data-scene="dollar" ref={ref("dollar")}>
                    <StepCard active={on("dollar")} kicker="THE FALL EVERYONE SEES" big={<CountUp start={on("dollar")} to={dollarFall} format={v => `−${v.toFixed(0)}%`} />} title="what a rupee buys in US dollars">
                        <Say>{`The globe has turned into months: each dot is one, from ${FROM} to ${TO}. A rupee bought
                            ${CENTS_FROM.toFixed(2)} US cents at the start and ${CENTS_TO.toFixed(2)} at the end. Start it at 100 and
                            it ends at ${end("usd").toFixed(0)}.`}</Say>
                        <Say last>{`${monthName(usdHighMonth)} was the dearest month for a dollar in the whole run, at ₹${usdHigh.toFixed(2)} on average.`}</Say>
                    </StepCard>
                </Div>

                {/* THE GUESS ================================================================================ */}
                <Div className="step" data-scene="guess" ref={ref("guess")}>
                    <StepCard active={on("guess")} kicker="BEFORE THE ANSWER" title="The rupee lost more than half its value in dollars. How much cheaper did Indian goods become for the countries that buy them?">
                        <Div className="slider-row">
                            <input type="range" min={0} max={60} step={1} value={guess} onChange={e => { setGuess(+e.target.value); setLocked(null); }}
                                aria-label="Your guess, per cent cheaper" />
                            <Text className="guess-value" weight="700">{guess}%</Text>
                        </Div>
                        <Text size="small" className="chip-hint" marginBottom="nano">Your guess is the dashed line on the chart.</Text>
                        <button type="button" className="lock-in" onClick={lockIn}>{locked === null ? "Lock in my guess ↓" : "Locked in ↓"}</button>
                    </StepCard>
                </Div>

                {/* THE BASKET'S RATE ======================================================================== */}
                <Div className="step" data-scene="neer" ref={ref("neer")}>
                    <StepCard active={on("neer")} kicker="AGAINST ALL 40" big={<CountUp start={on("neer")} to={-neer.change} format={v => `−${v.toFixed(1)}%`} />} title="against the whole basket">
                        <Say last>{`The nominal effective exchange rate (NEER) asks what a rupee buys in the basket of 40 currencies,
                            each weighted by trade. On the Reserve Bank’s index it fell from ${idx1(neer.from)} to ${idx1(neer.to)}: less steeply
                            than against the dollar alone, but still by more than two-fifths.`}</Say>
                    </StepCard>
                </Div>

                {/* PRICES =================================================================================== */}
                <Div className="step" data-scene="prices" ref={ref("prices")}>
                    <StepCard active={on("prices")} kicker="THE OTHER HALF" big={<CountUp start={on("prices")} to={REL_RISE} format={v => `+${v.toFixed(0)}%`} />} title="India’s prices against its partners’">
                        <Say last>{`Prices rose everywhere, but faster in India. The two indices imply how much faster: REER ÷ NEER,
                            India’s consumer prices against its partners’, weighted the same way. It rose by ${pct(REL_RISE)}. A rupee
                            that buys fewer dirhams and yuan, spent on goods that cost more rupees, need not make those goods any
                            cheaper abroad.`}</Say>
                    </StepCard>
                </Div>

                {/* THE REAL RATE ============================================================================ */}
                <Div className="step" data-scene="reer" ref={ref("reer")}>
                    <StepCard active={on("reer")} kicker="THE OTHER NUMBER" big={<CountUp start={on("reer")} to={realEnd} from={0} format={v => signed(v, 0)} />} title={`the real rate, ${FROM} to ${TO}`}>
                        <Say last={locked === null}>{`Put the two together and they almost cancel. The real effective exchange rate (REER) is the
                            nominal rate adjusted for those prices: whether Indian goods got cheaper or dearer for the countries
                            that buy them. In ${N} months it never left the shaded band, ${BAND.lo.toFixed(0)} to ${BAND.hi.toFixed(0)} on this
                            scale (${idx1(range.min)} to ${idx1(range.max)} on the Reserve Bank’s own index).`}</Say>
                        {locked !== null && <Text className="guess-verdict" weight="600">{verdict(locked)}</Text>}
                    </StepCard>
                </Div>

                {/* THE SWING ================================================================================ */}
                <Div className="step" data-scene="swing" ref={ref("swing")}>
                    <StepCard active={on("swing")} kicker="THE SWINGS THAT MATTER" big={<CountUp start={on("swing")} to={swing.fall} format={v => `−${v.toFixed(1)}%`} />} title={`in ${SWING_MONTHS} months`}>
                        <Say last>{`The real rate is not still. It reached ${idx1(swing.peak)} on the Reserve Bank’s index in
                            ${monthName(swing.peakMonth)}, the highest of the ${N} months, and fell to ${idx1(swing.trough)} by
                            ${monthName(swing.troughMonth)}. By this measure, moves like this, not the long nominal slide, are what
                            changed the price of Indian goods in partners’ currencies.`}</Say>
                    </StepCard>
                </Div>
            </Div>
        </Div>
    );
};

const SOURCES : [ string, string ][] = [
    [ "effective-exchange-rates-monthly.csv", "NEER, REER and the dollar rate, month by month" ],
    [ "rupee-yearly.csv", "the dollar rate and the indices, year by year" ],
];

const READING : { title : string; href : string; note : string }[] = [
    { title : "Guria and Sokal (2021). Effective exchange rate indices of the Indian rupee. RBI Bulletin, January 2021.", href : "https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx?Id=20020", note : "The revision to the 40-currency basket and the 2015-16 base: how partners are chosen, how weights are set, and why the series begins in 2004-05." },
    { title : "Reserve Bank of India (2005). Revision of nominal effective exchange rate (NEER) and real effective exchange rate (REER) indices. RBI Bulletin, December 2005.", href : "https://www.rbi.org.in/scripts/BS_ViewBulletin.aspx?Id=7129", note : "The earlier 36-currency and 6-currency indices and their method." },
];

// THE PAGE ============================================================================================================
export const TwoNumbersOneRupeePage = () => {
    // The charts below the opening draw their lines in the stage's colours.
    const lines = usePalette().line;
    const vars = { "--c-usd" : cssOf(lines.usd), "--c-neer" : cssOf(lines.neer), "--c-rel" : cssOf(lines.rel), "--c-reer" : cssOf(lines.reer) } as CSSProperties;

    return (
        <MotionConfig reducedMotion="user">
            <Article id="two-numbers-page" style={vars}>
                <TheOpening />
                <Div className="after-opening">

                {/* WHAT EACH ANSWERS ================================================================================ */}
                <Section className="chapter">
                    <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                        <Portion desktopSpan="12">
                            <Chapter id="what-each-answers" kicker="WHAT EACH NUMBER ANSWERS" title="Which number to read depends on the question">
                                <Para>{`Rupees per dollar answer the question of anyone paying in dollars: a student’s fees, an import bill, a
                                    holiday. They rose from ₹${usd.fy0.toFixed(2)} in ${HEADLINE.fy0} to ₹${usd.fyN.toFixed(2)} in ${HEADLINE.fyN}, ${pct(usd.upPct, 1)} more
                                    rupees for a dollar; put the other way, a rupee was worth ${pct(usd.downPct, 1)} less in dollars.`}</Para>
                                <Para>{`The NEER answers the same question across all of India’s trade at once, so a move in the dollar against
                                    the euro or the yuan does not pass for a move in the rupee.`}</Para>
                                <Para last>{`The REER answers whether Indian goods got cheaper or dearer for the countries that buy them. A rupee
                                    that falls only as fast as Indian prices outpace partners’ prices leaves Indian goods no cheaper abroad.`}</Para>
                            </Chapter>
                        </Portion>
                        <Portion desktopSpan="12">
                            <Chapter id="both-true" kicker="BOTH TRUE AT ONCE" title={`In ${TO.split(" ")[1]}, a record and a low`}>
                                <Para>{`In ${monthName(usdHighMonth)} the dollar averaged ₹${usdHigh.toFixed(2)}, more than in any other month since
                                    ${FROM}. In the same month the real rate stood at ${idx1(reer.to)}, below 100, as it had been every month since
                                    ${monthName(reerBelow100From)}.`}</Para>
                                <Para last>{`An index of 100 means the rupee’s real value in 2015-16, the base year. It is not a measure of fair
                                    value: below 100 says the rupee was weaker in real terms than in 2015-16, not that it was weaker than it should be.`}</Para>
                            </Chapter>
                        </Portion>
                    </Row>
                </Section>

                {/* ₹1 LAKH ========================================================================================== */}
                <Section className="chapter">
                    <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                        <Portion desktopSpan="16">
                            <Chapter id="one-lakh" kicker="WHAT ₹1 LAKH FETCHED" title={`₹1 lakh bought $${inr(HEADLINE.lakh.fy0)} in ${HEADLINE.fy0} and $${inr(HEADLINE.lakh.fyN)} in ${HEADLINE.fyN}`}>
                                <LakhDollars />
                            </Chapter>
                        </Portion>
                    </Row>
                </Section>

                {/* EXPLORE ========================================================================================== */}
                <Section className="chapter">
                    <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                        <Portion desktopSpan="24">
                            <Chapter id="explore" kicker="EXPLORE" title="Change the basket, change the weights">
                                <Para last>{`The headline indices use 40 currencies and trade weights. The Reserve Bank also publishes them with
                                    export weights, and for a basket of six currencies. Each tells the same story at a different pitch.`}</Para>
                            </Chapter>
                            <Reveal><Explorer /></Reveal>
                        </Portion>
                    </Row>
                </Section>

                {/* FOR ECONOMISTS =================================================================================== */}
                <Section className="chapter">
                    <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                        <Portion desktopSpan="24">
                            <details className="drawer">
                                <summary>For economists: the decomposition, year by year</summary>
                                <Text size="small" marginBottom="micro">{prose(`Each year’s change in the real rate is the change in the nominal rate plus the
                                    change in relative prices, exactly, in logs: Δ ln REER = Δ ln NEER + Δ ln(REER ÷ NEER). Annual averages of
                                    the monthly 40-currency trade-weighted indices; log points, ×100. A positive price term means India’s
                                    prices rose faster than its partners’.`)}</Text>
                                <div className="table-scroll">
                                    <table className="decomp">
                                        <thead><tr><th>Year</th><th className="num">Nominal</th><th className="num">Prices</th><th className="num">Real</th></tr></thead>
                                        <tbody>
                                            {DECOMP.map(d => (
                                                <tr key={d.fy}>
                                                    <td>{d.fy}</td>
                                                    <td className="num">{d.dn.toFixed(1)}</td>
                                                    <td className="num">{d.dp.toFixed(1)}</td>
                                                    <td className="num">{d.dr.toFixed(1)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </details>
                        </Portion>
                    </Row>
                </Section>

                {/* SOURCES & METHOD ================================================================================= */}
                <Section id="tn-sources">
                    <Row horizontalPadding="medium" marginTop="large" allowUltraWide>
                        <Portion desktopSpan="half">
                            <Divider kind="secondary" verticalMargin="micro" />
                            <Text weight="600" size="tiny" verticalMargin="micro">SOURCES</Text>
                            <Text size="tiny" marginBottom="micro">
                                {prose(`Reserve Bank of India, indices of the nominal and real effective exchange rate of the Indian rupee,
                                    monthly, base 2015-16 = 100, for the 40-currency basket with trade and with export weights and the
                                    6-currency basket with trade weights, ${FROM} to ${TO}; the rupee’s monthly average and financial-year average
                                    rates against the US dollar; and its daily reference rate; all as published on DBIE (scraped 29-09-2026).
                                    The basket weights are from ${BASKET?.source.publication ?? "the RBI Bulletin, January 2021"}, Table 1.`)}
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
                                    <Link href={`/stories/two-numbers-one-rupee/${file}`} download className="download-link">
                                        <Div verticallyCentreItems marginBottom="nano">
                                            <Download size="16px" />
                                            <Text weight="600" marginLeft="nano" size="tiny">Download {label} (CSV)</Text>
                                        </Div>
                                    </Link>
                                </Div>
                            ))}
                            <Div>
                                <Link href="/external/reer-and-neer" className="download-link">
                                    <Div verticallyCentreItems marginTop="nano" marginBottom="nano">
                                        <Table2 size="16px" />
                                        <Text weight="600" marginLeft="nano" size="tiny">Go to the REER and NEER tables</Text>
                                    </Div>
                                </Link>
                            </Div>
                        </Portion>
                        <Portion desktopSpan="half">
                            <Divider kind="secondary" verticalMargin="micro" />
                            <Text weight="600" size="tiny" verticalMargin="micro">METHOD</Text>
                            <MethodNote title="The indices.">{`The NEER is a weighted geometric average of the rupee’s exchange rates against the
                                40 currencies, as an index; the REER multiplies it by the ratio of India’s consumer prices to its partners’
                                consumer prices, weighted the same way. A higher index is a stronger rupee. The 2015-16 series begins in April
                                2004; the Reserve Bank did not carry it further back, and it is not joined here to the older bases.`}</MethodNote>
                            <MethodNote title="The price term.">{`REER ÷ NEER × 100 is the relative price the two indices imply. It is derived here,
                                not published. Because both indices use the same weights, ln REER = ln NEER + ln(REER ÷ NEER) holds exactly,
                                and the processor checks it for every month.`}</MethodNote>
                            <MethodNote title="The opening’s charts.">{`Each dot is a month. The four lines are rebased so ${FROM} = 100, which
                                changes no shape and lets them start from one point: what a rupee buys in US cents, the NEER, the
                                price term and the REER. The Reserve Bank’s own indices are based on 2015-16 = 100; the cards and the
                                tooltips give those values where they matter.`}</MethodNote>
                            <MethodNote title="Which months.">{`The story compares ${FROM}, the first month of the series, with ${TO}, the latest. Other
                                ends give other answers: on financial-year averages the REER went from ${idx1(HEADLINE.fyAvg.reer.fy0)} in ${HEADLINE.fy0} to
                                ${idx1(HEADLINE.fyAvg.reer.fyN)} in ${HEADLINE.fyN} and the NEER from ${idx1(HEADLINE.fyAvg.neer.fy0)} to ${idx1(HEADLINE.fyAvg.neer.fyN)}. That is
                                why the story leans on the band the REER stayed in, ${idx1(range.min)} (${monthName(range.minMonth)}) to ${idx1(range.max)}
                                (${monthName(range.maxMonth)}), rather than on its two ends alone. Recent months are provisional and may be revised.`}</MethodNote>
                            <MethodNote title="The dollar.">{`Monthly averages of the Reserve Bank’s reference rate. DBIE’s monthly table has no figure
                                for ${HEADLINE.usdFilled.map(f => monthName(f.month)).join(" or ")}; those months are the average of that month’s daily
                                reference rates, which reproduces every one of the ${HEADLINE.usdCheckedMonths} months since February 2023 that both tables
                                carry. Yearly figures are the Reserve Bank’s financial-year averages. On the thread the dollar line starts at the
                                NEER’s first value so the two falls can be compared; it is a rebased index, not a second scale.`}</MethodNote>
                            <MethodNote title="The weights and the globe.">{`The 40 partners’ trade weights for 2015-16 are from the Reserve Bank’s January
                                2021 Bulletin, not from DBIE. The Reserve Bank revises the weights each year; the indices use each year’s
                                own. On the globe a partner’s land dots deepen with its weight; the euro area is its 19 members of 2015-16,
                                and each arc ends at a partner’s capital (the euro area at Frankfurt). India’s outline is the Survey of
                                India’s; other borders are Natural Earth’s.`}</MethodNote>
                            <MethodNote title="Nothing typed by hand." last>{`Every number here is read from the DBIE series by a program that checks
                                the months, the base year and the identity every time it runs. The only figures typed in are the basket weights,
                                from the publication named above.`}</MethodNote>
                        </Portion>
                    </Row>
                </Section>
                </Div>
            </Article>
        </MotionConfig>
    );
};

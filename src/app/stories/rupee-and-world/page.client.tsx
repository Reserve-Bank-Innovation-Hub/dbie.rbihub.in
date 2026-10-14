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
import { Recap } from "./Recap";
import { AnimatedNumber, CountUp, Reveal } from "./Motion";
import { CARD_LEFT, RupeeStage, cssOf, usePalette, type SceneId } from "./RupeeStage";
import { SectionRail } from "./SectionRail";

// DATA ================================================================================================================
import {
    BAND, BASKET, COST, CROSS, RATES, DOLLAR_GAP, EVENTS, HALVES_MEET, HALVES_PEAK, HEADLINE, MONTHS, N, PARTNERS, REGIONS, REL_RISE, SERIES, SWING_MONTHS, USD,
    YEARLY, idx1, inr, monthName, pct, weightOf,
} from "./data";

// STYLES ==============================================================================================================
import "./rupee-and-world.css";

// THE WORDS ===========================================================================================================
const prose = (s : string) => s.replace(/\s+/g, " ").trim();
const { neer, reer, usd, swing, range } = HEADLINE;
const FROM = monthName(HEADLINE.first), TO = monthName(HEADLINE.last);
// the real rate's change from the first month to the latest, per cent
const realEnd = 100 * (SERIES.reer40t[N - 1] / SERIES.reer40t[0] - 1);
// The opening's prices, April 2004 = 100, in the latest month: the basket of currencies, dollars that were worth ₹100 then, India's
// prices against its partners', and Indian goods abroad (COST in data.ts); and the last at the swing's two ends.
// where the constellation's four planets end, from 100 in April 2004
const orbitEnd = {
    usd : Math.round(COST.usd[N - 1]), eur : Math.round(100 * RATES.EUR[N - 1] / RATES.EUR[0]),
    gbp : Math.round(100 * RATES.GBP[N - 1] / RATES.GBP[0]), jpy : Math.round(100 * RATES.JPY[N - 1] / RATES.JPY[0]),
};
const basketNow = COST.neer[N - 1], dollarNow = COST.usd[N - 1], pricesNow = COST.rel[N - 1], goodsNow = COST.reer[N - 1];
const goodsPeak = COST.reer[MONTHS.indexOf(HEADLINE.swing.peakMonth)], goodsTrough = COST.reer[MONTHS.indexOf(HEADLINE.swing.troughMonth)];
// the two halves at the swing's ends, and the dollar chart's marks for the events between them (by position in EVENTS)
const relPeak = COST.rel[MONTHS.indexOf(HEADLINE.swing.peakMonth)], relTrough = COST.rel[MONTHS.indexOf(HEADLINE.swing.troughMonth)];
const basketPeak = COST.neer[MONTHS.indexOf(HEADLINE.swing.peakMonth)], basketTrough = COST.neer[MONTHS.indexOf(HEADLINE.swing.troughMonth)];
const usdEvents = EVENTS.filter(e => e.chart === "usd");
const markOf = (month : string) => usdEvents.findIndex(e => e.month === month) + 1;
const tariffMark = markOf("2025-08"), westAsiaMark = markOf("2026-03");

// Each financial year's change, in logs, so the three add: nominal + prices = real.
const DECOMP = YEARLY.slice(1).map((y, i) => {
    const p = YEARLY[i];
    const dn = 100 * Math.log(y.neer / p.neer), dr = 100 * Math.log(y.reer / p.reer);
    return { fy : y.fy, dn, dp : dr - dn, dr };
});

// The guess against the answer, once the reader has locked one in.
// The guess is a price: a batch of Indian shoes that cost a shop abroad 100 in its own money in 2004, in today's money
// (adjusted for prices in both places). The answer is the real rate's change, read two ways: first month against the
// latest, and the first full year's average against the latest's. The two differ, so the answer is a range.
const shoeLo = Math.round(100 * SERIES.reer40t[N - 1] / SERIES.reer40t[0]);
const shoeHi = Math.round(100 * HEADLINE.fyAvg.reer.fyN / HEADLINE.fyAvg.reer.fy0);
const [ SHOE_A, SHOE_B ] = [ Math.min(shoeLo, shoeHi), Math.max(shoeLo, shoeHi) ];
const verdict = (g : number) => prose(`You said ${g}. Compared with the rest of the shop, the same batch costs about
    ${SHOE_A} to ${SHOE_B} today, roughly what it cost in 2004${g < SHOE_A - 10 ? ", far from the bargain the dollar rate suggests" : ""}.
    The real rate is the solid line; your guess is the dashed one.`);

const Chapter = ({ title, children, id } : { title : string; children : ReactNode; id : string }) => (
    <Reveal>
        <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro" id={id}>{title}</Heading4>
        {children}
    </Reveal>
);
const Para = ({ children, last = false } : { children : string; last ? : boolean }) => <Text fontStyle="serif" marginBottom={last ? undefined : "nano"}>{prose(children)}</Text>;
const Say = ({ children, last = false } : { children : string; last ? : boolean }) => <Text fontStyle="serif" marginBottom={last ? undefined : "nano"}>{prose(children)}</Text>;
const MethodNote = ({ title, children, last = false } : { title : string; children : string; last ? : boolean }) => (
    <Text size="tiny" marginBottom={last ? undefined : "micro"}><strong>{title}</strong> {prose(children)}</Text>
);

// A step's card: the header, which states the step's message in exact figures, then a picture-number, then a line or
// two. No label above the header: the section marker at the top of the screen says where the reader is.
const StepCard = ({ active, big, title, children, wide = false } : { active : boolean; big ? : ReactNode; title : ReactNode; children ? : ReactNode; wide ? : boolean }) => (
    <Card className={`step-card ${active ? "is-active" : ""} ${wide ? "is-wide" : ""}`} padding="micro">
        <Heading6 className="step-title" fontStyle="serif" weight="600" marginBottom="nano">{title}</Heading6>
        {big && <div className="step-big">{big}</div>}
        {children}
    </Card>
);

// A term the story uses, defined in plain words where it first appears.
// On a wide screen the explainer is always open, the term running into its text; on a phone (where the card shares the
// screen with the chart) it starts closed and opens on a tap, so the card stays short. The page is served with the
// wide form and switches after it mounts on a phone, so the server's page and the browser's agree.
const Define = ({ term, children } : { term : string; children : ReactNode }) => {
    const [ phone, setPhone ] = useState(false);
    useEffect(() => { setPhone(matchMedia("(max-width: 900px)").matches); }, []);
    if (!phone) return <div className="define" role="note"><b>{term}</b> {children}</div>;
    return (
        <details className="define" role="note">
            <summary><b>{term}</b><span className="define-more">What is it?</span></summary> {children}
        </details>
    );
};

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

// The guess's slider: a shoe that slides along a track, a little larger the higher the price. The range input lies
// over it, invisible, so the keyboard, screen readers and touch work as with any slider.
const priceWords = (v : number) => (v === 100 ? "same price" : v < 100 ? `${100 - v}% cheaper` : `${v - 100}% more expensive`);
const ShoeSlider = ({ value, onChange } : { value : number; onChange : (v : number) => void }) => {
    const at = (value - 50) / 100;
    return (
        <div className="shoe-slider">
            <div className="shoe-track"><span className="shoe-fill" style={{ width : `${at * 100}%` }} /><span className="shoe-mid" /></div>
            <span className="shoe" aria-hidden="true" style={{ left : `${at * 100}%`, fontSize : `${(24 + 14 * at).toFixed(1)}px` }}>👞</span>
            <input type="range" min={50} max={150} step={1} value={value} onChange={e => onChange(+e.target.value)}
                aria-label="Your guess: what the batch costs today compared with everything else the shop buys, where it cost 100 in 2004" aria-valuetext={`${value}, ${priceWords(value)}`} />
        </div>
    );
};

// Why the dollar pulled ahead of the basket from 2014: the Reserve Bank's own account (checked 08-10-2026): "The US
// dollar index, which measures the dollar’s movement against other major currencies, strengthened by 23 per cent from
// 80.1 at end-March 2014 to 98.4 at end-March 2015. While it strengthened primarily on account of a robust US economic
// recovery, weak economic recovery in the euro zone and Japan during the year resulted in the euro and the Japanese yen
// depreciating against the US dollar."
const DOLLAR_2014 = { source : "RBI Annual Report 2014-15, para II.4.2", url : "https://rbi.org.in/Scripts/AnnualReportPublications.aspx?Id=1148" };

// The answer's number: its figures roll in like a meter, one after another, each going round a different number of
// times; when the last lands, rays, a glow and confetti burst behind it. Replayed on each arrival; static with reduced
// motion (the stylesheet), and screen readers get the number plainly.
const CONFETTI = Array.from({ length : 16 }, (_, k) => ({ angle : (k / 16) * 360 + (k % 3) * 7, dist : 70 + (k * 37) % 50, hue : k % 4 }));
const TadaNumber = ({ value, start } : { value : number; start : boolean }) => {
    const [ run, setRun ] = useState(0);
    useEffect(() => { if (start) setRun(r => r + 1); }, [ start ]);
    const digits = String(value).split("").map(Number);
    const land = 0.35 + digits.length * 0.35 + 0.9;                // when the last figure lands, s
    return (
        <span className={`tada-number ${run ? "is-on" : ""}`} key={run} style={{ "--land" : `${land}s` } as CSSProperties}>
            <span className="sr-only">{value}</span>
            <span className="tada-burst" aria-hidden="true" />
            <span className="tada-glow" aria-hidden="true" />
            {CONFETTI.map((c, k) => (
                <span key={k} className={`tada-bit is-${c.hue}`} aria-hidden="true"
                    style={{ "--a" : `${c.angle}deg`, "--r" : `${c.dist}px` } as CSSProperties} />
            ))}
            <span className="tada-figures" aria-hidden="true">
                {digits.map((d, i) => {
                    const turns = i + 1, n = turns * 10 + d;           // each figure goes round once more than the one before
                    return (
                        <span key={i} className="roll-digit">
                            <span className="roll-strip" style={{ "--to" : `${-n}em`, "--delay" : `${0.35 + i * 0.35}s` } as CSSProperties}>
                                {Array.from({ length : n + 1 }, (_, k) => <span key={k}>{k % 10}</span>)}
                            </span>
                        </span>
                    );
                })}
            </span>
        </span>
    );
};

// THE OPENING =========================================================================================================
// The steps in order: the title and the basket on the globe (one opening, the globe carried through), then the three
// sections, one for each measure.
const STEPS : SceneId[] = [ "hero", "basket", "dollar", "coins", "coins26", "neer", "orbit", "scale", "prices", "guess", "halves", "reer", "orbitReal", "swing" ];
const SECTION_NAMES = [ "Rupees per dollar", "A basket of 40 currencies (NEER)", "Indian goods, priced abroad (REER)" ];
// the dollar's share of the basket
const USD_WEIGHT = PARTNERS.find(p => p.iso === "USD")?.weight ?? 0;
// a step's card sits on the right of the stage, or on the left where the stage's picture is set to the right
const stepClass = (id : SceneId) => `step ${CARD_LEFT.has(id) ? "is-left" : ""}`;
const signed = (v : number, dp = 0) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(dp)}%`;

const TheOpening = () => {
    const [ scene, setScene ] = useState<SceneId>("hero");
    const [ focus, setFocus ] = useState<{ label : string; codes : string[] } | null>(null);
    const [ guess, setGuess ] = useState(100);
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
    // Focus left in a step the reader has moved away from (the shoe slider, a chip, the lock-in button) is let go, so
    // the arrow keys move the page again rather than the control, which would also scroll back to it.
    useEffect(() => {
        const el = document.activeElement as HTMLElement | null;
        const step = el?.closest<HTMLElement>("[data-scene]");
        if (el && step && step.dataset.scene !== scene) el.blur();
    }, [ scene ]);

    // The opening moves a whole step at a time: one scroll from the title settles on the basket, the next on the
    // dollar, and so on. A wheel, a trackpad or a key is handled here (below); a touch screen snaps by CSS instead,
    // since the handler never sees a finger. The snap is switched on by an attribute, not a class, because the theme
    // rewrites the root's classes; the stylesheet applies it to coarse pointers only, so it never fights the handler.
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute("data-story-snap", "");
        return () => root.removeAttribute("data-story-snap");
    }, []);

    // One wheel or trackpad gesture, or one key, moves exactly one step. The page is moved by its own short animation
    // rather than the browser's smooth scroll, so it is known when the move ends. A gesture's later events, a
    // trackpad's momentum included, are swallowed; a new gesture is one that starts after a pause in the wheel or, once
    // the gesture is a moment old, pushes far harder than the dying momentum's mean over the last moment (a trackpad's
    // events can arrive merged, doubling one delta, so a jump against the last event alone is not enough). A quick
    // second swipe still counts: made while the page is still moving, it is held and taken as soon as the move ends.
    useEffect(() => {
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        let moving = false, anim = 0, lastWheel = 0, gestureAt = 0, armed = true, queued : 1 | -1 | 0 = 0, owned = false;
        let recent : { t : number; size : number }[] = [];        // the wheel's sizes over the last moment
        const stops = () => {
            const ys = STEPS.map(id => {
                const el = stepRefs.current[id];
                if (!el) return NaN;
                const r = el.getBoundingClientRect();
                return Math.round(r.top + scrollY + (r.height - innerHeight) / 2);
            });
            // After the opening, the close pages the same way: the three cards, the takeaway, the constellation, each
            // centred when it fits the screen and from its top when it does not. Below the last, the page scrolls freely.
            // measured from the layout (offsetTop), not the screen, so a block still rising into view counts where it will rest
            const layoutTop = (el : HTMLElement) => { let y = 0, e : HTMLElement | null = el; while (e) { y += e.offsetTop; e = e.offsetParent as HTMLElement | null; } return y; };
            const more = [ ...document.querySelectorAll<HTMLElement>("#rupee-and-world-page [data-page-stop], #rupee-and-world-page .page-stop") ].map(el => {
                const top = layoutTop(el), h = el.offsetHeight;
                return Math.round(h < innerHeight - 48 ? top + (h - innerHeight) / 2 : top - 24);
            });
            return { ys : [ ...ys, ...more ], opening : ys.length };
        };
        // Where one step in `dir` leads from here, or null when the page should scroll as usual.
        const next = (dir : 1 | -1) => {
            const { ys } = stops();
            const y = scrollY, last = ys[ys.length - 1];
            if (y > last + 2) return dir < 0 && y < last + innerHeight * 0.5 ? last : null;   // below the last stop: free
            if (dir > 0 && y >= last - 2) return null;
            if (dir > 0) { const k = ys.findIndex(v => v > y + 4); return k < 0 ? null : ys[k]; }
            for (let k = ys.length - 1; k >= 0; k--) if (ys[k] < y - 4) return ys[k];
            return ys[0];
        };
        const go = (target : number) => {
            const { ys, opening } = stops(), k = ys.findIndex(v => Math.abs(v - target) < 2);
            if (k >= 0 && k < opening) setScene(STEPS[k]);                // the stage starts to change as the page starts to move
            cancelAnimationFrame(anim);
            const from = scrollY, dist = target - from;
            if (reduced || Math.abs(dist) < 2) { scrollTo({ top : target, behavior : "instant" }); return; }
            const t0 = performance.now(), dur = Math.min(800, 420 + Math.abs(dist) * 0.25);
            moving = true;
            const frame = (now : number) => {
                const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
                scrollTo({ top : from + dist * e, behavior : "instant" });
                if (p < 1) { anim = requestAnimationFrame(frame); return; }
                moving = false;
                // a gesture made during the move takes the next step now
                const q = queued; queued = 0;
                if (q) { const t2 = next(q); if (t2 !== null) go(t2); }
            };
            anim = requestAnimationFrame(frame);
        };
        const onWheel = (e : WheelEvent) => {
            if (Math.abs(e.deltaY) < Math.abs(e.deltaX) || e.ctrlKey) return;
            const dir = e.deltaY > 0 ? 1 : -1;
            const now = performance.now(), size = Math.abs(e.deltaY) * (e.deltaMode === 1 ? 16 : 1);
            // the rest of a gesture the paging already took (a trackpad's momentum) stays with it, even where the page
            // would now scroll freely, so it cannot carry the page past where the step landed
            recent = recent.filter(r => now - r.t <= 200);
            const usual = recent.length ? recent.reduce((a, r) => a + r.size, 0) / recent.length : 0;   // the mean, which a merged event barely moves
            // a swipe's own ramp-up is never a new swipe: a jump counts only once the gesture is a moment old
            const fresh = now - lastWheel > 220 || (now - gestureAt > 350 && size > usual * 2 + 12 && size > 24);
            if (fresh) gestureAt = now;
            recent.push({ t : now, size });
            const target = moving ? 0 : next(dir);
            if (target === null && !(owned && !fresh)) { owned = false; lastWheel = now; return; }
            e.preventDefault();
            owned = true;
            if (target === null) { lastWheel = now; return; }
            if (fresh) armed = true;
            lastWheel = now;
            if (!armed || size < 1) return;
            armed = false;
            if (moving) queued = dir; else go(target);
        };
        const onKey = (e : KeyboardEvent) => {
            if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
            const t = e.target as HTMLElement | null;
            if (t && (t.closest("input, textarea, select, [contenteditable]") || (e.key === " " && t.closest("button")))) return;
            const dir = [ "ArrowDown", "PageDown" ].includes(e.key) || (e.key === " " && !e.shiftKey) ? 1
                : [ "ArrowUp", "PageUp" ].includes(e.key) || (e.key === " " && e.shiftKey) ? -1 : 0;
            if (!dir) return;
            const target = moving ? 0 : next(dir);
            if (target === null) return;
            e.preventDefault();
            if (!moving) go(target);
        };
        addEventListener("wheel", onWheel, { passive : false });
        addEventListener("keydown", onKey);
        return () => { removeEventListener("wheel", onWheel); removeEventListener("keydown", onKey); cancelAnimationFrame(anim); };
    }, []);

    const ref = (id : SceneId) => (el : HTMLElement | null) => { stepRefs.current[id] = el; };
    const on = (id : SceneId) => scene === id;
    const lockIn = () => {
        setLocked(guess);
        stepRefs.current.halves?.scrollIntoView({ behavior : matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block : "center" });
    };
    // A chip picks out its partners while pointed at, and stays picked on a tap until tapped again.
    // Leaving a chip waits a moment before letting go, so crossing the gap to the next chip does not swing the globe
    // back to its resting view and out again.
    const letGo = useRef(0);
    const pick = (f : { label : string; codes : string[] } | null) => {
        clearTimeout(letGo.current);
        if (f) setFocus(f); else letGo.current = window.setTimeout(() => setFocus(null), 220);
    };
    useEffect(() => () => clearTimeout(letGo.current), []);
    const chip = (label : string, codes : string[]) => ({
        onPointerEnter : (e : React.PointerEvent) => { if (e.pointerType === "mouse") pick({ label, codes }); },
        onPointerLeave : (e : React.PointerEvent) => { if (e.pointerType === "mouse") pick(null); },
        onFocus        : () => pick({ label, codes }),
        onBlur         : () => pick(null),
        onClick        : () => { clearTimeout(letGo.current); setFocus(f => (f?.label === label ? null : { label, codes })); },
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
                    {/* the title on the left, the globe on the right (RupeeStage); a contents strip under the words */}
                    <Div className="title-card">
                        <PageCrumbs />
                        {/* the rupee sign stands in for the R; screen readers get the words */}
                        <Heading1 className="hero-title" marginBottom="micro" aria-label="How do you measure a rupee?">
                            <span aria-hidden="true">How do you<br />measure a <span className="accent"><span className="coin">₹</span>upee?</span></span>
                        </Heading1>
                        <p className="hero-lead">{prose(`A US dollar cost ₹${(USD[0] as number).toFixed(2)} in ${FROM} and ₹${(USD[N - 1] as number).toFixed(2)} in ${TO}.`)}</p>
                        <Text className="hero-sub" fontStyle="serif">
                            {prose(`The Reserve Bank keeps two more measures of the rupee. Each answers a different question.`)}
                        </Text>
                        <ol className="hero-contents" aria-label="Three measures">
                            {SECTION_NAMES.map((name, i) => <li key={name}><span>0{i + 1}</span>{name}</li>)}
                        </ol>
                        <Text size="small" className="hero-cue" marginTop="small">Scroll to begin</Text>
                    </Div>
                </Div>

                {/* THE BASKET, ON THE GLOBE: the opening's second view, before the sections begin ============ */}
                <Div className={stepClass("basket")} data-scene="basket" ref={ref("basket")}>
                    <StepCard
                        active={on("basket")} wide
                        big={(
                            // A picked-out region changes only the number and the one-line name under it, never the card's
                            // height: a card that grew or shrank would move the chips under the pointer.
                            <div className="share-big">
                                <ShareRing share={focus ? focusWeight : 100} />
                                <span className="share-text">
                                    <span className="share-value"><AnimatedNumber value={focus ? focusWeight : 100} format={v => (v >= 99.95 ? "100" : v.toFixed(1))} />%</span>
                                    <span className="share-label">{focus ? `of the basket: ${focus.label}` : "of the basket: all 40 partners"}</span>
                                </span>
                            </div>
                        )}
                        title={`The Reserve Bank prices the rupee against 40 currencies at once; the US dollar is ${USD_WEIGHT.toFixed(1)}% of the basket`}
                    >
                        <Say>{`Each currency is weighted by its share of India’s trade, much as a stock index weighs its companies.`}</Say>
                        <Text size="small" className="chip-hint" marginBottom="nano">{prose(`Trade weights for 2015-16, the index’s base year. Point at a
                            region or a partner, here or on the globe.`)}</Text>
                        <div className="chips" role="group" aria-label="Regions of the basket">
                            {REGIONS.map(r => (
                                <button key={r.key} type="button" className={`chip ${focus?.label === r.label ? "is-on" : ""}`} {...chip(r.label, r.codes)}>
                                    {r.label}<span>{weightOf(r.codes).toFixed(1)}%</span>
                                </button>
                            ))}
                        </div>
                        {/* All 40 partners, heaviest first; a region picked out above marks its members here too. */}
                        <div className="chips is-partners" role="group" aria-label="All 40 partners, by weight">
                            {PARTNERS.map(p => (
                                <button key={p.iso} type="button" {...chip(p.country, [ p.iso ])}
                                    className={`chip is-small ${focus?.label === p.country ? "is-on" : focus?.codes.includes(p.iso) ? "is-member" : ""}`}>
                                    {p.country}<span>{p.weight.toFixed(1)}%</span>
                                </button>
                            ))}
                        </div>
                    </StepCard>
                </Div>

                {/* 1 · RUPEES PER DOLLAR ===================================================================== */}
                <Div className={stepClass("dollar")} data-scene="dollar" data-section="1" ref={ref("dollar")}>
                    <StepCard active={on("dollar")} big={<CountUp start={on("dollar")} from={USD[0] as number} to={USD[N - 1] as number} format={v => `₹${v.toFixed(2)}`} />}
                        title={`A US dollar cost ₹${(USD[N - 1] as number).toFixed(2)} in ${TO}, ${((USD[N - 1] as number) / (USD[0] as number)).toFixed(1)}x the ₹${(USD[0] as number).toFixed(2)} of ${FROM}`}>
                        {/* the mark drawn here is the same as the chart's, so the reader knows what to look for */}
                        <Text fontStyle="serif" marginBottom="nano">
                            {prose(`Most of the rise came in steps. Point at a number`)}{" "}<span className="event-mark is-inline" aria-hidden="true">X</span>{" "}{prose(`on the
                                line for the event behind it.`)}
                        </Text>
                        <Say last>{`But the dollar is one of the 40 currencies India trades in. Next, the rupee against all of them.`}</Say>
                    </StepCard>
                </Div>

                {/* 2 · A BASKET OF 40 CURRENCIES (NEER) ===================================================== */}
                <Div className={stepClass("coins")} data-scene="coins" data-section="2" ref={ref("coins")}>
                    <StepCard active={on("coins")} big="₹100" title={`In ${FROM}, ₹100 bought a basket holding a little of each of the 40 currencies`}>
                        <Say last>{`Each coin is one partner’s currency, as large as its trade weight: the euro largest, then the yuan,
                            the dirham and the dollar. Point at a coin to see which it is.`}</Say>
                    </StepCard>
                </Div>

                <Div className={stepClass("coins26")} data-scene="coins26" data-section="2" ref={ref("coins26")}>
                    <StepCard active={on("coins26")} big={<CountUp start={on("coins26")} from={100} to={basketNow} format={v => `₹${Math.round(v)}`} />}
                        title={`By ${TO} the same basket cost ₹${Math.round(basketNow)}; dollars worth ₹100 in ${FROM.split(" ")[1]} cost ₹${Math.round(dollarNow)}`}>
                        <Say last>{`The basket rose less because the dollar also rose against most of the other 39 currencies in it.`}</Say>
                    </StepCard>
                </Div>

                <Div className={stepClass("neer")} data-scene="neer" data-section="2" ref={ref("neer")}>
                    <StepCard active={on("neer")} big={<>{DOLLAR_GAP.toFixed(1)}%<span className="big-of"> more for the dollars</span></>}
                        title={`Dollars have cost more than the basket since ${monthName(MONTHS[CROSS])}; by ${TO}, ${DOLLAR_GAP.toFixed(1)}% more`}>
                        <Define term="NEER.">{prose(`The nominal effective exchange rate is this basket: the rupee against 40 currencies, each
                            weighted by trade. The Reserve Bank publishes it as an index, 2015-16 = 100, that rises when the rupee
                            strengthens (it went from ${idx1(neer.from)} to ${idx1(neer.to)}). The story turns it round into the basket’s
                            rupee cost, which rises when the rupee weakens.`)}</Define>
                        <Text fontStyle="serif" marginBottom="nano">
                            {prose(`In 2014-15 the dollar rose 23% against other major currencies, on a robust US recovery while the
                                euro zone and Japan were weak`)}{" "}<a className="cite-link" href={DOLLAR_2014.url} target="_blank" rel="noopener">({DOLLAR_2014.source} ↗)</a>.
                        </Text>
                    </StepCard>
                </Div>

                <Div className={stepClass("orbit")} data-scene="orbit" data-section="2" ref={ref("orbit")}>
                    <StepCard active={on("orbit")}
                        title={`Seen from the rupee, the dollar rose most of the four: ${orbitEnd.usd}, against ${orbitEnd.eur} for the euro, ${orbitEnd.gbp} for the pound and ${orbitEnd.jpy} for the yen`}>
                        <ol className="how-to-read">
                            <li><b>The ₹ at the centre</b> is the rupee; each currency sits as far out as it costs, from 100 on the dashed ring in {FROM}.</li>
                            <li><b>The ring of 40 coins</b> is the basket, at {Math.round(basketNow)} by {TO}.</li>
                            <li><b>The months play;</b> pause or drag to any month.</li>
                        </ol>
                    </StepCard>
                </Div>

                {/* 3 · INDIAN GOODS, PRICED ABROAD (REER) =================================================== */}
                <Div className={stepClass("scale")} data-scene="scale" data-section="3" ref={ref("scale")}>
                    <StepCard active={on("scale")}
                        big={<><CountUp start={on("scale")} from={100} to={pricesNow} duration={2.6} format={v => `${Math.round(v)}`} /><span className="big-of"> for every 100 abroad</span></>}
                        title={`Over the same years, India’s prices rose ${(pricesNow - 100).toFixed(1)}% more than its partners’`}>
                        <Say last>{`The same goods, priced in India and abroad, each in its own currency: 100 on both sides in ${FROM},
                            ${Math.round(pricesNow)} against 100 by ${TO}. These are index numbers, not rupees.`}</Say>
                    </StepCard>
                </Div>

                <Div className={stepClass("prices")} data-scene="prices" data-section="3" ref={ref("prices")}>
                    <StepCard active={on("prices")} big={`${Math.round(pricesNow)}`}
                        title={`India’s prices against its partners’ rose almost every year, from 100 to ${Math.round(pricesNow)}`}>
                        <Say last>{`So, two halves: partners’ currencies cost ${(basketNow - 100).toFixed(1)}% more rupees; Indian prices rose
                            ${(pricesNow - 100).toFixed(1)}% more than theirs. For a shop abroad, which wins?`}</Say>
                    </StepCard>
                </Div>

                <Div className={stepClass("guess")} data-scene="guess" data-section="3" ref={ref("guess")}>
                    <StepCard active={on("guess")} title="Did Indian shoes get cheaper for a shop abroad?">
                        <Say>{`In 2004 a shop abroad paid 100, in its own currency, for a batch of shoes made in India:`}</Say>
                        {/* four of the largest partners: the UAE, the euro area, Singapore, the US */}
                        <div className="shop-flags" role="list" aria-label="For example">
                            <span role="listitem">🇦🇪 Dubai</span><span role="listitem">🇩🇪 Frankfurt</span><span role="listitem">🇸🇬 Singapore</span><span role="listitem">🇺🇸 New York</span>
                        </div>
                        <Say>{`Compared with everything else the shop buys, what does the batch cost now?`}</Say>
                        <Div className="slider-row">
                            <ShoeSlider value={guess} onChange={v => { setGuess(v); setLocked(null); }} />
                            <Text className="guess-value" weight="700">{guess}</Text>
                        </Div>
                        <div className="slider-ends" aria-hidden="true">
                            <span><b>50</b>half as much</span><span><b>100</b>same as before</span><span><b>150</b>50% more</span>
                        </div>
                        <button type="button" className="lock-in" onClick={lockIn}>{locked === null ? "Lock in my guess ↓" : "Locked in ↓"}</button>
                    </StepCard>
                </Div>

                <Div className={stepClass("halves")} data-scene="halves" data-section="3" ref={ref("halves")}>
                    <StepCard active={on("halves")} big={<>{Math.round(pricesNow)}<span className="big-of"> and </span>{Math.round(basketNow)}</>}
                        title={`Indian prices and the basket were level again by ${TO}, ${Math.round(pricesNow)} and ${Math.round(basketNow)}, after their widest gap in ${monthName(MONTHS[HALVES_PEAK])}: ${Math.round(COST.rel[HALVES_PEAK])} against ${Math.round(COST.neer[HALVES_PEAK])}`}>
                        <Say last>{`Where the terracotta line (India’s prices) runs above the purple (the basket), Indian goods cost
                            more abroad.`}</Say>
                    </StepCard>
                </Div>

                <Div className={stepClass("reer")} data-scene="reer" data-section="3" ref={ref("reer")}>
                    <StepCard active={on("reer")} big={<TadaNumber value={Math.round(goodsNow)} start={on("reer")} />}
                        title={`Put together, Indian goods cost buyers abroad ${Math.round(goodsNow)} in ${TO}, for 100 in ${FROM}`}>
                        <Say>{`${Math.round(pricesNow)} ÷ ${Math.round(basketNow)} × 100 ≈ ${Math.round(goodsNow)}. In ${N} months it never left
                            the shaded band, ${Math.round(BAND.lo)} to ${Math.round(BAND.hi)}.`}</Say>
                        <Define term="REER.">{prose(`The real effective exchange rate is the NEER adjusted for consumer prices in India
                            against those in the 40 partners: what Indian goods cost buyers abroad. The Reserve Bank’s index, 2015-16 =
                            100, rises when Indian goods cost more abroad (${idx1(reer.from)} to ${idx1(reer.to)}; ${idx1(range.min)} to
                            ${idx1(range.max)} at its extremes).`)}</Define>
                        {locked !== null && <Text className="guess-verdict" weight="600">{verdict(locked)}</Text>}
                    </StepCard>
                </Div>

                <Div className={stepClass("orbitReal")} data-scene="orbitReal" data-section="3" ref={ref("orbitReal")}>
                    <StepCard active={on("orbitReal")} big={<>{Math.round(basketNow)}<span className="big-arrow" aria-label="to">→</span>{Math.round(goodsNow)}</>}
                        title={`Adjusted for prices, the basket’s ring comes back from ${Math.round(basketNow)} to ${Math.round(goodsNow)}, almost where it began`}>
                        <Say last>{`The four planets fade: DBIE carries no price adjustment for each country on its own.`}</Say>
                    </StepCard>
                </Div>

                <Div className={stepClass("swing")} data-scene="swing" data-section="3" ref={ref("swing")}>
                    <StepCard active={on("swing")} big={<>{Math.round(goodsPeak)}<span className="big-arrow" aria-label="to">→</span>{Math.round(goodsTrough)}</>}
                        title={`Within the band, Indian goods abroad rose to ${Math.round(goodsPeak)} in ${monthName(swing.peakMonth)} and fell to ${Math.round(goodsTrough)} by ${monthName(swing.troughMonth)}`}>
                        <Say last>{`Indian prices barely moved (${Math.round(relPeak)}, then ${Math.round(relTrough)}); partners’ currencies went
                            from ₹${Math.round(basketPeak)} to ₹${Math.round(basketTrough)}, through the US tariffs and the West Asia conflict
                            (${tariffMark} and ${westAsiaMark} on the dollar chart).`}</Say>
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
export const RupeeAndWorldPage = () => {
    // The charts below the opening draw their lines in the stage's colours.
    const lines = usePalette().line;
    const vars = { "--c-usd" : cssOf(lines.usd), "--c-neer" : cssOf(lines.neer), "--c-rel" : cssOf(lines.rel), "--c-reer" : cssOf(lines.reer) } as CSSProperties;

    return (
        <MotionConfig reducedMotion="user">
            <Article id="rupee-and-world-page" style={vars}>
                <SectionRail names={SECTION_NAMES} />
                <TheOpening />
                <Div className="after-opening">

                {/* THE CLOSE: THREE MEASURES, THREE QUESTIONS ============================================================ */}
                <Section className="chapter recap-section">
                    <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                        <Portion desktopSpan="24">
                            <div data-page-stop>
                            <Chapter id="three-measures" title={`From ${FROM} to ${TO}, the dollar rate rose ${((USD[N - 1] as number) / (USD[0] as number)).toFixed(1)}x and the basket ${(basketNow / 100).toFixed(1)}x, while what Indian goods cost abroad went from 100 to ${Math.round(goodsNow)}`}>
                                <Para last>{`Each measure answers a different question. The small lines share one scale, each starting at
                                    100; turn a card over to see how it is measured.`}</Para>
                            </Chapter>
                            <Recap colours={{ usd : cssOf(lines.usd), neer : cssOf(lines.neer), reer : cssOf(lines.reer) }} />
                            </div>
                            {/* the takeaway, in the same card the opening tells its story in */}
                            <Reveal delay={0.2} className="takeaway page-stop">
                                <StepCard active title="The dollar rate answers what a dollar costs; the REER answers what Indian goods cost abroad, and over 22 years that barely moved">
                                    <Text fontStyle="serif" marginBottom="nano">
                                        {prose(`The Reserve Bank publishes the NEER and the REER as indicators of external competitiveness`)}{" "}
                                        <a className="cite-link" href="https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx?Id=7129" target="_blank" rel="noopener">(RBI Bulletin, Dec 2005 ↗)</a>.
                                    </Text>
                                </StepCard>
                            </Reveal>
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
                                    <Link href={`/stories/rupee-and-world/${file}`} download className="download-link">
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
                            <MethodNote title="NEER and REER, in brief.">{`The NEER (nominal effective exchange rate) is the rupee against a basket of 40
                                currencies, each weighted by its share of India’s trade. The REER (real effective exchange rate) is the NEER
                                adjusted for consumer prices in India against those in the same 40 countries: what Indian goods cost buyers
                                abroad. On the Reserve Bank’s indices a higher number means a stronger rupee (NEER) or Indian goods costing
                                more abroad (REER). The story shows the NEER turned round, as the rupee cost of the basket, so that it rises
                                when the rupee weakens, as the dollar rate does.`}</MethodNote>
                            <MethodNote title="The indices.">{`The NEER is a weighted geometric average of the rupee’s exchange rates against the
                                40 currencies, as an index; the REER multiplies it by the ratio of India’s consumer prices to its partners’
                                consumer prices, weighted the same way. A higher index is a stronger rupee. The 2015-16 series begins in April
                                2004; the Reserve Bank did not carry it further back, and it is not joined here to the older bases.`}</MethodNote>
                            <MethodNote title="The price term.">{`REER ÷ NEER × 100 is the relative price the two indices imply. It is derived here,
                                not published. Because both indices use the same weights, ln REER = ln NEER + ln(REER ÷ NEER) holds exactly,
                                and the processor checks it for every month.`}</MethodNote>
                            <MethodNote title="The opening’s charts.">{`The charts are monthly. The dollar chart is in rupees for one US dollar, monthly
                                averages. The others are prices that start at 100 in ${FROM}, so that every line rises the same way: the
                                basket of 40 currencies is the NEER turned into a price (its first value over each month’s, × 100); dollars that were
                                worth ₹100 in April 2004 are the dollar rate over its first value; India’s prices against its partners’ are REER ÷ NEER over
                                their first value; and what Indian goods cost abroad is the REER over its first value. The last is
                                exactly the third over the second. The Reserve Bank’s own indices (2015-16 = 100) are in the tooltips.`}</MethodNote>
                            <MethodNote title="The basket of coins.">{`Each coin is one partner’s currency, its size following the
                                currency’s trade weight in 2015-16. The rupee notes are illustrations in the colours of the current series,
                                not reproductions. The basket that cost ₹100 in ${FROM} costs ₹${Math.round(basketNow)} in ${TO}; the wallet pays ₹180
                                and takes ₹${180 - Math.round(basketNow)} back.`}</MethodNote>
                            <MethodNote title="What 100 means on the Reserve Bank’s indices.">{`On the indices as the Reserve Bank publishes them,
                                100 is the rupee’s value in the base year, 2015-16. It is not a measure of fair value: a reading below 100
                                says the rupee’s value was lower than in 2015-16, not that it was lower than it should be. The opening
                                restates every index as a price from 100 in ${FROM}, so its 100s mean ${FROM}, not 2015-16.`}</MethodNote>
                            <MethodNote title="The shoes.">{`The batch of shoes is an illustration of the real effective exchange rate, not
                                a price from any survey. Its price today, where it cost 100 in 2004, is the REER’s change: ${SHOE_A} on the first
                                month against the latest (${idx1(SERIES.reer40t[0])} to ${idx1(SERIES.reer40t[N - 1])}), ${SHOE_B} on the first full
                                year’s average against the latest’s (${idx1(HEADLINE.fyAvg.reer.fy0)} to ${idx1(HEADLINE.fyAvg.reer.fyN)}). It is
                                the 40-currency average: a typical shop across India’s partners, in its own currency. Any one partner’s currency,
                                the dollar included, has its own story.`}</MethodNote>
                            <MethodNote title="The events.">{`The numbered events on the dollar chart are those behind its sharpest moves, each
                                described from a Reserve Bank or Government of India document (Annual Reports, the Monetary Policy
                                Report, the Economic Survey) that the note links to. Rupee levels in a note that its source does not give
                                are this series’ monthly averages. They mark what the official accounts name; they are not a full
                                explanation of every move.`}</MethodNote>
                            <MethodNote title="Which months.">{`The story compares ${FROM}, the first month of the series, with ${TO}, the latest. Other
                                ends give other answers: on financial-year averages the REER went from ${idx1(HEADLINE.fyAvg.reer.fy0)} in ${HEADLINE.fy0} to
                                ${idx1(HEADLINE.fyAvg.reer.fyN)} in ${HEADLINE.fyN} and the NEER from ${idx1(HEADLINE.fyAvg.neer.fy0)} to ${idx1(HEADLINE.fyAvg.neer.fyN)}. That is
                                why the story leans on the band the REER stayed in, ${idx1(range.min)} (${monthName(range.minMonth)}) to ${idx1(range.max)}
                                (${monthName(range.maxMonth)}), rather than on its two ends alone. Recent months are provisional and may be revised.`}</MethodNote>
                            <MethodNote title="The dollar.">{`Monthly averages of the Reserve Bank’s reference rate. DBIE’s monthly table has no figure
                                for ${HEADLINE.usdFilled.map(f => monthName(f.month)).join(" or ")}; those months are the average of that month’s daily
                                reference rates, which reproduces every one of the ${HEADLINE.usdCheckedMonths} months since February 2023 that both tables
                                carry. Yearly figures are the Reserve Bank’s financial-year averages. On the thread the dollar line starts at the
                                NEER’s first value so the two changes can be compared; it is a rebased index, not a second scale.`}</MethodNote>
                            <MethodNote title="The weights and the globe.">{`The 40 partners’ trade weights for 2015-16 are from the Reserve Bank’s January
                                2021 Bulletin, not from DBIE. The Reserve Bank revises the weights each year; the indices use each year’s
                                own. On the globe a partner’s colour deepens with its weight; the euro area is its 19 members of 2015-16,
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

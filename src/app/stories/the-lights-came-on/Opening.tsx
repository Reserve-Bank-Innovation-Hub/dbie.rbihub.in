"use client";

// The opening, in the manner of the agriculture story's: a pinned isometric town (TownStage) under the title. As the
// reader scrolls from March 2015 to June 2026 the bank's business turns from the companies' district to the
// households' street, and scrolling back reverses it. The scene carries no number: the captions say in words what the
// picture shows, and the ₹100 strip under them gives the figures, from QUARTERS, for the quarter each beat names. The
// chapters follow on the page.

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState } from "react";
import type React from "react";
import dynamic from "next/dynamic";

// LOCAL COMPONENTS ====================================================================================================
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";
import { BEATS, ease, span } from "./townBeats";

// DATA ================================================================================================================
import { CLASS_LABELS, HEADLINE, QUARTERS, type Quarter } from "./data.gen";

// STYLES ==============================================================================================================
import "./opening.css";

// three.js loads only in the browser, and only on this story
const TownStage = dynamic(() => import("./TownStage"), { ssr : false, loading : () => <div className="town-stage is-loading" /> });

// THE QUARTERS ========================================================================================================
// The story counts from March 2015, the first March of the eleven years it compares; every quarter from then on is in
// QUARTERS.
const BASE_QUARTER = "2015-03";
const RUN : Quarter[] = QUARTERS.slice(QUARTERS.findIndex(q => q.quarter === BASE_QUARTER));
const runIndex = (quarter : string) => RUN.findIndex(q => q.quarter === quarter);
const MONTHS = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
const monthYear = (quarter : string) => `${MONTHS[+quarter.slice(5, 7) - 1]} ${quarter.slice(0, 4)}`;

// THE WORDS ===========================================================================================================
// Template strings over HEADLINE, so a refresh of the data rewrites them; prose() folds the line breaks of the source
// into single spaces and keeps a figure on the same line as its unit.
const prose = (s : string) => s.replace(/\s+/g, " ").trim().replace(/(\d) (lakh|crore)\b/g, "$1 $2");
const whole = (v : number) => Math.round(v);

const BASE_YEAR = +BASE_QUARTER.slice(0, 4);
const M15 = HEADLINE.marches.find(m => m.year === BASE_YEAR)!;
const LATEST = HEADLINE.latest;

// The change in the gap between individuals and private companies, March 2015 to the latest quarter, and the part of
// it that is private companies' share falling.
const rise = LATEST.individuals - M15.individuals, fall = M15.privateCompanies - LATEST.privateCompanies;
const companiesPart = fall / (rise + fall);
const partWords = companiesPart >= 0.45 && companiesPart <= 0.55 ? "about half"
    : companiesPart >= 0.4 && companiesPart < 0.45 ? "nearly half"
    : `${whole(100 * companiesPart)} of every 100 rupees`;
const gapNow = LATEST.individuals - LATEST.privateCompanies;
const narrowed = gapNow < HEADLINE.gapPeak.gap - 0.05;
// the women's figures are for March of the last year in HEADLINE.marches
const WOMEN_QUARTER = `${HEADLINE.marches[HEADLINE.marches.length - 1].year}-03`;

// One caption for each beat, holding from the beat's start in townBeats.ts.
const CAPTIONS = [
    { from : BEATS.y2015, kicker : monthYear(BASE_QUARTER), text : prose(`Private companies owed ₹${whole(M15.privateCompanies)} of every ₹100 that
        banks had lent, and individuals ₹${whole(M15.individuals)}.`) },
    { from : BEATS.crossover, kicker : monthYear(HEADLINE.crossover), text : "Individuals overtook private companies." },
    { from : BEATS.latest, kicker : monthYear(LATEST.quarter), text : prose(`Individuals owed ₹${whole(LATEST.individuals)} of every ₹100 and private
        companies ₹${whole(LATEST.privateCompanies)}. ${narrowed
            ? `The gap was widest in ${monthYear(HEADLINE.gapPeak.quarter)} and has narrowed since.`
            : "The gap between them is the widest yet."}`) },
    { from : BEATS.women, kicker : "Women", text : prose(`Women held ${whole(HEADLINE.women.accountsShare2026)} of every 100 individuals’ loan
        accounts and ₹${HEADLINE.women.moneyShare2026.toFixed(1)} of every ₹100 lent to individuals.`) },
];

// THE ₹100 STRIP ======================================================================================================
// Five groups: the four small classes of Table 3.2 (co-operatives, microfinance institutions, non-profits and
// non-residents) travel together as "Others".
type GroupKey = "individuals" | "privateCompanies" | "public" | "householdOthers" | "others";
const GROUPS : { key : GroupKey; label : string }[] = [
    { key : "individuals", label : CLASS_LABELS.individuals },
    { key : "privateCompanies", label : CLASS_LABELS.privateCompanies },
    { key : "public", label : CLASS_LABELS.public },
    { key : "householdOthers", label : CLASS_LABELS.householdOthers },
    { key : "others", label : "Others" },
];
const sharesOf = (q : Quarter) : Record<GroupKey, number> => {
    const c = q.classes, t = q.total.outstanding / 100;
    return {
        individuals : c.individuals.outstanding / t, privateCompanies : c.privateCompanies.outstanding / t, public : c.public.outstanding / t,
        householdOthers : c.householdOthers.outstanding / t,
        others : (c.cooperative.outstanding + c.mfis.outstanding + c.nonProfits.outstanding + c.nonResidents.outstanding) / t,
    };
};
const SHARES = RUN.map(sharesOf);
// The strip holds each beat's quarter and, as a beat begins, travels to the next one through every quarter between;
// the bar's widths move smoothly, the figures are always the nearest real quarter's.
const STOPS = [
    { at : 0, travel : 0, i : runIndex(BASE_QUARTER) },
    { at : BEATS.crossover, travel : 0.06, i : runIndex(HEADLINE.crossover) },
    { at : BEATS.latest, travel : 0.11, i : runIndex(LATEST.quarter) },
    { at : BEATS.women, travel : 0.03, i : runIndex(WOMEN_QUARTER) },
];
const quarterAt = (p : number) => {
    let f = STOPS[0].i;
    for (let k = 1; k < STOPS.length; k++) if (p >= STOPS[k].at) f = STOPS[k - 1].i + (STOPS[k].i - STOPS[k - 1].i) * ease(span(p, STOPS[k].at, STOPS[k].at + STOPS[k].travel));
    return f;
};

export const Opening = () => {
    const openingRef = useRef<HTMLElement>(null);
    const [ progress, setProgress ] = useState(0);

    // progress through the opening: 0 as it reaches the top of the screen, 1 as its last screen begins to leave
    useEffect(() => {
        let raf = 0;
        const measure = () => {
            const el = openingRef.current; if (!el) return;
            const r = el.getBoundingClientRect(), run = r.height - window.innerHeight;
            setProgress(run > 0 ? Math.max(0, Math.min(1, -r.top / run)) : 0);
        };
        const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
        measure();
        window.addEventListener("scroll", onScroll, { passive : true });
        window.addEventListener("resize", onScroll);
        return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
    }, []);

    const caption = [ ...CAPTIONS ].reverse().find(c => progress >= c.from) ?? CAPTIONS[0];
    const f = quarterAt(progress), lo = Math.floor(f), hi = Math.min(RUN.length - 1, lo + 1), near = Math.round(f);
    const width = (g : GroupKey) => SHARES[lo][g] + (SHARES[hi][g] - SHARES[lo][g]) * (f - lo);
    const figures = SHARES[near], quarter = monthYear(RUN[near].quarter);

    return (
        <section className="town-opening" ref={openingRef} aria-label="The opening: a town whose bank turns from its companies to its households">
            <div className="town-sticky" style={{ "--title" : 1 - span(progress, 0.06, 0.12) } as React.CSSProperties}>
                <TownStage progress={progress} />
                <div className="town-title">
                    <PageCrumbs />
                    <p className="town-kicker">BANK CREDIT</p>
                    <h1 className="town-h1">Companies left, <span className="accent">households came</span></h1>
                    <p className="town-standfirst">
                        {prose(`Of every ₹100 that banks in India have lent, more now goes to individuals than to private companies.
                            The Reserve Bank’s quarterly returns show the change from ${monthYear(BASE_QUARTER)} to
                            ${monthYear(LATEST.quarter)}, and ${partWords} of it is the share lent to private companies falling.`)}
                    </p>
                </div>
                <div className={`town-read ${progress >= BEATS.y2015 - 0.04 ? "is-on" : ""}`}>
                    <div aria-live="polite">
                        <span className="town-read-kicker">{caption.kicker}</span>
                        <p className="town-read-text">{caption.text}</p>
                    </div>
                    <div className="town-strip">
                        <p className="town-strip-head">Of every ₹100 banks had lent, {quarter}</p>
                        <div className="town-bar" role="img"
                            aria-label={`${quarter}: ${GROUPS.map(g => `${g.label} ₹${figures[g.key].toFixed(1)}`).join(", ")}`}>
                            {GROUPS.map(g => (
                                <span key={g.key} className={`town-seg seg-${g.key}`} style={{ flexGrow : width(g.key) }}>
                                    {figures[g.key] >= 20 && <b>₹{figures[g.key].toFixed(1)}</b>}
                                </span>
                            ))}
                        </div>
                        <ul className="town-key" aria-hidden="true">
                            {GROUPS.map(g => (
                                <li key={g.key}>
                                    <i className={`town-swatch seg-${g.key}`} />
                                    <span className="town-key-name">{g.label}</span>
                                    <b className="town-key-value">₹{figures[g.key].toFixed(1)}</b>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className={`town-cue ${progress > 0.02 ? "is-off" : ""}`}>Scroll through the years</div>
            </div>
        </section>
    );
};

"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowDown } from "lucide-react";
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";
import { HEADLINE, QUARTERS } from "./data.gen";
import { LATEST_YEAR, monthName, shortMonth } from "./data";
import { CREDIT_GROUPS, IsometricCredit, type CreditGroup, type CreditShares } from "./IsometricCredit";
import "./opening.css";

// THE SHARES ==========================================================================================================
// Each stack is a group's share of outstanding bank credit; the five add to ₹100. Heights glide between quarters as
// the reader scrolls; every figure printed is an actual quarter's, the nearest one.
const RUN = QUARTERS.filter(q => q.quarter >= "2015-03");
const SHARES : CreditShares[] = RUN.map(q => {
    const of = (n : number) => 100 * n / q.total.outstanding;
    const individuals = of(q.classes.individuals.outstanding);
    const companies = of(q.classes.privateCompanies.outstanding);
    const publicShare = of(q.classes.public.outstanding);
    const businesses = of(q.classes.householdOthers.outstanding);
    return { individuals, companies, public : publicShare, businesses, others : 100 - individuals - companies - publicShare - businesses };
});
const LAST = RUN.length - 1;
const CROSS = RUN.findIndex(q => q.quarter === HEADLINE.crossover);
const KEYS = CREDIT_GROUPS.map(g => g.key);
const at = (f : number) : CreditShares => {
    const i = Math.min(LAST - 1, Math.floor(f)), t = f - i;
    return Object.fromEntries(KEYS.map(k => [ k, SHARES[i][k] * (1 - t) + SHARES[i + 1][k] * t ])) as Record<CreditGroup, number>;
};

// THE SCROLL ==========================================================================================================
// The title, a hold on the first quarter, time running to the crossover, a hold, time running to the latest quarter,
// a hold. Time runs at an even pace through each stretch, so a year of scrolling is a year of quarters.
const P = { title : 0.1, start : 0.2, toCross : 0.46, cross : 0.56, toLast : 0.86 };
const clamp = (n : number) => Math.max(0, Math.min(1, n));
const indexAt = (p : number) => p < P.start ? 0
    : p < P.toCross ? CROSS * (p - P.start) / (P.toCross - P.start)
        : p < P.cross ? CROSS
            : p < P.toLast ? CROSS + (LAST - CROSS) * (p - P.cross) / (P.toLast - P.cross) : LAST;
const progressAt = (i : number) => i === 0 ? (P.title + P.start) / 2
    : i <= CROSS ? P.start + (P.toCross - P.start) * i / CROSS
        : i === LAST ? (P.toLast + 1) / 2 : P.cross + (P.toLast - P.cross) * (i - CROSS) / (LAST - CROSS);

// THE WORDS ===========================================================================================================
const prose = (s : string) => s.replace(/\s+/g, " ").trim();
const rs = (n : number) => `₹${n.toFixed(1)}`;
const FIRST = SHARES[0], TURN = SHARES[CROSS], NOW = SHARES[LAST];
const narrowed = NOW.individuals - NOW.companies < HEADLINE.gapPeak.gap - 0.05;
const BEATS = [
    {
        text  : prose(`Private companies owed ${rs(FIRST.companies)} of every ₹100 banks had lent, and individuals
                ${rs(FIRST.individuals)}.`),
        aside : "Each is one group of borrowers, as tall as its share. The five always add up to ₹100.",
    },
    {
        text  : prose(`Individuals passed private companies, ${rs(TURN.individuals)} to ${rs(TURN.companies)} of every ₹100.`),
        aside : "Loans to individuals include home loans, farm loans, other personal loans and loans for a trade or profession.",
    },
    {
        text  : prose(`Individuals owed ${rs(NOW.individuals)} of every ₹100 and private companies ${rs(NOW.companies)}.`),
        aside : prose(narrowed
            ? `The gap was widest in ${monthName(HEADLINE.gapPeak.quarter)}. It has narrowed since because lending to
                private companies sped up: it grew ${LATEST_YEAR.companies.toFixed(1)}% in the year to
                ${monthName(RUN[LAST].quarter)}, against ${LATEST_YEAR.companiesBefore.toFixed(1)}% a year before.`
            : `Lending to private companies grew ${LATEST_YEAR.companies.toFixed(1)}% in the year to
                ${monthName(RUN[LAST].quarter)}, and lending to individuals ${LATEST_YEAR.individuals.toFixed(1)}%.`),
    },
];
const YEARS = RUN.map((q, i) => ({ year : q.quarter.slice(0, 4), i })).filter(({ year }, i, all) => i === 0 || all[i - 1].year !== year);

export const Opening = () => {
    const ref = useRef<HTMLElement>(null);
    const [ p, setP ] = useState(0);

    useEffect(() => {
        let raf = 0;
        const measure = () => {
            const el = ref.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            setP(clamp(-r.top / Math.max(1, r.height - window.innerHeight)));
        };
        const queue = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
        measure();
        window.addEventListener("scroll", queue, { passive : true });
        window.addEventListener("resize", queue);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("scroll", queue);
            window.removeEventListener("resize", queue);
        };
    }, []);

    // The timeline is also a control: choosing a quarter scrolls the page to it.
    const jump = (i : number) => {
        const el = ref.current;
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top : top + progressAt(i) * (el.offsetHeight - window.innerHeight), behavior : "instant" });
    };

    const f = indexAt(p);
    const index = Math.round(f);
    const values = SHARES[index];
    const date = monthName(RUN[index].quarter);
    const titled = p < P.title;
    const beat = index < CROSS ? 0 : index < LAST ? 1 : 2;
    // The sentences belong to their quarters: they show while time holds there and give way while it runs.
    const holding = f === 0 || f === CROSS || f === LAST;
    const along = f / LAST;
    const nearCross = Math.abs(along - CROSS / LAST) < 0.09;

    return (
        <section className="credit-opening" ref={ref} aria-label="How every ₹100 of bank credit was shared, quarter by quarter">
            <div className="credit-stage">
                <div className="credit-scene">
                    <IsometricCredit shares={at(f)} values={values} then={FIRST} showThen={f > 0.5} date={date} />
                </div>

                <div className="credit-crumbs"><PageCrumbs /></div>

                <div className="credit-words">
                    <div className={`credit-title-card${titled ? "" : " is-gone"}`} aria-hidden={!titled}>
                        <p className="credit-kicker">Bank credit</p>
                        <h1 className="credit-title">How households took over <span>the bank loan book</span></h1>
                        <p className="credit-standfirst">
                            {prose(`In ${RUN[0].quarter.slice(0, 4)}, private companies owed ${Math.round(FIRST.companies)}% of everything
                            Indian banks had lent. Watch how individuals passed companies to become the dominant borrower
                            category.`)}
                        </p>
                    </div>
                    <div className={`credit-beat${titled ? " is-waiting" : ""}`} aria-live="polite">
                        <time className="credit-date" dateTime={RUN[index].quarter}>{date}</time>
                        <div className={`credit-caption${holding ? "" : " is-running"}`} key={beat}>
                            <p className="credit-text">{BEATS[beat].text}</p>
                            <p className="credit-aside">{BEATS[beat].aside}</p>
                        </div>
                        <p className={`credit-key${f > 0.5 ? "" : " is-gone"}`}><span aria-hidden="true" /> Where each stack stood in {monthName(RUN[0].quarter)}</p>
                    </div>
                </div>

                <dl className="credit-values" aria-hidden="true">
                    {CREDIT_GROUPS.map(g => <div key={g.key} className={`is-${g.key}`}>
                        <dt><g.icon size={13} />{g.short}</dt><dd>{rs(values[g.key])}</dd>
                    </div>)}
                </dl>

                <div className="credit-time">
                    <div className="credit-rail" style={{ "--along" : along } as CSSProperties}>
                        <span className="credit-rail-fill" />
                        <span className={`credit-rail-cross${nearCross ? " is-quiet" : ""}`} style={{ left : `${100 * CROSS / LAST}%` }}>
                            <i>Individuals pass companies</i>
                        </span>
                        <span className={`credit-rail-head${along < 0.04 ? " is-start" : along > 0.96 ? " is-end" : ""}`}><b>{shortMonth(RUN[index].quarter)}</b></span>
                        <label className="sr-only" htmlFor="credit-quarter">Quarter</label>
                        <input id="credit-quarter" type="range" min="0" max={LAST} step="1" value={index}
                            aria-valuetext={`${date}: individuals ${rs(values.individuals)}, private companies ${rs(values.companies)}`}
                            onChange={e => jump(Number(e.target.value))} />
                    </div>
                    <ol className="credit-years" aria-hidden="true">
                        {YEARS.map(({ year, i }) => <li key={year} style={{ left : `${100 * i / LAST}%` }}>{year}</li>)}
                    </ol>
                    <p className={`credit-cue${titled ? "" : " is-gone"}`}><ArrowDown size={14} aria-hidden="true" /> Scroll to move through time</p>
                </div>
            </div>
        </section>
    );
};

"use client";

// REACT CORE ==========================================================================================================
import { useId, useState } from "react";

// LOCAL COMPONENTS ====================================================================================================
import { ChartTip, Figure } from "./chartKit";
import { useSize } from "./useSize";

// DATA ================================================================================================================
import { HEADLINE, MONTHS, SUM, TEN, YEARS, grams, gramsFor, inr, monthShort, partYear, rs } from "./data";

// Ten grams of gold in Mumbai, month by month from April 1990, on a log scale so equal steps mean equal percentage
// rises. The two changes in import duty are marked where they fall; they are not DBIE figures.

const PAD = { l : 64, r : 20, t : 20, b : 30 }, H = 400;
const TICKS = [ 5000, 10000, 20000, 50000, 100000 ];
const YEAR_TICKS = [ 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025 ];
const LO = Math.log(3000), HI = Math.log(Math.max(...MONTHS.map(m => m.gold)) * 1.08);
const TABLE = {
    head    : [ "Year", "Gold, ₹ per 10 g", "Months", `Grams for ₹${inr(SUM)}` ],
    numeric : [ false, true, true, true ],
    rows    : YEARS.map(y => [ y.year, inr(y.gold.price), y.gold.months, grams(gramsFor(y.year, SUM)) ]),
};

export const PriceLine = () => {
    const { ref, width } = useSize<HTMLDivElement>();
    const [ hot, setHot ] = useState<number | null>(null);
    const gradId = useId();
    const W = Math.max(640, width || 0);
    const n = MONTHS.length;
    const xOf = (i : number) => PAD.l + i / (n - 1) * (W - PAD.l - PAD.r);
    const yOf = (v : number) => PAD.t + (1 - (Math.log(v) - LO) / (HI - LO)) * (H - PAD.t - PAD.b);
    const indexOf = (ym : string) => MONTHS.findIndex(m => m.ym >= ym);
    const path = MONTHS.map((m, i) => `${i ? "L" : "M"}${xOf(i).toFixed(1)} ${yOf(m.gold).toFixed(1)}`).join(" ");
    const area = `${path} L${xOf(n - 1).toFixed(1)} ${H - PAD.b} L${xOf(0).toFixed(1)} ${H - PAD.b} Z`;
    const hotM = hot === null ? null : MONTHS[hot];
    const peak = indexOf(HEADLINE.peak.ym);

    return (
        <Figure title={`Ten grams of gold in Mumbai, ${monthShort(HEADLINE.first.ym)} to ${monthShort(HEADLINE.last.ym)}`} className="figure-large" table={TABLE}
            units="monthly average, ₹ per 10 grams, log scale"
            note={`The Reserve Bank's monthly average price of standard gold in Mumbai, a bullion price before making charges and tax. The duty marks are the story's, from the Budget and the notification, not from DBIE. The last year is ${partYear(HEADLINE.toYear, YEARS[YEARS.length - 1].gold.months)}.`}>
            <div ref={ref} className="chart-wrap r1">
                <div className="chart-scroll">
                    <svg className="chart-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="The Mumbai price of ten grams of gold by month, on a log scale"
                        onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); const x = e.clientX - r.left; setHot(Math.max(0, Math.min(n - 1, Math.round((x - PAD.l) / (W - PAD.l - PAD.r) * (n - 1))))); }}
                        onMouseLeave={() => setHot(null)}>
                        <defs>
                            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" className="area-top" />
                                <stop offset="1" className="area-foot" />
                            </linearGradient>
                        </defs>
                        {TICKS.map(t => (
                            <g key={t} className="grid-line">
                                <line x1={PAD.l} x2={W - PAD.r} y1={yOf(t)} y2={yOf(t)} />
                                <text x={PAD.l - 8} y={yOf(t) + 4} textAnchor="end">{t >= 100000 ? `₹${t / 100000} lakh` : `₹${inr(t)}`}</text>
                            </g>
                        ))}
                        {YEAR_TICKS.map(y => { const i = indexOf(`${y}-01`); return i < 0 ? null : <text key={y} className="axis-label" x={xOf(i)} y={H - 8} textAnchor={y === 1990 ? "start" : "middle"}>{y}</text>; })}
                        <path className="price-area" d={area} fill={`url(#${gradId})`} />
                        <path className="price-line" d={path} />
                        {/* the duty marks, labelled at the foot, each on its own line so the two do not collide */}
                        {HEADLINE.duty.map((d, k) => { const i = indexOf(d.month); return i < 0 ? null : (
                            <g key={d.month} className="duty-mark">
                                <line x1={xOf(i)} x2={xOf(i)} y1={PAD.t + 40} y2={H - PAD.b} />
                                <text x={xOf(i) - 6} y={H - PAD.b - 12 - 16 * k} textAnchor="end">duty {d.rate}%, {monthShort(d.month)}</text>
                            </g>
                        ); })}
                        <g className="end-label">
                            {peak >= 0 && peak !== n - 1 && <circle className="is-peak" cx={xOf(peak)} cy={yOf(HEADLINE.peak.price)} r={4} />}
                            {peak >= 0 && peak !== n - 1 && <text x={xOf(peak) - 8} y={yOf(HEADLINE.peak.price) - 10} textAnchor="end">peak {rs(HEADLINE.peak.price)}, {monthShort(HEADLINE.peak.ym)}</text>}
                            <circle cx={xOf(n - 1)} cy={yOf(MONTHS[n - 1].gold)} r={4} />
                            <text x={xOf(n - 1) + 2} y={yOf(MONTHS[n - 1].gold) + 22} textAnchor="end">{rs(MONTHS[n - 1].gold)}, {monthShort(MONTHS[n - 1].ym)}</text>
                            <circle cx={xOf(0)} cy={yOf(MONTHS[0].gold)} r={4} />
                            <text x={xOf(0) + 8} y={yOf(MONTHS[0].gold) - 10}>{rs(MONTHS[0].gold)}, {monthShort(MONTHS[0].ym)}</text>
                        </g>
                        {hotM && <line className="hot-line" x1={xOf(hot!)} x2={xOf(hot!)} y1={PAD.t} y2={H - PAD.b} />}
                        {hotM && <circle className="hot-dot" cx={xOf(hot!)} cy={yOf(hotM.gold)} r={5} />}
                    </svg>
                </div>
                {hotM && <ChartTip x={xOf(hot!)} y={yOf(hotM.gold) - 12} width={W} head={`${rs(hotM.gold)} for ${TEN} g`} lines={[ monthShort(hotM.ym), `₹${inr(SUM)} bought ${grams(SUM / hotM.gold * TEN)}` ]} />}
            </div>
        </Figure>
    );
};

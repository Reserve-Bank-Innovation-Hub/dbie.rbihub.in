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

const PAD = { l : 64, r : 190, t : 34, b : 30 }, H = 420;              // the right margin holds the end labels
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
        <Figure className="figure-large" table={TABLE}
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
                        {/* every label sits in clear space, never on the line or the area beneath it: the duty marks run up to the
                            top margin and are named there, the earlier leftward and the later rightward so the two part; the peak
                            and the latest month are named in the right margin, a line apart; the first month is named well above its
                            point, over the flat early years, with a leader down to it */}
                        {HEADLINE.duty.map((d, k) => { const i = indexOf(d.month); return i < 0 ? null : (
                            <g key={d.month} className="duty-mark">
                                <line x1={xOf(i)} x2={xOf(i)} y1={PAD.t - 6} y2={H - PAD.b} />
                                <text x={xOf(i) + (k ? 5 : -5)} y={PAD.t - 12} textAnchor={k ? "start" : "end"}>duty {d.rate}%, {monthShort(d.month)}</text>
                            </g>
                        ); })}
                        <g className="end-label is-haloed">
                            {(() => {
                                const x = W - PAD.r + 12, yPeak = Math.max(PAD.t + 14, yOf(HEADLINE.peak.price) + 4), yLast = Math.max(yPeak + 18, yOf(MONTHS[n - 1].gold) + 4);
                                return (<>
                                    {peak >= 0 && peak !== n - 1 && <circle className="is-peak" cx={xOf(peak)} cy={yOf(HEADLINE.peak.price)} r={4} />}
                                    {peak >= 0 && peak !== n - 1 && <text className="is-peak" x={x} y={yPeak}>peak {rs(HEADLINE.peak.price)}, {monthShort(HEADLINE.peak.ym)}</text>}
                                    <circle cx={xOf(n - 1)} cy={yOf(MONTHS[n - 1].gold)} r={4} />
                                    <text x={x} y={yLast}>{rs(MONTHS[n - 1].gold)}, {monthShort(MONTHS[n - 1].ym)}</text>
                                </>);
                            })()}
                            {(() => {
                                const y0 = yOf(MONTHS[0].gold), yl = yOf(10000);
                                return (<>
                                    <line className="leader" x1={xOf(0)} x2={xOf(0)} y1={y0 - 5} y2={yl + 6} />
                                    <circle cx={xOf(0)} cy={y0} r={4} />
                                    <text x={xOf(0) - 2} y={yl} >{rs(MONTHS[0].gold)}, {monthShort(MONTHS[0].ym)}</text>
                                </>);
                            })()}
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

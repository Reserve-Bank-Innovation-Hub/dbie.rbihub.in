"use client";

// REACT CORE ==========================================================================================================
import { useState } from "react";

// LOCAL COMPONENTS ====================================================================================================
import { ChartTip, Figure } from "./chartKit";
import { useSize } from "./useSize";

// DATA ================================================================================================================
import { FROM_YEAR, HEADLINE, RESERVES, TONNES, YEARS, bn, dateName, inr, monthShort, pct, timesWords } from "./data";

// The Reserve Bank's gold as a share of the foreign exchange reserves, month by month from the story's first year,
// with the volume in tonnes beside it for the years the weekly report gives them: a share that rises mostly through
// price is said so, and the tonnes are there to show it.

const PAD = { l : 48, r : 20, t : 20, b : 30 }, H = 360;
const SERIES = RESERVES.filter(r => r.ym >= `${FROM_YEAR}-04`);
const TOP = Math.ceil(Math.max(...SERIES.map(r => r.share)) / 10) * 10;
const TICKS = Array.from({ length : TOP / 10 + 1 }, (_, i) => i * 10);
const TABLE = {
    head    : [ "Year", "Gold, $ billion", "Share of reserves", "Tonnes, where given" ],
    numeric : [ false, true, true, true ],
    rows    : YEARS.map(y => {
        const t = [ ...TONNES ].reverse().find(t => t.date.startsWith(`${y.year}-`));
        return [ `${y.year}, ${monthShort(y.reserves.ym)}`, y.reserves.goldUsdBn.toLocaleString("en-IN", { maximumFractionDigits : 1 }), pct(y.reserves.share), t ? `${inr(t.tonnes)} t` : "–" ];
    }),
};

export const Reserves = () => {
    const { ref, width } = useSize<HTMLDivElement>();
    const [ hot, setHot ] = useState<number | null>(null);
    const W = Math.max(640, width || 0);
    const n = SERIES.length;
    const xOf = (i : number) => PAD.l + i / (n - 1) * (W - PAD.l - PAD.r);
    const yOf = (v : number) => PAD.t + (1 - v / TOP) * (H - PAD.t - PAD.b);
    const line = SERIES.map((r, i) => `${i ? "L" : "M"}${xOf(i).toFixed(1)} ${yOf(r.share).toFixed(1)}`).join(" ");
    const area = `${line} L${xOf(n - 1).toFixed(1)} ${yOf(0)} L${xOf(0).toFixed(1)} ${yOf(0)} Z`;
    const at = (ym : string) => SERIES.findIndex(r => r.ym === ym);
    const marks = [ HEADLINE.reserves.high, HEADLINE.reserves.low, HEADLINE.reserves.last ].map(m => ({ ...m, i : at(m.ym) })).filter(m => m.i >= 0);
    const hotR = hot === null ? null : SERIES[hot];
    const { first : tFirst } = HEADLINE.reserves.tonnes;

    return (
        <Figure title="The Reserve Bank’s gold as a share of the reserves" className="figure-large" table={TABLE}
            units="per cent of total foreign exchange reserves, by value, month-end"
            note={`Gold and total reserves in dollars, as DBIE carries them by month; the share moves with the gold price as well as with what the Bank holds. Tonnes from the weekly report, which gives them from ${dateName(tFirst.date)}.`}
            >
            <div ref={ref} className="chart-wrap r1">
                <div className="chart-scroll">
                    <svg className="chart-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gold’s share of the reserves by month, as an area"
                        onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); const x = e.clientX - r.left; setHot(Math.max(0, Math.min(n - 1, Math.round((x - PAD.l) / (W - PAD.l - PAD.r) * (n - 1))))); }}
                        onMouseLeave={() => setHot(null)}>
                        {TICKS.map(t => (
                            <g key={t} className="grid-line">
                                <line x1={PAD.l} x2={W - PAD.r} y1={yOf(t)} y2={yOf(t)} />
                                <text x={PAD.l - 8} y={yOf(t) + 4} textAnchor="end">{t}%</text>
                            </g>
                        ))}
                        {[ 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025 ].map(y => { const i = SERIES.findIndex(r => r.ym >= `${y}-01`); return i < 0 ? null : <text key={y} className="axis-label" x={xOf(i)} y={H - 8} textAnchor={y === 1990 ? "start" : "middle"}>{y}</text>; })}
                        <path className="share-area" d={area} />
                        <path className="share-line" d={line} />
                        {/* each mark's label in the clear: the high to the right of the peak, the low up and to the left over the
                            flat years before it, the latest well above the line's end; a halo of the paper keeps them off the line */}
                        {marks.map((m, k) => {
                            const at = ([ { dx : 10, dy : 4, anchor : "start" }, { dx : 22, dy : -26, anchor : "end" }, { dx : 6, dy : -30, anchor : "end" } ] as const)[k];
                            return (
                                <g key={m.ym} className="end-label is-haloed">
                                    <circle cx={xOf(m.i)} cy={yOf(m.share)} r={4} />
                                    <text x={xOf(m.i) + at.dx} y={yOf(m.share) + at.dy} textAnchor={at.anchor}>{pct(m.share)}, {monthShort(m.ym)}</text>
                                </g>
                            );
                        })}
                        {hotR && <line className="hot-line" x1={xOf(hot!)} x2={xOf(hot!)} y1={PAD.t} y2={H - PAD.b} />}
                        {hotR && <circle className="hot-dot" cx={xOf(hot!)} cy={yOf(hotR.share)} r={5} />}
                    </svg>
                </div>
                {hotR && <ChartTip x={xOf(hot!)} y={yOf(hotR.share) - 12} width={W} head={pct(hotR.share)} lines={[ monthShort(hotR.ym), `gold ${bn(hotR.goldUsdBn)} of ${bn(hotR.totalUsdBn)}` ]} />}
            </div>
        </Figure>
    );
};

// The weight and the value, as two cards for the chapter's text column: the tonnes at the weekly report's first and
// latest dates, and how far the value rose against the weight. They share one line grid; side by side the value's
// two lines sit on the weight's, and where the column is too narrow for that, they stack.
export const TonnesCards = () => {
    const { first : tFirst, last : tLast } = HEADLINE.reserves.tonnes;
    return (
        <div className="tonnes-wrap">
            <div className="tonnes-cards">
                <div className="tonnes-card">
                    <p className="tonnes-head">By weight</p>
                    <p className="tonnes-line"><strong>{inr(tFirst.tonnes)} tonnes</strong> at {dateName(tFirst.date)}, worth {bn(tFirst.goldUsdBn)}</p>
                    <p className="tonnes-line"><strong>{inr(tLast.tonnes)} tonnes</strong> at {dateName(tLast.date)}, worth {bn(tLast.goldUsdBn)}</p>
                </div>
                <div className="tonnes-card">
                    <p className="tonnes-value">The value rose <em>{timesWords(tLast.goldUsdBn / tFirst.goldUsdBn)}</em>, as the weight rose <em>{timesWords(tLast.tonnes / tFirst.tonnes)}</em></p>
                </div>
            </div>
        </div>
    );
};

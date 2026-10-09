"use client";

// REACT CORE ==========================================================================================================
import { useState } from "react";

// LOCAL COMPONENTS ====================================================================================================
import { ChartTip, Figure } from "./chartKit";
import { useSize } from "./useSize";

// DATA ================================================================================================================
import { FROM_YEAR, TO_YEAR, YEARS, Year, times } from "./data";

// Each thing's price set against the workers' price index, the first year as one: above the line it ran ahead of
// prices, below it fell behind. Five lines on a log scale so a doubling reads the same anywhere, the index itself the
// flat rule at one. The mason's and wheat's lines stop where DBIE's figures do.

interface Series { key : string; name : string; of : (y : Year) => number | null; }
const SERIES : Series[] = [
    { key : "gold",   name : "🪙 Gold",          of : y => y.gold.price },
    { key : "silver", name : "🥈 Silver",        of : y => y.silver.price },
    { key : "mason",  name : "👷 A mason’s day", of : y => y.mason?.wage ?? null },
    { key : "usd",    name : "💵 The dollar",    of : y => y.usd.rate },
    { key : "wheat",  name : "🌾 Wheat at MSP",  of : y => y.wheat?.price ?? null },
];
const first = YEARS[0];
// The ratio for a year: the price's rise over the index's rise.
const ratio = (s : Series, y : Year) => { const p = s.of(y), p0 = s.of(first); return p === null || p0 === null ? null : (p / p0) / (y.index.value / first.index.value); };
const POINTS = SERIES.map(s => ({ ...s, pts : YEARS.map(y => ({ year : y.year, v : ratio(s, y) })).filter((p) : p is { year : number; v : number } => p.v !== null) }));
const TICKS = [ 0.5, 1, 2, 4, 8 ];
const PAD = { l : 44, r : 160, t : 16, b : 28 }, H = 380;

const TABLE = {
    head    : [ "Year", ...SERIES.map(s => s.name) ],
    numeric : [ false, true, true, true, true, true ],
    rows    : YEARS.map(y => [ y.year, ...SERIES.map(s => { const r = ratio(s, y); return r === null ? "–" : times(r); }) ]),
};

export const RanAhead = () => {
    const { ref, width } = useSize<HTMLDivElement>();
    const [ hot, setHot ] = useState<number | null>(null);
    const W = Math.max(640, width || 0);
    const lo = Math.log2(0.4), hi = Math.log2(10);
    const xOf = (year : number) => PAD.l + (year - FROM_YEAR) / (TO_YEAR - FROM_YEAR) * (W - PAD.l - PAD.r);
    const yOf = (v : number) => PAD.t + (1 - (Math.log2(v) - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
    const path = (pts : { year : number; v : number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${xOf(p.year).toFixed(1)} ${yOf(p.v).toFixed(1)}`).join(" ");
    // The end labels, nudged apart where two would collide.
    const ends = POINTS.map(s => ({ key : s.key, name : s.name, v : s.pts[s.pts.length - 1].v, y : yOf(s.pts[s.pts.length - 1].v) })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 15) ends[i].y = ends[i - 1].y + 15;
    const hotRow = hot === null ? null : YEARS.find(y => y.year === hot)!;

    return (
        <Figure title="Each price against the workers' index" units={`${FROM_YEAR} = 1; above the line is ahead of prices, below it behind; log scale`} table={TABLE}
            note="Prices relative to the consumer price index for industrial workers, chained across its bases. A thing above one rose faster than prices in general; no cause is read into it.">
            <div ref={ref} className="ran-wrap r1">
                <div className="ran-scroll">
                    <svg className="ran-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Five lines of prices against the workers' index, the first year as one"
                        onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); const x = e.clientX - r.left; const year = Math.round(FROM_YEAR + (x - PAD.l) / (W - PAD.l - PAD.r) * (TO_YEAR - FROM_YEAR)); setHot(Math.max(FROM_YEAR, Math.min(TO_YEAR, year))); }}
                        onMouseLeave={() => setHot(null)}>
                        {TICKS.map(t => (
                            <g key={t}>
                                <line className={`grid ${t === 1 ? "is-base" : ""}`} x1={PAD.l} x2={W - PAD.r} y1={yOf(t)} y2={yOf(t)} />
                                <text className="tick" x={PAD.l - 8} y={yOf(t) + 4} textAnchor="end">{t}×</text>
                            </g>
                        ))}
                        {[ FROM_YEAR, 2006, 2011, 2016, 2021, TO_YEAR ].map(y => <text key={y} className="tick" x={xOf(y)} y={H - 8} textAnchor="middle">{y}</text>)}
                        {POINTS.map((s, i) => <path key={s.key} className={`ran-line ran-${s.key} r${i + 2}`} d={path(s.pts)} />)}
                        {ends.map(e => <text key={e.key} className={`ran-label ran-${e.key} r${POINTS.findIndex(s => s.key === e.key) + 2}`} x={W - PAD.r + 10} y={e.y + 4}>{e.name} {times(e.v)}</text>)}
                        {hot !== null && <line className="crosshair" x1={xOf(hot)} x2={xOf(hot)} y1={PAD.t} y2={H - PAD.b} />}
                        {hot !== null && POINTS.map(s => { const p = s.pts.find(p => p.year === hot); return p && <circle key={s.key} className={`ran-dot ran-${s.key}`} cx={xOf(p.year)} cy={yOf(p.v)} r={4} />; })}
                    </svg>
                    {hotRow && <ChartTip x={xOf(hot!)} y={PAD.t} width={W} head={`${hot}`} lines={POINTS.map(s => { const p = s.pts.find(p => p.year === hot); return `${s.name}: ${p ? times(p.v) : "–"}`; })} />}
                </div>
            </div>
        </Figure>
    );
};

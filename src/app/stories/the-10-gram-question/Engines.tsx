"use client";

// LOCAL COMPONENTS ====================================================================================================
import { Figure } from "./chartKit";
import { useSize } from "./useSize";

// DATA ================================================================================================================
import { WINDOWS, times } from "./data";

// The three engines of the rupee price, window by window: the London price in dollars, the rupee against the dollar,
// and the Mumbai premium over the London price brought into rupees. Each is a multiple over the window, drawn as a
// segment on a log axis so that the three lay end to end make the whole rise; a segment that runs left is an engine
// that pulled the price down. The whole span runs along the foot.

const ENGINES = [
    { key : "london",  name : "Gold in dollars", cls : "engine-london" },
    { key : "rate",    name : "The rupee",       cls : "engine-rate" },
    { key : "premium", name : "Mumbai’s gap",    cls : "engine-premium" },
] as const;
const AXIS = [ 0.25, 0.5, 1, 2, 4, 8, 16, 32 ];
const PAD = { l : 150, r : 72, t : 28, b : 30 }, ROW = 58, BAR = 22;
const LO = Math.log(0.2), HI = Math.log(48);
const TABLE = {
    head    : [ "Window", "Ten grams in Mumbai", ...ENGINES.map(e => e.name) ],
    numeric : [ false, true, true, true, true ],
    strong  : [ WINDOWS.length - 1 ],                                            // the whole span
    rows    : WINDOWS.map(w => [ `${w.label}, ${w.from} to ${w.to}`, `₹${w.mumbai.from.toLocaleString("en-IN", { maximumFractionDigits : 0 })} → ₹${w.mumbai.to.toLocaleString("en-IN", { maximumFractionDigits : 0 })}, ${times(w.mumbai.times)}`, times(w.london.times), times(w.rate.times), times(w.premium.times) ]),
};

export const Engines = () => {
    const { ref, width } = useSize<HTMLDivElement>();
    const W = Math.max(640, width || 0);
    const H = PAD.t + ROW * WINDOWS.length + PAD.b;
    const xOf = (v : number) => PAD.l + (Math.log(v) - LO) / (HI - LO) * (W - PAD.l - PAD.r);
    const x1 = xOf(1);

    return (
        <Figure title="What drove the rupee price, window by window" className="figure-large" table={TABLE}>
            <div ref={ref} className="chart-wrap r1">
                <div className="chart-scroll">
                    <svg className="chart-svg engines-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="For each window, three segments on a log axis: gold in dollars, the rupee, and Mumbai’s gap, making the rise in the Mumbai price">
                        {AXIS.map(v => (
                            <g key={v} className={`grid-line ${v === 1 ? "is-one" : ""}`}>
                                <line x1={xOf(v)} x2={xOf(v)} y1={PAD.t - 6} y2={H - PAD.b} />
                                <text x={xOf(v)} y={H - 10} textAnchor="middle">{v < 1 ? `×${v}` : `×${v}`}</text>
                            </g>
                        ))}
                        {WINDOWS.map((w, i) => {
                            const y = PAD.t + ROW * i, yBar = y + (ROW - BAR) / 2;
                            let right = 0, left = 0;                        // log distance stacked on either side of one
                            const segs = ENGINES.map(e => {
                                const l = Math.log(w[e.key].times);
                                const from = l >= 0 ? right : left, to = from + l;
                                if (l >= 0) right = to; else left = to;
                                const xa = xOf(Math.exp(Math.min(from, to))), xb = xOf(Math.exp(Math.max(from, to)));
                                return { ...e, xa, xb, v : w[e.key].times };
                            });
                            const xNet = xOf(w.mumbai.times);
                            return (
                                <g key={w.label} className={`engine-row ${i === WINDOWS.length - 1 ? "is-whole" : ""}`}>
                                    <text className="row-label" x={PAD.l - 12} y={y + ROW / 2 + 4} textAnchor="end">{w.label}</text>
                                    <text className="row-sub" x={PAD.l - 12} y={y + ROW / 2 + 18} textAnchor="end">{w.from} to {w.to}</text>
                                    {segs.map(s => <rect key={s.key} className={s.cls} x={s.xa} y={yBar} width={Math.max(0, s.xb - s.xa)} height={BAR}><title>{`${s.name}: ${times(s.v)}`}</title></rect>)}
                                    {segs.filter(s => s.xb - s.xa > 44).map(s => <text key={`${s.key}-v`} className={`seg-label is-${s.key}`} x={(s.xa + s.xb) / 2} y={yBar + BAR / 2 + 4} textAnchor="middle">{times(s.v)}</text>)}
                                    <line className="net-mark" x1={xNet} x2={xNet} y1={yBar - 6} y2={yBar + BAR + 6} />
                                    <text className="net-label" x={xNet + (w.mumbai.times >= 1 ? 8 : -8)} y={yBar - 8} textAnchor={w.mumbai.times >= 1 ? "start" : "end"}>{times(w.mumbai.times)}</text>
                                </g>
                            );
                        })}
                        <line className="one-line" x1={x1} x2={x1} y1={PAD.t - 6} y2={H - PAD.b} />
                    </svg>
                </div>
                <ul className="engine-key" aria-hidden="true">
                    {ENGINES.map(e => <li key={e.key}><span className={`swatch ${e.cls}`} />{e.name}</li>)}
                </ul>
            </div>
        </Figure>
    );
};

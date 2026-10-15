"use client";

// NEFT's day as a clock: a ring of 48 wedges, one for each half-hourly batch. Payments fly in from outside the ring
// into the batch now filling; at each half-hour the batch settles, with a flash, and its wedge turns solid turmeric.
// Beside it IMPS fills a ring of its own smoothly, with no batches, since each payment is credited at once. An average
// day of the latest year runs in 16 seconds and loops; with reduced motion the clock stands at 18:00.

// REACT CORE ==========================================================================================================
import { ReactNode, useEffect, useState } from "react";

// LOCAL ===============================================================================================================
import { Layout, loopOnScreen, reducedMotion, splitClass, useStage } from "./stage";
import { rupees } from "./methods";

// DATA ================================================================================================================
import { EVENTS, HEADLINE } from "./data.gen";

// STYLES ==============================================================================================================
import "./neft-clock.css";

const H = HEADLINE, DAY = 16, BATCHES = 48, SLOT = DAY / BATCHES;
const PER = H.day.neftCrore * 100 / BATCHES;                                      // lakh payments a batch
const hhmm = (mins : number) => `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(Math.floor(mins) % 60).padStart(2, "0")}`;
const EV = EVENTS.find(e => e.slide === "neft");

// an annular sector from angle a0 to a1 (radians, 0 at the top, clockwise), radii r0 to r1
const sector = (a0 : number, a1 : number, r0 : number, r1 : number) => {
    const p = (a : number, r : number) => `${(Math.sin(a) * r).toFixed(2)} ${(-Math.cos(a) * r).toFixed(2)}`;
    const big = a1 - a0 > Math.PI ? 1 : 0;
    return `M${p(a0, r0)} L${p(a0, r1)} A${r1} ${r1} 0 ${big} 1 ${p(a1, r1)} L${p(a1, r0)} A${r0} ${r0} 0 ${big} 0 ${p(a0, r0)} Z`;
};

export const NeftClockStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const { ref, size, seen } = useStage<HTMLDivElement>();
    const [ t, setT ] = useState(DAY * 0.75);
    useEffect(() => {
        if (!seen || reducedMotion()) return;
        setT(0);
        // only while on screen
        return ref.current ? loopOnScreen(ref.current, dt => setT(x => (x + dt) % DAY)) : undefined;
    }, [ seen ]);

    const frac = t / DAY, batch = Math.min(BATCHES - 1, Math.floor(t / SLOT)), within = t / SLOT - batch, since = within * SLOT;
    const { w, h } = size, stacked = w < 560;
    // the NEFT clock takes most of the stage; IMPS's smaller ring sits to its right, or below it on a phone
    // side by side: the clock, a gap, and IMPS's ring at 0.45 of its size, all inside the stage
    const R = Math.max(80, stacked ? Math.min(w * 0.33, h * 0.3) : Math.min(h * 0.4, (w - 150) / 2.9));
    const r0 = R * 0.66, gap = 0.012;
    const cx = stacked ? w / 2 : R + 50, cy = stacked ? R + 18 : h / 2 - 10;
    const ir = stacked ? Math.min(R * 0.42, (h - 2 * R - 50) / 2.4) : R * 0.45;
    const ix = stacked ? w / 2 : cx + R + 70 + ir, iy = stacked ? 2 * R + 40 + ir : h / 2 - 10;
    const wedge = (k : number) => [ k / BATCHES * Math.PI * 2 + gap, (k + 1) / BATCHES * Math.PI * 2 - gap ] as const;
    const flash = Math.max(0, 1 - since / 0.35);
    const [ ca0, ca1 ] = wedge(batch), mid = (ca0 + ca1) / 2;
    // payments flying into the batch now filling: a fixed set of dots, each on its own phase
    const dots = Array.from({ length : 14 }, (_, j) => {
        const ph = (t * 1.6 + j / 14) % 1, a = mid + Math.sin(j * 7.3) * 0.5 * (1 - ph), r = R * (1.55 - 0.75 * ph);
        return { x : Math.sin(a) * r, y : -Math.cos(a) * r, o : Math.min(1, ph * 3) * (1 - ph * 0.3) };
    });
    const impsA = frac * Math.PI * 2;
    const ev = EV;
    return (
        <div className={splitClass(layout)}>
            <div className="split-card">
                {children}
                {ev && <p className="event-line">{ev.note} <a href={ev.url}>Source</a></p>}
            </div>
            <div className="split-stage nc-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img" aria-label={`NEFT's day as a clock of 48 half-hourly batches. At ${hhmm(frac * 1440)}, batch ${batch + 1} of 48 is filling; ${(H.day.neftCrore * batch / BATCHES).toFixed(2)} crore payments have settled so far, about ${PER.toFixed(1)} lakh a batch. IMPS has credited ${(H.day.impsLakh * frac).toFixed(1)} lakh payments, each at once.`}>
                        <g transform={`translate(${cx} ${cy})`}>
                            <circle className="nc-face" r={R * 1.04} />
                            {Array.from({ length : BATCHES }, (_, k) => {
                                const [ a0, a1 ] = wedge(k);
                                const done = k < batch, now = k === batch;
                                return (
                                    <g key={k}>
                                        <path className="nc-slot" d={sector(a0, a1, r0, R)} />
                                        {done && <path className={`nc-done ${k === batch - 1 && flash > 0 ? "is-new" : ""}`} d={sector(a0, a1, r0, R)} style={k === batch - 1 ? { opacity : 0.55 + 0.45 * (1 - flash) } : undefined} />}
                                        {now && <path className="nc-fill" d={sector(a0, a1, r0, r0 + (R - r0) * within)} />}
                                    </g>
                                );
                            })}
                            {batch > 0 && flash > 0 && (() => { const [ a0, a1 ] = wedge(batch - 1); return <path className="nc-flash" d={sector(a0 - 0.01, a1 + 0.01, r0 - 6 * flash, R + 10 * flash)} style={{ opacity : flash }} />; })()}
                            {!reducedMotion() && dots.map((d, j) => <circle key={j} className="nc-dot" cx={d.x} cy={d.y} r={Math.max(2, R * 0.022)} style={{ opacity : d.o }} />)}
                            {[ 0, 6, 12, 18 ].map(hr => { const a = hr / 24 * Math.PI * 2; return <text key={hr} className="nc-hour" x={Math.sin(a) * (R + 16)} y={-Math.cos(a) * (R + 16) + 4} textAnchor="middle">{String(hr).padStart(2, "0")}:00</text>; })}
                            <text className="nc-time" y={-R * 0.2} textAnchor="middle">{hhmm(frac * 1440)}</text>
                            <text className="nc-batch" y={-R * 0.2 + 22} textAnchor="middle">Batch {batch + 1} of {BATCHES}</text>
                            <text className="nc-settled" y={R * 0.2} textAnchor="middle">{(H.day.neftCrore * batch / BATCHES).toFixed(2)} crore</text>
                            <text className="nc-sub" y={R * 0.2 + 17} textAnchor="middle">settled so far</text>
                            <text className="nc-sub" y={R * 0.2 + 34} textAnchor="middle">{PER.toFixed(1)} lakh a batch</text>
                        </g>
                        <g transform={`translate(${ix} ${iy})`}>
                            <circle className="nc-imps-track" r={ir} />
                            {frac > 0.001 && <path className="nc-imps-fill" d={sector(0, Math.max(0.001, impsA), ir * 0.82, ir)} />}
                            <circle className="nc-imps-head" cx={Math.sin(impsA) * ir * 0.91} cy={-Math.cos(impsA) * ir * 0.91} r={Math.max(3, ir * 0.08)} />
                            <text className="nc-imps-n" y={2} textAnchor="middle">{(H.day.impsLakh * frac).toFixed(1)}</text>
                            <text className="nc-sub" y={18} textAnchor="middle">lakh so far</text>
                            <text className="nc-imps-name" y={ir + 22} textAnchor="middle">IMPS: each payment credited at once</text>
                        </g>
                        <text className="nc-avg" x={stacked ? w / 2 : cx} y={stacked ? h - 4 : cy + R + 42} textAnchor="middle">
                            Average payment, {H.fy}: NEFT {rupees(H.neftAvg.to)} · IMPS {rupees(H.impsAvg.to)}
                        </text>
                    </svg>
                )}
            </div>
        </div>
    );
};

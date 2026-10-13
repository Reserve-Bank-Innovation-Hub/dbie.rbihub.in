"use client";

// Money kept: NRI deposits in Indian banks, month by month since January 2010, as a vault of three layers (NRE, FCNR(B)
// and NRO accounts). The first step shows the whole; the second lifts the FCNR(B) layer, the dollar deposits, with the
// two windows the RBI opened for them and the unwinding between, and the 2026 window as a block past DBIE's last month.

// REACT CORE ==========================================================================================================
import { ReactNode, useState } from "react";

// DATA ================================================================================================================
import { HEADLINE, NRI, NRI_MONTHS } from "./data.gen";
import { type StepEvent } from "./record";
import { Pins, Readout, useReadout } from "./ChartBits";
import { Layout, monthShort, splitClass, useStage, usd } from "./stage";

const LAYERS = [
    { key : "nro", label : "NRO", full : "Non-Resident Ordinary (NRO)", note : "rupee accounts for income earned in India" },
    { key : "fcnr", label : "FCNR(B)", full : "Foreign Currency Non-Resident (Banks), FCNR(B)", note : "deposits kept in foreign currency" },
    { key : "nre", label : "NRE", full : "Non-Resident External (NRE)", note : "rupee accounts for money brought from abroad" },
] as const;
// The 2026 window, from the Ministry of Finance (PIB, 24-08-2026): FCNR(B) deposits raised to 21-08-2026, not DBIE data.
export const WINDOW_2026 = 65.40;

export const VaultStep = ({ layout, mode, events, children } : { layout? : Layout; mode : "all" | "fcnr"; events : StepEvent[]; children : ReactNode }) => {
    const { ref, size, drawn } = useStage<HTMLDivElement>();
    const [ on, setOn ] = useState<string | null>(null);
    const { w, h } = size;
    const n = NRI_MONTHS.length, fcnr = mode === "fcnr";
    const narrow = w < 560, block = fcnr ? (narrow ? 34 : 56) : 0;
    const pad = { l : 48, r : (fcnr ? block + (narrow ? 22 : 104) : 90), t : narrow && fcnr ? 64 : 44, b : 36 };
    const X = (i : number) => pad.l + i / (n - 1) * (w - pad.l - pad.r);
    const max = fcnr ? 110 : 190;
    const Y = (v : number) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
    const total = (i : number) => NRI.nre[i] + NRI.fcnr[i] + NRI.nro[i];
    // the layers, stacked from the bottom; in the FCNR(B) step only that layer, on its own scale
    const stacks = fcnr ? [ { ...LAYERS[1], lo : NRI.fcnr.map(() => 0), hi : NRI.fcnr } ] : (() => {
        let base = NRI_MONTHS.map(() => 0);
        return LAYERS.map(l => { const lo = base, hi = base.map((b, i) => b + NRI[l.key][i]); base = hi; return { ...l, lo, hi }; });
    })();
    const path = (lo : number[], hi : number[]) => `M${X(0)},${Y(hi[0])} ` + hi.map((v, i) => `L${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ") + " " + lo.map((_, j) => { const i = n - 1 - j; return `L${X(i).toFixed(1)},${Y(lo[i]).toFixed(1)}`; }).join(" ") + " Z";
    const at = (m : string) => NRI_MONTHS.indexOf(m);
    const windows = fcnr ? [
        { from : HEADLINE.window2013.from, to : HEADLINE.window2013.to, label : `+${usd(HEADLINE.window2013.rise)}`, sub : `${monthShort(HEADLINE.window2013.from)}–${monthShort(HEADLINE.window2013.to)}` },
        { from : HEADLINE.unwind2016.from, to : HEADLINE.unwind2016.to, label : `−${usd(HEADLINE.unwind2016.fall)}`, sub : `${monthShort(HEADLINE.unwind2016.from)}–${monthShort(HEADLINE.unwind2016.to)}` },
    ] : [];
    const xb = X(n - 1) + 16, lastF = NRI.fcnr[n - 1];
    const { tip, bind } = useReadout(px => {
        if (!w || px > X(n - 1) + 8) return null;
        const i = Math.max(0, Math.min(n - 1, Math.round((px - pad.l) / (w - pad.l - pad.r) * (n - 1))));
        const lines = fcnr ? [ `${usd(NRI.fcnr[i])} in FCNR(B) deposits` ] : [ `${usd(total(i))} in all`, ...LAYERS.map(l => `${l.label} ${usd(NRI[l.key][i])}`).reverse() ];
        return { x : X(i), y : Y(fcnr ? NRI.fcnr[i] : total(i)), head : monthShort(NRI_MONTHS[i]), lines };
    });
    // an event past DBIE's last month (the Ministry's figure for the 2026 window) is the block itself, not a pin
    const pins = events.filter(e => e.k < n).map(e => ({ ...e, x : X(e.k), y : Y(fcnr ? NRI.fcnr[e.k] : total(e.k)), delay : 0.4 + 1.8 * e.k / (n - 1) }));
    const years = NRI_MONTHS.map((m, i) => [ m, i ] as const).filter(([ m ]) => m.endsWith("-01") && +m.slice(0, 4) % (narrow ? 4 : 2) === 0);
    return (
        <div className={splitClass(layout)}>
            <div className="split-stage vault-stage" ref={ref} {...bind}>
                {w > 0 && (
                    <svg width={w} height={h} role="img" aria-label={fcnr
                        ? `FCNR(B) deposits, ${monthShort(NRI_MONTHS[0])} to ${monthShort(NRI_MONTHS[n - 1])}: up ${usd(HEADLINE.window2013.rise)} from August 2013 to February 2014, down ${usd(HEADLINE.unwind2016.fall)} from August to December 2016, ${usd(lastF)} in ${monthShort(NRI_MONTHS[n - 1])}; the 2026 window raised ${usd(WINDOW_2026, 2)} by 21-08-2026 (Ministry of Finance).`
                        : `NRI deposits, ${monthShort(NRI_MONTHS[0])} to ${monthShort(NRI_MONTHS[n - 1])}: ${usd(total(0))} to ${usd(total(n - 1))}.`}>
                        {(fcnr ? [ 0, 25, 50, 75, 100 ] : [ 0, 50, 100, 150 ]).map(v => (
                            <g key={v} className="grid">
                                <line x1={pad.l} x2={X(n - 1)} y1={Y(v)} y2={Y(v)} />
                                <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end">${v}</text>
                            </g>
                        ))}
                        {windows.map((wd, i) => (
                            <g key={i} className={`window ${drawn ? "is-shown" : ""}`} style={{ transitionDelay : `${0.6 + 1.6 * at(wd.from) / n}s` }}>
                                <rect x={X(at(wd.from))} y={pad.t - 6} width={X(at(wd.to)) - X(at(wd.from))} height={h - pad.t - pad.b + 6} />
                                <text className="window-value" x={(X(at(wd.from)) + X(at(wd.to))) / 2} y={pad.t - 14 - (narrow ? (1 - i) * 17 : 0)} textAnchor="middle">{wd.label}</text>
                                {!narrow && <text x={(X(at(wd.from)) + X(at(wd.to))) / 2} y={h - pad.b + 34} textAnchor="middle" className="window-sub">{wd.sub}</text>}
                            </g>
                        ))}
                        <g className={`vault ${drawn ? "is-drawn" : ""}`}>
                            {stacks.map((s, si) => (
                                <path key={s.key} className={`layer is-${s.key} ${on && on !== s.key ? "is-dim" : ""}`} d={path(s.lo, s.hi)} style={{ transitionDelay : `${si * 0.35}s` }}
                                    onPointerEnter={() => setOn(s.key)} onPointerLeave={() => setOn(null)} />
                            ))}
                        </g>
                        {!fcnr && (() => {
                            const yTop = Y(total(n - 1));
                            return (
                                <g className={`mark ${drawn ? "is-shown" : ""}`} style={{ transitionDelay : "1.6s" }}>
                                    <circle className="pulse" cx={X(n - 1)} cy={yTop} r={6} /><circle cx={X(n - 1)} cy={yTop} r={4.5} />
                                    <text x={X(n - 1) + 12} y={yTop + 5}>{usd(total(n - 1))}</text>
                                    <text className="mark-sub" x={X(n - 1) + 12} y={yTop + 21}>{monthShort(NRI_MONTHS[n - 1])}</text>
                                </g>
                            );
                        })()}
                        {fcnr && (
                            <g className={`block-2026 ${drawn ? "is-shown" : ""}`}>
                                <rect className="block-base" x={xb} y={Y(lastF)} width={block} height={Y(0) - Y(lastF)} />
                                <rect className="block-new" x={xb} y={Y(lastF + WINDOW_2026)} width={block} height={Y(lastF) - Y(lastF + WINDOW_2026)} />
                                <text className="block-value" x={narrow ? xb + block / 2 : xb + block + 8} y={narrow ? Y(lastF + WINDOW_2026) - 8 : Y(lastF + WINDOW_2026) + 14} textAnchor={narrow ? "middle" : "start"}>+{usd(WINDOW_2026, narrow ? 1 : 2)}</text>
                                {!narrow && <>
                                    <text className="block-sub" x={xb + block + 8} y={Y(lastF + WINDOW_2026) + 30}>raised 08-06 to</text>
                                    <text className="block-sub" x={xb + block + 8} y={Y(lastF + WINDOW_2026) + 45}>21-08-2026</text>
                                </>}
                                {!narrow && <text className="block-sub" x={xb + block + 8} y={Y(lastF) + 4}>{usd(lastF)}, {monthShort(NRI_MONTHS[n - 1])}</text>}
                                <text className="block-year" x={xb + block / 2} y={h - pad.b + 22} textAnchor="middle">2026</text>
                            </g>
                        )}
                        {years.map(([ m, i ]) => <text key={m} className="axis-year" x={X(i)} y={h - pad.b + 20} textAnchor="middle">{m.slice(0, 4)}</text>)}
                    </svg>
                )}
                {w > 0 && <Pins pins={pins} w={w} shown={drawn} />}
                <Readout tip={tip} w={w} top={pad.t} bottom={h - pad.b} />
            </div>
            <aside className="split-card">
                {children}
                {!fcnr && (
                    <ul className="layer-key">
                        {[ ...LAYERS ].reverse().map(l => (
                            <li key={l.key} className={on === l.key ? "is-on" : ""} onPointerEnter={() => setOn(l.key)} onPointerLeave={() => setOn(null)}>
                                <i className={`sw is-${l.key}`} /><b>{l.full}</b> {usd(NRI[l.key][n - 1])}<span>{l.note}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </aside>
        </div>
    );
};

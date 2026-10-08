"use client";

// The explorer: the nominal and real indices for any of the three baskets DBIE carries on the 2015-16 base, month by
// month, with a crosshair that reads every value. The toggles change which series are drawn; the lines glide to them.

// REACT CORE ==========================================================================================================
import { useMemo, useState } from "react";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LOCAL ===============================================================================================================
import { ChartTip, EASE, Figure } from "./chartKit";
import { Basket, MONTHS, N, SERIES_OF, idx1, monthShort } from "./data";
import { useSize } from "./useSize";

type Show = "both" | "neer" | "reer";
const BASKETS : Basket[] = [ "40t", "40e", "6" ];

export const Explorer = () => {
    const [ basket, setBasket ] = useState<Basket>("40t");
    const [ show, setShow ] = useState<Show>("both");
    const [ hover, setHover ] = useState<number | null>(null);
    const { ref, width } = useSize<HTMLDivElement>();
    const height = width < 600 ? 300 : 380;
    const pad = { l : 40, r : width < 600 ? 56 : 92, t : 12, b : 26 };

    const s = SERIES_OF[basket];
    // One axis for every basket, so switching shows the difference rather than rescaling it away.
    const [ lo, hi ] = useMemo(() => {
        const all = BASKETS.flatMap(b => [ ...SERIES_OF[b].neer, ...SERIES_OF[b].reer ]);
        return [ Math.floor(Math.min(...all) / 10) * 10, Math.ceil(Math.max(...all) / 10) * 10 ];
    }, []);
    const x = (i : number) => pad.l + (width - pad.l - pad.r) * i / (N - 1);
    const y = (v : number) => pad.t + (height - pad.t - pad.b) * (hi - v) / (hi - lo);
    const path = (vals : number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
    const grid = Array.from({ length : (hi - lo) / 20 + 1 }, (_, i) => lo + i * 20);

    const onMove = (e : React.PointerEvent<SVGRectElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        const i = Math.round((e.clientX - r.left) / r.width * (N - 1));
        setHover(Math.max(0, Math.min(N - 1, i)));
    };

    return (
        <Figure
            title="The rupee by basket: nominal and real"
            units="Indices, 2015-16 = 100; a lower index is a weaker rupee. Monthly."
            table={{
                head : [ "Month", "NEER 40 trade", "REER 40 trade", "NEER 40 export", "REER 40 export", "NEER 6", "REER 6" ],
                numeric : [ false, true, true, true, true, true, true ],
                rows : MONTHS.map((m, i) => [ monthShort(m), ...BASKETS.flatMap(b => [ idx1(SERIES_OF[b].neer[i]), idx1(SERIES_OF[b].reer[i]) ]) ]).reverse(),
            }}
            note="Trade weights count India’s exports and imports with each partner; export weights count exports only. The 6-currency basket is the dollar, euro, pound, yen, renminbi and Hong Kong dollar. Source: RBI, indices of NEER and REER, base 2015-16, on DBIE."
        >
            <div className="explorer-controls" role="group" aria-label="Chart options">
                <div className="seg" role="radiogroup" aria-label="Basket">
                    {BASKETS.map(b => (
                        <button key={b} type="button" role="radio" aria-checked={basket === b} className={basket === b ? "is-on" : ""} onClick={() => setBasket(b)}>{SERIES_OF[b].short}</button>
                    ))}
                </div>
                <div className="seg" role="radiogroup" aria-label="Measure">
                    {([ [ "both", "Both" ], [ "neer", "Nominal" ], [ "reer", "Real" ] ] as [ Show, string ][]).map(([ k, l ]) => (
                        <button key={k} type="button" role="radio" aria-checked={show === k} className={show === k ? "is-on" : ""} onClick={() => setShow(k)}>{l}</button>
                    ))}
                </div>
            </div>
            <div ref={ref} className="explorer-wrap" style={{ height }}>
                {width > 0 && (
                    <svg width={width} height={height} role="img" aria-label={`NEER and REER, ${SERIES_OF[basket].label}`}>
                        {grid.map(g => (
                            <g key={g}>
                                <line x1={pad.l} x2={width - pad.r} y1={y(g)} y2={y(g)} className={`grid ${g === 100 ? "is-base" : ""}`} />
                                <text x={pad.l - 8} y={y(g) + 4} textAnchor="end" className="tick">{g}</text>
                            </g>
                        ))}
                        {[ "2005-01", "2010-01", "2015-01", "2020-01", "2025-01" ].map(mo => (
                            <text key={mo} x={x(MONTHS.indexOf(mo))} y={height - 6} textAnchor="middle" className="tick">{mo.slice(0, 4)}</text>
                        ))}
                        <motion.path className="ex-line is-neer" initial={false} animate={{ d : path(s.neer), opacity : show === "reer" ? 0.12 : 1 }} transition={{ duration : 0.7, ease : EASE }} />
                        <motion.path className="ex-line is-reer" initial={false} animate={{ d : path(s.reer), opacity : show === "neer" ? 0.12 : 1 }} transition={{ duration : 0.7, ease : EASE }} />
                        <motion.text className="ex-end is-neer" initial={false} animate={{ y : y(s.neer[N - 1]) + 4, opacity : show === "reer" ? 0.3 : 1 }} x={width - pad.r + 8} transition={{ duration : 0.7, ease : EASE }}>NEER {idx1(s.neer[N - 1])}</motion.text>
                        <motion.text className="ex-end is-reer" initial={false} animate={{ y : y(s.reer[N - 1]) + 4, opacity : show === "neer" ? 0.3 : 1 }} x={width - pad.r + 8} transition={{ duration : 0.7, ease : EASE }}>REER {idx1(s.reer[N - 1])}</motion.text>
                        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={height - pad.b} className="crosshair" />}
                        <rect x={pad.l} y={pad.t} width={width - pad.l - pad.r} height={height - pad.t - pad.b} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
                    </svg>
                )}
                {hover !== null && width > 0 && (
                    <ChartTip x={x(hover)} y={Math.min(y(s.neer[hover]), y(s.reer[hover]))} width={width} head={monthShort(MONTHS[hover])}
                        lines={[ `NEER ${idx1(s.neer[hover])}`, `REER ${idx1(s.reer[hover])}`, SERIES_OF[basket].label ]} />
                )}
            </div>
        </Figure>
    );
};

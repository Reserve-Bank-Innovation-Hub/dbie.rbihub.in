"use client";

// REACT CORE ==========================================================================================================
import { memo, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

// UI ==================================================================================================================
import { Button, Card, Div, Heading4, Text } from "fictoan-react";
import { motion, useReducedMotion } from "framer-motion";

// GEO =================================================================================================================
import { geoContains, geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";

const INDIA_ISO = "IND";

interface CountryProps {
    name : string;
    iso : string;
}

type FC = FeatureCollection<Geometry, CountryProps>;
type Pt = [ number, number ];

// India's headline export categories. Each is pinned to a [lon, lat] inside India (its industry
// heartland) and ships to a representative buyer-country capital `to` — illustrative, not exhaustive,
// but on land and on-screen so the goods land in a country rather than the sea.
interface ExportItem {
    id : string;
    label : string;
    emoji : string;
    lon : number;
    lat : number;
    to : Pt;
}

const EXPORTS : ExportItem[] = [
    {id : "gems", label : "Gems & jewellery", emoji : "💎", lon : 72.9, lat : 21.2, to : [ 54.37, 24.47 ]}, // → Abu Dhabi, UAE
    {id : "textiles", label : "Textiles & garments", emoji : "🧵", lon : 76.5, lat : 12.4, to : [ 32.85, 39.93 ]}, // → Ankara, Türkiye
    {id : "agriculture", label : "Agricultural goods", emoji : "🌾", lon : 78.6, lat : 26.2, to : [ 46.72, 24.69 ]}, // → Riyadh, Saudi Arabia
    {id : "leather", label : "Leather & goods", emoji : "👜", lon : 80.2, lat : 13.6, to : [ 23.73, 37.98 ]}, // → Athens, Greece
    {id : "marine", label : "Marine products", emoji : "🦐", lon : 81.6, lat : 16.4, to : [ 139.69, 35.69 ]}, // → Tokyo, Japan
    {id : "minerals", label : "Iron ore & minerals", emoji : "⛏️", lon : 85.6, lat : 22.3, to : [ 116.41, 39.90 ]}, // → Beijing, China
    {id : "handicrafts", label : "Handicrafts & goods", emoji : "🏺", lon : 74.6, lat : 26.9, to : [ 31.24, 30.04 ]}, // → Cairo, Egypt
];

// Where the U-turning earnings flee to — the creditors India was borrowing from (IMF/World Bank to
// the west, Japan and other bilateral lenders to the east). Off-frame on purpose: money leaving.
const CREDITORS : Pt[] = [ [ -12, 38 ], [ 142, 37 ], [ 9, 52 ] ];

// Central point inside India where retained earnings settle — the earnings bar lives here too, so the
// kept dollars visibly land in the bar as it fills.
const INDIA_TARGET : Pt = [ 80.5, 21.5 ];
// Well south of Kanyakumari, out in the ocean — far enough that the taller card clears the tip.
const BUTTON_POINT : Pt = [ 77.5, -2.5 ];

// Per-year scenario values. `uturnShare` is the debt-service ratio — the share of export earnings that
// goes straight back out to creditors: ~35% in 1991, down to ~6% by 2025.
interface YearConfig {
    year : string;
    uturnShare : number;
}

const YEARS : YearConfig[] = [
    {year : "1991", uturnShare : 0.35},
    {year : "2025", uturnShare : 0.06},
];

// Animation tunables ----------------------------------------------------------------------------------
const GOODS_DUR = 3;                  // s — goods lifting off India and landing at their buyers
const DOLLAR_START = GOODS_DUR * 0.8;    // s — a dollar appears as its good lands (overlap = payment)
const RETURN_DUR = 3;                  // s — dollars travelling back to India's border
const HOVER_DUR = 3;                  // s — U-turn dollars fluttering (hesitating) at the border
const FLEE_DUR = 5;                  // s — U-turn dollars fleeing around India to their creditors
const ENTER_DUR = 1.4;                // s — retained dollars crossing the border into India
const CORRIDOR_LAT = 39;                 // ° — flight lane north of India's tip (over the Himalayas)
const FILL_TARGET = 30;                 // reserve dollars needed to fill the gauge
const IMPORT_BASELINE = 0.5;            // share of gross earnings that essential imports eat first; debt
                                        // service competes with reserves for the thin slice on top
const JITTER_PX = 48;                 // px — per-dollar fan-out so stacked particles don't overlap
const WAVE_PAD_MS = 200;                // ms — small settle time after the last particle finishes

// One flying particle — a good (emoji) or a dollar (💵), following an explicit pixel waypoint path.
// The outer span runs the trajectory (translate + scale); the inner span adds a flutter (rotate) at
// the border. Visibility is scale-only — no opacity.
interface Particle {
    key : string;
    kind : "good" | "reserves" | "import" | "uturn";   // reserves fill the gauge; imports/debt do not
    label : string;
    pts : Pt[];        // absolute pixel waypoints
    scales : number[];    // scale at each waypoint (same length as pts)
    segDurs : number[];    // seconds per segment (length pts.length - 1)
    delay : number;      // start delay, seconds
    retained : boolean;     // true → credits the bar on arrival
    flutter? : { start : number; duration : number }; // shake window, seconds after the particle starts
}

const FlowParticle = memo(({p, onRetained} : { p : Particle; onRetained : () => void }) => {
    const from = p.pts[0];
    const xs = p.pts.map((pt) => pt[0] - from[0]);
    const ys = p.pts.map((pt) => pt[1] - from[1]);
    const duration = p.segDurs.reduce((a, b) => a + b, 0);

    const times : number[] = [ 0 ];
    let acc = 0;
    p.segDurs.forEach((d) => {
        acc += d;
        times.push(acc / duration);
    });

    return (
        <span className="flow-anchor" style={{left : from[0], top : from[1]}}>
            <motion.span
                className={`flow-trajectory ${p.kind}`}
                initial={{x : 0, y : 0, scale : p.scales[0]}}
                animate={{x : xs, y : ys, scale : p.scales}}
                transition={{duration, times, delay : p.delay, ease : "easeInOut"}}
                onAnimationComplete={() => {
                    if (p.retained) onRetained();
                }}
            >
                <motion.span
                    className="flow-particle"
                    title={p.label}
                    initial={{rotate : 0, x : 0, y : 0}}
                    animate={p.flutter ? {
                        rotate : [ 0, -22, 19, -17, 14, -11, 8, -6, 3, 0 ],
                        x      : [ 0, -7, 8, -6, 6, -4, 4, -2, 1, 0 ],
                        y      : [ 0, 6, -7, 5, -5, 4, -3, 2, -1, 0 ],
                    } : {rotate : 0, x : 0, y : 0}}
                    transition={p.flutter
                        ? {delay : p.delay + p.flutter.start, duration : p.flutter.duration, ease : "linear"}
                        : {duration : 0}}
                >
                    {p.kind === "good" ? p.label : "💵"}
                </motion.span>

                {/* Dollars carry a tag so it's clear which are kept vs paid back out. The debt-repayment
                 tag reveals only when the dollar starts fluttering at the border. */}
                {p.kind !== "good" && (
                    <motion.span
                        className={`flow-label ${p.kind}`}
                        initial={{opacity : p.flutter ? 0 : 1}}
                        animate={{opacity : 1}}
                        transition={p.flutter
                            ? {delay : p.delay + p.flutter.start, duration : 0.3}
                            : {duration : 0}}
                    >
                        {p.kind === "reserves" ? "Reserves" : p.kind === "import" ? "Imports" : "Debt repayment"}
                    </motion.span>
                )}
            </motion.span>
        </span>
    );
});
FlowParticle.displayName = "FlowParticle";

interface Geo {
    sources : (ExportItem & {
        x : number; y : number;     // India origin — a good launches here
        bx : number; by : number;   // buyer — the good lands, a dollar is born
        vx : number; vy : number;   // hover point, just outside the border
        flee : Pt[][];              // per creditor: pixel waypoints hover → creditor, routed around India
    })[];
    creditors : Pt[];
    target : Pt;
    barXY : Pt;     // pixel anchor for the earnings label (inside India)
    buttonXY : Pt;     // pixel anchor for the Sell-goods button (below Kanyakumari)
    indiaTop : number; // top (north) pixel of India's bounds — the fill rises to here at 100%
    indiaBottom : number; // bottom (south) pixel — the fill starts here at 0%
}

// Walk the line from a buyer toward India's interior, find the border crossing, then back off a fixed
// margin into foreign airspace — that's where a U-turning dollar hovers, clearly OUTSIDE India.
const BORDER_MARGIN_DEG = 2.4; // ~260km beyond the border, along the buyer's direction

const borderApproach = (buyer : Pt, indiaFeature : Feature<Geometry, CountryProps>) : Pt => {
    const N = 64;
    let crossing : Pt = buyer;
    for (let i = 1; i <= N; i++) {
        const t = i / N;
        const p : Pt = [
            buyer[0] + (INDIA_TARGET[0] - buyer[0]) * t,
            buyer[1] + (INDIA_TARGET[1] - buyer[1]) * t,
        ];
        if (geoContains(indiaFeature as never, p)) break;
        crossing = p;
    }
    // Nudge outward (away from India, toward the buyer) so the hover point sits beyond the border.
    const dx = buyer[0] - INDIA_TARGET[0];
    const dy = buyer[1] - INDIA_TARGET[1];
    const len = Math.hypot(dx, dy) || 1;
    return [ crossing[0] + (dx / len) * BORDER_MARGIN_DEG, crossing[1] + (dy / len) * BORDER_MARGIN_DEG ];
};

// Does the straight line a→b pass through India? Sample it and test in lon/lat space.
const crossesIndia = (a : Pt, b : Pt, indiaFeature : Feature<Geometry, CountryProps>) : boolean => {
    const N = 40;
    for (let i = 1; i < N; i++) {
        const t = i / N;
        if (geoContains(indiaFeature as never, [ a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t ])) return true;
    }
    return false;
};

// Route a fleeing dollar from its hover point to a creditor WITHOUT crossing India. If the direct line
// would cut through the country, detour up into a corridor north of India's tip (over the Himalayas):
// e.g. Middle-East border → north over Tibet → Japan, never entering Indian airspace.
const routeAround = (hover : Pt, creditor : Pt, indiaFeature : Feature<Geometry, CountryProps>) : Pt[] => {
    if (!crossesIndia(hover, creditor, indiaFeature)) return [ creditor ];
    return [ [ hover[0], CORRIDOR_LAT ], [ creditor[0], CORRIDOR_LAT ], creditor ];
};

// Build the particle list for one wave: goods out, then `uturnShare` U-turn / the rest retained.
const buildWave = (geo : Geo, uturnShare : number) : Particle[] => {
    const out : Particle[] = [];

    geo.sources.forEach((s, i) => {
        out.push({
            key     : `g${i}`, kind : "good", label : s.emoji, retained : false,
            pts     : [ [ s.x, s.y ], [ s.bx, s.by ], [ s.bx, s.by ] ],   // launch → land → hold (shrink)
            scales  : [ 1, 1.4, 0 ],
            segDurs : [ GOODS_DUR * 0.8, GOODS_DUR * 0.2 ],
            delay   : i * 0.05,
        });
    });

    let gi = 0;
    geo.sources.forEach((s) => {
        const n = Math.random() < 0.5 ? 2 : 3;            // 2–3 dollars per landing → ~18–21 total
        for (let k = 0; k < n; k++) {
            const delay = DOLLAR_START + gi * 0.04;        // born as the good lands → overlaps payment
            const buyer : Pt = [ s.bx, s.by ];             // born here, overlapping the landed good
            const r = Math.random();                       // one draw splits the dollar three ways

            if (r < uturnShare) {
                // DEBT REPAYMENT — fan out, then flee around India to a creditor.
                const jx = (Math.random() - 0.5) * JITTER_PX;
                const jy = (Math.random() - 0.5) * JITTER_PX;
                const J = (pt : Pt) : Pt => [ pt[0] + jx, pt[1] + jy ];
                const hover : Pt = J([ s.vx, s.vy ]);
                const route = s.flee[Math.floor(Math.random() * s.flee.length)].map(J);
                const R = route.length;
                out.push({
                    key : `d${gi}`, kind : "uturn", label : "💵", retained : false,
                    // buyer → border → (flutter hold) → routed around India → creditor
                    pts     : [ buyer, hover, hover, ...route ],
                    scales  : [ 0, 1.1, 1.1, ...route.map((_, j) => (j === R - 1 ? 0 : 1.1)) ],
                    segDurs : [ RETURN_DUR, HOVER_DUR, ...Array(R).fill(FLEE_DUR / R) ],
                    delay,
                    flutter : {start : RETURN_DUR, duration : HOVER_DUR},
                });
            } else {
                // HOME-BOUND — essential imports (consumed) or reserves (the surplus that fills the gauge).
                // Same path home; only reserves credit the bar. Spread the return leg so the incoming
                // cash fans out across India instead of piling onto one point. No flutter.
                const isReserves = r >= uturnShare + IMPORT_BASELINE;
                const jx = (Math.random() - 0.5) * JITTER_PX;
                const jy = (Math.random() - 0.5) * JITTER_PX;
                const hover  : Pt = [ s.vx + jx, s.vy + jy ];
                const target : Pt = [ geo.target[0] + jx, geo.target[1] + jy ];
                out.push({
                    key : `d${gi}`, kind : isReserves ? "reserves" : "import", label : "💵", retained : isReserves,
                    // buyer → border → into India
                    pts     : [ buyer, hover, target ],
                    scales  : [ 0, 1.1, 0 ],
                    segDurs : [ RETURN_DUR, ENTER_DUR ],
                    delay,
                });
            }
            gi++;
        }
    });

    return out;
};

// Total wall-clock of a wave = the latest particle's end (delay + all its segments).
const waveDurationMs = (particles : Particle[]) : number =>
    Math.max(...particles.map((p) => p.delay + p.segDurs.reduce((a, b) => a + b, 0))) * 1000 + WAVE_PAD_MS;

// A wave just renders its (pre-built) particles.
const Wave = ({particles, onRetained} : { particles : Particle[]; onRetained : () => void }) => (
    <>
        {particles.map((p) => <FlowParticle key={p.key} p={p} onRetained={onRetained} />)}
    </>
);

interface IndiaMapProps {
    year        : string;
    uturnShare  : number;
    india       : FC | null;
    neighbours  : FC | null;
    trigger     : number;   // launch a wave whenever this increments (0 = idle)
    resetSignal : number;   // empty the gauge whenever this increments (0 = idle)
}

// One year-locked map: India is a gauge that fills with retained earnings, and it runs a wave each time
// `trigger` increments. The geojson is passed in so both halves parse it just once.
const IndiaMap = ({ year, uturnShare, india, neighbours, trigger, resetSignal } : IndiaMapProps) => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [ size, setSize ] = useState({ w : 0, h : 0 });
    const prefersReduced = useReducedMotion();
    const clipId = `india-fill-${year}`;   // unique per map so the two clips don't collide

    const [ waves, setWaves ] = useState<{ id : number; particles : Particle[] }[]>([]);
    const [ barFill, setBarFill ] = useState(0);
    const nextWaveId = useRef(0);
    const timeouts = useRef<number[]>([]);

    // Measure the half-width container so the projection works in real pixel space.
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([ entry ]) => {
            const { width, height } = entry.contentRect;
            setSize({ w : width, h : height });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Clear any pending wave-cleanup timers on unmount.
    useEffect(() => () => { timeouts.current.forEach((t) => window.clearTimeout(t)); }, []);

    const { w, h } = size;

    // Fit the projection to India's official bounds with generous padding, so India sits centred and
    // its neighbours fill in around the edges. Mercator keeps familiar country shapes.
    const {indiaPaths, neighbourPaths, geo} = useMemo(() => {
        const empty = {
            indiaPaths     : [] as string[],
            neighbourPaths : [] as { d : string; iso : string; name : string }[],
            geo            : {
                sources  : [], creditors : [], target : [ 0, 0 ], barXY : [ 0, 0 ], buttonXY : [ 0, 0 ],
                indiaTop : 0, indiaBottom : 0,
            } as Geo,
        };
        if (!india || !w || !h) return empty;

        const indiaFeature = india.features[0];
        if (!indiaFeature) return empty;

        // Fit tightly to India, then zoom out about the frame centre so the surrounding countries
        // come into view while India stays centred. ZOOM < 1 = more context, smaller India.
        const ZOOM = 0.6;
        const pad = Math.min(w, h) * 0.14;
        const projection = geoMercator().fitExtent(
            [ [ pad, pad ], [ w - pad, h - pad ] ],
            indiaFeature as Feature<Geometry, CountryProps>,
        );
        const cx = w / 2, cy = h / 2;
        const [ tx, ty ] = projection.translate();
        projection
            .scale(projection.scale() * ZOOM)
            .translate([ cx + (tx - cx) * ZOOM, cy + (ty - cy) * ZOOM ]);
        const path = geoPath(projection);
        const px = (lonlat : Pt) : Pt => (projection(lonlat) ?? [ 0, 0 ]) as Pt;
        const [ [ , bTop ], [ , bBottom ] ] = path.bounds(indiaFeature as Feature<Geometry, CountryProps>);

        return {
            indiaPaths     : india.features.map((f) => path(f) ?? "").filter(Boolean),
            neighbourPaths : (neighbours?.features ?? [])
                .map((f) => ({d : path(f) ?? "", iso : f.properties.iso, name : f.properties.name}))
                .filter((p) => p.d),
            geo            : {
                sources     : EXPORTS.map((e) => {
                    const feature = indiaFeature as Feature<Geometry, CountryProps>;
                    const [ x, y ] = px([ e.lon, e.lat ]);
                    const [ bx, by ] = px(e.to);
                    const hover = borderApproach(e.to, feature);
                    const [ vx, vy ] = px(hover);
                    const flee = CREDITORS.map((c) => routeAround(hover, c, feature).map(px));
                    return {...e, x, y, bx, by, vx, vy, flee};
                }),
                creditors   : CREDITORS.map(px),
                target      : px(INDIA_TARGET),
                barXY       : px(INDIA_TARGET),
                buttonXY    : px(BUTTON_POINT),
                indiaTop    : bTop,
                indiaBottom : bBottom,
            },
        };
    }, [ india, neighbours, w, h ]);

    const addRetained = useCallback(() => setBarFill((f) => Math.min(1, f + 1 / FILL_TARGET)), []);

    // Launch a wave whenever the parent bumps `trigger` (skip the initial 0). The button lock lives in
    // the parent, so this just builds, runs and cleans up the wave.
    useEffect(() => {
        if (trigger === 0 || !geo.sources.length) return;

        if (prefersReduced) {
            const retained = Math.round(EXPORTS.length * 2.5 * (1 - uturnShare));
            setBarFill((f) => Math.min(1, f + retained / FILL_TARGET));
            return;
        }

        const id = nextWaveId.current++;
        const particles = buildWave(geo, uturnShare);
        setWaves((ws) => [ ...ws, { id, particles } ]);
        const t = window.setTimeout(() => {
            setWaves((ws) => ws.filter((x) => x.id !== id));
        }, waveDurationMs(particles));
        timeouts.current.push(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ trigger ]);

    // Empty the gauge and stop any in-flight wave when the parent asks (skip the initial 0).
    useEffect(() => {
        if (resetSignal === 0) return;
        setBarFill(0);
        setWaves([]);
        timeouts.current.forEach((t) => window.clearTimeout(t));
        timeouts.current = [];
    }, [ resetSignal ]);

    const pct = Math.round(barFill * 100);
    // The fill level rises from India's southern bound (0%) toward its northern bound (100%).
    const fillLevel = geo.indiaBottom - barFill * (geo.indiaBottom - geo.indiaTop);

    return (
        <Div className="india-map-wrap" ref={wrapRef}>
            <Div className="year-label">
                <Heading4>{year}</Heading4>
                <Text className="year-pct" fontStyle="monospace">{pct}% reserves</Text>
            </Div>

            <svg
                className="india-map"
                width="100%" height="100%"
                viewBox={`0 0 ${w || 1} ${h || 1}`}
                role="img"
                aria-label={`India's external earnings in ${year}, filling as earnings are kept at home`}
            >
                {/* Neighbours — faint context, drawn first so India's opaque fill clips them */}
                <g className="neighbours">
                    {neighbourPaths.map((p, i) => (
                        // Key by index — Natural Earth reuses "-99" as the ISO for several countries
                        <path key={`nbr-${i}`} className="country" d={p.d}>
                            <title>{p.name}</title>
                        </path>
                    ))}
                </g>

                {/* India is the gauge: a saturated fill copy, clipped to a level that rises with earnings */}
                <defs>
                    <clipPath id={clipId}>
                        <motion.rect
                            x={0} width={w || 1}
                            initial={false}
                            animate={{y : fillLevel, height : Math.max(0, geo.indiaBottom - fillLevel)}}
                            transition={{duration : 0.5, ease : "easeOut"}}
                        />
                    </clipPath>
                </defs>

                <g className="india">
                    {/* Base — light India */}
                    {indiaPaths.map((d, i) => (
                        <path key={i} className="country is-india" d={d}>
                            <title>India</title>
                        </path>
                    ))}
                    {/* Fill — saturated India, revealed from the bottom up */}
                    <g clipPath={`url(#${clipId})`}>
                        {indiaPaths.map((d, i) => (
                            <path key={`fill-${i}`} className="country is-india-fill" d={d} />
                        ))}
                    </g>
                </g>
            </svg>

            {/* Static export markers — the catalogue of goods sitting on India */}
            {geo.sources.map((m) => (
                <span
                    key={m.id}
                    className="export-marker"
                    data-export={m.id}
                    title={m.label}
                    style={{left : m.x, top : m.y}}
                >
                    {m.emoji}
                </span>
            ))}

            {/* In-flight wave — cleans itself up the instant its last particle lands */}
            {waves.map((wv) => <Wave key={wv.id} particles={wv.particles} onRetained={addRetained} />)}
        </Div>
    );
};

// Longest a wave can run — used to lock the single button while both halves animate in parallel.
const MAX_WAVE_MS = (DOLLAR_START + 21 * 0.04 + RETURN_DUR + HOVER_DUR + FLEE_DUR + 0.4) * 1000;

// The DSR comparison: 1991 on the left, 2025 on the right, one button driving both waves in parallel so
// the contrast is stark — 2025's India floods (only ~6% leaks) while 1991's crawls (~35% leaks).
export const DSRComparison = () => {
    const [ india, setIndia ] = useState<FC | null>(null);
    const [ neighbours, setNeighbours ] = useState<FC | null>(null);
    const [ trigger, setTrigger ] = useState(0);
    const [ resetSignal, setResetSignal ] = useState(0);
    const [ locked, setLocked ] = useState(false);
    const [ showReset, setShowReset ] = useState(false);

    // Fetch the geojson once and share it with both halves.
    useEffect(() => {
        let alive = true;
        Promise.all([
            fetch("/stories/debt-to-service-ratio/india-soi.geojson").then((r) => r.json()),
            fetch("/stories/debt-to-service-ratio/world-countries.geojson").then((r) => r.json()),
        ])
            .then(([ ind, nbr ] : [ FC, FC ]) => {
                if (!alive) return;
                setIndia(ind);
                // Drop Natural Earth's own India outline — the SOI layer is the authority.
                setNeighbours({ ...nbr, features : nbr.features.filter((f) => f.properties.iso !== INDIA_ISO) });
            })
            .catch(() => {});
        return () => { alive = false; };
    }, []);

    const sellGoods = useCallback(() => {
        if (locked || !india) return;
        setTrigger((t) => t + 1);              // both maps watch this and fire a wave
        setLocked(true);
        window.setTimeout(() => setLocked(false), MAX_WAVE_MS);
    }, [ locked, india ]);

    const resetAll = useCallback(() => {
        setResetSignal((s) => s + 1);          // both maps empty their gauge and drop in-flight waves
        setLocked(false);                      // re-enable selling immediately
    }, []);

    // Reveal the reset control only while the cursor is in the bottom half of the section.
    const onMove = (e : MouseEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        setShowReset(e.clientY - r.top > r.height * 0.5);
    };

    return (
        <Div className="dsr-split" onMouseMove={onMove} onMouseLeave={() => setShowReset(false)}>
            <Div className="dsr-title">
                <Heading4 className="map-title">
                    Debt repayment vs earnings
                </Heading4>

                <Text isSubtext size="small">
                    How much was sent back to creditors vs used productively to build our reserves
                </Text>
            </Div>

            <Div className="dsr-maps">
                <IndiaMap
                    year={YEARS[0].year}
                    uturnShare={YEARS[0].uturnShare}
                    india={india}
                    neighbours={neighbours}
                    trigger={trigger}
                    resetSignal={resetSignal}
                />

                <IndiaMap
                    year={YEARS[1].year}
                    uturnShare={YEARS[1].uturnShare}
                    india={india}
                    neighbours={neighbours}
                    trigger={trigger}
                    resetSignal={resetSignal}
                />
            </Div>

            <Div className="dsr-controls">
                <Card
                    className="dsr-card"
                    shadow="soft" shape="rounded"
                >
                    <Text className="earnings-title">
                        Sell India&rsquo;s exports and watch where each dollar goes.
                    </Text>

                    <Div className="dsr-legend">
                        <span className="legend-row"><span className="legend-dot reserves" />Reserves — builds the gauge</span>
                        <span className="legend-row"><span className="legend-dot import" />Imports — essential, consumed</span>
                        <span className="legend-row"><span className="legend-dot uturn" />Debt repayment — sent back to creditors</span>
                    </Div>

                    <Button
                        className="sell-button"
                        kind="primary" size="small" isFullWidth
                        onClick={sellGoods}
                        disabled={locked}
                    >
                        Simulate exports
                    </Button>
                </Card>

                <Text
                    className={`reset-link ${showReset ? "is-visible" : ""}`}
                    role="button" tabIndex={0}
                    onClick={resetAll}
                    textColour="red" isClickable size="tiny" weight="600"
                >
                    RESET
                </Text>
            </Div>
        </Div>
    );
};

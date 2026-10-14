"use client";

// Where money sent home comes from and where it lands, for each round of the RBI's remittances survey (2016-17, 2020-21,
// 2023-24), picked with a slider under the header (the latest round to start with; it never moves on its own).
//
// A flat world map (Natural Earth projection, oceans, graticule), the countries from Natural Earth's file and India as
// the Survey of India draws it. First the world: a curved flow from each source country's capital into New Delhi, as
// wide as its share, dashes running along it into India; source countries tinted by share (the Gulf in turmeric, the
// rest in neem). A moment later the map zooms in towards India and hands over to India alone, upright in its own
// projection and drawn state by state from the Survey of India's state
// boundaries, the states the survey names tinted by their share, each tied by a leader line to a card with its share
// (north to south; on a phone the cards sit below the map, without the lines).
// The two views can be switched at any time. The survey gives countries and states separately, never who sends to
// which state, so the flows end at India and the states are a second view, not a continuation of the flows.

// REACT CORE ==========================================================================================================
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";

// GEO =================================================================================================================
import { geoCentroid, geoConicConformal, geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";

// DATA ================================================================================================================
import { SURVEY } from "./data.gen";
import { Layout, reducedMotion, splitClass, useStage } from "./stage";

const DELHI : [ number, number ] = [ 77.21, 28.61 ];
// each source country: its ISO code in the map file and its capital as [lon, lat]
const PLACE : Record<string, { iso : string; at : [ number, number ] }> = {
    "US" : { iso : "USA", at : [ -77.04, 38.90 ] }, "UAE" : { iso : "ARE", at : [ 54.38, 24.45 ] }, "UK" : { iso : "GBR", at : [ -0.13, 51.51 ] },
    "Saudi Arabia" : { iso : "SAU", at : [ 46.68, 24.71 ] }, "Singapore" : { iso : "SGP", at : [ 103.82, 1.35 ] }, "Qatar" : { iso : "QAT", at : [ 51.53, 25.29 ] },
    "Kuwait" : { iso : "KWT", at : [ 47.99, 29.38 ] }, "Canada" : { iso : "CAN", at : [ -75.70, 45.42 ] }, "Oman" : { iso : "OMN", at : [ 58.41, 23.59 ] },
    "Australia" : { iso : "AUS", at : [ 149.13, -35.28 ] }, "Bahrain" : { iso : "BHR", at : [ 50.58, 26.22 ] },
};

type Props = { name : string; iso? : string };
interface Geo { world : Feature<Geometry, Props>[]; states : Feature<Geometry, Props>[] }
let geoPromise : Promise<Geo> | null = null;
const loadGeo = () => geoPromise ??= (async () => {
    const get = (u : string) => fetch(u).then(r => r.json() as Promise<FeatureCollection<Geometry, Props>>);
    const [ world, states ] = await Promise.all([ get("/stories/rupee-and-world/world-countries.geojson"), get("/stories/money-in-money-out/india-states-soi.geojson") ]);
    return { world : world.features.filter(f => f.properties.iso !== "IND"), states : states.features };
})();

type View = "world" | "india";

export const LandingStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const { ref, size, drawn } = useStage<HTMLDivElement>();
    const [ geo, setGeo ] = useState<Geo | null>(null);
    const [ round, setRound ] = useState(SURVEY.rounds.length - 1);
    const [ view, setView ] = useState<View>("world");
    const [ touched, setTouched ] = useState(false);
    useEffect(() => { loadGeo().then(setGeo); }, []);
    // the world first; once the flows have run a moment, the map zooms into India (unless the reader has chosen a view)
    useEffect(() => {
        if (!drawn || touched) return;
        const id = window.setTimeout(() => setView("india"), reducedMotion() ? 0 : 4200);
        return () => clearTimeout(id);
    }, [ drawn, touched ]);
    const { w, h } = size;
    const narrow = w < 560;

    const proj = useMemo(() => {
        const p = geoNaturalEarth1();
        if (w && h) p.fitExtent([ [ 8, 8 ], [ w - 8, h - 8 ] ], { type : "Sphere" });
        return p;
    }, [ w, h ]);
    const path = useMemo(() => geoPath(proj), [ proj ]);

    // the zoom into India: the scale and shift that fit India's states into the left part of the stage (the cards take
    // the right), or the top on a phone
    const zoom = useMemo(() => {
        if (!geo || !w) return { k : 1, x : 0, y : 0 };
        const [ [ x0, y0 ], [ x1, y1 ] ] = path.bounds({ type : "FeatureCollection", features : geo.states } as FeatureCollection);
        const box = narrow ? { l : 10, t : 10, r : w - 10, b : h * 0.56 } : { l : 20, t : 16, r : w * 0.58, b : h - 16 };
        const k = Math.min((box.r - box.l) / (x1 - x0), (box.b - box.t) / (y1 - y0));
        return { k, x : box.l + ((box.r - box.l) - (x1 - x0) * k) / 2 - x0 * k, y : box.t + ((box.b - box.t) - (y1 - y0) * k) / 2 - y0 * k };
    }, [ geo, path, w, h, narrow ]);
    const inIndia = view === "india";
    // India seen straight on: at the end of the move India is drawn in its own projection, the Lambert conformal conic the Survey of India uses for the country (standard parallels 12°28′ N and
    // 35°10′ N, centred on 80° E), so it stands upright as on an official map rather than leaning as it does at the edge
    // of a world projection
    const indiaProj = useMemo(() => {
        const p = geoConicConformal().parallels([ 12.47, 35.17 ]).rotate([ -80, 0 ]);
        if (geo && w && h) {
            const box = narrow ? [ [ 10, 10 ], [ w - 10, h * 0.56 ] ] : [ [ 20, 16 ], [ w * 0.58, h - 16 ] ];
            p.fitExtent(box as [ [ number, number ], [ number, number ] ], { type : "FeatureCollection", features : geo.states } as FeatureCollection);
        }
        return p;
    }, [ geo, w, h, narrow ]);

    // The move between the two views, as one continuous motion driven by u (0 the world, 1 India upright): for the first
    // half the world map zooms towards India; for the second India's own outline bends from its shape on the world map into
    // the upright projection, every boundary point travelling from where the zoomed world map puts it to where the
    // Survey of India projection puts it, while the world around it fades. Back to the world runs it in reverse.
    //
    // It runs outside React, so a frame costs only what changes: the world map is its own <svg>, drawn once and moved
    // by a CSS transform (which the browser scales on the graphics card); India's states are projected both ways once,
    // up front, and each frame only blends the two sets of points into their paths. React hears only when the motion
    // crosses a stage (the world, the zoom, the states, settled), which is what the labels, key and cards depend on.
    const worldRef = useRef<SVGSVGElement>(null);
    const stateRefs = useRef<(SVGPathElement | null)[]>([]);
    const uRef = useRef(0);
    const [ stage, setStage ] = useState(0);              // 0 the world, 1 zooming, 2 the states, 3 settled
    const shapes = useMemo(() => {
        if (!geo || !w) return [];
        return geo.states.map(f => {
            const polys = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : f.geometry.type === "Polygon" ? [ f.geometry.coordinates ] : [];
            return polys.flatMap(poly => poly.map(ring => {
                const a = new Float32Array(ring.length * 2), b = new Float32Array(ring.length * 2);
                ring.forEach(([ lon, la ], k) => {
                    const pa = proj([ lon, la ]) ?? [ 0, 0 ], pb = indiaProj([ lon, la ]) ?? [ 0, 0 ];
                    a[k * 2] = pa[0]; a[k * 2 + 1] = pa[1]; b[k * 2] = pb[0]; b[k * 2 + 1] = pb[1];
                });
                return { a, b };
            }));
        });
    }, [ geo, w, proj, indiaProj ]);
    const ease = (t : number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const paint = (u : number) => {
        const zt = ease(Math.min(1, u / 0.5)), mt = ease(Math.max(0, (u - 0.5) / 0.5));
        const kz = Math.pow(zoom.k, zt), same = Math.abs(zoom.k - 1) < 1e-6;
        const xz = same ? 0 : zoom.x * (1 - kz) / (1 - zoom.k), yz = same ? 0 : zoom.y * (1 - kz) / (1 - zoom.k);
        const wsvg = worldRef.current;
        if (wsvg) { wsvg.style.transform = `translate(${xz}px, ${yz}px) scale(${kz})`; wsvg.style.opacity = String(1 - mt); }
        shapes.forEach((rings, i) => {
            const el = stateRefs.current[i];
            if (!el) return;
            let d = "";
            for (const { a, b } of rings) {
                for (let k = 0; k < a.length; k += 2) {
                    const ax = a[k] * kz + xz, ay = a[k + 1] * kz + yz;
                    d += (k ? "L" : "M") + (ax + (b[k] - ax) * mt).toFixed(1) + "," + (ay + (b[k + 1] - ay) * mt).toFixed(1);
                }
                d += "Z";
            }
            el.setAttribute("d", d);
        });
        const next = u <= 0 ? 0 : u >= 1 ? 3 : u > 0.48 ? 2 : 1;
        setStage(st => st === next ? st : next);
    };
    // repaint at the current point whenever the shapes change (a resize, the map arriving)
    useEffect(() => { paint(uRef.current); });                                  // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        const to = inIndia ? 1 : 0;
        if (reducedMotion()) { uRef.current = to; paint(to); return; }
        let raf = 0, last = performance.now();
        const tick = (now : number) => {
            const dt = (now - last) / 1000; last = now;
            const v = uRef.current, n = to > v ? Math.min(to, v + dt / 3.4) : Math.max(to, v - dt / 1.6);
            uRef.current = n; paint(n);
            if (n !== to) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [ inIndia, shapes ]);                                                    // eslint-disable-line react-hooks/exhaustive-deps
    const settled = stage === 3, atWorld = stage === 0, showStates = stage >= 2;

    // the round's figures
    const countries = SURVEY.countries.filter(c => PLACE[c.short]).map(c => ({ ...c, v : c.shares[round] }));
    const otherCountries = +(100 - SURVEY.countries.reduce((a, c) => a + (c.shares[round] ?? 0), 0)).toFixed(1);
    const states = SURVEY.states.map(s => ({ name : s.name, v : s.shares[round] }));
    const otherStates = +(100 - states.reduce((a, s) => a + (s.v ?? 0), 0)).toFixed(1);
    const shareOf = new Map(states.map(s => [ s.name, s.v ]));
    const isoShare = new Map(countries.map(c => [ PLACE[c.short].iso, c ]));

    // the flows: a curve from each capital into Delhi, bowed upward, as wide as the share
    const flows = countries.filter(c => (c.v ?? 0) > 0).map(c => {
        const [ ax, ay ] = proj(PLACE[c.short].at) ?? [ 0, 0 ], [ bx, by ] = proj(DELHI) ?? [ 0, 0 ];
        const mx = (ax + bx) / 2, my = (ay + by) / 2, dist = Math.hypot(bx - ax, by - ay);
        return { c, d : `M${ax},${ay} Q${mx},${my - dist * 0.32} ${bx},${by}`, ax, ay, width : 1 + (c.v as number) * 0.32 };
    });

    // the state cards: one for each state the survey names, then the rest, stacked on the right (below on a phone);
    // each card's leader line runs from its state's centre
    // north to south, so the leader lines do not cross; the rest last
    const lat = (name : string) => { const f = geo?.states.find(s => s.properties.name === name); return f ? geoCentroid(f)[1] : 0; };
    const cards = [ ...states.slice().sort((a, b) => lat(b.name) - lat(a.name)), { name : "Other states", v : otherStates as number | null } ];
    const cardBox = narrow
        ? { x : 10, y : h * 0.58, w : (w - 30) / 2, h : 50 }
        : { x : w * 0.64, y : h * 0.1, w : w * 0.34, h : Math.min(64, (h * 0.8) / cards.length - 8) };
    const cardAt = (i : number) => narrow
        ? { x : cardBox.x + (i % 2) * (cardBox.w + 10), y : cardBox.y + Math.floor(i / 2) * (cardBox.h + 8) }
        : { x : cardBox.x, y : cardBox.y + i * (cardBox.h + 8) };
    const centreOf = (name : string) => {
        const f = geo?.states.find(s => s.properties.name === name);
        if (!f) return null;
        return indiaProj(geoCentroid(f));
    };
    const max = Math.max(...cards.map(c => c.v ?? 0));
    const TOP_COUNTRY = Math.max(...SURVEY.countries.flatMap(c => c.shares.filter((v) : v is number => v !== null)));

    // the world map: drawn once for a size and a round, then only moved; the flows fade as the zoom begins
    const worldMap = useMemo(() => !geo || !w ? null : (
        <svg ref={worldRef} className="world-layer" width={w} height={h} aria-hidden="true">
            <path className="ocean" d={path({ type : "Sphere" }) ?? ""} />
            <path className="graticule" d={path(geoGraticule10()) ?? ""} />
            {geo.world.map((f, i) => {
                const c = isoShare.get(f.properties.iso ?? ""), v = c?.v ?? 0;
                return <path key={i} className="land" d={path(f) ?? ""}
                    style={c && v > 0 ? { fill : `color-mix(in srgb, var(${c.gcc ? "--gulf" : "--in"}) ${Math.round(25 + Math.min(1, v / TOP_COUNTRY) * 75)}%, var(--land))` } : undefined} />;
            })}
            <g className="flows">
                {flows.map(f => (
                    <g key={f.c.short} className={`flow ${f.c.gcc ? "is-gulf" : ""}`}>
                        <path className="flow-line" d={f.d} style={{ strokeWidth : f.width }} />
                        <path className="flow-run" d={f.d} style={{ strokeWidth : Math.max(1.5, f.width * 0.5) }} />
                        <circle className="flow-from" cx={f.ax} cy={f.ay} r={2.5 + f.width * 0.25} />
                    </g>
                ))}
            </g>
        </svg>
    ), [ geo, w, h, path, round ]);                                              // eslint-disable-line react-hooks/exhaustive-deps
    // a state's shade: from a light wash to full terracotta, on one scale for every round (the largest share in any round
    // is the darkest), so moving the slider compares like with like
    const TOP_STATE = Math.max(...SURVEY.states.flatMap(s => s.shares.filter((v) : v is number => v !== null)));
    const stateTint = (v : number) => `color-mix(in srgb, var(--out) ${Math.round(18 + Math.min(1, v / TOP_STATE) * 82)}%, var(--land))`;

    return (
        <div className={splitClass(layout)}>
            <div className={`split-stage landing-stage ${stage > 0 ? "is-moving" : ""} ${showStates ? "is-india" : "is-world"} ${drawn ? "is-drawn" : ""}`} ref={ref}>
                {w > 0 && geo && worldMap}
                {w > 0 && geo && (
                    <svg className="india-layer" width={w} height={h} role="img"
                        aria-label={inIndia
                            ? `${SURVEY.rounds[round]}, by state: ${cards.map(c => `${c.name} ${c.v == null ? "not reported" : `${c.v}%`}`).join(", ")}.`
                            : `${SURVEY.rounds[round]}, by source country: ${countries.filter(c => c.v != null).map(c => `${c.short} ${c.v}%`).join(", ")}; other countries ${otherCountries}%.`}>
                        {/* India: its states, their outlines set each frame by the motion; the named ones tinted once in place */}
                        <g className={`india-map ${showStates ? "is-states" : ""}`}>
                            {geo.states.map((f, i) => {
                                const v = shareOf.get(f.properties.name);
                                return <path key={`i${i}`} ref={el => { stateRefs.current[i] = el; }} className={`india-state ${v != null ? "is-named" : ""}`} style={showStates && v != null ? { fill : stateTint(v) } : undefined} />;
                            })}
                        </g>
                        {/* the world view's names */}
                        {atWorld && (() => {
                            const taken : number[][] = [];
                            return flows.slice().sort((a, b) => (b.c.v ?? 0) - (a.c.v ?? 0)).map(f => {
                                if ((f.c.v ?? 0) < 2) return null;
                                const text = `${f.c.short} ${(f.c.v as number).toFixed(1)}%`, tw = text.length * 7.2;
                                const spots = [ [ f.ax + 8, f.ay - 8 ], [ f.ax - tw - 8, f.ay - 8 ], [ f.ax + 8, f.ay + 14 ], [ f.ax - tw - 8, f.ay + 14 ] ];
                                const free = spots.find(([ x, y ]) => !taken.some(b => x < b[2] && x + tw > b[0] && y - 12 < b[3] && y + 2 > b[1]));
                                if (!free) return null;
                                taken.push([ free[0], free[1] - 12, free[0] + tw, free[1] + 2 ]);
                                return <text key={f.c.short} className="map-label" x={free[0]} y={free[1]}>{text}</text>;
                            });
                        })()}
                        {atWorld && (() => {
                            const p = proj(DELHI);
                            return p ? <g className="delhi"><circle className="pulse" cx={p[0]} cy={p[1]} r={6} /><circle cx={p[0]} cy={p[1]} r={4.5} /><text x={p[0] + 8} y={p[1] + 18}>India</text></g> : null;
                        })()}
                        {/* the India view's leader lines, from each state's centre to its card */}
                        {settled && !narrow && cards.map((c, i) => {
                            const from = c.name === "Other states" ? null : centreOf(c.name);
                            if (!from || c.v == null) return null;
                            const to = cardAt(i), tx = to.x, ty = to.y + cardBox.h / 2;
                            const mx = from[0] + (tx - from[0]) * 0.5;
                            return (
                                <g key={c.name} className="leader" style={{ animationDelay : `${0.15 + i * 0.08}s` }}>
                                    <path d={`M${from[0]},${from[1]} C${mx},${from[1]} ${mx},${ty} ${tx},${ty}`} />
                                    <circle cx={from[0]} cy={from[1]} r={4} />
                                </g>
                            );
                        })}
                    </svg>
                )}
                {settled && (
                    <ul className="state-cards">
                        {cards.map((c, i) => {
                            const at = cardAt(i);
                            return (
                                <li key={c.name} className={`state-card ${c.v == null ? "is-none" : ""}`} style={{ left : at.x, top : at.y, width : cardBox.w, height : cardBox.h, animationDelay : `${0.1 + i * 0.08}s` }}>
                                    <span className="state-name">{c.name}</span>
                                    <b className="state-share">{c.v == null ? "not reported" : `${c.v.toFixed(1)}%`}</b>
                                    <span className="state-bar"><i style={{ width : `${c.v == null ? 0 : (c.v / max) * 100}%` }} /></span>
                                </li>
                            );
                        })}
                    </ul>
                )}
                {atWorld && narrow && <p className="landing-note">Other countries, not shown on the map: {otherCountries}%</p>}
                {/* the colour key for the view in sight */}
                <div className={`map-key ${showStates ? "is-india" : "is-world"}`}>
                    {!showStates ? <>
                        <span className="key-ramp is-in" /><span>Share sent from a country, low to high</span>
                        <span className="key-ramp is-gulf" /><span>The same, for Gulf countries</span>
                        <span className="key-flow" /><span>Flow into India, as wide as the share</span>
                        <span className="key-swatch is-india" /><span>India</span>
                        <span className="key-note">Other countries, not shown on the map: {otherCountries}%</span>
                    </> : <>
                        <span className="key-ramp is-out" /><span>Share received by a state, low to high</span>
                        <span className="key-swatch is-land" /><span>States the survey does not name</span>
                    </>}
                </div>
            </div>
            <aside className="split-card">
                {children}
                <div className="view-switch" role="group" aria-label="View">
                    <button type="button" className={!inIndia ? "is-on" : ""} aria-pressed={!inIndia} onClick={() => { setTouched(true); setView("world"); }}>Where it comes from</button>
                    <button type="button" className={inIndia ? "is-on" : ""} aria-pressed={inIndia} onClick={() => { setTouched(true); setView("india"); }}>Where it lands</button>
                </div>
                <div className="round-slider">
                    <span className="round-label">Survey round</span>
                    <div className="round-track">
                        <input type="range" min={0} max={SURVEY.rounds.length - 1} step={1} value={round} aria-label="Survey round" aria-valuetext={SURVEY.rounds[round]}
                            onChange={e => setRound(+e.target.value)} />
                        <div className="round-stops" aria-hidden="true">
                            {SURVEY.rounds.map((r, i) => (
                                <button key={r} type="button" tabIndex={-1} className={i === round ? "is-on" : i < round ? "is-past" : ""} onClick={() => setRound(i)}>
                                    <i /><span>{r}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
};

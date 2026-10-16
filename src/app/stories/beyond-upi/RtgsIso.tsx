"use client";

// RTGS, as an isometric flowchart drawn in SVG, after the clean isometric infographics the user pointed to (a solid
// ground with a faint grid, objects standing on it, thin white lines with dots, names lying flat on the ground):
// a sender, the sender's bank, the RBI, the beneficiary's bank and a recipient stand on one zigzag track that keeps to
// the two isometric axes; the extruded word RTGS lies in a ring at the centre, joined to the three institutions by
// thin spokes. ₹500 bundles travel the track and stop a beat at the RBI, whose plinth glows as each settles; they come
// faster and closer together as the year's RTGS value grows (`factor`). Drawn once; only the bundles and the glow move,
// set straight on the SVG each frame, and only while the stage is on screen.

// REACT CORE ==========================================================================================================
import { useEffect, useRef } from "react";

// LOCAL ===============================================================================================================
import { loopOnScreen, reducedMotion } from "./stage";

const C30 = Math.cos(Math.PI / 6), S30 = 0.5;
type Pt = [ number, number ];

// the two layouts: wide (a horizontal zigzag) and tall (a vertical zigzag)
interface Plan { w : number; h : number; s : number; nodes : Pt[]; labels : { at : Pt; size : number; anchor? : "start" | "middle" }[]; straight? : boolean }
const WIDE : Plan = {
    w : 1200, h : 700, s : 46,
    // the track climbs from the sender at the lower left (clear of the words above it) to the RBI, dips to the
    // beneficiary's bank and climbs again to the recipient; each leg keeps to an isometric axis
    nodes : [ [ 80, 594 ], [ 350, 438 ], [ 620, 282 ], [ 890, 438 ], [ 1160, 282 ] ],
    labels : [ { at : [ 150, 672 ], size : 1 }, { at : [ 400, 548 ], size : 1 }, { at : [ 770, 248 ], size : 1.15 }, { at : [ 930, 548 ], size : 1 }, { at : [ 1000, 168 ], size : 1 } ],
};
// on a phone the zigzag runs down the screen, larger, and the names stand upright beside each station, which reads
// better than flat lettering at that size
const TALL : Plan = {
    // on a phone: one column down the left, each station's name beside it on the right, so nothing overlaps
    w : 360, h : 560, s : 25, straight : true,
    nodes : [ [ 72, 70 ], [ 72, 180 ], [ 72, 290 ], [ 72, 400 ], [ 72, 510 ] ],
    labels : [ { at : [ 146, 62 ], size : 1 }, { at : [ 146, 172 ], size : 0.84 }, { at : [ 146, 282 ], size : 1.1 }, { at : [ 146, 392 ], size : 0.72 }, { at : [ 146, 502 ], size : 1 } ],
};
export const STATIONS = [
    { name : "Sender",             note : "Starts the payment" },
    { name : "Sender’s bank",      note : "Debits and sends the message" },
    { name : "RBI",                note : "Settles it, gross and final" },
    { name : "Beneficiary’s bank", note : "Credits within 30 minutes" },
    { name : "Recipient",          note : "Receives the money" },
];

// a point on the ground (x along the axis running down to the right, y along the axis running down to the left, z up),
// in screen units, from an origin
const iso = (o : Pt, s : number) => (x : number, y : number, z = 0) : Pt => [ o[0] + (x - y) * C30 * s, o[1] + (x + y) * S30 * s - z * s ];
const poly = (pts : Pt[]) => pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

// a box, its three visible faces: top, the face towards the viewer's left and the face towards the right
const Box = ({ P, x, y, z, w, d, h, top, left, right } : { P : ReturnType<typeof iso>; x : number; y : number; z : number; w : number; d : number; h : number; top : string; left : string; right : string }) => {
    const x1 = x + w, y1 = y + d, z1 = z + h;
    return (
        <g>
            <polygon points={poly([ P(x, y1, z), P(x1, y1, z), P(x1, y1, z1), P(x, y1, z1) ])} fill={left} />
            <polygon points={poly([ P(x1, y, z), P(x1, y1, z), P(x1, y1, z1), P(x1, y, z1) ])} fill={right} />
            <polygon points={poly([ P(x, y, z1), P(x1, y, z1), P(x1, y1, z1), P(x, y1, z1) ])} fill={top} />
        </g>
    );
};

// a classical bank in the manner of a 3D bank icon: a slab with a paved plaza in front, a podium, a hall with windows
// down its side and a glass front with gold doors, fluted columns, steps, an entablature, a roof and a pediment
// lettered in gold with the rupee above; lamps and planters on the plaza. The front faces down and to the right.
// `grand` is the RBI: larger, six columns, lettered RBI, with a flag.
const STONE = { top : "#ffffff", left : "#f1ecfb", right : "#ddd4f4" }, WALL = { top : "#eee8fb", left : "#e3dbf7", right : "#cfc3ef" };
const SLAB = { top : "#d6caf6", left : "#5a2fb8", right : "#4b23a8" };
const GLASS = "#4a2a9a", GOLD = "#e8bf4f", GOLD_DARK = "#a67c1a", ROOF = "#6f3fd0", ROOF_EDGE = "#9a73ec";
const Bank = ({ at, s, grand } : { at : Pt; s : number; grand? : boolean }) => {
    const k = grand ? 1.22 : 0.95, P0 = iso(at, s);
    const Wf = grand ? 2.0 : 1.6, Dd = 1.25, PL = 0.72;                       // the front's width, the hall's depth, the plaza
    const ox = -(Dd + PL) / 2, oy = -Wf / 2;
    const P = (x : number, y : number, z = 0) : Pt => P0((ox + x) * k, (oy + y) * k, z * k);
    const SL = 0.12, PD = 0.36, H = 1.5, zr = H + 0.2, zt = zr + (grand ? 0.62 : 0.5);
    const n = grand ? 6 : 4, r = 0.085, xc = Dd - 0.14, yF = Wf - 0.08, xg = Dd - 0.32;
    const cols = Array.from({ length : n }, (_, i) => 0.2 + i * (Wf - 0.4) / (n - 1));
    const quad = (a : Pt, b : Pt, c : Pt, d : Pt) => poly([ a, b, c, d ]);
    const onFront = (y : number, z : number) => { const q = P(Dd + 0.07, y, z); return `matrix(${C30} ${-S30} 0 1 ${q[0]} ${q[1]})`; };
    const fs = (grand ? 0.3 : 0.26) * s * k;
    return (
        <g>
            <ellipse cx={at[0]} cy={at[1] + 8} rx={Wf * k * s * 1.25} ry={Wf * k * s * 0.6} fill="#2b0f78" opacity="0.25" />
            {/* the slab and its paving */}
            <Box P={P} x={-0.12} y={-0.12} z={0} w={Dd + PL + 0.12} d={Wf + 0.24} h={SL} {...SLAB} />
            {[ Dd + 0.24, Dd + 0.48 ].map(x => <line key={x} x1={P(x, -0.12, SL)[0]} y1={P(x, -0.12, SL)[1]} x2={P(x, Wf + 0.12, SL)[0]} y2={P(x, Wf + 0.12, SL)[1]} stroke="#b9a8ec" strokeWidth="0.8" />)}
            {Array.from({ length : 5 }, (_, i) => (i + 1) * (Wf + 0.24) / 6 - 0.12).map(y => <line key={y} x1={P(Dd, y, SL)[0]} y1={P(Dd, y, SL)[1]} x2={P(Dd + PL, y, SL)[0]} y2={P(Dd + PL, y, SL)[1]} stroke="#b9a8ec" strokeWidth="0.8" />)}
            {/* the podium and the hall, its side windows and its glass front with gold doors */}
            <Box P={P} x={0} y={0} z={SL} w={Dd} d={Wf} h={PD - SL} {...STONE} />
            <Box P={P} x={0.05} y={0.08} z={PD} w={xg - 0.05} d={Wf - 0.16} h={H - PD} {...WALL} />
            {[ 0, 1, 2 ].flatMap(c => [ [ 0.5, 0.88 ], [ 1.0, 1.38 ] ].map(([ z0, z1 ]) => {
                const x0 = 0.13 + c * 0.25, x1 = x0 + 0.17;
                return (
                    <g key={`${c}-${z0}`}>
                        <polygon points={quad(P(x0, yF, z0), P(x1, yF, z0), P(x1, yF, z1), P(x0, yF, z1))} fill={GLASS} stroke="#f6f2ff" strokeWidth="1.2" />
                        <line x1={P((x0 + x1) / 2, yF, z0)[0]} y1={P((x0 + x1) / 2, yF, z0)[1]} x2={P((x0 + x1) / 2, yF, z1)[0]} y2={P((x0 + x1) / 2, yF, z1)[1]} stroke="#f6f2ff" strokeWidth="0.8" />
                    </g>
                );
            }))}
            <polygon points={quad(P(xg, 0.18, PD + 0.02), P(xg, Wf - 0.18, PD + 0.02), P(xg, Wf - 0.18, H - 0.04), P(xg, 0.18, H - 0.04))} fill={GLASS} />
            {[ 0.95, 1.22 ].map(z => <line key={z} x1={P(xg, 0.18, z)[0]} y1={P(xg, 0.18, z)[1]} x2={P(xg, Wf - 0.18, z)[0]} y2={P(xg, Wf - 0.18, z)[1]} stroke="#cdbff3" strokeWidth="1" />)}
            <polygon points={quad(P(xg, Wf / 2 - 0.18, PD), P(xg, Wf / 2 + 0.18, PD), P(xg, Wf / 2 + 0.18, PD + 0.6), P(xg, Wf / 2 - 0.18, PD + 0.6))} fill={GOLD} stroke={GOLD_DARK} strokeWidth="1" />
            <line x1={P(xg, Wf / 2, PD)[0]} y1={P(xg, Wf / 2, PD)[1]} x2={P(xg, Wf / 2, PD + 0.6)[0]} y2={P(xg, Wf / 2, PD + 0.6)[1]} stroke={GOLD_DARK} strokeWidth="1" />
            {/* the fluted columns, back to front */}
            {cols.map(y => {
                const T = P(xc, y, H - 0.07), B = P(xc, y, PD + 0.05), hw = 1.2247 * r * k * s, hv = 0.7071 * r * k * s;
                return (
                    <g key={y}>
                        <Box P={P} x={xc - 0.12} y={y - 0.12} z={PD} w={0.24} d={0.24} h={0.06} {...STONE} />
                        <rect x={B[0] - hw} y={T[1]} width={2 * hw} height={B[1] - T[1]} fill="url(#rf-col)" />
                        <ellipse cx={B[0]} cy={B[1]} rx={hw} ry={hv} fill="url(#rf-col)" />
                        {[ -0.4, 0, 0.4 ].map(f => <line key={f} x1={B[0] + f * hw} y1={T[1] + 2} x2={B[0] + f * hw} y2={B[1]} stroke="#b9acdf" strokeWidth="0.6" opacity="0.7" />)}
                        <Box P={P} x={xc - 0.12} y={y - 0.12} z={H - 0.08} w={0.24} d={0.24} h={0.08} {...STONE} />
                    </g>
                );
            })}
            {/* the steps, top to bottom */}
            {[ 0, 1, 2 ].map(j => <Box key={j} P={P} x={Dd + j * 0.16} y={0.18} z={SL} w={0.16} d={Wf - 0.36} h={(PD - SL) * (3 - j) / 3} {...STONE} />)}
            {/* the entablature, the roof and the pediment, lettered in gold */}
            <Box P={P} x={-0.05} y={-0.05} z={H} w={Dd + 0.12} d={Wf + 0.1} h={zr - H} {...STONE} />
            <line x1={P(Dd + 0.07, -0.05, H + 0.06)[0]} y1={P(Dd + 0.07, -0.05, H + 0.06)[1]} x2={P(Dd + 0.07, Wf + 0.05, H + 0.06)[0]} y2={P(Dd + 0.07, Wf + 0.05, H + 0.06)[1]} stroke="#cfc3ef" strokeWidth="1" />
            <polygon points={quad(P(-0.05, Wf / 2, zt), P(Dd + 0.07, Wf / 2, zt), P(Dd + 0.07, Wf + 0.1, zr), P(-0.05, Wf + 0.1, zr))} fill={ROOF} />
            <line x1={P(-0.05, Wf / 2, zt)[0]} y1={P(-0.05, Wf / 2, zt)[1]} x2={P(Dd + 0.07, Wf / 2, zt)[0]} y2={P(Dd + 0.07, Wf / 2, zt)[1]} stroke={ROOF_EDGE} strokeWidth="1.5" />
            <polygon points={poly([ P(Dd + 0.07, -0.1, zr), P(Dd + 0.07, Wf + 0.1, zr), P(Dd + 0.07, Wf / 2, zt) ])} fill="#fbf8f2" stroke="#d9cff3" strokeWidth="2" strokeLinejoin="round" />
            <g transform={onFront(Wf / 2, zr + 0.06)}>
                <text x="1" y="1" textAnchor="middle" fontSize={fs} fontWeight="900" fill={GOLD_DARK} fontFamily="system-ui, 'Helvetica Neue', Arial, sans-serif">{grand ? "RBI" : "BANK"}</text>
                <text textAnchor="middle" fontSize={fs} fontWeight="900" fill={GOLD} fontFamily="system-ui, 'Helvetica Neue', Arial, sans-serif">{grand ? "RBI" : "BANK"}</text>
            </g>
            <g transform={onFront(Wf / 2, zr + (zt - zr) * 0.62)}>
                <text x="0.8" y="0.8" textAnchor="middle" fontSize={fs * 0.62} fontWeight="900" fill={GOLD_DARK} fontFamily="system-ui, sans-serif">₹</text>
                <text textAnchor="middle" fontSize={fs * 0.62} fontWeight="900" fill={GOLD} fontFamily="system-ui, sans-serif">₹</text>
            </g>
            {/* lamps and planters on the plaza */}
            {[ 0.06, Wf - 0.06 ].map(y => {
                const a = P(Dd + PL - 0.16, y, SL), b = P(Dd + PL - 0.16, y, SL + 0.72);
                return <g key={y}><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#2f2f2f" strokeWidth="1.4" /><rect x={b[0] - 2.6} y={b[1] - 6} width="5.2" height="7" rx="1" fill="#fff3c9" stroke="#2f2f2f" strokeWidth="1" /></g>;
            })}
            {[ -0.02, Wf - 0.16 ].map(y => {
                const c = P(Dd + 0.62, y + 0.08, SL + 0.24);
                return <g key={y}><Box P={P} x={Dd + 0.54} y={y} z={SL} w={0.16} d={0.16} h={0.14} {...STONE} /><circle cx={c[0]} cy={c[1]} r={0.1 * k * s} fill="#6b8e23" /><circle cx={c[0] - 1.5} cy={c[1] - 2} r={0.05 * k * s} fill="#8fb23f" /></g>;
            })}
            {grand && (() => {
                const a = P(0.2, Wf / 2, zt), b = P(0.2, Wf / 2, zt + 0.9);
                return <g><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#ffffff" strokeWidth="2" /><path d={`M${b[0]} ${b[1]} l${0.5 * s} ${0.12 * s} l${-0.5 * s} ${0.16 * s} z`} fill="#eaaa3a" /></g>;
            })()}
        </g>
    );
};

// the RBI, after a classical isometric public building: a rusticated stone base storey with arched windows, two wings
// with flat roofs behind parapets, and between them a taller centre with a portico of six columns under a pediment
// lettered RBI in gold; steps up to it from the plaza, and a flag on the ridge. The front faces down and to the right.
const CREAM = { top : "#fbf9f4", left : "#f1ede4", right : "#dcd6c9" }, BASE = { top : "#e6dcc6", left : "#cbbd9c", right : "#b3a37f" };
const Rbi = ({ at, s } : { at : Pt; s : number }) => {
    const k = 1.05, P0 = iso(at, s);
    const Wf = 2.6, Dd = 1.5, PL = 0.62, WG = 0.74;                          // front width, depth, plaza, a wing's width
    const ox = -(Dd + PL) / 2, oy = -Wf / 2;
    const P = (x : number, y : number, z = 0) : Pt => P0((ox + x) * k, (oy + y) * k, z * k);
    const SL = 0.12, BT = 0.55, WT = 1.55, CT = 1.62, zr = 1.82, zt = 2.3, xb = 1.18;   // slab, base, wing, column and roof heights; the centre's back wall
    const quad = (pts : Pt[]) => poly(pts);
    const win = (key : string, pts : Pt[], arch? : boolean) => <polygon key={key} points={quad(pts)} fill={arch ? "#5b4a2e" : "#5a7fa8"} stroke={arch ? "#efe6d2" : "#ffffff"} strokeWidth="1" />;
    // a window on the front face (x fixed) or on the side face (y fixed)
    const onX = (key : string, x : number, y0 : number, y1 : number, z0 : number, z1 : number, arch? : boolean) => win(key, [ P(x, y0, z0), P(x, y1, z0), P(x, y1, z1), P(x, y0, z1) ], arch);
    const onY = (key : string, y : number, x0 : number, x1 : number, z0 : number, z1 : number, arch? : boolean) => win(key, [ P(x0, y, z0), P(x1, y, z0), P(x1, y, z1), P(x0, y, z1) ], arch);
    const wing = (y0 : number, side : boolean) => (
        <g>
            <Box P={P} x={0} y={y0} z={BT} w={Dd} d={WG} h={WT - BT} {...CREAM} />
            {[ [ 0.72, 1.0 ], [ 1.13, 1.42 ] ].map(([ z0, z1 ]) => onX(`f${y0}${z0}`, Dd, y0 + 0.22, y0 + WG - 0.22, z0, z1))}
            {side && [ 0.2, 0.62, 1.04 ].flatMap(x => [ [ 0.72, 1.0 ], [ 1.13, 1.42 ] ].map(([ z0, z1 ]) => onY(`s${x}${z0}`, y0 + WG, x, x + 0.24, z0, z1)))}
            <Box P={P} x={-0.04} y={y0 - 0.04} z={WT} w={Dd + 0.08} d={WG + 0.08} h={0.14} {...CREAM} />
            <polygon points={quad([ P(0.08, y0 + 0.08, WT + 0.141), P(Dd - 0.08, y0 + 0.08, WT + 0.141), P(Dd - 0.08, y0 + WG - 0.08, WT + 0.141), P(0.08, y0 + WG - 0.08, WT + 0.141) ])} fill="#e9e4d8" />
        </g>
    );
    const cols = Array.from({ length : 6 }, (_, i) => WG + 0.12 + i * (Wf - 2 * WG - 0.24) / 5), xc = Dd - 0.1, r = 0.075;
    return (
        <g>
            <ellipse cx={at[0]} cy={at[1] + 10} rx={Wf * k * s * 1.2} ry={Wf * k * s * 0.58} fill="#2b0f78" opacity="0.25" />
            <Box P={P} x={-0.12} y={-0.12} z={0} w={Dd + PL + 0.12} d={Wf + 0.24} h={SL} {...SLAB} />
            {/* the stone base storey, its courses and arched windows */}
            <Box P={P} x={0} y={0} z={SL} w={Dd} d={Wf} h={BT - SL} {...BASE} />
            {[ 0.26, 0.4 ].map(z => <g key={z}>
                <line x1={P(Dd, 0, z)[0]} y1={P(Dd, 0, z)[1]} x2={P(Dd, Wf, z)[0]} y2={P(Dd, Wf, z)[1]} stroke="#9c8c68" strokeWidth="0.8" />
                <line x1={P(0, Wf, z)[0]} y1={P(0, Wf, z)[1]} x2={P(Dd, Wf, z)[0]} y2={P(Dd, Wf, z)[1]} stroke="#9c8c68" strokeWidth="0.8" />
            </g>)}
            {[ 0.2, WG - 0.36, Wf - WG + 0.2, Wf - 0.36 ].map(y => onX(`b${y}`, Dd, y, y + 0.16, 0.2, 0.46, true))}
            {[ 0.25, 0.68, 1.11 ].map(x => onY(`bs${x}`, Wf, x, x + 0.16, 0.2, 0.46, true))}
            {/* the far wing, the centre with its portico, the near wing */}
            {wing(0, false)}
            <Box P={P} x={0} y={WG} z={BT} w={xb} d={Wf - 2 * WG} h={zr - BT} {...CREAM} />
            {[ WG + 0.2, Wf / 2 + 0.25 ].map(y => onX(`c${y}`, xb, y, y + 0.22, 0.95, 1.4))}
            <polygon points={quad([ P(xb, Wf / 2 - 0.15, BT), P(xb, Wf / 2 + 0.15, BT), P(xb, Wf / 2 + 0.15, BT + 0.5), P(xb, Wf / 2 - 0.15, BT + 0.5) ])} fill={GOLD} stroke={GOLD_DARK} strokeWidth="1" />
            {cols.map(y => {
                const T = P(xc, y, CT - 0.06), B = P(xc, y, BT + 0.05), hw = 1.2247 * r * k * s, hv = 0.7071 * r * k * s;
                return (
                    <g key={y}>
                        <Box P={P} x={xc - 0.1} y={y - 0.1} z={BT} w={0.2} d={0.2} h={0.06} {...CREAM} />
                        <rect x={B[0] - hw} y={T[1]} width={2 * hw} height={B[1] - T[1]} fill="url(#rf-col)" />
                        <ellipse cx={B[0]} cy={B[1]} rx={hw} ry={hv} fill="url(#rf-col)" />
                        {[ -0.4, 0, 0.4 ].map(f => <line key={f} x1={B[0] + f * hw} y1={T[1] + 2} x2={B[0] + f * hw} y2={B[1]} stroke="#b9acdf" strokeWidth="0.6" opacity="0.7" />)}
                        <Box P={P} x={xc - 0.1} y={y - 0.1} z={CT - 0.07} w={0.2} d={0.2} h={0.07} {...CREAM} />
                    </g>
                );
            })}
            <Box P={P} x={0} y={WG - 0.04} z={CT} w={Dd + 0.06} d={Wf - 2 * WG + 0.08} h={zr - CT} {...CREAM} />
            <polygon points={quad([ P(0, Wf / 2, zt), P(Dd + 0.06, Wf / 2, zt), P(Dd + 0.06, Wf - WG + 0.1, zr), P(0, Wf - WG + 0.1, zr) ])} fill="#f6f3ec" stroke="#dcd6c9" strokeWidth="1" />
            <polygon points={poly([ P(Dd + 0.06, WG - 0.1, zr), P(Dd + 0.06, Wf - WG + 0.1, zr), P(Dd + 0.06, Wf / 2, zt) ])} fill="#fbf9f4" stroke="#dcd6c9" strokeWidth="2" strokeLinejoin="round" />
            {(() => { const q = P(Dd + 0.07, Wf / 2, zr + 0.1), fs = 0.27 * s * k; return (
                <g transform={`matrix(${C30} ${-S30} 0 1 ${q[0]} ${q[1]})`}>
                    <text x="1" y="1" textAnchor="middle" fontSize={fs} fontWeight="900" letterSpacing="2" fill={GOLD_DARK} fontFamily="system-ui, 'Helvetica Neue', Arial, sans-serif">RBI</text>
                    <text textAnchor="middle" fontSize={fs} fontWeight="900" letterSpacing="2" fill={GOLD} fontFamily="system-ui, 'Helvetica Neue', Arial, sans-serif">RBI</text>
                </g>
            ); })()}
            {wing(Wf - WG, true)}
            {/* the steps up to the portico, and the flag */}
            {[ 0, 1, 2, 3 ].map(j => <Box key={j} P={P} x={Dd + j * 0.13} y={WG + 0.05} z={SL} w={0.13} d={Wf - 2 * WG - 0.1} h={(BT - SL) * (4 - j) / 4} {...CREAM} />)}
            {(() => { const a = P(0.25, Wf / 2, zt), b = P(0.25, Wf / 2, zt + 0.85); return <g><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#ffffff" strokeWidth="2" /><path d={`M${b[0]} ${b[1]} l${0.5 * s} ${0.12 * s} l${-0.5 * s} ${0.16 * s} z`} fill="#eaaa3a" /></g>; })()}
        </g>
    );
};

// a person, three-quarter on, facing down and to the left: hair, face, a collared jacket, arms bent to hold a phone or a
// bundle, trousers and shoes; `h` is the figure's height on screen
const Person = ({ at, h, coat, coatDark, holds } : { at : Pt; h : number; coat : string; coatDark : string; holds : "phone" | "bundle" }) => {
    const u = h / 100;                                                                            // drawn on a 100-unit figure
    return (
        <g transform={`translate(${at[0]} ${at[1]}) scale(${u})`}>
            <ellipse cx="2" cy="0" rx="22" ry="8" fill="#3c1a8f" opacity="0.25" />
            {/* legs and shoes */}
            <path d="M-9 -44 L-10 -4 Q-10 0 -6 0 L-2 0 L-2 -44 Z" fill="#2f2f2f" />
            <path d="M3 -44 L4 -5 Q4 -1 8 -1 L11 -1 L10 -44 Z" fill="#1f1f1f" />
            <path d="M-14 -1 Q-14 -5 -9 -5 L-2 -5 L-2 1 L-13 1 Z" fill="#141414" />
            <path d="M2 -2 Q2 -6 7 -6 L12 -6 L13 0 L3 0 Z" fill="#0d0d0d" />
            {/* the jacket, its shaded side and collar */}
            <path d="M-15 -78 Q-17 -60 -13 -42 L13 -42 Q16 -60 14 -78 Q0 -84 -15 -78 Z" fill={coat} />
            <path d="M2 -82 Q14 -80 14 -78 Q16 -60 13 -42 L3 -42 Z" fill={coatDark} opacity="0.55" />
            <path d="M-6 -81 L0 -72 L5 -81 Z" fill="#ffffff" opacity="0.85" />
            {/* the arms, bent, hands meeting in front */}
            <path d="M-15 -77 Q-22 -64 -16 -55 Q-10 -50 -3 -54" fill="none" stroke={coat} strokeWidth="7" strokeLinecap="round" />
            <path d="M14 -77 Q20 -64 15 -56 Q9 -51 3 -54" fill="none" stroke={coatDark} strokeWidth="7" strokeLinecap="round" />
            <circle cx="-3" cy="-54" r="3.4" fill="#c98b62" /><circle cx="3" cy="-54" r="3.4" fill="#b67a54" />
            {holds === "phone"
                ? <g><rect x="-5" y="-66" width="10" height="16" rx="2" fill="#1e1c1a" /><rect x="-3.6" y="-64" width="7.2" height="12" rx="1" fill="#8fd16b" /></g>
                : <g><rect x="-10" y="-60" width="20" height="8" rx="1.5" fill="#9aae7a" /><rect x="-2" y="-61" width="4" height="10" fill="#f2ead7" /></g>}
            {/* neck, face and hair */}
            <rect x="-3" y="-86" width="6" height="6" fill="#b67a54" />
            <ellipse cx="0" cy="-95" rx="9" ry="10.5" fill="#c98b62" />
            <path d="M3 -103 Q9 -97 8 -88 Q10 -95 9 -100 Z" fill="#b67a54" />
            <path d="M-10 -96 Q-11 -108 0 -108 Q10 -108 10 -99 Q6 -103 -1 -102 Q-6 -101 -10 -96 Z" fill="#2a1d14" />
            <circle cx="-4" cy="-95" r="1" fill="#2a1d14" /><circle cx="2.5" cy="-95" r="1" fill="#2a1d14" />
        </g>
    );
};

// a ₹500 bundle as a small box, drawn about its own centre
const BundleShape = ({ s } : { s : number }) => {
    const P = iso([ 0, 0 ], s * 0.9);
    return (
        <g>
            <Box P={P} x={-0.35} y={-0.17} z={0} w={0.7} d={0.34} h={0.16} top="#b7c69a" left="#9aae7a" right="#7f965e" />
            <polygon points={poly([ P(-0.06, -0.17, 0.161), P(0.06, -0.17, 0.161), P(0.06, 0.17, 0.161), P(-0.06, 0.17, 0.161) ])} fill="#f2ead7" />
            <polygon points={poly([ P(-0.06, 0.17, 0), P(0.06, 0.17, 0), P(0.06, 0.17, 0.16), P(-0.06, 0.17, 0.16) ])} fill="#e3d7bb" />
        </g>
    );
};

// a word lying flat on the ground, running up and to the right
const flat = (x : number, y : number) => `matrix(${C30} ${-S30} ${C30} ${S30} ${x} ${y})`;

export const RtgsIso = ({ factor, narrow, label } : { factor : () => number; narrow : boolean; label : string }) => {
    const plan = narrow ? TALL : WIDE, { s, nodes } = plan;
    const bundles = useRef<SVGGElement>(null), glow = useRef<SVGEllipseElement>(null), host = useRef<SVGSVGElement>(null);

    // the track's length, its corners at the stations, for placing a bundle at a distance along it
    const segs = nodes.slice(1).map((p, i) => Math.hypot(p[0] - nodes[i][0], p[1] - nodes[i][1]));
    const total = segs.reduce((a, b) => a + b, 0), atRbi = segs[0] + segs[1];
    const along = (d : number) : Pt => { let r = d; for (let i = 0; i < segs.length; i++) { if (r <= segs[i]) { const k = r / segs[i]; return [ nodes[i][0] + (nodes[i + 1][0] - nodes[i][0]) * k, nodes[i][1] + (nodes[i + 1][1] - nodes[i][1]) * k ]; } r -= segs[i]; } return nodes[nodes.length - 1]; };

    useEffect(() => {
        const g = bundles.current, el = host.current;
        if (!g || !el) return;
        const pool = [ ...g.children ] as SVGGElement[];
        const reduced = reducedMotion();
        // each bundle: how far along it is, and how long it has waited at the RBI
        let live : { d : number; wait : number }[] = [], owed = 0, glowT = 0;
        const SPEED = 170, PAUSE = 0.45, GAP = 1.15;                                  // screen units a second; seconds
        const draw = () => {
            pool.forEach((b, i) => {
                const it = live[i];
                if (!it) { b.setAttribute("opacity", "0"); return; }
                const p = along(it.d), fade = Math.min(1, it.d / 30, (total - it.d) / 30);
                b.setAttribute("transform", `translate(${p[0].toFixed(1)} ${(p[1] - 4).toFixed(1)})`);
                b.setAttribute("opacity", fade.toFixed(2));
            });
            glow.current?.setAttribute("opacity", (0.15 + glowT * 0.6).toFixed(2));
        };
        if (reduced) { live = [ 0.12, 0.32, 0.5, 0.7, 0.9 ].map(k => ({ d : k * total, wait : 1 })); draw(); return; }
        return loopOnScreen(el, dt => {
            const f = factor();
            owed += dt * f / GAP;
            while (owed >= 1 && live.length < pool.length) { live.push({ d : 0, wait : 0 }); owed -= 1; }
            for (const b of live) {
                if (b.d < atRbi && b.d + dt * SPEED * f >= atRbi && b.wait < PAUSE) { b.d = atRbi; b.wait += dt; if (b.wait >= PAUSE) glowT = 1; continue; }
                b.d += dt * SPEED * Math.sqrt(f);
            }
            live = live.filter(b => b.d < total);
            glowT = Math.max(0, glowT - dt * 1.6);
            draw();
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ narrow ]);

    const people = [ 0, 4 ];
    const rbi = nodes[2];
    return (
        <svg ref={host} className="rf-svg" viewBox={`0 0 ${plan.w} ${plan.h}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}>
            <defs>
                <pattern id="rf-grid" width={C30 * 60} height={60} patternUnits="userSpaceOnUse">
                    <path d={`M0 ${30} L${C30 * 60} 0 M0 ${30} L${C30 * 60} 60`} stroke="#ffffff" strokeOpacity="0.07" strokeWidth="1" fill="none" />
                </pattern>
                <linearGradient id="rf-col" x1="0" x2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="0.55" stopColor="#efe9fb" /><stop offset="1" stopColor="#c4b7ea" /></linearGradient>
                <radialGradient id="rf-glow"><stop offset="0" stopColor="#ffffff" stopOpacity="0.9" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></radialGradient>
            </defs>
            <rect width={plan.w} height={plan.h} fill="url(#rf-grid)" />

            {/* the track, with a dot at each station */}
            <polyline points={poly(nodes)} fill="none" stroke="#ffffff" strokeWidth={narrow ? 4 : 6} strokeLinejoin="round" strokeLinecap="round" />
            {nodes.map((n, i) => <circle key={i} cx={n[0]} cy={n[1]} r={narrow ? 5 : 7} fill="#ffffff" stroke="#6f3fd0" strokeWidth="2" />)}

            {/* the RBI's plinth glows as a bundle settles */}
            <ellipse ref={glow} cx={rbi[0]} cy={rbi[1] + 4} rx={s * 3.4} ry={s * 1.9} fill="url(#rf-glow)" opacity="0.15" />

            {/* the bundles in flight (a fixed pool, placed each frame), passing behind the buildings they enter */}
            <g ref={bundles}>{Array.from({ length : 18 }, (_, i) => <g key={i} opacity="0"><BundleShape s={s} /></g>)}</g>

            {/* the stations, drawn back to front */}
            {[ 0, 2, 4, 1, 3 ].map(i => people.includes(i)
                ? <Person key={i} at={[ nodes[i][0] + (i === 0 ? 10 : -10), nodes[i][1] - 6 ]} h={s * 2.7} coat={i === 0 ? "#eaaa3a" : "#6b8e23"} coatDark={i === 0 ? "#b97f12" : "#4a6a14"} holds={i === 0 ? "phone" : "bundle"} />
                : (i === 2 ? <Rbi key={i} at={nodes[i]} s={s} /> : <Bank key={i} at={nodes[i]} s={s} />))}


            {/* the names, lying flat */}
            {STATIONS.map((st, i) => {
                const l = plan.labels[i], fs = (narrow ? 24 : 22) * l.size;
                if (plan.straight) return (
                    <g key={i} className="rf-flat" textAnchor={l.anchor ?? "start"}>
                        <text x={l.at[0]} y={l.at[1]} fontSize={fs} fontWeight="900" letterSpacing="1" fill="#ffffff">{st.name.toUpperCase()}</text>
                        <text x={l.at[0]} y={l.at[1] + Math.max(fs, 20) * 0.95} fontSize={Math.max(fs * 0.74, 15)} fontWeight="500" fill="#ffffff" fillOpacity="0.88">{st.note}</text>
                    </g>
                );
                return (
                    <g key={i} transform={flat(l.at[0], l.at[1])} className="rf-flat">
                        <text fontSize={fs} fontWeight="900" letterSpacing="1.5" fill="#ffffff">{st.name.toUpperCase()}</text>
                        <text y={fs * 0.95} fontSize={fs * 0.66} fontWeight="500" fill="#ffffff" fillOpacity="0.85">{st.note}</text>
                    </g>
                );
            })}
        </svg>
    );
};

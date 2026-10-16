"use client";

// The guess's four things, drawn in the same isometric manner as the RTGS flow (RtgsIso.tsx), after the references the
// user chose: a modern phone lying on its back with a bright wallpaper; an indivara hatchback seen from the front three
// quarters; a low-poly diorama of two turmeric apartment towers on a block with a courtyard, trees and a road; and a teal
// glass tower with white fins, balcony bands and a glass penthouse on its roof. Light comes from the upper left (tops
// lightest, the face to the left a mid tone, the face to the right darkest); each stands on a soft shadow, on a clear
// background. Colours are written out so the drawings read the same in both themes; they are Kosh colours and their
// tints (indivara, turmeric, sandalwood, neem, a teal).

// REACT CORE ==========================================================================================================
import type { ReactNode } from "react";

const C30 = Math.cos(Math.PI / 6);
type Pt = [ number, number ];
const iso = (o : Pt, s : number) => (x : number, y : number, z = 0) : Pt => [ o[0] + (x - y) * C30 * s, o[1] + (x + y) * 0.5 * s - z * s ];
const pts = (p : Pt[]) => p.map(q => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ");
type P3 = ReturnType<typeof iso>;
interface Shade { top : string; left : string; right : string }

// a box: its top, its face towards the lower left (y = y1) and its face towards the lower right (x = x1)
const Box = ({ P, x, y, z, w, d, h, c } : { P : P3; x : number; y : number; z : number; w : number; d : number; h : number; c : Shade }) => {
    const x1 = x + w, y1 = y + d, z1 = z + h;
    return (
        <g>
            <polygon points={pts([ P(x, y1, z), P(x1, y1, z), P(x1, y1, z1), P(x, y1, z1) ])} fill={c.left} />
            <polygon points={pts([ P(x1, y, z), P(x1, y1, z), P(x1, y1, z1), P(x1, y, z1) ])} fill={c.right} />
            <polygon points={pts([ P(x, y, z1), P(x1, y, z1), P(x1, y1, z1), P(x, y1, z1) ])} fill={c.top} />
        </g>
    );
};
// rectangles on the left face (y fixed; x0..x1, z0..z1), the right face (x fixed; y0..y1) and a level (z fixed)
const onLeft = (P : P3, y : number, x0 : number, x1 : number, z0 : number, z1 : number) => pts([ P(x0, y, z0), P(x1, y, z0), P(x1, y, z1), P(x0, y, z1) ]);
const onRight = (P : P3, x : number, y0 : number, y1 : number, z0 : number, z1 : number) => pts([ P(x, y0, z0), P(x, y1, z0), P(x, y1, z1), P(x, y0, z1) ]);
const onTop = (P : P3, z : number, x0 : number, y0 : number, x1 : number, y1 : number) => pts([ P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z) ]);
// the plane of the left face at a point, for drawing circles on it (u along x, v up)
const leftPlane = (q : Pt, s : number) => `matrix(${C30 * s} ${0.5 * s} 0 ${-s} ${q[0]} ${q[1]})`;
const Art = ({ label, children, defs } : { label : string; children : ReactNode; defs? : ReactNode }) => (
    <svg viewBox="0 0 160 150" role="img" aria-label={label} style={{ overflow : "hidden" }}>{defs && <defs>{defs}</defs>}{children}</svg>
);
// a low-poly crown: a seven-sided shape, its upper left lit
const crown = (c : Pt, r : number, dark : string, light : string) => {
    const ring = (rr : number, dx : number, dy : number) => pts(Array.from({ length : 7 }, (_, k) => { const a = k / 7 * Math.PI * 2 - 0.3; return [ c[0] + dx + Math.cos(a) * rr * (k % 2 ? 0.92 : 1), c[1] + dy + Math.sin(a) * rr * (k % 2 ? 0.92 : 1) ] as Pt; }));
    return <g><polygon points={ring(r, 0, 0)} fill={dark} /><polygon points={ring(r * 0.62, -r * 0.25, -r * 0.28)} fill={light} /></g>;
};

// THE PHONE ===========================================================================================================
// a modern phone on its back, its long side running up to the right: a silver rim, a black bezel with a notch, a bright
// wallpaper and a glass sheen; a button on its near edge
export const PhoneArt = () => {
    const s = 34, O : Pt = [ 80, 74 ];
    const T = (z : number) => `matrix(${C30 * s} ${0.5 * s} ${-C30 * s} ${0.5 * s} ${O[0]} ${O[1] - z * s})`;
    const W = 0.72, L = 1.5;
    const screen = (fill : string) => <rect x={-W + 0.08} y={-L + 0.08} width={2 * W - 0.16} height={2 * L - 0.16} rx="0.17" fill={fill} />;
    return (
        <Art label="A smartphone" defs={<>
            <filter id="ga-ph-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.06" /></filter>
            <linearGradient id="ga-ph-base" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6a3fd0" /><stop offset="0.55" stopColor="#c03a9a" /><stop offset="1" stopColor="#2fb8d8" /></linearGradient>
            <radialGradient id="ga-ph-mag" cx="0.35" cy="0.3" r="0.55"><stop offset="0" stopColor="#e8357a" /><stop offset="1" stopColor="#e8357a" stopOpacity="0" /></radialGradient>
            <radialGradient id="ga-ph-org" cx="0.7" cy="0.5" r="0.45"><stop offset="0" stopColor="#f08a3c" /><stop offset="1" stopColor="#f08a3c" stopOpacity="0" /></radialGradient>
            <radialGradient id="ga-ph-cy" cx="0.75" cy="0.88" r="0.45"><stop offset="0" stopColor="#2fb8d8" /><stop offset="1" stopColor="#2fb8d8" stopOpacity="0" /></radialGradient>
            <radialGradient id="ga-ph-wh" cx="0.45" cy="0.62" r="0.25"><stop offset="0" stopColor="#ffffff" stopOpacity="0.55" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></radialGradient>
            <linearGradient id="ga-ph-gls" x1="0" y1="0" x2="1" y2="1"><stop offset="0.25" stopColor="#fff" stopOpacity="0" /><stop offset="0.42" stopColor="#fff" stopOpacity="0.22" /><stop offset="0.55" stopColor="#fff" stopOpacity="0" /></linearGradient>
            <linearGradient id="ga-ph-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f2f3f5" /><stop offset="1" stopColor="#b9bdc4" /></linearGradient>
        </>}>
            {/* the shadow, the phone's shape thrown a little down and right */}
            <g transform={T(0)}><rect x={-W + 0.1} y={-L + 0.12} width={2 * W} height={2 * L} rx="0.24" fill="#2f2f2f" opacity="0.18" filter="url(#ga-ph-blur)" /></g>
            {/* the body's thickness, layer on layer, darker underneath */}
            {[ "#6f737b", "#7f838b", "#8f939a", "#a3a7ad", "#b7bac0" ].map((c, k) => <g key={k} transform={T(k * 0.022)}><rect x={-W} y={-L} width={2 * W} height={2 * L} rx="0.24" fill={c} /></g>)}
            <g transform={T(0.05)}><rect x={W - 0.012} y={-0.75} width="0.03" height="0.32" rx="0.012" fill="#9a9ea5" /></g>
            <g transform={T(0.11)}>
                <rect x={-W} y={-L} width={2 * W} height={2 * L} rx="0.24" fill="url(#ga-ph-rim)" />
                <rect x={-W + 0.035} y={-L + 0.035} width={2 * W - 0.07} height={2 * L - 0.07} rx="0.21" fill="#0d0d10" />
                {screen("url(#ga-ph-base)")}{screen("url(#ga-ph-mag)")}{screen("url(#ga-ph-org)")}{screen("url(#ga-ph-cy)")}{screen("url(#ga-ph-wh)")}
                <rect x="-0.24" y={-L + 0.06} width="0.48" height="0.11" rx="0.055" fill="#0d0d10" />
                {screen("url(#ga-ph-gls)")}
            </g>
        </Art>
    );
};

// THE CAR =============================================================================================================
// an indivara hatchback from the front three quarters: its length along x, the front facing the lower right, the near side
// with its windows, doors and two alloy wheels facing the lower left; then mirrored, so that it lies on the phone's
// diagonal, its length running up to the right and its front facing the lower left
export const CarArt = () => {
    const s = 28, P = iso([ 82, 99 ], s);
    const x0 = -1.8, x1 = 1.8, y0 = -0.8, y1 = 0.8, zb = 0.3, zt = 0.95, zr = 1.65;
    const wheel = (xw : number) => (
        <g transform={leftPlane(P(xw, y1 + 0.002, 0.37), s)}>
            <circle r="0.44" fill="#3d1f7a" />
            <circle r="0.36" fill="#1f1f22" />
            <circle r="0.24" fill="#cfd3d8" />
            {[ 0, 1, 2, 3, 4 ].map(k => { const a = k / 5 * Math.PI * 2; return <line key={k} x1="0" y1="0" x2={(Math.cos(a) * 0.22).toFixed(3)} y2={(Math.sin(a) * 0.22).toFixed(3)} stroke="#8a9098" strokeWidth="0.05" />; })}
            <circle r="0.07" fill="#6c727a" />
        </g>
    );
    const ln = (a : Pt, b : Pt, stroke : string, w : number, op = 1) => <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={stroke} strokeWidth={w} strokeOpacity={op} />;
    return (
        <Art label="A small car" defs={<>
            <linearGradient id="ga-car-side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a079ee" /><stop offset="1" stopColor="#5a2fb0" /></linearGradient>
            <linearGradient id="ga-car-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#b392f2" /><stop offset="1" stopColor="#864fe3" /></linearGradient>
            <linearGradient id="ga-car-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3b4654" /><stop offset="1" stopColor="#1c232c" /></linearGradient>
        </>}>
            <g transform="translate(160 0) scale(-1 1)">
                <ellipse cx="86" cy="118" rx="68" ry="18" fill="#2f2f2f" opacity="0.12" />
                {/* the body */}
                <Box P={P} x={x0} y={y0} z={zb} w={x1 - x0} d={y1 - y0} h={zt - zb} c={{ top : "url(#ga-car-top)", left : "url(#ga-car-side)", right : "#5a2fb0" }} />
                {/* the cabin: the near side, the roof and the windscreen */}
                <polygon points={pts([ P(x0 + 0.05, y1 - 0.1, zt), P(x0 + 0.3, y1 - 0.1, zr), P(0.55, y1 - 0.1, zr), P(1.2, y1 - 0.1, zt) ])} fill="#864fe3" />
                <polygon points={pts([ P(x0 + 0.3, y0 + 0.1, zr), P(0.55, y0 + 0.1, zr), P(0.55, y1 - 0.1, zr), P(x0 + 0.3, y1 - 0.1, zr) ])} fill="url(#ga-car-top)" />
                <polygon points={pts([ P(0.55, y0 + 0.1, zr), P(0.55, y1 - 0.1, zr), P(1.2, y1 - 0.1, zt), P(1.2, y0 + 0.1, zt) ])} fill="url(#ga-car-glass)" />
                <polygon points={pts([ P(0.65, y0 + 0.4, zr - 0.12), P(0.65, y0 + 0.6, zr - 0.12), P(1.08, y0 + 0.9, zt + 0.08), P(1.08, y0 + 0.7, zt + 0.08) ])} fill="#ffffff" opacity="0.22" />
                {/* the side windows, split by the B-pillar */}
                <polygon points={pts([ P(x0 + 0.18, y1 - 0.098, zt + 0.07), P(x0 + 0.38, y1 - 0.098, zr - 0.07), P(-0.5, y1 - 0.098, zr - 0.07), P(-0.5, y1 - 0.098, zt + 0.07) ])} fill="url(#ga-car-glass)" />
                <polygon points={pts([ P(-0.36, y1 - 0.098, zt + 0.07), P(-0.36, y1 - 0.098, zr - 0.07), P(0.5, y1 - 0.098, zr - 0.07), P(1.05, y1 - 0.098, zt + 0.07) ])} fill="url(#ga-car-glass)" />
                {ln(P(x0 + 0.35, y1 - 0.097, zr - 0.12), P(0.4, y1 - 0.097, zr - 0.12), "#ffffff", 0.8, 0.18)}
                {/* door lines, a handle, the tail lamp */}
                {[ -0.43, 0.55 ].map(u => <g key={u}>{ln(P(u, y1 + 0.002, zb + 0.08), P(u, y1 + 0.002, zt), "#4a2596", 0.7)}</g>)}
                <polygon points={onLeft(P, y1 + 0.003, -0.2, 0.05, 0.78, 0.83)} fill="#4a2596" />
                <polygon points={onLeft(P, y1 + 0.003, x0, x0 + 0.12, 0.62, 0.86)} fill="#d23a3a" />
                {/* the wing mirror */}
                <polygon points={pts([ P(0.62, y1, zt + 0.05), P(0.62, y1 + 0.2, zt + 0.08), P(0.75, y1 + 0.2, zt + 0.16), P(0.75, y1, zt + 0.14) ])} fill="#864fe3" />
                {/* the front: grille, lamps, plate, bumper */}
                <polygon points={onRight(P, x1 + 0.002, -0.32, 0.32, 0.5, 0.74)} fill="#1d2733" />
                {[ 0.56, 0.62, 0.68 ].map(z => <g key={z}>{ln(P(x1 + 0.003, -0.3, z), P(x1 + 0.003, 0.3, z), "#5f6b78", 0.5)}</g>)}
                <polygon points={pts([ P(x1 + 0.002, -0.76, 0.72), P(x1 + 0.002, -0.42, 0.74), P(x1 + 0.002, -0.42, 0.86), P(x1 + 0.002, -0.72, 0.88) ])} fill="#f4f6f8" />
                <polygon points={pts([ P(x1 + 0.002, 0.42, 0.74), P(x1 + 0.002, 0.76, 0.72), P(x1 + 0.002, 0.72, 0.88), P(x1 + 0.002, 0.42, 0.86) ])} fill="#f4f6f8" />
                <polygon points={onRight(P, x1 + 0.003, -0.24, 0.24, 0.34, 0.46)} fill="#f4f6f8" />
                <polygon points={onRight(P, x1 + 0.002, y0, y1, zb, zb + 0.06)} fill="#4a2596" />
                {wheel(-1.05)}{wheel(1.05)}
            </g>
        </Art>
    );
};

// THE FLATS ===========================================================================================================
// a low-poly block: two turmeric towers of eight storeys with sandalwood tops, stepped roofs and entrance canopies, on a
// courtyard with trees, planters, lamps and a teal car, a road round two sides, on a slab of earth
export const FlatArt = () => {
    const s = 18, P = iso([ 80, 90 ], s);
    const brick : Shade = { top : "#f4c25a", left : "#eaaa3a", right : "#c98a14" };
    const cream : Shade = { top : "#f3eee4", left : "#ede6d7", right : "#d6c8ac" };
    const items : { d : number; el : ReactNode }[] = [];
    const tower = (cx : number, cy : number, k : string) => {
        const x0 = cx - 0.5, y0 = cy - 0.5, H = 3.6, band = 0.8, x1 = x0 + 1, y1 = y0 + 1, fh = (H - 0.3) / 8;
        const win = (pl : "l" | "r", u : number, z : number, key : string) => {
            const fr = pl === "l" ? onLeft(P, y1 + 0.003, u, u + 0.26, z, z + 0.26) : onRight(P, x1 + 0.003, u, u + 0.26, z, z + 0.26);
            const gl = pl === "l" ? onLeft(P, y1 + 0.004, u + 0.035, u + 0.225, z + 0.035, z + 0.225) : onRight(P, x1 + 0.004, u + 0.035, u + 0.225, z + 0.035, z + 0.225);
            return <g key={key}><polygon points={fr} fill="#fbf8f2" /><polygon points={gl} fill={pl === "l" ? "#6b5650" : "#55433e"} /></g>;
        };
        items.push({ d : cx + cy + 1, el : (
            <g key={k}>
                <Box P={P} x={x0} y={y0} z={0} w={1} d={1} h={H - band} c={brick} />
                <Box P={P} x={x0} y={y0} z={H - band} w={1} d={1} h={band} c={cream} />
                {Array.from({ length : 8 }, (_, f) => [ 0.14, 0.6 ].flatMap((u, c) => [ win("l", x0 + u, 0.3 + f * fh, `l${f}${c}`), win("r", y0 + u, 0.3 + f * fh, `r${f}${c}`) ]))}
                {/* the stepped roof and its deck */}
                <Box P={P} x={x0 - 0.05} y={y0 - 0.05} z={H} w={1.1} d={1.1} h={0.1} c={cream} />
                <polygon points={onTop(P, H + 0.101, x0 + 0.08, y0 + 0.08, x1 - 0.08, y1 - 0.08)} fill="#e1d5bc" />
                <Box P={P} x={x0 + 0.1} y={y0 + 0.1} z={H + 0.1} w={0.5} d={0.35} h={0.14} c={cream} />
                <polygon points={onTop(P, H + 0.241, x0 + 0.14, y0 + 0.14, x0 + 0.56, y0 + 0.41)} fill="#e1d5bc" />
                {/* the entrance: door, canopy, steps */}
                <polygon points={onLeft(P, y1 + 0.004, x0 + 0.36, x0 + 0.64, 0, 0.42)} fill="#fbf8f2" />
                <Box P={P} x={x0 + 0.3} y={y1} z={0.46} w={0.4} d={0.18} h={0.05} c={cream} />
                <Box P={P} x={x0 + 0.28} y={y1} z={0} w={0.44} d={0.3} h={0.05} c={cream} />
                <Box P={P} x={x0 + 0.28} y={y1} z={0.05} w={0.44} d={0.15} h={0.05} c={cream} />
            </g>
        ) });
    };
    tower(-1.2, 0.2, "t1"); tower(0.2, -1.2, "t2");
    const round = (x : number, y : number, r : number, light : boolean) => items.push({ d : x + y, el : (
        <g key={`r${x}${y}`}>
            <line x1={P(x, y, 0)[0]} y1={P(x, y, 0)[1]} x2={P(x, y, 0.5)[0]} y2={P(x, y, 0.5)[1]} stroke="#7a4a2e" strokeWidth="1.6" />
            {crown(P(x, y, 0.5 + r), r * s, light ? "#8fb23f" : "#6b8e23", light ? "#b5cf6a" : "#8fb23f")}
        </g>
    ) });
    const cone = (x : number, y : number) => items.push({ d : x + y, el : (
        <g key={`c${x}${y}`}>
            <line x1={P(x, y, 0)[0]} y1={P(x, y, 0)[1]} x2={P(x, y, 0.3)[0]} y2={P(x, y, 0.3)[1]} stroke="#7a4a2e" strokeWidth="1.6" />
            {(() => { const b = P(x, y, 0.3), t = P(x, y, 1.45); return <g><polygon points={pts([ [ b[0] - 0.32 * s, b[1] - 0.2 * s ], [ t[0], t[1] ], [ b[0] + 0.32 * s, b[1] - 0.2 * s ], [ b[0], b[1] + 0.05 * s ] ])} fill="#6b8e23" /><polygon points={pts([ [ b[0] - 0.32 * s, b[1] - 0.2 * s ], [ t[0], t[1] ], [ b[0], b[1] + 0.05 * s ] ])} fill="#8fb23f" /></g>; })()}
        </g>
    ) });
    const planter = (x : number, y : number) => items.push({ d : x + y + 0.3, el : (
        <g key={`p${x}${y}`}>
            <Box P={P} x={x} y={y} z={0} w={0.45} d={0.2} h={0.14} c={{ top : "#6b8e23", left : "#b98a5e", right : "#946a44" }} />
            {[ 0.08, 0.22, 0.36 ].map(u => <g key={u}>{crown(P(x + u, y + 0.1, 0.24), 0.11 * s, "#5d7d1d", "#8fb23f")}</g>)}
        </g>
    ) });
    const lamp = (x : number, y : number) => items.push({ d : x + y, el : (
        <g key={`l${x}${y}`}>
            <line x1={P(x, y, 0)[0]} y1={P(x, y, 0)[1]} x2={P(x, y, 1.2)[0]} y2={P(x, y, 1.2)[1]} stroke="#4a4a4a" strokeWidth="0.9" />
            <line x1={P(x, y, 1.2)[0]} y1={P(x, y, 1.2)[1]} x2={P(x + 0.18, y - 0.18, 1.25)[0]} y2={P(x + 0.18, y - 0.18, 1.25)[1]} stroke="#4a4a4a" strokeWidth="0.9" />
            <circle cx={P(x + 0.2, y - 0.2, 1.24)[0]} cy={P(x + 0.2, y - 0.2, 1.24)[1]} r="1.3" fill="#eaaa3a" />
        </g>
    ) });
    cone(-1.75, -0.45); round(-1.65, 0.75, 0.24, true); round(-0.95, 1.05, 0.22, false); round(-0.3, 1.05, 0.2, true);
    round(1.05, 0.55, 0.22, false); round(1.05, -0.25, 0.2, true); cone(1.0, -1.55); round(0.75, 1.0, 0.2, true);
    planter(-1.5, 0.75); planter(-0.95, 0.75); planter(-0.05, -0.65); planter(0.45, -0.65);
    lamp(-1.6, 1.2); lamp(0.2, 1.2); lamp(1.2, 0.95); lamp(1.2, -0.9);
    items.push({ d : 0.9, el : (
        <g key="car">
            <Box P={P} x={0.05} y={0.35} z={0.04} w={0.6} d={0.3} h={0.12} c={{ top : "#6fb0b3", left : "#478f93", right : "#1e4e51" }} />
            <Box P={P} x={0.18} y={0.38} z={0.16} w={0.3} d={0.24} h={0.1} c={{ top : "#8cc0c2", left : "#3a2f2c", right : "#2a2220" }} />
        </g>
    ) });
    items.sort((a, b) => a.d - b.d);
    return (
        <Art label="Two apartment towers">
            <ellipse cx="80" cy="132" rx="66" ry="10" fill="#2f2f2f" opacity="0.1" />
            {/* the slab of earth, its grass, the road and the courtyard */}
            <Box P={P} x={-2} y={-2} z={-0.42} w={4} d={4} h={0.42} c={{ top : "#8fb23f", left : "#8a5a37", right : "#6a4128" }} />
            <polygon points={onLeft(P, 2.001, -2, 2, -0.08, 0)} fill="#7fa834" /><polygon points={onRight(P, 2.001, -2, 2, -0.08, 0)} fill="#6b8e23" />
            <polygon points={onTop(P, 0.002, -1.95, 1.28, 1.95, 1.9)} fill="#3a3633" />
            <polygon points={onTop(P, 0.003, 1.28, -1.95, 1.9, 1.9)} fill="#3a3633" />
            {Array.from({ length : 9 }, (_, k) => -1.8 + k * 0.38).map(u => <g key={u}>
                <line x1={P(u, 1.59, 0.004)[0]} y1={P(u, 1.59, 0.004)[1]} x2={P(u + 0.16, 1.59, 0.004)[0]} y2={P(u + 0.16, 1.59, 0.004)[1]} stroke="#ffffff" strokeWidth="0.8" />
                {u < 1.1 && <line x1={P(1.59, u, 0.004)[0]} y1={P(1.59, u, 0.004)[1]} x2={P(1.59, u + 0.16, 0.004)[0]} y2={P(1.59, u + 0.16, 0.004)[1]} stroke="#ffffff" strokeWidth="0.8" />}
            </g>)}
            <polygon points={onTop(P, 0.004, -1.85, -1.85, 1.18, 1.18)} fill="#b9b2a6" stroke="#ece7dc" strokeWidth="1.2" />
            <polygon points={onTop(P, 0.005, -1.85, 0.55, -1.25, 1.18)} fill="#8fb23f" />
            <polygon points={onTop(P, 0.005, 0.6, -1.85, 1.18, -1.2)} fill="#8fb23f" />
            {items.map(i => i.el)}
        </Art>
    );
};

// THE PENTHOUSE =======================================================================================================
// a modern tower of nine storeys on a rounded plinth with a lawn: teal glass walls behind white balcony bands, white
// fins and corner frames, and on the roof a round drum, two white boxes and a glass penthouse with plants; round trees
// along the lawn
export const PenthouseArt = () => {
    const s = 17, P = iso([ 80, 112 ], s);
    const x0 = -1.2, x1 = 1.2, y0 = -0.9, y1 = 0.9, H = 4.6, floors = 9, fh = (H - 0.3) / floors;
    const white : Shade = { top : "#ffffff", left : "#eef1f6", right : "#cfd5df" };
    const tree = (x : number, y : number) => {
        const b = P(x, y, 0), t = P(x, y, 0.62);
        return <g key={`${x}${y}`}><line x1={b[0]} y1={b[1]} x2={t[0]} y2={t[1]} stroke="#3a3530" strokeWidth="1.1" /><circle cx={t[0]} cy={t[1] - 0.18 * s} r={0.3 * s} fill="url(#ga-pent-tree)" /></g>;
    };
    const dr = P(-0.65, -0.45, H + 0.15), R = 0.38;
    return (
        <Art label="A glass tower with a penthouse" defs={<>
            <linearGradient id="ga-pent-gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6fb0b3" /><stop offset="0.5" stopColor="#478f93" /><stop offset="1" stopColor="#2f6f73" /></linearGradient>
            <linearGradient id="ga-pent-gr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#478f93" /><stop offset="1" stopColor="#1e4e51" /></linearGradient>
            <linearGradient id="ga-pent-sky" x1="0" y1="0" x2="1" y2="0"><stop offset="0.1" stopColor="#fff" stopOpacity="0" /><stop offset="0.45" stopColor="#e2f2f2" stopOpacity="0.35" /><stop offset="0.6" stopColor="#fff" stopOpacity="0" /></linearGradient>
            <radialGradient id="ga-pent-tree" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stopColor="#a6d15a" /><stop offset="1" stopColor="#4f8a1e" /></radialGradient>
        </>}>
            <ellipse cx="82" cy="140" rx="54" ry="8" fill="#2f2f2f" opacity="0.1" />
            {/* the plinth and its lawn, rounded */}
            <Box P={P} x={-1.75} y={-1.55} z={-0.22} w={3.5} d={3.1} h={0.22} c={{ top : "#f3eee4", left : "#e1d5bc", right : "#c9b99a" }} />
            <polygon points={onTop(P, 0.001, -1.55, -1.35, 1.55, 1.35)} fill="#86a83c" stroke="#86a83c" strokeWidth="4" strokeLinejoin="round" />
            {/* the tower's walls, glass behind bands and fins */}
            <Box P={P} x={x0} y={y0} z={0} w={x1 - x0} d={y1 - y0} h={H} c={{ top : "#ffffff", left : "url(#ga-pent-gl)", right : "url(#ga-pent-gr)" }} />
            <polygon points={onLeft(P, y1 + 0.001, x0, x1, 0, H)} fill="url(#ga-pent-sky)" />
            {Array.from({ length : floors }, (_, f) => {
                const z = 0.3 + f * fh;
                return <g key={f}>
                    <polygon points={onLeft(P, y1 + 0.13, x0 + 0.1, x1, z, z + 0.07)} fill="#f4f6fa" />
                    <polygon points={onLeft(P, y1 + 0.13, x0 + 0.1, x1, z + 0.07, z + 0.22)} fill="#ffffff" opacity="0.28" />
                    <polygon points={onRight(P, x1 + 0.13, y0, y1 + 0.13, z, z + 0.07)} fill="#d9dfe9" />
                    <polygon points={onRight(P, x1 + 0.13, y0, y1 + 0.13, z + 0.07, z + 0.22)} fill="#ffffff" opacity="0.2" />
                </g>;
            })}
            <Box P={P} x={-0.5} y={y1} z={0} w={0.22} d={0.15} h={H + 0.1} c={white} />
            <Box P={P} x={x1} y={-0.15} z={0} w={0.15} d={0.22} h={H + 0.1} c={white} />
            <Box P={P} x={x0 - 0.06} y={y1 - 0.1} z={0} w={0.22} d={0.25} h={H + 0.1} c={white} />
            <Box P={P} x={x1 - 0.1} y={y1 - 0.1} z={0} w={0.25} d={0.25} h={H + 0.1} c={white} />
            <Box P={P} x={x1 - 0.1} y={y0 - 0.06} z={0} w={0.25} d={0.22} h={H + 0.1} c={white} />
            {/* the roof: slab, drum, boxes and the glass penthouse with its plants */}
            <Box P={P} x={x0 - 0.12} y={y0 - 0.12} z={H} w={x1 - x0 + 0.24} d={y1 - y0 + 0.24} h={0.15} c={white} />
            <polygon points={onTop(P, H + 0.151, x0, y0, x1, y1)} fill="#a9d0d1" />
            <rect x={dr[0] - R * s * 1.2247} y={dr[1] - 0.35 * s} width={2 * R * s * 1.2247} height={0.35 * s} fill="#e3e7ee" />
            <ellipse cx={dr[0]} cy={dr[1]} rx={R * s * 1.2247} ry={R * s * 0.7071} fill="#cfd5df" />
            <ellipse cx={dr[0]} cy={dr[1] - 0.35 * s} rx={R * s * 1.2247} ry={R * s * 0.7071} fill="#ffffff" stroke="#dfe3ea" strokeWidth="0.8" />
            <Box P={P} x={0.05} y={-0.85} z={H + 0.15} w={0.38} d={0.32} h={0.36} c={white} />
            <Box P={P} x={0.4} y={-0.45} z={H + 0.15} w={0.5} d={0.5} h={0.62} c={{ top : "#8cc0c2", left : "url(#ga-pent-gl)", right : "url(#ga-pent-gr)" }} />
            {[ 0.55, 0.72 ].map(u => <line key={u} x1={P(u, 0.051, H + 0.15)[0]} y1={P(u, 0.051, H + 0.15)[1]} x2={P(u, 0.051, H + 0.77)[0]} y2={P(u, 0.051, H + 0.77)[1]} stroke="#d5ebeb" strokeWidth="0.5" />)}
            {[ [ 0.55, -0.3 ], [ 0.75, -0.15 ] ].map(([ u, v ]) => { const c = P(u, v, H + 0.85); return <g key={u}><circle cx={c[0]} cy={c[1]} r="3" fill="#5d8c1f" /><circle cx={c[0] - 1} cy={c[1] - 1} r="1.6" fill="#8fc24a" /></g>; })}
            <Box P={P} x={0.6} y={0.45} z={H + 0.15} w={0.45} d={0.38} h={0.3} c={white} />
            {/* the trees along the lawn */}
            {[ [ -1.4, 1.2 ], [ -0.75, 1.2 ], [ -0.05, 1.2 ], [ 0.65, 1.2 ], [ 1.4, 1.15 ], [ 1.45, 0.35 ], [ 1.45, -0.5 ], [ 1.45, -1.2 ] ].map(([ x, y ]) => tree(x, y))}
        </Art>
    );
};

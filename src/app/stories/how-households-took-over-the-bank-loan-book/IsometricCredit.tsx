"use client";

import { Building2, Factory, Shapes, Store, UsersRound, type LucideIcon } from "lucide-react";
import { useId, type CSSProperties } from "react";

export type CreditGroup = "individuals" | "companies" | "public" | "businesses" | "others";
export type CreditShares = Record<CreditGroup, number>;

export const CREDIT_GROUPS : { key : CreditGroup; label : string; lines : string[]; short : string; icon : LucideIcon }[] = [
    { key : "individuals", label : "Individuals", lines : [ "Individuals" ], short : "Individuals", icon : UsersRound },
    { key : "companies", label : "Private companies", lines : [ "Private", "companies" ], short : "Companies", icon : Factory },
    { key : "public", label : "Government and public sector", lines : [ "Government and", "public sector" ], short : "Government", icon : Building2 },
    { key : "businesses", label : "Proprietors and partnerships", lines : [ "Proprietors and", "partnerships" ], short : "Proprietors", icon : Store },
    { key : "others", label : "Others", lines : [ "Others" ], short : "Others", icon : Shapes },
];

// A parallel isometric projection: ground units equal on both axes, height in viewBox units. The bank heads one row of
// five stacks that runs across the screen (the row's direction, u up and v down, projects to a horizontal line), so
// no stack hides another and every label has its own column. Equal footprints: only height differs, and height is
// the group's share of every ₹100 lent. Architectural details and people do not encode counts.
const S = 44;                                   // one ground unit, in viewBox units
const STEP = 1.85;                              // the row's spacing, in ground units
const FOOT = 1.3;                               // a stack's footprint
const PER_RUPEE = 8.5;                          // height of ₹1
const LANE = 1.2;                               // the road in front of the row, as an offset towards the reader
const project = (u : number, v : number, z = 0) : [ number, number ] => [ (u - v) * 0.866 * S, (u + v) * 0.5 * S - z ];
const pt = (u : number, v : number, z = 0) => project(u, v, z).join(",");
const poly = (points : [ number, number ][]) => `M${points.map(p => p.join(",")).join(" L")} Z`;
const centre = (k : number) : [ number, number ] => [ k * STEP, -k * STEP ];

// A box from z0 to z1 over u0..u1, v0..v1; only the three faces the reader can see.
const Box = ({ u0, u1, v0, v1, z0 = 0, z1, className } : {
    u0 : number; u1 : number; v0 : number; v1 : number; z0 ? : number; z1 : number; className ? : string;
}) => <g className={className}>
    <path className="iso-face-left" d={poly([ project(u0, v1, z1), project(u1, v1, z1), project(u1, v1, z0), project(u0, v1, z0) ])} />
    <path className="iso-face-right" d={poly([ project(u1, v1, z1), project(u1, v0, z1), project(u1, v0, z0), project(u1, v1, z0) ])} />
    <path className="iso-face-top" d={poly([ project(u0, v0, z1), project(u1, v0, z1), project(u1, v1, z1), project(u0, v1, z1) ])} />
</g>;

// The bank: a stepped plinth, a colonnade on the face towards the row, an entablature with its name and a pediment.
const BANK = { u : -0.37, v : 0.37, a : 1.1, b : 1.0 };
const Bank = () => {
    const { u, v, a, b } = BANK;
    const u0 = u - a, u1 = u + a, v0 = v - b, v1 = v + b, vm = v;
    const BASE = 16, CAP = 84, TOP = 98, RIDGE = 126;
    const columns = [ -0.72, -0.36, 0.36, 0.72 ].map(d => vm + d);
    const [ sx, sy ] = project(u1, vm, (CAP + TOP) / 2);
    return <g className="iso-bank" aria-hidden="true">
        <Box className="iso-stone is-step" u0={u0 - 0.28} u1={u1 + 0.28} v0={v0 - 0.28} v1={v1 + 0.28} z1={7} />
        <Box className="iso-stone is-step" u0={u0 - 0.14} u1={u1 + 0.14} v0={v0 - 0.14} v1={v1 + 0.14} z0={7} z1={BASE} />
        <Box className="iso-stone is-hall" u0={u0 + 0.22} u1={u1 - 0.22} v0={v0} v1={v1} z0={BASE} z1={CAP} />
        {/* the door, deep in the portico, between the middle columns */}
        <path className="iso-bank-door" d={poly([ project(u1 - 0.22, vm + 0.22, 64), project(u1 - 0.22, vm - 0.22, 64), project(u1 - 0.22, vm - 0.22, BASE), project(u1 - 0.22, vm + 0.22, BASE) ])} />
        {columns.map(c => <g key={c} className="iso-bank-column">
            <path className="iso-face-left" d={poly([ project(u1 - 0.12, c + 0.08, CAP), project(u1, c + 0.08, CAP), project(u1, c + 0.08, BASE), project(u1 - 0.12, c + 0.08, BASE) ])} />
            <path className="iso-face-right" d={poly([ project(u1, c + 0.08, CAP), project(u1, c - 0.08, CAP), project(u1, c - 0.08, BASE), project(u1, c + 0.08, BASE) ])} />
        </g>)}
        <Box className="iso-stone is-cornice" u0={u0} u1={u1} v0={v0} v1={v1} z0={CAP} z1={TOP} />
        <path className="iso-roof is-back" d={poly([ project(u0, v0, TOP), project(u1, v0, TOP), project(u1, vm, RIDGE), project(u0, vm, RIDGE) ])} />
        <path className="iso-roof" d={poly([ project(u0, vm, RIDGE), project(u1, vm, RIDGE), project(u1, v1, TOP), project(u0, v1, TOP) ])} />
        <path className="iso-gable" d={poly([ project(u1, v1, TOP), project(u1, vm, RIDGE), project(u1, v0, TOP) ])} />
        <text className="iso-bank-name" transform={`matrix(0.866 -0.5 0 1 ${sx} ${sy})`} textAnchor="middle" dominantBaseline="central">BANK</text>
    </g>;
};

// THE BUILDINGS =======================================================================================================
// Each group has its own marker: a human tower for individuals, a glass office tower for private
// companies, a parliament's colonnaded rotunda for government, a stack of shops run by partners for proprietors and
// partnerships, a co-operative hall for the rest. Height is still the share, the same for all five. People are
// symbolic: the height of their tower encodes money, not the number of people who borrow.
type Kind = CreditGroup;
type Frame = { u0 : number; u1 : number; v0 : number; v1 : number; h : number; t : number; n : number };
const RUPEES_A_TIER : Record<CreditGroup, number> = { individuals : 2, companies : 2, public : 2, businesses : 2, others : 2 };
const tiersOf = (share : number, kind : CreditGroup) => Math.max(1, Math.round(share / RUPEES_A_TIER[kind]));

// A quad on the face towards the reader's left (the v1 plane) and on the face towards the right (the u1 plane);
// `out` pushes the lower edge out of the wall, as an awning does.
const onLeft = ({ v1 } : Frame, ua : number, ub : number, za : number, zb : number, out = 0) =>
    poly([ project(ua, v1, zb), project(ub, v1, zb), project(ub, v1 + out, za), project(ua, v1 + out, za) ]);
const onRight = ({ u1 } : Frame, va : number, vb : number, za : number, zb : number, out = 0) =>
    poly([ project(u1, vb, zb), project(u1, va, zb), project(u1 + out, va, za), project(u1 + out, vb, za) ]);

// A person seen from the front, feet at (x, y); t is the height from the feet to the shoulders.
const SKIN = [ "#8d5a3b", "#a86b45", "#6b4430", "#9a6240", "#7a4b33" ];
const Person = ({ x, y, t, i, arms = false } : { x : number; y : number; t : number; i : number; arms ? : boolean }) =>
    <g className="iso-person">
        {arms && <rect x={x - 0.5 * t} y={y - 0.96 * t} width={t} height={0.13 * t} rx={0.06 * t} fill={SKIN[i % 5]} />}
        <rect className="iso-legs" x={x - 0.19 * t} y={y - 0.48 * t} width={0.17 * t} height={0.48 * t} rx={0.04 * t} />
        <rect className="iso-legs" x={x + 0.02 * t} y={y - 0.48 * t} width={0.17 * t} height={0.48 * t} rx={0.04 * t} />
        <rect className={`iso-cloth is-c${(i * 7) % 5}`} x={x - 0.25 * t} y={y - t} width={0.5 * t} height={0.6 * t} rx={0.12 * t} />
        <circle cx={x} cy={y - 1.18 * t} r={0.2 * t} fill={SKIN[(i * 3) % 5]} />
    </g>;

// An adult figure in three-quarter view, with a small head, shaped torso, long legs, a profile and clothing folds.
// Supporting figures brace the ankles of the person on their shoulders; the person at the summit balances freely.
const HUMAN_HEIGHT = 72;
const SHOULDER_HEIGHT = 54;
const HUMAN_SHIRTS = [ "var(--c-emph)", "color-mix(in oklch, var(--c-emph), white 28%)", "#f2f0e6", "color-mix(in oklch, var(--c-emph), black 20%)", "#b87565" ];
const TowerPerson = ({ x, y, i, supporting } : { x : number; y : number; i : number; supporting : boolean }) => {
    const tiedHair = i % 4 === 1;
    return <g className="iso-tower-person" transform={`translate(${x} ${y})`}
        style={{ "--person-shirt" : HUMAN_SHIRTS[i % HUMAN_SHIRTS.length], "--person-skin" : SKIN[i % SKIN.length] } as CSSProperties}>
        {/* The darker leg and sleeve sit behind the nearer side of the body. */}
        <path className="iso-person-trousers is-far" d="M0,-33 L7,-32 Q9,-25 8,-18 L8,-3 L4,-2 L2,-17 L-1,-26 Z" />
        <path className="iso-person-trousers" d="M-7,-33 L1,-32 L0,-24 L-3,-16 L-5,-2 L-10,-3 L-8,-18 Q-9,-26 -7,-33 Z" />
        <path className="iso-person-shoes" d="M4,-3 L8,-3 L12,-1 Q13,0 10,0 L4,0 Z M-10,-3 L-5,-3 L-2,-1 Q-1,0 -4,0 L-11,0 Z" />
        <path className="iso-person-trouser-fold" d="M4,-28 L5,-19 L6,-7 M-5,-29 L-6,-20 L-7,-7" />
        <path className="iso-person-skin" d="M-2.5,-61 L2,-61 L2.5,-54 Q0,-52 -3,-55 Z" />
        <path className="iso-person-shirt" d="M-3,-57 Q-9,-56 -10,-52 L-8,-43 L-7,-33 Q-1,-31 7,-33 L8,-43 L8,-51 Q6,-56 2,-57 L0,-54 Z" />
        <path className="iso-person-shirt-side" d="M4,-56 Q9,-54 9,-49 L7,-33 L3,-32 Q5,-44 4,-56 Z" />
        <path className="iso-person-cloth-fold" d="M-5,-50 Q-2,-48 1,-49 M-5,-36 L1,-35 M4,-44 L3,-39" />
        <path className="iso-person-collar" d="M-3,-57 L0,-54 L3,-56" />
        {supporting ? <>
            <path className="iso-person-skin" d="M-12,-48 L-15,-43 Q-18,-41 -19,-45 L-12,-57 Q-10,-60 -8,-59 L-7,-57 L-10,-55 L-14,-46 L-9,-46 Z" />
            <path className="iso-person-shirt" d="M-7,-55 Q-12,-55 -14,-49 L-10,-45 L-5,-50 Z" />
            <path className="iso-person-skin-side" d="M10,-49 L15,-44 L11,-55 L8,-57 Q7,-60 10,-60 L13,-58 L19,-46 Q20,-41 16,-41 L7,-46 Z" />
            <path className="iso-person-shirt-side" d="M5,-55 Q11,-54 13,-49 L9,-44 L3,-50 Z" />
        </> : <>
            <path className="iso-person-skin" d="M-11,-50 L-19,-49 L-25,-54 Q-28,-55 -28,-52 L-23,-47 Q-20,-45 -17,-45 L-8,-46 Z" />
            <path className="iso-person-shirt" d="M-7,-55 Q-12,-54 -15,-51 L-13,-46 L-6,-47 Z" />
            <path className="iso-person-skin-side" d="M10,-50 L18,-48 L23,-51 Q26,-52 27,-50 L21,-45 Q19,-44 16,-45 L7,-46 Z" />
            <path className="iso-person-shirt-side" d="M5,-55 Q10,-54 14,-51 L12,-46 L4,-47 Z" />
        </>}
        {/* Ears, a small nose, jaw shading and an understated eye keep the face human at the chart's scale. */}
        <path className="iso-person-skin" d="M-1,-71 Q4,-71 5,-67 L5,-66 L7,-64.5 L5,-63.5 L4.5,-61 Q3,-59 0,-59 L-3,-61 L-4,-65 Q-5,-70 -1,-71 Z" />
        <path className="iso-person-skin-side" d="M3,-69 L5,-67 L5,-66 L7,-64.5 L5,-63.5 L4.5,-61 Q2,-59 0,-59 Q3,-63 3,-69 Z" />
        <ellipse className="iso-person-skin" cx="-3.2" cy="-65.3" rx="1.5" ry="2" />
        {tiedHair ? <>
            <ellipse className="iso-person-hair" cx="-5.3" cy="-67.5" rx="2.6" ry="3" />
            <path className="iso-person-hair" d="M-4,-64 Q-6,-71 -1,-72 Q4,-73 5,-68 Q1,-69 -2,-66 Z" />
        </> : <path className="iso-person-hair" d="M-4,-64 Q-6,-70 -2,-72 Q3,-73 5,-70 L5,-68 Q2,-70 -1,-67 L-2,-63 Z" />}
        <path className="iso-person-face-detail" d="M2,-66.8 L3.6,-66.5 M3.1,-61.5 L4.3,-61.7" />
    </g>;
};

// Only people, standing directly on shoulders: no floors, slabs or enclosing column. Tiers are chosen to keep adult
// proportions close to natural; a small vertical adjustment makes the tower's crown land on the exact money height.
const HumanTower = ({ u0, u1, v0, v1, h } : Frame) => {
    const [ cx, cy ] = project((u0 + u1) / 2, (v0 + v1) / 2);
    const tiers = Math.max(2, Math.round((h - HUMAN_HEIGHT) / SHOULDER_HEIGHT) + 1);
    const naturalHeight = HUMAN_HEIGHT + (tiers - 1) * SHOULDER_HEIGHT;
    return <g className="iso-human-tower">
        <ellipse className="iso-person-shadow" cx={cx} cy={cy + 1} rx="43" ry="9" />
        <g transform={`translate(${cx} ${cy}) scale(1 ${h / naturalHeight})`}>
            {Array.from({ length : tiers }, (_, tier) => {
                const summit = tier === tiers - 1;
                return <g key={tier} className="iso-human-tier" data-tier={tier}>
                    {(summit ? [ 0 ] : [ -30, 30, 0 ]).map((offset, j) => <TowerPerson key={offset}
                        x={offset} y={-tier * SHOULDER_HEIGHT} i={tier * 3 + j} supporting={!summit} />)}
                </g>;
            })}
        </g>
    </g>;
};

// Private companies: a glass tower with fins, a lit crown, the firm's mark, a lobby canopy, a helipad and a spire.
const OfficeTower = (f : Frame) => {
    const { u0, u1, v0, v1, h, t, n } = f;
    const fins = [ 0.22, 0.43, 0.65, 0.87, 1.08 ];
    const crown = Math.min(7, h * 0.12);
    const [ rx, ry ] = [ 0.36 * S * 1.2247, 0.36 * S * 0.7071 ];
    const [ cx, cy ] = project(u0 + 0.65, v0 + 0.65, h);
    return <g>
        <path className="iso-glass is-left" d={onLeft(f, u0, u1, 0, h)} />
        <path className="iso-glass is-right" d={onRight(f, v0, v1, 0, h)} />
        <path className="iso-glint" d={poly([ project(u0 + 0.12, v1, h * 0.96), project(u0 + 0.42, v1, h * 0.96), project(u0 + 1.0, v1, h * 0.3), project(u0 + 0.7, v1, h * 0.3) ])} />
        {Array.from({ length : n - 1 }, (_, i) => <path key={`f${i}`} className="iso-floor"
            d={`M${pt(u0, v1, (i + 1) * t)} L${pt(u1, v1, (i + 1) * t)} L${pt(u1, v0, (i + 1) * t)}`} />)}
        {fins.map(a => <path key={`n${a}`} className="iso-fin"
            d={`M${pt(u0 + a, v1, 9)} L${pt(u0 + a, v1, h - crown)} M${pt(u1, v0 + a, 9)} L${pt(u1, v0 + a, h - crown)}`} />)}
        <path className="iso-crown" d={onLeft(f, u0, u1, h - crown, h)} />
        <path className="iso-crown is-right" d={onRight(f, v0, v1, h - crown, h)} />
        {h > 40 && <>
            <path className="iso-logo" d={onLeft(f, u0 + 0.42, u0 + 0.88, h - crown - 17, h - crown - 5)} />
            <path className="iso-logo-mark" d={onLeft(f, u0 + 0.55, u0 + 0.75, h - crown - 14, h - crown - 8)} />
        </>}
        <path className="iso-lobby" d={onLeft(f, u0 + 0.1, u1 - 0.1, 0, 8)} />
        <path className="iso-lobby" d={onRight(f, v0 + 0.1, v1 - 0.1, 0, 8)} />
        <path className="iso-canopy" d={onLeft(f, u0 + 0.25, u1 - 0.25, 8, 10, 0.22)} />
        <path className="iso-roof-top" d={poly([ project(u0, v0, h), project(u1, v0, h), project(u1, v1, h), project(u0, v1, h) ])} />
        <ellipse className="iso-helipad" cx={cx} cy={cy} rx={rx} ry={ry} />
        <text className="iso-helipad-h" transform={`translate(${cx} ${cy}) scale(1 0.58)`} textAnchor="middle" dominantBaseline="central">H</text>
        <path className="iso-mast" d={`M${pt(u0 + 0.12, v0 + 0.12, h)} v-22`} />
    </g>;
};

// Government and public sector: a parliament's round colonnade, tier on tier, with a dome and the flag.
const Rotunda = (f : Frame) => {
    const { u0, v0, h, t, n } = f;
    const [ cx, cy ] = project(u0 + 0.65, v0 + 0.65, 0);
    const rx = 0.74 * S * 1.2247, ry = 0.74 * S * 0.7071;
    const front = (z : number, r = 1) => `M${cx - rx * r},${cy - z} A${rx * r},${ry * r} 0 0 0 ${cx + rx * r},${cy - z}`;
    const band = (za : number, zb : number, r = 1) => `${front(za, r)} L${cx + rx * r},${cy - zb} A${rx * r},${ry * r} 0 0 1 ${cx - rx * r},${cy - zb} Z`;
    const angles = Array.from({ length : 13 }, (_, k) => Math.PI * (k + 0.5) / 13);
    const top = cy - h, dr = 0.5;
    return <g>
        <path className="iso-drum-side" d={band(0, h)} />
        {Array.from({ length : n }, (_, i) => {
            const z = i * t;
            return <g key={i}>
                <path className="iso-colonnade" d={band(z + 0.18 * t, z + 0.78 * t, 0.985)} />
                {angles.map(a => {
                    const x = cx - rx * Math.cos(a), y = cy + ry * Math.sin(a), w = 2.6 * Math.sin(a);
                    return <rect key={a} className="iso-column" x={x - w / 2} y={y - z - 0.78 * t} width={w} height={0.6 * t} />;
                })}
                <path className="iso-cornice" d={front(z + 0.86 * t)} />
            </g>;
        })}
        <ellipse className="iso-drum-top" cx={cx} cy={top} rx={rx} ry={ry} />
        <path className="iso-dome" d={`M${cx - rx * dr},${top} A${rx * dr},${rx * dr * 0.95} 0 0 1 ${cx + rx * dr},${top} A${rx * dr},${ry * dr} 0 0 1 ${cx - rx * dr},${top} Z`} />
        <path className="iso-mast" d={`M${cx},${top - rx * dr * 0.95} v-22`} />
        <g transform={`translate(${cx} ${top - rx * dr * 0.95 - 22})`}>
            {/* The national flag at 3:2: saffron, white and green, the navy Ashoka Chakra of 24 spokes on the white. */}
            <rect width={15} height={10 / 3} fill="#ff9933" /><rect y={10 / 3} width={15} height={10 / 3} fill="#ffffff" /><rect y={20 / 3} width={15} height={10 / 3} fill="#138808" />
            <g transform="translate(7.5 5)" className="iso-chakra">
                <circle r={1.45} />
                <path d={Array.from({ length : 24 }, (_, k) => `M0,0 L${(1.45 * Math.cos(k * Math.PI / 12)).toFixed(2)},${(1.45 * Math.sin(k * Math.PI / 12)).toFixed(2)}`).join(" ")} />
            </g>
        </g>
    </g>;
};

// Proprietors, partnerships and groups: shop on shop, each with a striped awning and two partners at the counter,
// and the firm's board on the roof.
const Market = (f : Frame) => {
    const { u0, u1, v0, v1, h, t, n } = f;
    const stripes = 6, sw = (FOOT - 0.12) / stripes;
    const [ bx, by ] = project(u0 + 0.65, v0 + 0.55, h + 11);
    return <g>
        <Box className="iso-shop-wall" u0={u0} u1={u1} v0={v0} v1={v1} z1={h} />
        {Array.from({ length : n }, (_, i) => {
            const z = i * t, open = z + 0.62 * t;
            return <g key={i}>
                <path className="iso-shop-inside" d={onLeft(f, u0 + 0.1, u1 - 0.1, z + 0.08 * t, open)} />
                {[ 0.42, 0.86 ].map((a, k) => {
                    const [ x, y ] = project(u0 + a, v1 - 0.05, z + 0.24 * t);
                    return <Person key={k} x={x} y={y} t={0.42 * t} i={i * 2 + k + 1} />;
                })}
                <path className="iso-counter" d={onLeft(f, u0 + 0.1, u1 - 0.1, z + 0.08 * t, z + 0.3 * t)} />
                <path className="iso-shutter" d={onRight(f, v0 + 0.1, v1 - 0.1, z + 0.08 * t, open)} />
                {Array.from({ length : stripes }, (_, s) => <g key={`s${s}`} className={`iso-stripe ${s % 2 ? "is-plain" : `is-${i % 2 ? "b" : "a"}`}`}>
                    <path d={onLeft(f, u0 + 0.06 + s * sw, u0 + 0.06 + (s + 1) * sw, open, z + 0.92 * t, 0.16)} />
                    <path d={onRight(f, v0 + 0.06 + s * sw, v0 + 0.06 + (s + 1) * sw, open, z + 0.92 * t, 0.16)} />
                </g>)}
            </g>;
        })}
        <path className="iso-mast" d={`M${pt(u0 + 0.3, v0 + 0.55, h)} v-6 M${pt(u1 - 0.3, v0 + 0.55, h)} v-6`} />
        <path className="iso-board" d={poly([ project(u0 + 0.08, v0 + 0.55, h + 18), project(u1 - 0.08, v0 + 0.55, h + 18), project(u1 - 0.08, v0 + 0.55, h + 5), project(u0 + 0.08, v0 + 0.55, h + 5) ])} />
        <text className="iso-board-text" transform={`matrix(0.866 0.5 0 1 ${bx} ${by})`} textAnchor="middle" dominantBaseline="central">&amp; Co.</text>
    </g>;
};

// Others: a co-operative hall, people at its door.
const Hall = (f : Frame) => {
    const { u0, u1, v0, v1, h } = f;
    return <g>
        <Box u0={u0} u1={u1} v0={v0} v1={v1} z1={h} />
        <path className="iso-door" d={onLeft(f, u0 + 0.5, u0 + 0.8, 0, Math.min(h - 2, 13))} />
        <path className="iso-sign" d={onRight(f, v0 + 0.14, v0 + 0.7, Math.max(1, h - 6), h - 1.5)} />
        {[ [ 0.28, 0.2, 0 ], [ 1.0, 0.25, 1 ] ].map(([ a, o, i ]) => {
            const [ x, y ] = project(u0 + a, v1 + o, 0);
            return <Person key={i} x={x} y={y} t={11} i={i + 3} />;
        })}
    </g>;
};

// What stands above the walls, for placing the figure over each building.
const HEADROOM : Record<Kind, number> = { individuals : 12, companies : 30, public : 44, businesses : 30, others : 14 };

// One group's building, with a dashed outline where it stood in the first quarter.
const Stack = ({ kind, k, share, then, showThen } : { kind : Kind; k : number; share : number; then : number; showThen : boolean }) => {
    const [ u, v ] = centre(k);
    const h = Math.max(0.5, share * PER_RUPEE), g = then * PER_RUPEE, w = FOOT / 2;
    const n = tiersOf(share, kind);
    const f : Frame = { u0 : u - w, u1 : u + w, v0 : v - w, v1 : v + w, h, t : h / n, n };
    const { u0, u1, v0, v1 } = f;
    const ring = (z : number) => `M${pt(u0, v1, z)} L${pt(u1, v1, z)} L${pt(u1, v0, z)}`;
    const Building = { individuals : HumanTower, companies : OfficeTower, public : Rotunda, businesses : Market, others : Hall }[kind];
    return <g className="iso-stack">
        <Building {...f} />
        {showThen && (g > h
            ? <path className="iso-then" d={`${ring(g)} M${pt(u0, v1, g)} L${pt(u0, v0, g)} L${pt(u1, v0, g)}
                M${pt(u0, v1, h)} L${pt(u0, v1, g)} M${pt(u1, v1, h)} L${pt(u1, v1, g)} M${pt(u1, v0, h)} L${pt(u1, v0, g)}`} />
            : <path className="iso-then" d={ring(g)} />)}
    </g>;
};

export const IsometricCredit = ({ shares, values, then, showThen, date } : {
    shares : CreditShares; values : CreditShares; then : CreditShares; showThen : boolean; date : string;
}) => {
    const id = useId();
    const last = CREDIT_GROUPS.length;
    const [ laneU, laneV ] = [ BANK.u + BANK.a, BANK.v ];
    return <svg className="credit-isometric" viewBox="-170 -500 980 650" preserveAspectRatio="xMidYMid meet"
        role="img" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>{`Every ₹100 banks had lent, ${date}`}</title>
        <desc id={`${id}-desc`}>
            {`A bank and five stacks; each stack's height is a group's share of every ₹100 of outstanding bank credit. The individuals' stack is a symbolic human tower; its height represents money, not a count of borrowers.${
                CREDIT_GROUPS.map(g => ` ${g.label}: ₹${values[g.key].toFixed(1)}.`).join("")}`}
        </desc>
        <defs>
            <linearGradient id="credit-glass-left" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor : "var(--glass-hi)" }} />
                <stop offset="0.55" style={{ stopColor : "var(--glass-mid)" }} />
                <stop offset="1" style={{ stopColor : "var(--glass-lo)" }} />
            </linearGradient>
            <linearGradient id="credit-glass-right" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor : "var(--glass-mid)" }} />
                <stop offset="1" style={{ stopColor : "var(--glass-deep)" }} />
            </linearGradient>
            <linearGradient id="credit-drum" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" style={{ stopColor : "var(--drum-hi)" }} />
                <stop offset="0.45" style={{ stopColor : "var(--drum-mid)" }} />
                <stop offset="1" style={{ stopColor : "var(--drum-lo)" }} />
            </linearGradient>
            <radialGradient id={`${id}-fade`} gradientUnits="userSpaceOnUse" cx="320" cy="-40" r="760">
                <stop offset="0.35" stopColor="white" />
                <stop offset="1" stopColor="black" />
            </radialGradient>
            <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="5000" height="5000">
                <rect x="-2000" y="-2000" width="5000" height="5000" fill={`url(#${id}-fade)`} />
            </mask>
        </defs>

        {/* The ground runs off every edge and fades into the page. */}
        <g mask={`url(#${id}-mask)`} aria-hidden="true">
            <path className="iso-ground" d={poly([ project(-12, -20), project(22, -20), project(22, 12), project(-12, 12) ])} />
            <g className="iso-grid">
                {Array.from({ length : 19 }, (_, i) => -12 + i * STEP).map(n => <g key={n}>
                    <path d={`M${pt(n, -20)} L${pt(n, 12)}`} />
                    <path d={`M${pt(-12, n - 8)} L${pt(22, n - 8)}`} />
                </g>)}
            </g>
        </g>

        {/* The road out of the bank's door, with a spur to each stack. */}
        <g className="iso-road" aria-hidden="true">
            <path d={`M${pt(laneU, laneV)} L${pt(2 * LANE - laneV, laneV)} L${pt((last - 1) * STEP + LANE + 0.6, -(last - 1) * STEP + LANE - 0.6)}`} />
            {CREDIT_GROUPS.map((g, i) => {
                const [ u, v ] = centre(i + 1);
                return <path key={g.key} d={`M${pt(u + LANE, v + LANE)} L${pt(u + FOOT / 2, v + FOOT / 2)}`} />;
            })}
        </g>

        <Bank />
        {CREDIT_GROUPS.map((g, i) => <g key={g.key} className={`iso-category is-${g.key}`} aria-hidden="true">
            <Stack kind={g.key} k={i + 1} share={shares[g.key]} then={then[g.key]} showThen={showThen} />
        </g>)}

        {/* Flat labels: the value over each stack, the group's name under the road. */}
        <g className="iso-labels" aria-hidden="true">
            {CREDIT_GROUPS.map((g, i) => {
                const [ u, v ] = centre(i + 1);
                const [ x, top ] = project(u, v, shares[g.key] * PER_RUPEE);
                const y = project(u + LANE, v + LANE)[1];
                const Icon = g.icon;
                const primary = i < 2;
                return <g key={g.key} className={`is-${g.key}`}>
                    <text x={x} y={top - FOOT * S * 0.5 - HEADROOM[g.key]} textAnchor="middle" className={`iso-value${primary ? " is-primary" : ""}`}>
                        ₹{values[g.key].toFixed(1)}
                    </text>
                    <Icon x={x - 10} y={y + 22} width={20} height={20} strokeWidth={1.6} className="iso-icon" />
                    <text x={x} y={y + 64} textAnchor="middle" className="iso-name">
                        {g.lines.map((line, j) => <tspan key={line} x={x} dy={j ? 16 : 0}>{line}</tspan>)}
                    </text>
                </g>;
            })}
        </g>
    </svg>;
};


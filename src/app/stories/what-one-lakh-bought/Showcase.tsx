"use client";

// REACT CORE ==========================================================================================================
import { ReactNode, useLayoutEffect, useRef, useState } from "react";

// UI ==================================================================================================================
import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";

// LOCAL COMPONENTS ====================================================================================================
import { useSize } from "./useSize";

// The heirloom's showcase: a gallery drawn in one SVG, maroon walls and floor under three spotlights, with what the
// sum bought in gold in each lens year on its own display unit, a plinth in the brand vermilion, darkened, carrying a glass case,
// a black holder of the kind a jeweller uses for the piece, and the year's figures on the plinth's face. The units stand on a turntable: the first faces
// the reader under the lights, and as the reader scrolls the table turns, carrying it off to the right and out of sight while the
// next, with a smaller and simpler piece, comes round to the front. The room and its lights never move. The section
// is tall and its stage sticks, like the hero's sheet of notes; the turn follows the scroll alone, with a pause at
// each unit. The story's text sits over the left of the room on a panel that blurs the scene behind it.

// A PIECE =============================================================================================================
export type Kind = "bridal" | "necklace" | "bangles" | "chain" | "earrings" | "ring";
export interface Piece {
    year  : number;
    grams : string;              // "224.1 g"
    piece : string;              // "A full bridal set"
    note  : string;              // the price it rests on; empty for none
    kind  : Kind;                // what is drawn on the bust
    price? : { was : string; now : string };   // on the plate, the sum struck through and the price today over it
    noYear? : boolean;                         // the plate without its year
}

// THE ROOM ============================================================================================================
// The scene's own frame, cropped to the stage: 1600 wide, 900 high, the floor from FLOOR_Y, the units standing on it
// at the turntable's front. The front and the lights over it sit at CX in the drawing, then shift right on a desktop
// to the middle of the part of the stage the text panel leaves clear.
const W = 1600, H = 900, FLOOR_Y = 640, CX = 800, FRONT_Y = 850, RING_R = 540;
const PANEL = 0.4;                                      // the text panel's share of the stage on a desktop
const LAMPS = [ CX - 170, CX, CX + 170 ];

// THE TURN ============================================================================================================
const SCREENS = 1;                                      // screens of scroll per unit
const clamp   = (v : number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth  = (u : number) => u * u * (3 - 2 * u);

// THE HOLDERS AND THEIR PIECES, DRAWN =================================================================================
// Each year's piece rests on the holder a jeweller would use for it, after the set of black stands in
// public/design-ref/one-lakh-story/ref-jewellery-stands.webp: a necklace or a chain on a bust, bangles on a hand's
// wrist, a ring in its box, earrings on a small stand. All stand on the plinth's top, y = -182 in the unit's frame,
// origin at the foot of the plinth, y upward as negative. Gold is a stroke of beads, dasharray 0 with round caps.
const beads = (d : string, size : number, gap : number) => <path d={d} className="gold" fill="none" strokeWidth={size} strokeLinecap="round" strokeDasharray={`0 ${gap}`} />;

// The bust: a flat neck, shoulders flaring to straight sides, a flat foot, with a sheen down its left.
const Bust = () => (
    <g>
        <path d="M-40 -500 Q-40 -512 -28 -512 L28 -512 Q40 -512 40 -500 L40 -468 C44 -446 72 -428 98 -412 C114 -402 120 -390 120 -370 L120 -196 Q120 -182 106 -182 L-106 -182 Q-120 -182 -120 -196 L-120 -370 C-120 -390 -114 -402 -98 -412 C-72 -428 -44 -446 -40 -468 Z" className="black" />
        <path d="M-104 -200 C-108 -290 -102 -370 -82 -404 C-66 -426 -50 -444 -42 -470 L-22 -470 C-28 -446 -42 -428 -58 -406 C-78 -372 -84 -290 -80 -200 Z" className="black-sheen" />
    </g>
);





// The necklace set, after public/design-ref/one-lakh-story/necklace.png: two strands of small pearls, then a strand
// of round beads each with a set drop hanging from it, the drops growing to a large pendant at the centre. The
// strands are quadratic arcs from the shoulders; drop() places a drop at a point along the lowest.
const ARC = { x0 : -90, y0 : -444, cx : 0, cy : -292 };                      // the lowest strand's arc, symmetric
const onArc = (t : number) => ({ x : (1 - t) ** 2 * ARC.x0 + 2 * (1 - t) * t * ARC.cx + t * t * -ARC.x0, y : (1 - t) ** 2 * ARC.y0 + 2 * (1 - t) * t * ARC.cy + t * t * ARC.y0 });
const teardrop = (rx : number, h : number) => `M0 ${-h} C${rx} ${-h * 0.3} ${rx} ${h * 0.55} 0 ${h} C${-rx} ${h * 0.55} ${-rx} ${-h * 0.3} 0 ${-h} Z`;
const DROPS = [ [ 0.1, 8 ], [ 0.2, 10 ], [ 0.3, 12 ], [ 0.4, 15 ], [ 0.6, 15 ], [ 0.7, 12 ], [ 0.8, 10 ], [ 0.9, 8 ] ];
const Necklace = () => (
    <g>
        {beads(`M-62 -468 Q0 -370 62 -468`, 7, 10)}
        {beads(`M-76 -458 Q0 -332 76 -458`, 8, 11.5)}
        {beads(`M${ARC.x0} ${ARC.y0} Q${ARC.cx} ${ARC.cy} ${-ARC.x0} ${ARC.y0}`, 8, 12)}
        {DROPS.map(([ t, h ]) => { const { x, y } = onArc(t); return (
            <g key={t} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
                <circle cx={0} cy={0} r={4.5} className="gold-fill" />
                <path d={teardrop(h * 0.62, h)} transform={`translate(0 ${4 + h})`} className="stone" />
            </g>
        ); })}
        {(() => { const { x, y } = onArc(0.5); return (
            <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
                <circle cx={0} cy={2} r={6} className="gold-fill" />
                <path d={teardrop(15, 25)} transform="translate(0 35)" className="stone" />
                <path d={teardrop(7.5, 12)} transform="translate(0 35)" className="stone-light" />
            </g>
        ); })()}
    </g>
);

// The bridal set, after public/design-ref/one-lakh-story/ref-224-set.png: the bust in the middle of the case on a
// riser, wearing a bib of pearls in three rows with pearl drops and a pendant, and a maang tikka down the front of
// its neck; a wedge stand at either side holding a jhumka; a bangle roller in front on the left carrying two stacks
// of bangles; two cushions in front on the right, one with a ring and one with a pair of studs. The pearls are
// cream stones rimmed in gold.
const r2  = (v : number) => Math.round(v * 100) / 100 + 0;                    // two decimals, never -0, the same on the server and in the browser
const ring = (r : number) => [ 0, 72, 144, 216, 288 ].map(a => ({ a, x : r2(Math.sin(a * Math.PI / 180) * r), y : r2(-Math.cos(a * Math.PI / 180) * r) }));
const qpt = (a : { x0 : number; y0 : number; cy : number }, t : number) => ({ x : (1 - t) ** 2 * a.x0 + t * t * -a.x0, y : (1 - t) ** 2 * a.y0 + 2 * (1 - t) * t * a.cy + t * t * a.y0 });
const along = (a : { x0 : number; y0 : number; cy : number }, n : number) => Array.from({ length : n }, (_, i) => qpt(a, (i + 0.5) / n));
const BIB = [ { x0 : -64, y0 : -456, cy : -368, n : 11, r : 4.6 }, { x0 : -78, y0 : -450, cy : -326, n : 13, r : 5.2 }, { x0 : -92, y0 : -444, cy : -282, n : 15, r : 5.8 } ];
const PearlBib = () => (
    <g>
        {BIB.map((row, k) => along(row, row.n).map((pt, i) => (
            <g key={`${k}-${i}`} transform={`translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`}>
                {k === 2 && i !== 7 && <path d={teardrop(3.6, 7)} transform="translate(0 12)" className="pearl" />}
                <circle r={row.r} className={k === 1 ? "gold-fill" : "pearl"} />
            </g>
        )))}
        {(() => { const { x, y } = qpt(BIB[2], 0.5); return (
            <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
                <path d={teardrop(14, 23)} transform="translate(0 34)" className="gold-fill" />
                <path d={teardrop(8, 14)} transform="translate(0 34)" className="pearl" />
                {[ -10, 0, 10 ].map(dx => <path key={dx} d={teardrop(3, 5.5)} transform={`translate(${dx} ${dx ? 56 : 62})`} className="pearl" />)}
            </g>
        ); })()}
    </g>
);
const Tikka = () => (
    <g>
        {beads("M0 -514 L0 -486", 3.6, 5.2)}
        <path d={teardrop(7, 12)} transform="translate(0 -472)" className="gold-fill" />
        <path d={teardrop(3.8, 7)} transform="translate(0 -472)" className="pearl" />
        {[ -5, 0, 5 ].map(dx => <circle key={dx} cx={dx} cy={dx ? -458 : -455} r={2} className="pearl" />)}
    </g>
);
const PearlJhumka = () => (
    <g>
        {ring(5).map(pt => <circle key={pt.a} cx={pt.x} cy={pt.y} r={2.6} className="pearl" />)}
        <circle r={2.4} className="gold-fill" />
        <line x1={0} y1={5} x2={0} y2={16} className="gold" strokeWidth={1.6} />
        <path d="M-12 30 A12 12 0 0 1 12 30 Z" className="gold-fill" />
        {[ -9.5, -4.75, 0, 4.75, 9.5 ].map(dx => <path key={dx} d={teardrop(2.4, 4.5)} transform={`translate(${dx} 36)`} className="pearl" />)}
    </g>
);
const EarringWedge = ({ x } : { x : number }) => (
    <g transform={`translate(${x} -182)`}>
        <path d="M-30 0 L-10 -156 Q0 -162 10 -156 L30 0 Z" className="black" />
        <path d="M-26 0 L-8 -154 L-2 -154 L-16 0 Z" className="black-sheen" />
        <g transform="translate(0 -128)"><PearlJhumka /></g>
    </g>
);
const BangleRoller = () => (
    <g transform="translate(-96 -214)">
        <rect x={-56} y={-16} width={112} height={32} rx={3} className="black" />
        <rect x={-56} y={-16} width={112} height={8} rx={3} className="black-sheen" />
        <ellipse cx={-56} cy={0} rx={6} ry={16} className="black-dark" />
        <ellipse cx={56} cy={0} rx={6} ry={16} className="black-dark" />
        {[ -44, -36, -28, -20, 6, 14, 22, 30 ].map((x, i) => (
            <ellipse key={x} cx={x} cy={0} rx={4.5} ry={19} className={i % 2 ? "pearl-ring" : "gold-ring"} style={{ strokeWidth : 3.4 }} />
        ))}
        <rect x={-60} y={16} width={120} height={16} rx={2} className="black-dark" />
    </g>
);
const RingCushions = () => (
    <g>
        <rect x={92} y={-226} width={40} height={44} rx={5} className="black" />
        <rect x={96} y={-226} width={32} height={8} rx={4} className="black-sheen" />
        <circle cx={112} cy={-230} r={7} className="gold-ring" style={{ strokeWidth : 3 }} />
        <circle cx={112} cy={-238} r={3.4} className="pearl" />
        <rect x={138} y={-216} width={32} height={34} rx={5} className="black" />
        <rect x={142} y={-216} width={24} height={7} rx={3.5} className="black-sheen" />
        {[ 147, 161 ].map(x => <g key={x} transform={`translate(${x} -222)`}>{ring(3.6).map(pt => <circle key={pt.a} cx={pt.x} cy={pt.y} r={1.9} className="pearl" />)}<circle r={1.8} className="gold-fill" /></g>)}
    </g>
);
const Bridal = () => (
    <g>
        {/* the riser, then the bust on it, a little smaller so the stands have room */}
        <rect x={-96} y={-196} width={192} height={14} rx={2} className="black-dark" />
        <g transform="translate(0 -40) scale(0.86)">
            <Bust />
            {/* the tikka sits about 30 px higher on the screen than drawn, the bib about 14 px higher */}
            <g transform="translate(0 -35)">
                <Tikka />
                <g transform="translate(0 18)"><PearlBib /></g>
            </g>
        </g>
        <EarringWedge x={-138} />
        <EarringWedge x={138} />
        <BangleRoller />
        <RingCushions />
    </g>
);

// The other cases, after public/design-ref/one-lakh-story/ref-all-jewellery.png: the bangles on a large roller
// across the plinth, four of them, each a broad band of gold set with pearls between beaded edges; the chain a strand of gold
// beads on the bust with a small flower pendant; the ring on a cushion, a flower cluster of pearls on a gold
// band; earrings, should a year call for them, a pair of pearl-cluster studs on wedges.
// The stand the bangles rest on: a block on a riser, the bangles' feet cut off where they meet it.
const BangleBase = () => (
    <g>
        <rect x={-96} y={-214} width={192} height={32} rx={2} className="black-dark" />
        <rect x={-72} y={-236} width={144} height={24} rx={3} className="black" />
        <rect x={-66} y={-236} width={132} height={6} rx={3} className="black-sheen" />
    </g>
);
const Bangle = ({ x } : { x : number }) => (
    <g transform={`translate(${x} -262)`}>
        {/* a band round the roller, seen as the roller's own end is: an elliptical ring, both edges bowing out, the
            pearls along the front of it, after ref-bangle-shape.png */}
        <ellipse cx={0} cy={0} rx={6} ry={27} fill="none" stroke="color-mix(in oklch, var(--scene-gold), black 30%)" strokeWidth={8.4} />
        <ellipse cx={0} cy={0} rx={6} ry={27} fill="none" className="gold" strokeWidth={6} />
        {[ -18, -6, 6, 18 ].map(y => <circle key={y} cx={r2(6 * Math.sqrt(1 - (y / 27) ** 2))} cy={y} r={2.2} className="pearl" />)}
        {[ -22, -12, 0, 12, 22 ].map(y => <circle key={y} cx={r2(6 * Math.sqrt(1 - (y / 27) ** 2) - 2.6)} cy={y} r={1} className="pearl" />)}
    </g>
);
// A display unit on its own, for the money chapter: the whole case as it stands in the gallery, plinth, plate, holder
// and glass, in a frame that fits it.
export const DisplayUnit = ({ pc, label } : { pc : Piece; label : string }) => (
    <svg className="display-unit" viewBox={`-240 -640 480 ${pc.price ? (pc.note ? 694 : 664) : 650}`} role="img" aria-label={label}>
        <Unit pc={pc} />
    </svg>
);

const Flower = ({ r = 4, n = 6 } : { r? : number; n? : number }) => (
    <g>
        {Array.from({ length : n }, (_, i) => { const a = i * 360 / n; return <circle key={i} cx={r2(Math.sin(a * Math.PI / 180) * r)} cy={r2(-Math.cos(a * Math.PI / 180) * r)} r={r * 0.5} className="pearl" />; })}
        <circle r={r * 0.42} className="gold-fill" />
    </g>
);
const Cushion = () => (
    <g>
        <rect x={-96} y={-214} width={192} height={32} rx={2} className="black-dark" />
        <rect x={-58} y={-266} width={116} height={52} rx={8} className="black" />
        <rect x={-52} y={-266} width={104} height={12} rx={6} className="black-sheen" />
    </g>
);

const HOLDERS : Record<Kind, ReactNode> = {
    bridal : (
        <g>
            <Bust />
            <Bridal />
        </g>
    ),
    necklace : (
        <g>
            <Bust />
            <Necklace />
        </g>
    ),
    chain : (
        <g>
            <Bust />
            <g transform="translate(0 21.5)">
                {along({ x0 : -72, y0 : -458, cy : -318 }, 26).map((pt, i) => <circle key={i} cx={r2(pt.x)} cy={r2(pt.y)} r={i % 5 === 2 ? 5.4 : 4.3} className={i % 5 === 2 ? "gold-bead-light" : "gold-bead"} />)}
                <g transform="translate(0 -384)"><Flower r={6} /></g>
                <path d={teardrop(3.2, 6)} transform="translate(0 -370)" className="pearl" />
            </g>
        </g>
    ),
    bangles : (
        <g>
            <BangleBase />
            <g style={{ clipPath : "inset(0 0 5px 0)" }}>
                {[ -45, -15, 15, 45 ].map(x => <Bangle key={x} x={x} />)}
            </g>
        </g>
    ),
    ring : (
        <g>
            <Cushion />
            <ellipse cx={0} cy={-284} rx={15} ry={18} fill="none" className="gold" strokeWidth={4.5} />
            <g transform="translate(0 -303)"><Flower r={7} n={7} /></g>
        </g>
    ),
    earrings : (
        <g>
            <EarringWedge x={-50} />
            <EarringWedge x={50} />
        </g>
    ),
};

// A UNIT ==============================================================================================================
// The plinth, its label, the holder with its piece, and the case, in the unit's frame.
const Unit = ({ pc } : { pc : Piece }) => {
    const tall = pc.price ? (pc.note ? 44 : 14) : 0;    // the plinth and plate grow to take the price line
    return (
    <g className="unit-body">
        {/* the plinth: a top slab, the face, the label panel with a gold hairline */}
        <rect x={-225} y={-182} width={450} height={22} rx={2} className="plinth-top" />
        <rect x={-210} y={-160} width={420} height={160 + tall} className="plinth" />
        <rect x={-210} y={-160} width={420} height={160 + tall} className="plinth-shade" style={{ clipPath : "inset(0 0 0 50%)" }} />
        {/* the label: a museum plate on the plinth's face, ivory on the dark wood, set to the left */}
        <rect x={-170} y={-148} width={344} height={122 + tall} rx={3} className="plate-shadow" />
        <rect x={-172} y={-150} width={344} height={122 + tall} rx={3} className="plate" />
        {!pc.noYear && <text x={150} y={-120} textAnchor="end" className="label-year">{pc.year}</text>}
        <text x={-150} y={-105} className="label-grams">{pc.grams}</text>
        <text x={-150} y={-80} className="label-piece">{pc.piece}</text>
        {pc.note && <text x={-150} y={-48} className="label-note">{pc.note}</text>}
        {pc.price && (
            <g className="label-price">
                <text x={-150} y={-10 - (44 - tall)} className="label-was">{pc.price.was}</text>
                <text x={150} y={-10 - (44 - tall)} textAnchor="end" className="label-now">{pc.price.now}</text>
            </g>
        )}
        {HOLDERS[pc.kind]}
        {/* the glass: a pane with a glare */}
        <rect x={-172} y={-620} width={344} height={438} rx={3} className="glass" />
        <path d="M-172 -620 L-60 -620 L-172 -420 Z" className="glare" />
        <path d="M172 -620 L172 -560 L-100 -182 L-172 -182 Z" className="glare" opacity={0.4} />
    </g>
    );
};

// THE COMPONENT =======================================================================================================
// The text over the room comes in beats, one shown at a time: the first while the first unit is in the light, the
// next once the second unit has come round, and so on; the last stays for the rest of the turn. The kicker stays
// through the beats unless a beat brings its own.
export interface Beat { kicker? : ReactNode; body : ReactNode; }
export const Showcase = ({ pieces, label, kicker, beats } : { pieces : Piece[]; label : string; kicker : ReactNode; beats : Beat[] }) => {
    const sectionRef = useRef<HTMLElement>(null);
    const { ref : stageRef, width : fw, height : fh } = useSize<HTMLDivElement>();
    const lightsRef  = useRef<SVGGElement>(null);
    const unitRefs   = useRef<(SVGGElement | null)[]>([]);
    const reduced    = !!useReducedMotion();
    const [ front, setFront ] = useState(0);
    const [ beat, setBeat ]     = useState(0);           // which of the texts is shown
    const N = pieces.length;

    const { scrollYProgress } = useScroll({ target : sectionRef, offset : [ "start start", "end end" ] });

    // The turntable at a point of the scroll: k is the unit at the front, fractional between two. Each unit stands at
    // its angle on a ring; the further round it is, the smaller, higher on the floor and dimmer it is drawn.
    const place = (p : number) => {
        const u = clamp((p - 0.06) / 0.88) * (N - 1);
        const k = Math.floor(u) + smooth(u - Math.floor(u));
        // The drawing is cropped to the stage; on a desktop the front and the lights move right by a fifth of the
        // visible width, the middle of what the panel leaves clear.
        const scale = Math.max(fw / W, fh / H) || 1;
        const shift = fw >= 900 ? (PANEL / 2) * (fw / scale) : 0;
        lightsRef.current?.setAttribute("transform", `translate(${shift.toFixed(1)} 0)`);
        pieces.forEach((_, i) => {
            const el = unitRefs.current[i];
            if (!el) return;
            const th = (k - i) * 2 * Math.PI / N;
            const d  = (Math.cos(th) + 1) / 2;           // 1 at the front, 0 at the back
            const x  = CX + shift + RING_R * Math.sin(th), y = FRONT_Y - (1 - d) * 150, s = 0.42 + 0.58 * d;
            el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`);
            // Seen only in the front half of the turn: gone by the time a unit is level with the table's axis, so at
            // rest the one in the light stands alone.
            const seen = Math.max(0, (d - 0.5) / 0.5);
            el.setAttribute("opacity", (seen * seen).toFixed(3));
            el.setAttribute("aria-hidden", d < 0.5 ? "true" : "false");
        });
        setFront(Math.round(k));
        setBeat(Math.min(beats.length - 1, Math.floor(k + 0.4)));
    };
    const placeRef = useRef(place);
    placeRef.current = place;

    useMotionValueEvent(scrollYProgress, "change", p => { if (!reduced) placeRef.current(p); });
    useLayoutEffect(() => { if (!reduced) placeRef.current(scrollYProgress.get()); }, [ reduced, scrollYProgress, fw, fh ]);

    // Without motion the stylesheet stands the units in a row instead; the markup is the same either way, so the
    // server's and the browser's renders agree.
    return (
        <section ref={sectionRef} className="showcase" style={{ height : `${N * SCREENS * 100}svh` }}>
            <div ref={stageRef} className="showcase-stage">
                <svg className="scene" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
                    <defs>
                        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" className="wall-top" /><stop offset="1" className="wall-foot" />
                        </linearGradient>
                        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" className="floor-far" /><stop offset="1" className="floor-near" />
                        </linearGradient>
                        <radialGradient id="pool" cx="0.5" cy="0.5" r="0.5">
                            <stop offset="0" className="pool-in" /><stop offset="1" className="pool-out" />
                        </radialGradient>
                        <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" className="beam-top" /><stop offset="1" className="beam-foot" />
                        </linearGradient>
                    </defs>
                    {/* the room */}
                    <rect x={0} y={0} width={W} height={FLOOR_Y} fill="url(#wall)" />
                    <rect x={0} y={FLOOR_Y} width={W} height={H - FLOOR_Y} fill="url(#floor)" />
                    <line x1={0} y1={FLOOR_Y} x2={W} y2={FLOOR_Y} className="skirting" />
                    {[ 200, 500, 1100, 1400 ].map(x => <line key={x} x1={x} y1={FLOOR_Y} x2={x < CX ? x - 160 : x + 160} y2={H} className="floor-line" />)}
                    {/* the lights: three lamps, their beams, the pool they make on the floor, over the front */}
                    <g ref={lightsRef}>
                        <ellipse cx={CX} cy={FRONT_Y + 10} rx={420} ry={60} fill="url(#pool)" />
                        {LAMPS.map(x => <path key={x} d={`M${x - 26} 42 L${x + 26} 42 L${CX + (x - CX) * 0.6 + 230} ${FRONT_Y + 20} L${CX + (x - CX) * 0.6 - 230} ${FRONT_Y + 20} Z`} fill="url(#beam)" />)}
                        {LAMPS.map(x => <g key={x}><ellipse cx={x} cy={40} rx={34} ry={12} className="lamp-rim" /><ellipse cx={x} cy={40} rx={24} ry={7} className="lamp" /></g>)}
                    </g>
                    {/* the units on the turntable */}
                    {pieces.map((pc, i) => (
                        <g key={pc.year} ref={el => { unitRefs.current[i] = el; }} className={`unit ${i === front ? "is-front" : ""}`} transform={`translate(${CX} ${FRONT_Y})`}>
                            <Unit pc={pc} />
                        </g>
                    ))}
                </svg>
                <div className="showcase-text">
                    <div className="showcase-kicker">{beats[beat]?.kicker ?? kicker}</div>
                    {beats.map((t, i) => <div key={i} className={`showcase-beat ${i ? "is-turn" : "is-opening"} ${i === beat ? "is-shown" : ""}`}>{t.body}</div>)}
                </div>
            </div>
        </section>
    );
};

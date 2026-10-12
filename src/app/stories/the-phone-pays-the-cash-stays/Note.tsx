// The story's banknote, drawn one way everywhere it appears: the title's ₹500, the note wall, the notes in the cash
// grids, the legends and the close. It follows the flat note of "What ₹1 lakh could buy" (its note-1000.svg): a
// paper ground in three fields, the two side fields paler, a disc carrying the rupee sign in the middle, the value set
// upright on the left, pill bars standing in for the lettering, a dashed divider, and on the right the numeral, a ring
// and a row of dots, with a notch in two corners. No portrait, no issuer's name, nothing that imitates a real note.
// Each denomination keeps the colours the story already gives it (₹500 Neem, ₹200 and the old ₹500 turmeric, ₹100
// lavender, ₹2,000 pink, ₹1,000 terracotta). The layout is in fractions of the note's width and height, so it fits any
// shape; the detail thins as the note gets small: everything from about 120 px wide, the disc, sign and numeral from
// about 36 px, and below that only the fields and the disc.

export interface NoteStyle { paper : string; band : string; ink : string; window : string; lace : string }

export const NOTE_STYLES : Record<string, NoteStyle> = {
    "500"    : { paper : "#cfdcaa", band : "#6b8e23", ink : "#3c5214", window : "#f3f1e7", lace : "#9db45a" },
    "500old" : { paper : "#f6dfa8", band : "#eaaa3a", ink : "#7a5414", window : "#f3f1e7", lace : "#e9be63" },
    "200"    : { paper : "#f6dfa8", band : "#eaaa3a", ink : "#7a5414", window : "#f3f1e7", lace : "#e9be63" },
    "100"    : { paper : "#ddd0f6", band : "#864fe3", ink : "#46257f", window : "#f3f1e7", lace : "#b29bef" },
    "2000"   : { paper : "#f4c6dc", band : "#c4508a", ink : "#6e2549", window : "#f3f1e7", lace : "#df8db6" },
    "1000"   : { paper : "#ecc6bc", band : "#ba644f", ink : "#6e3527", window : "#f3f1e7", lace : "#d9927f" },
    "small"  : { paper : "#ede6d7", band : "#a8957a", ink : "#5c5040", window : "#f3f1e7", lace : "#c9b99c" },
};

// "value" is for notes too small for the disc: the fields and the value alone, as large as it fits.
type Detail = "full" | "mid" | "low" | "value";
export const detailFor = (w : number) : Detail => (w >= 120 ? "full" : w >= 36 ? "mid" : "low");

// The parts of a note w × h at (x, y), as plain shapes both drawers share.
const partsOf = (x : number, y : number, w : number, h : number, discAt = 0.49) => {
    const u = Math.min(w / 177, h / 73);             // the note's own unit, from the 177 × 73 original
    return {
        u,
        left  : [ x, y, w * 0.28, h ] as const,
        right : [ x + w * 0.7, y, w * 0.3, h ] as const,
        disc  : { cx : x + w * discAt, cy : y + h * 0.56, r : Math.min(h * 0.25, w * 0.105) },
        pills : [ [ 0.316, 0.11, 0.237, 0.068, 0.5 ], [ 0.316, 0.22, 0.147, 0.048, 0.35 ], [ 0.316, 0.85, 0.1, 0.041, 0.3 ], [ 0.847, 0.767, 0.113, 0.034, 0.3 ] ]
            .map(([ fx, fy, fw, fh, a ]) => ({ x : x + w * fx, y : y + h * fy, w : w * fw, h : h * fh, a })),
        divider : x + w * 0.684,
        ring  : { cx : x + w * 0.774, cy : y + h * 0.63, r : h * 0.089 },
        dots  : [ 0.859, 0.893, 0.927 ].map(f => ({ cx : x + w * f, cy : y + h * 0.63, r : h * 0.022 })),
        notch : Math.min(w * 0.045, h * 0.11),
    };
};

// On a canvas (the title's texture and the cash grids). `discAt` moves the disc along the note (a fraction of its
// width), for a note folded down the middle, whose visible half should carry it; the divider is then left out.
export function drawNote(g : CanvasRenderingContext2D, x : number, y : number, w : number, h : number, style : NoteStyle, value : string, font : string, detail : Detail = detailFor(w), discAt? : number) {
    const P = partsOf(x, y, w, h, discAt);
    g.save();
    g.fillStyle = style.paper; g.fillRect(x, y, w, h);
    g.globalAlpha *= 0.55; g.fillStyle = style.window; g.fillRect(...P.left); g.fillRect(...P.right); g.globalAlpha /= 0.55;
    if (detail === "value") {
        g.fillStyle = style.ink; g.textAlign = "center"; g.textBaseline = "middle";
        g.font = `700 ${Math.min(h * 0.5, w * 1.05 / Math.max(3, value.length))}px ${font}`;
        g.fillText(value, x + w / 2, y + h * 0.55);
        g.restore();
        return;
    }
    g.fillStyle = style.band; g.beginPath(); g.arc(P.disc.cx, P.disc.cy, P.disc.r, 0, Math.PI * 2); g.fill();
    if (detail !== "low") {
        g.fillStyle = style.window; g.textAlign = "center"; g.textBaseline = "middle";
        g.font = `700 ${P.disc.r * 1.35}px ${font}`; g.fillText("₹", P.disc.cx, P.disc.cy + P.disc.r * 0.05);
        g.fillStyle = style.ink; g.textAlign = "right"; g.textBaseline = "alphabetic";
        g.font = `700 ${h * 0.15}px ${font}`; g.fillText(`₹${value}`, x + w * 0.96, y + h * 0.24);
    }
    if (detail === "full") {
        const a0 = g.globalAlpha;
        // the value upright on the left
        g.save(); g.translate(x + w * 0.153, y + h * 0.85); g.rotate(-Math.PI / 2);
        g.globalAlpha = a0 * 0.85; g.textAlign = "left"; g.font = `700 ${h * 0.18}px ${font}`; g.fillText(`₹${value}`, 0, 0);
        g.restore();
        for (const p of P.pills) { g.globalAlpha = a0 * p.a; g.beginPath(); g.roundRect(p.x, p.y, p.w, p.h, p.h / 2); g.fill(); }
        g.globalAlpha = a0;
        if (discAt === undefined) {
            g.strokeStyle = style.lace; g.lineWidth = 1.2 * P.u; g.setLineDash([ 3 * P.u, 3 * P.u ]);
            g.beginPath(); g.moveTo(P.divider, y + h * 0.04); g.lineTo(P.divider, y + h * 0.96); g.stroke(); g.setLineDash([]);
        }
        g.strokeStyle = style.ink; g.lineWidth = 0.8 * P.u;
        g.beginPath(); g.arc(P.ring.cx, P.ring.cy, P.ring.r, 0, Math.PI * 2); g.stroke();
        g.fillStyle = style.lace; for (const d of P.dots) { g.beginPath(); g.arc(d.cx, d.cy, d.r, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = style.ink; g.globalAlpha = a0 * 0.55;
        g.beginPath(); g.moveTo(x + w, y); g.lineTo(x + w, y + P.notch); g.lineTo(x + w - P.notch, y); g.fill();
        g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + h - P.notch); g.lineTo(x + P.notch, y + h); g.fill();
    }
    g.restore();
}

// In SVG (the note wall, the legends, the close). `x`, `y` place it inside a parent <svg>; on its own, NoteIcon wraps it.
export const NoteFace = ({ x = 0, y = 0, w, h, denom, value, detail = detailFor(w) } : { x? : number; y? : number; w : number; h : number; denom : string; value : string; detail? : Detail }) => {
    const s = NOTE_STYLES[denom] ?? NOTE_STYLES.small, P = partsOf(x, y, w, h);
    return (
        <g className="note-face">
            <rect x={x} y={y} width={w} height={h} fill={s.paper} />
            <rect x={P.left[0]} y={P.left[1]} width={P.left[2]} height={P.left[3]} fill={s.window} opacity={0.55} />
            <rect x={P.right[0]} y={P.right[1]} width={P.right[2]} height={P.right[3]} fill={s.window} opacity={0.55} />
            <circle cx={P.disc.cx} cy={P.disc.cy} r={P.disc.r} fill={s.band} />
            {detail !== "low" && value && <>
                <text x={P.disc.cx} y={P.disc.cy + P.disc.r * 0.47} textAnchor="middle" fontSize={P.disc.r * 1.35} fontWeight={700} fill={s.window}>₹</text>
                <text x={x + w * 0.96} y={y + h * 0.24} textAnchor="end" fontSize={h * 0.15} fontWeight={700} fill={s.ink}>₹{value}</text>
            </>}
            {detail === "full" && value && <>
                <text transform={`translate(${x + w * 0.153} ${y + h * 0.85}) rotate(-90)`} fontSize={h * 0.18} fontWeight={700} fill={s.ink} opacity={0.85}>₹{value}</text>
                {P.pills.map((p, i) => <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.h / 2} fill={s.ink} opacity={p.a} />)}
                <path d={`M${P.divider} ${y + h * 0.04}V${y + h * 0.96}`} stroke={s.lace} strokeWidth={1.2 * P.u} strokeDasharray={`${3 * P.u} ${3 * P.u}`} />
                <circle cx={P.ring.cx} cy={P.ring.cy} r={P.ring.r} fill="none" stroke={s.ink} strokeWidth={0.8 * P.u} />
                {P.dots.map((d, i) => <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={s.lace} />)}
                <path d={`M${x + w} ${y}v${P.notch}l${-P.notch} ${-P.notch}zM${x} ${y + h}v${-P.notch}l${P.notch} ${P.notch}z`} fill={s.ink} opacity={0.55} />
            </>}
        </g>
    );
};

// A note on its own, as an inline icon (the legends) or a picture (the close).
export const NoteIcon = ({ denom, value, width, className } : { denom : string; value : string; width : number; className? : string }) => {
    const h = width * 73 / 177;
    return (
        <svg className={`note-icon ${className ?? ""}`} width={width} height={h} viewBox={`0 0 ${width} ${h}`} aria-hidden="true">
            <NoteFace w={width} h={h} denom={denom} value={value} />
        </svg>
    );
};


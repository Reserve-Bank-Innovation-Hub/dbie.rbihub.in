// The story's realistic objects, drawn once as standalone SVG strings in the manner of instruments.ts: payment cards,
// two card terminals, three QR standees, eight cars seen from above and a FASTag card. Each function returns
// { svg, w, h }: the markup (an <svg> with its own viewBox, width and height) and its size in drawing pixels, so the
// page can show it as an image (dataUri from ./instruments) and a canvas can draw it. Colours are written out, since
// an image cannot read the page's tokens. No real brand appears: a bank is "Bank name", a card network is a rupee
// roundel, UPI is the plain word, and FASTag the plain word in two colours.

// LOCAL ===============================================================================================================
import { QR_PATH } from "./instruments";

export interface Drawn { svg : string; w : number; h : number }

const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif", MONO = "Menlo, Consolas, monospace";
const wrap = (w : number, h : number, body : string) : Drawn => ({ svg : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`, w, h });
const qr = (x : number, y : number, size : number, ink = "#1d1b19") => `<g transform="translate(${x} ${y}) scale(${size / 21})"><path d="${QR_PATH}" fill="${ink}" fill-rule="evenodd"/></g>`;

// PAYMENT CARDS =======================================================================================================
// A metal-look card: the base gradient, a fine wave texture, a glossy diagonal sweep, an EMV chip with contact pads,
// the contactless mark, an embossed number (a light edge above, a dark one below) and a rupee roundel for the network.
const CARD_TONE = {
    credit  : { from : "#f1c45e", mid : "#d79c2c", to : "#9c6a12", ink : "#fff8e6", deep : "#6b4708", label : "CREDIT" },
    debit   : { from : "#a5bf78", mid : "#6f8f3a", to : "#4f6b25", ink : "#f4f8ea", deep : "#2f4212", label : "DEBIT" },
    prepaid : { from : "#e4d3ae", mid : "#c2a978", to : "#9c8155", ink : "#fffaf0", deep : "#5f4a28", label : "PPI CARD" },
} as const;
export const cardSvg = (kind : "credit" | "debit" | "prepaid") : Drawn => {
    const t = CARD_TONE[kind];
    const waves = Array.from({ length : 14 }, (_, i) => `<path d="M-10 ${18 + i * 10} C 50 ${4 + i * 10}, 110 ${34 + i * 10}, 250 ${10 + i * 10}" />`).join("");
    const emboss = (x : number, y : number, s : string, size : number) =>
        `<text x="${x + 0.6}" y="${y + 0.8}" font-family="${MONO}" font-size="${size}" font-weight="700" fill="${t.deep}" opacity="0.55" letter-spacing="1.6">${s}</text>` +
        `<text x="${x - 0.4}" y="${y - 0.5}" font-family="${MONO}" font-size="${size}" font-weight="700" fill="#ffffff" opacity="0.55" letter-spacing="1.6">${s}</text>` +
        `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${size}" font-weight="700" fill="${t.ink}" letter-spacing="1.6">${s}</text>`;
    return wrap(240, 150, [
        `<defs>`,
        `<linearGradient id="base" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.from}"/><stop offset="0.5" stop-color="${t.mid}"/><stop offset="1" stop-color="${t.to}"/></linearGradient>`,
        `<linearGradient id="gloss" x1="0" y1="0" x2="1" y2="0.6"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.42" stop-color="#fff" stop-opacity="0.0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.32"/><stop offset="0.58" stop-color="#fff" stop-opacity="0.0"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
        `<linearGradient id="edge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.7"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.1"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></linearGradient>`,
        `<linearGradient id="chip" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e3a1"/><stop offset="0.45" stop-color="#d8b45a"/><stop offset="0.55" stop-color="#c49a3c"/><stop offset="1" stop-color="#f0d68a"/></linearGradient>`,
        `<radialGradient id="glow" cx="0.2" cy="0.1" r="0.9"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`,
        `<clipPath id="cut"><rect x="1" y="1" width="238" height="148" rx="12"/></clipPath>`,
        `</defs>`,
        `<rect x="1" y="2.5" width="238" height="148" rx="12" fill="#000" opacity="0.18"/>`,
        `<rect x="1" y="1" width="238" height="148" rx="12" fill="url(#base)"/>`,
        `<g clip-path="url(#cut)">`,
        `<g fill="none" stroke="${t.ink}" stroke-width="0.5" opacity="0.18">${waves}</g>`,
        `<circle cx="196" cy="34" r="70" fill="none" stroke="${t.ink}" stroke-width="0.6" opacity="0.14"/><circle cx="196" cy="34" r="56" fill="none" stroke="${t.ink}" stroke-width="0.6" opacity="0.12"/>`,
        // on the prepaid card (meal and gift wallets), a faint, large burger and drink, cut in by the card's edge
        kind === "prepaid" ? `<g fill="${t.ink}" opacity="0.2" transform="translate(150 6) scale(0.2)">` +
            `<path d="M30 300 Q30 200 210 200 Q390 200 400 300 Q402 320 380 320 L50 320 Q28 320 30 300 Z"/>` +
            `<rect x="30" y="345" width="370" height="40" rx="20"/>` +
            `<path d="M40 410 Q75 380 110 410 Q145 380 180 410 Q215 380 250 410 Q285 380 320 410 Q355 380 390 410 L390 432 L40 432 Z"/>` +
            `<path d="M20 455 L410 455 L385 520 Q380 535 365 535 L65 535 Q50 535 45 520 Z"/>` +
            `<path d="M360 210 L550 210 L540 500 L430 500 L420 330 Q420 230 360 225 Z"/>` +
            `<rect x="340" y="135" width="240" height="60" rx="14"/>` +
            `<path d="M455 135 L470 70 Q474 58 486 54 L555 28 Q575 22 580 42 Q584 58 566 64 L505 86 L492 135 Z"/>` +
            `</g>` : "",
        `<rect x="1" y="1" width="238" height="148" fill="url(#glow)"/>`,
        `<rect x="-40" y="-20" width="320" height="190" fill="url(#gloss)"/>`,
        `</g>`,
        `<rect x="1.5" y="1.5" width="237" height="147" rx="11.5" fill="none" stroke="url(#edge)" stroke-width="1.2"/>`,
        `<text x="18" y="30" font-family="${SANS}" font-size="12.5" font-weight="800" fill="${t.ink}" letter-spacing="2.4">${t.label}</text>`,
        `<text x="18" y="42" font-family="${SANS}" font-size="7" fill="${t.ink}" opacity="0.8" letter-spacing="1">Bank name</text>`,
        // the chip
        `<rect x="22" y="54" width="38" height="29" rx="5" fill="#000" opacity="0.22" transform="translate(0.6 0.9)"/>`,
        `<rect x="22" y="54" width="38" height="29" rx="5" fill="url(#chip)" stroke="#a9832e" stroke-width="0.8"/>`,
        `<g stroke="#9c7a2c" stroke-width="0.7" fill="none"><path d="M22 63.5h11M22 73.5h11M49 63.5h11M49 73.5h11"/><path d="M33 54v29M49 54v29"/><rect x="36" y="60" width="10" height="17" rx="2"/></g>`,
        `<rect x="23" y="55" width="36" height="6" rx="3" fill="#fff" opacity="0.3"/>`,
        // contactless
        `<g fill="none" stroke="${t.ink}" stroke-width="2" stroke-linecap="round" opacity="0.92"><path d="M74 60.5 q5 8 0 16"/><path d="M80.5 57 q8 11.5 0 23"/><path d="M87 53.5 q11 15 0 30"/></g>`,
        emboss(22, 110, "4012 8888 1881 4721", 14.5),
        `<text x="22" y="124" font-family="${SANS}" font-size="5.5" fill="${t.ink}" opacity="0.8">VALID</text><text x="22" y="130" font-family="${SANS}" font-size="5.5" fill="${t.ink}" opacity="0.8">THRU</text>`,
        emboss(42, 130, "08/29", 9.5),
        emboss(22, 142, "A CARDHOLDER", 8.5),
        // the network: a rupee roundel
        `<circle cx="206" cy="125" r="15" fill="#000" opacity="0.18" transform="translate(0.6 1)"/>`,
        `<circle cx="206" cy="125" r="15" fill="#fbf8f2"/><circle cx="206" cy="125" r="15" fill="none" stroke="${t.deep}" stroke-opacity="0.35" stroke-width="1"/>`,
        `<circle cx="206" cy="125" r="11.5" fill="none" stroke="${t.mid}" stroke-width="1.2"/>`,
        `<text x="206" y="130.5" text-anchor="middle" font-family="${SANS}" font-size="15" font-weight="800" fill="${t.to}">₹</text>`,
    ].join(""));
};

// CARD TERMINALS ======================================================================================================
// A countertop card terminal photographed at three-quarters, lit from the top left. The body is one tapered slab
// (`OUTLINE`, wider at the screen than at the keypad's foot) laid on an affine plane that runs away from the viewer;
// it is extruded down and to the right in matte grey rubber, the grip that wraps its right edge. On the glossy black
// top: a recessed colour screen under glass, twelve keys with tops, lips and shadows, a function row and the red,
// yellow and green keys; a card stands half out of the slot at the front edge. A long contact shadow sits on the
// counter, and a faint grain lies over the plastic. 260 × 380; no maker's name, only the model "M-25".
export const posKeypadSvg = (amount : string) : Drawn => {
    const M = { a : 0.93, b : 0.16, c : -0.2, d : 0.88, e : 86, f : 34 };                    // the top face's plane
    const P = (u : number, v : number) => [ M.e + M.a * u + M.c * v, M.f + M.b * u + M.d * v ] as const;
    const plane = `matrix(${M.a} ${M.b} ${M.c} ${M.d} ${M.e} ${M.f})`;
    const W0 = 150, W1 = 128, L = 300, R = 22;                                               // width at the head, at the foot; length
    const x1 = (W0 - W1) / 2;
    const OUTLINE = `M${R} 0 H${W0 - R} Q${W0} 0 ${W0} ${R} L${W0 - x1} ${L - R} Q${W0 - x1} ${L} ${W0 - x1 - R} ${L} H${x1 + R} Q${x1} ${L} ${x1} ${L - R} L0 ${R} Q0 0 ${R} 0 Z`;
    const DX = 11, DY = 22, STEPS = 16;                                                        // the extrusion: the body's thickness
    const keys = [ [ "1", "" ], [ "2", "ABC" ], [ "3", "DEF" ], [ "4", "GHI" ], [ "5", "JKL" ], [ "6", "MNO" ], [ "7", "PQRS" ], [ "8", "TUV" ], [ "9", "WXYZ" ], [ "*", "" ], [ "0", "" ], [ "#", "" ] ];
    const KW = 32, KH = 20;
    const key = (u : number, v : number, s : string, sub : string) => [
        `<g transform="translate(${u} ${v})">`,
        `<rect x="1" y="3.5" width="${KW}" height="${KH}" rx="7" fill="#000" opacity="0.55" filter="url(#ks)"/>`,
        `<rect y="2.2" width="${KW}" height="${KH}" rx="7" fill="#0e0e10"/>`,                                     // the lip
        `<rect width="${KW}" height="${KH}" rx="7" fill="url(#keyTop)"/>`,
        `<rect x="2.5" y="1.2" width="${KW - 5}" height="6" rx="3" fill="#fff" opacity="0.13"/>`,
        `<rect width="${KW}" height="${KH}" rx="7" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="0.6"/>`,
        `<text x="${sub ? 11 : KW / 2}" y="14.2" text-anchor="middle" font-family="${SANS}" font-size="11.5" font-weight="700" fill="#fbfbfc">${s}</text>`,
        sub ? `<text x="23" y="13.4" text-anchor="middle" font-family="${SANS}" font-size="5" font-weight="700" fill="#c9cacf">${sub}</text>` : "",
        `</g>`,
    ].join("");
    const action = (u : number, v : number, c0 : string, c1 : string, lip : string, glyph : string) => [
        `<g transform="translate(${u} ${v})">`,
        `<rect x="1" y="3.5" width="${KW}" height="17" rx="7" fill="#000" opacity="0.55" filter="url(#ks)"/>`,
        `<rect y="2.2" width="${KW}" height="17" rx="7" fill="${lip}"/>`,
        `<linearGradient id="a${glyph.charCodeAt(0)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></linearGradient>`,
        `<rect width="${KW}" height="17" rx="7" fill="url(#a${glyph.charCodeAt(0)})"/>`,
        `<rect x="3" y="1.2" width="${KW - 6}" height="5" rx="2.5" fill="#fff" opacity="0.45"/>`,
        `<text x="${KW / 2}" y="12.6" text-anchor="middle" font-family="${SANS}" font-size="10" font-weight="800" fill="#fff">${glyph}</text>`,
        `</g>`,
    ].join("");
    const foot = P(W0 / 2, L);
    return wrap(260, 380, [
        `<defs>`,
        `<linearGradient id="slab" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b3c40"/><stop offset="0.35" stop-color="#202124"/><stop offset="1" stop-color="#0d0d0f"/></linearGradient>`,
        `<linearGradient id="band" x1="0" y1="0" x2="1" y2="0.35"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.3" stop-color="#fff" stop-opacity="0.0"/><stop offset="0.42" stop-color="#fff" stop-opacity="0.13"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.03"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
        `<linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.75"/><stop offset="0.35" stop-color="#fff" stop-opacity="0.15"/><stop offset="0.6" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
        `<linearGradient id="grip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c7f86"/><stop offset="0.55" stop-color="#55585e"/><stop offset="1" stop-color="#2b2c30"/></linearGradient>`,
        `<pattern id="ribs" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#000" opacity="0"/><circle cx="1.5" cy="1.5" r="0.55" fill="#000" opacity="0.35"/></pattern>`,
        `<linearGradient id="keyTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b4c51"/><stop offset="1" stop-color="#26272a"/></linearGradient>`,
        `<linearGradient id="lcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e8edf2"/></linearGradient>`,
        `<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.5"/><stop offset="0.32" stop-color="#fff" stop-opacity="0.12"/><stop offset="0.33" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
        `<linearGradient id="inner" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.45"/><stop offset="0.12" stop-color="#000" stop-opacity="0"/></linearGradient>`,
        `<linearGradient id="card" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef0f3"/><stop offset="0.45" stop-color="#a9afb7"/><stop offset="0.7" stop-color="#d7dbe0"/><stop offset="1" stop-color="#8c939c"/></linearGradient>`,
        `<linearGradient id="slotShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`,
        `<linearGradient id="chip" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e3a1"/><stop offset="0.5" stop-color="#c49a3c"/><stop offset="1" stop-color="#f0d68a"/></linearGradient>`,
        `<filter id="ks" x="-20%" y="-30%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.2"/></filter>`,
        `<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>`,
        `<filter id="tight" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5"/></filter>`,
        `<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.09"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/></filter>`,
        `</defs>`,
        // the counter: a long soft shadow to the lower right, a tight one where the body sits
        `<g transform="translate(${DX + 16} ${DY + 18})" opacity="0.38" filter="url(#soft)"><g transform="${plane}"><path d="${OUTLINE}" fill="#000"/></g></g>`,
        `<g transform="translate(${DX + 2} ${DY + 3})" opacity="0.55" filter="url(#tight)"><g transform="${plane}"><path d="${OUTLINE}" fill="#000"/></g></g>`,
        // the body's thickness: the outline stepped down and right, a grey rubber grip
        Array.from({ length : STEPS }, (_, k) => { const t = 1 - k / STEPS; return `<g transform="translate(${(DX * t).toFixed(2)} ${(DY * t).toFixed(2)})"><g transform="${plane}"><path d="${OUTLINE}" fill="url(#grip)"/></g></g>`; }).join(""),
        `<g transform="translate(${DX * 0.5} ${DY * 0.5})"><g transform="${plane}"><path d="${OUTLINE}" fill="url(#ribs)"/></g></g>`,
        `<g transform="translate(${DX} ${DY})"><g transform="${plane}"><path d="${OUTLINE}" fill="none" stroke="#141518" stroke-width="1.6"/></g></g>`,
        `<g transform="translate(${DX * 0.25} ${DY * 0.25})"><g transform="${plane}"><path d="${OUTLINE}" fill="none" stroke="#a9acb3" stroke-opacity="0.55" stroke-width="1.4"/></g></g>`,
        // the top slab
        `<g transform="${plane}">`,
        `<path d="${OUTLINE}" fill="url(#slab)"/>`,
        `<path d="${OUTLINE}" fill="#000" filter="url(#grain)"/>`,
        `<path d="${OUTLINE}" fill="url(#band)"/>`,
        `<path d="${OUTLINE}" fill="none" stroke="url(#rim)" stroke-width="2"/>`,
        `<text x="${W0 - 18}" y="15" text-anchor="end" font-family="${SANS}" font-size="7" font-style="italic" font-weight="700" fill="#8d9097">M-25</text>`,
        // the screen, recessed under glass
        `<rect x="14" y="22" width="${W0 - 28}" height="98" rx="9" fill="#050506"/>`,
        `<rect x="14" y="22" width="${W0 - 28}" height="98" rx="9" fill="none" stroke="#fff" stroke-opacity="0.1"/>`,
        `<rect x="21" y="29" width="${W0 - 42}" height="84" rx="3" fill="url(#lcd)"/>`,
        `<rect x="21" y="29" width="${W0 - 42}" height="14" rx="3" fill="#2f63b5"/><rect x="21" y="38" width="${W0 - 42}" height="5" fill="#2f63b5"/>`,
        `<text x="27" y="39" font-family="${SANS}" font-size="8" font-weight="700" fill="#fff">Sale</text>`,
        `<text x="${W0 - 27}" y="39" text-anchor="end" font-family="${SANS}" font-size="6.5" fill="#d6e2f5">12:41</text>`,
        `<text x="27" y="61" font-family="${SANS}" font-size="7.5" fill="#46515e">Amount</text>`,
        `<text x="${W0 - 27}" y="62" text-anchor="end" font-family="${SANS}" font-size="13" font-weight="800" fill="#121a24">₹${amount}</text>`,
        `<line x1="27" y1="70" x2="${W0 - 27}" y2="70" stroke="#d4dbe3"/>`,
        `<text x="27" y="84" font-family="${SANS}" font-size="7.5" fill="#46515e">Please enter your PIN</text>`,
        `<text x="${W0 / 2}" y="104" text-anchor="middle" font-family="${MONO}" font-size="14" font-weight="700" fill="#121a24" letter-spacing="3">****</text>`,
        `<rect x="21" y="29" width="${W0 - 42}" height="84" rx="3" fill="url(#inner)"/>`,
        `<rect x="14" y="22" width="${W0 - 28}" height="98" rx="9" fill="url(#glass)"/>`,
        // the function row
        [ 16, 59, 102 ].map(x => `<rect x="${x}" y="129" width="32" height="7" rx="3.5" fill="#0e0e10"/><rect x="${x}" y="128" width="32" height="6.5" rx="3.25" fill="#3a3b3f"/>`).join(""),
        keys.map(([ s, sub ], i) => key(14 + (i % 3) * 41, 146 + Math.floor(i / 3) * 27, s, sub)).join(""),
        action(15, 258, "#ec5a4c", "#b2261b", "#6e140d", "✕"), action(55, 258, "#f5cf4f", "#d29b14", "#7d5a06", "‹"), action(95, 258, "#4cc26a", "#24863e", "#0f4d20", "✓"),
        `</g>`,
        // the card, pushed halfway into the slot in the front edge: the chip end is inside the machine, so what shows is
        // the card's outer half, square where it enters the slot and rounded at its free end
        (() => {
            const cardPlane = `matrix(${M.a} ${M.b} ${M.c * 0.9} ${M.d * 0.9} ${(foot[0] - M.a * 40 + 6).toFixed(1)} ${(foot[1] - M.b * 40 + DY * 0.55).toFixed(1)})`;
            const half = "M0 0 H80 V25 Q80 30 75 30 H5 Q0 30 0 25 Z";
            return [
                `<g transform="${cardPlane}">`,
                `<path d="${half}" transform="translate(2 3)" fill="#000" opacity="0.35" filter="url(#tight)"/>`,
                `<path d="${half}" fill="url(#card)"/>`,
                `<path d="M0 0 V25 Q0 30 5 30 H75 Q80 30 80 25 V0" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="0.8"/>`,
                `<g fill="none" stroke="#5d646d" stroke-width="1" stroke-linecap="round"><path d="M12 13 q2.5 4 0 8"/><path d="M15.5 11 q4 6 0 12"/></g>`,
                `<text x="72" y="24" text-anchor="end" font-family="${SANS}" font-size="8.5" font-weight="800" fill="#4d545d" letter-spacing="1.5">CARD</text>`,
                `<rect x="0" y="0" width="80" height="10" fill="url(#slotShade)"/>`,
                `</g>`,
            ].join("");
        })(),
        // the slot's mouth in the front edge
        (() => { const a = P(W0 / 2 - 44, L - 1), b = P(W0 / 2 + 44, L - 1); return `<path d="M${a[0] + DX * 0.35} ${a[1] + DY * 0.45} L${b[0] + DX * 0.35} ${b[1] + DY * 0.45}" stroke="#050506" stroke-width="4" stroke-linecap="round"/>`; })(),
    ].join(""));
};

// A handheld Android terminal in indivara and dark grey, with its printer, a slip and a large screen.
export const posAndroidSvg = (amount : string) : Drawn => wrap(220, 320, [
    `<defs>`,
    `<linearGradient id="shell" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a3cc4"/><stop offset="0.45" stop-color="#9465ef"/><stop offset="1" stop-color="#5a31a8"/></linearGradient>`,
    `<linearGradient id="base" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2c2c30"/><stop offset="0.5" stop-color="#47474d"/><stop offset="1" stop-color="#232326"/></linearGradient>`,
    `<linearGradient id="scr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eef0f5"/></linearGradient>`,
    `<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.4" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
    `<linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9e6df"/></linearGradient>`,
    `<radialGradient id="shadow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`,
    `</defs>`,
    `<ellipse cx="112" cy="304" rx="86" ry="11" fill="url(#shadow)"/>`,
    // the paper slip from the printer
    `<path d="M70 4 L150 2 L152 46 L72 50 Z" fill="url(#paper)" stroke="#d6d1c6" stroke-width="0.6"/>`,
    `<g stroke="#bdb6a7" stroke-width="1.6" stroke-linecap="round"><path d="M80 14h40M80 22h56M80 30h30"/></g>`,
    `<path d="M72 44 l5 -3 l5 3 l5 -3 l5 3 l5 -3 l5 3 l5 -3 l5 3 l5 -3 l5 3 l5 -3 l5 3 l5 -3 l5 3 l5 -3" fill="none" stroke="#d6d1c6"/>`,
    // the dark lower body (the grip) behind the shell
    `<path d="M64 200 L156 200 L150 286 Q148 298 136 298 L84 298 Q72 298 70 286 Z" fill="url(#base)"/>`,
    // the shell
    `<path d="M30 70 Q30 42 58 40 L162 36 Q190 36 190 64 L192 230 Q192 262 160 264 L62 268 Q32 268 32 238 Z" fill="url(#shell)"/>`,
    `<path d="M40 60 Q42 46 60 46 L160 42" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="2"/>`,
    // printer head and contactless mark
    `<rect x="66" y="40" width="88" height="10" rx="5" fill="#2a2140"/>`,
    `<g transform="translate(160 56)" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.9"><path d="M0 4 q4 6 0 12"/><path d="M5 1 q7 9 0 18"/><path d="M10 -2 q10 12 0 24"/></g>`,
    // the screen
    `<rect x="46" y="78" width="128" height="174" rx="10" fill="#141418"/>`,
    `<rect x="52" y="86" width="116" height="158" rx="6" fill="url(#scr)"/>`,
    `<circle cx="110" cy="82" r="1.6" fill="#3c3c44"/>`,
    `<text x="110" y="112" text-anchor="middle" font-family="${SANS}" font-size="8.5" fill="#6b6478">Payment</text>`,
    `<circle cx="110" cy="148" r="20" fill="#6b8e23"/><path d="M100 148 l7 7 l13 -14" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<text x="110" y="196" text-anchor="middle" font-family="${SANS}" font-size="20" font-weight="800" fill="#23202b">₹${amount}</text>`,
    `<text x="110" y="214" text-anchor="middle" font-family="${SANS}" font-size="10" font-weight="700" fill="#6b8e23">Paid</text>`,
    `<rect x="78" y="232" width="64" height="4" rx="2" fill="#d8d4e2"/>`,
    `<rect x="52" y="86" width="116" height="158" rx="6" fill="url(#sheen)"/>`,
    // the side button
    `<rect x="190" y="110" width="4" height="26" rx="2" fill="#4a2a8c"/>`,
].join(""));

// QR STANDEES =========================================================================================================
export const standeeSvg = (kind : "tent" | "acrylic" | "card") : Drawn => {
    if (kind === "tent") return wrap(160, 220, [
        `<defs>`,
        `<linearGradient id="face" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9f5fb"/><stop offset="1" stop-color="#ffffff"/></linearGradient>`,
        `<linearGradient id="band" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1f4fa3"/><stop offset="1" stop-color="#2d68c9"/></linearGradient>`,
        `<linearGradient id="side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9fb7d9"/><stop offset="1" stop-color="#d5e2f1"/></linearGradient>`,
        `<radialGradient id="shadow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0.3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`,
        `</defs>`,
        `<ellipse cx="84" cy="212" rx="70" ry="7" fill="url(#shadow)"/>`,
        // the back panel of the tent, folded away
        `<path d="M128 14 L150 24 L150 208 L128 212 Z" fill="url(#side)"/>`,
        `<path d="M14 12 L128 14 L128 212 L14 210 Z" fill="url(#face)" stroke="#c9d8ea" stroke-width="0.8"/>`,
        `<path d="M14 12 L128 14 L128 46 L14 44 Z" fill="url(#band)"/>`,
        `<text x="71" y="34" text-anchor="middle" font-family="${SANS}" font-size="12" font-weight="800" fill="#fff">Accepted here</text>`,
        `<rect x="24" y="54" width="94" height="94" rx="4" fill="#fff" stroke="#d8e2ee"/>`,
        qr(31, 61, 80),
        `<text x="71" y="164" text-anchor="middle" font-family="${SANS}" font-size="7.5" font-weight="700" fill="#1f3c74">Scan &amp; pay with</text>`,
        `<text x="71" y="174" text-anchor="middle" font-family="${SANS}" font-size="7.5" font-weight="700" fill="#1f3c74">any UPI app</text>`,
        `<path d="M14 184 L128 186 L128 212 L14 210 Z" fill="url(#band)"/>`,
        `<text x="71" y="202" text-anchor="middle" font-family="${SANS}" font-size="8" font-weight="700" fill="#fff" letter-spacing="1">UPI</text>`,
        `<path d="M14 12 L128 14" stroke="#fff" stroke-opacity="0.6"/>`,
    ].join(""));
    if (kind === "acrylic") return wrap(160, 220, [
        `<defs>`,
        `<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f0fd"/><stop offset="0.5" stop-color="#e9e2fb"/><stop offset="1" stop-color="#d9cff4"/></linearGradient>`,
        `<linearGradient id="frost" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="1" stop-color="#c8bce8" stop-opacity="0.9"/></linearGradient>`,
        `<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e3a3"/><stop offset="0.35" stop-color="#c9982f"/><stop offset="0.6" stop-color="#f3d27a"/><stop offset="1" stop-color="#a87a1e"/></linearGradient>`,
        `<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0.8"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="0.35" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
        `<linearGradient id="reflect" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
        `</defs>`,
        `<ellipse cx="80" cy="214" rx="72" ry="5" fill="#000" opacity="0.22"/>`,
        // the gold base, a mirror
        `<path d="M8 196 L152 196 L146 210 L14 210 Z" fill="url(#gold)"/>`,
        `<path d="M14 198 L146 198 L143 204 L17 204 Z" fill="url(#reflect)" opacity="0.6"/>`,
        `<rect x="18" y="8" width="124" height="192" rx="12" fill="url(#glass)"/>`,
        `<rect x="19.5" y="9.5" width="121" height="189" rx="10.5" fill="none" stroke="url(#frost)" stroke-width="3"/>`,
        `<rect x="18" y="8" width="124" height="192" rx="12" fill="none" stroke="#b9acdf" stroke-width="0.8"/>`,
        // the gold-framed QR
        `<rect x="36" y="34" width="88" height="88" rx="8" fill="url(#gold)"/>`,
        `<rect x="41" y="39" width="78" height="78" rx="4" fill="#fbf8f2"/>`,
        qr(46, 44, 68),
        `<text x="80" y="150" text-anchor="middle" font-family="${SANS}" font-size="20" font-weight="800" font-style="italic" fill="url(#gold)" letter-spacing="1">UPI</text>`,
        `<text x="80" y="176" text-anchor="middle" font-family="${SANS}" font-size="6" font-weight="700" fill="#5b4a86" letter-spacing="0.4">THANK YOU FOR YOUR PAYMENT</text>`,
        `<rect x="18" y="8" width="124" height="192" rx="12" fill="url(#sheen)"/>`,
        `<path d="M24 16 Q30 12 40 12" stroke="#fff" stroke-opacity="0.9" stroke-width="1.5" fill="none"/>`,
    ].join(""));
    return wrap(160, 220, [
        `<defs>`,
        `<linearGradient id="face" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f1eef7"/></linearGradient>`,
        `<linearGradient id="ind" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a3cc4"/><stop offset="1" stop-color="#8f5ff0"/></linearGradient>`,
        `<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.18"/></filter>`,
        `</defs>`,
        `<path d="M14 58 L14 204 L146 204 L146 58 L108 58 A28 28 0 0 0 52 58 Z" fill="url(#face)" stroke="#e1dbec" filter="url(#soft)"/>`,
        `<circle cx="80" cy="44" r="22" fill="url(#ind)"/><circle cx="80" cy="44" r="22" fill="none" stroke="#fff" stroke-opacity="0.35"/>`,
        `<text x="80" y="53" text-anchor="middle" font-family="${SANS}" font-size="25" font-weight="800" fill="#fff">₹</text>`,
        `<text x="80" y="82" text-anchor="middle" font-family="${SANS}" font-size="9" font-weight="700" fill="#3a2a5c" letter-spacing="1.2">SCAN &amp; PAY</text>`,
        `<rect x="34" y="88" width="92" height="92" rx="3" fill="#fff"/>`,
        qr(38, 92, 84),
        `<text x="80" y="191" text-anchor="middle" font-family="${SANS}" font-size="6.5" fill="#5b5168">UPI ID: shop@bank</text>`,
        `<rect x="14" y="196" width="132" height="8" fill="url(#ind)"/>`,
    ].join(""));
};

// CARS FROM ABOVE =====================================================================================================
// Eight cars facing right, about 120 × 56: body, glass with a reflection, roof, mirrors, lights and a soft shadow;
// each with a small white FASTag inside its windscreen.
const CARS = [
    { name : "taxi",       body : [ "#f4c25a", "#c98a14" ], roof : "#eaaa3a", kind : "sedan", sign : true },
    { name : "terracotta", body : [ "#d27a64", "#8f4433" ], roof : "#ba644f", kind : "sedan" },
    { name : "vermilion",  body : [ "#ef6352", "#a72a1d" ], roof : "#de4635", kind : "hatch" },
    { name : "indivara",   body : [ "#a079ee", "#5a2fb0" ], roof : "#864fe3", kind : "sedan" },
    { name : "teal",       body : [ "#478f93", "#1e4e51" ], roof : "#2f6f73", kind : "suv", rails : true },
    { name : "charcoal",   body : [ "#55555a", "#1a1a1c" ], roof : "#2f2f2f", kind : "suv", rails : true },
    { name : "neem",       body : [ "#86a83c", "#4a6a14" ], roof : "#6b8e23", kind : "pickup" },
    { name : "sandalwood", body : [ "#ddcda9", "#a8916a" ], roof : "#c9b48e", kind : "van" },
] as const;
export const CAR_COUNT = CARS.length;
export const carSvg = (i : number) : Drawn => {
    const c = CARS[((i % CARS.length) + CARS.length) % CARS.length] as (typeof CARS)[number] & { sign? : boolean; rails? : boolean };
    const W = 120, H = 56;
    const L = c.kind === "hatch" ? 96 : c.kind === "van" ? 112 : c.kind === "pickup" ? 112 : 108;
    const x0 = (W - L) / 2, y0 = 6, h = 44;
    // the cabin's glass and roof along the car, by kind (front faces right)
    const ws = c.kind === "van" ? x0 + L - 26 : c.kind === "pickup" ? x0 + L - 34 : x0 + L - 38;                 // windscreen's rear edge
    const rear = c.kind === "hatch" ? x0 + 12 : c.kind === "van" ? x0 + 8 : c.kind === "pickup" ? x0 + 46 : c.kind === "suv" ? x0 + 12 : x0 + 22;
    const roofFrom = rear + 9, roofTo = ws - 2;
    return wrap(W, H, [
        `<defs>`,
        `<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.body[0]}"/><stop offset="0.5" stop-color="${c.body[1]}"/><stop offset="1" stop-color="${c.body[0]}"/></linearGradient>`,
        `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d3a48"/><stop offset="0.5" stop-color="#121a24"/><stop offset="1" stop-color="#3a4a5c"/></linearGradient>`,
        `<linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.18"/></linearGradient>`,
        `<filter id="s" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter>`,
        `</defs>`,
        `<rect x="${x0 + 2}" y="${y0 + 4}" width="${L}" height="${h}" rx="12" fill="#000" opacity="0.32" filter="url(#s)"/>`,
        // mirrors
        `<rect x="${ws - 8}" y="${y0 - 3}" width="7" height="5" rx="2" fill="${c.body[1]}"/><rect x="${ws - 8}" y="${y0 + h - 2}" width="7" height="5" rx="2" fill="${c.body[1]}"/>`,
        // body
        `<rect x="${x0}" y="${y0}" width="${L}" height="${h}" rx="${c.kind === "van" ? 8 : 12}" fill="url(#b)"/>`,
        `<rect x="${x0}" y="${y0}" width="${L}" height="${h}" rx="${c.kind === "van" ? 8 : 12}" fill="none" stroke="#000" stroke-opacity="0.25"/>`,
        // bonnet crease lines
        `<path d="M${ws + 6} ${y0 + 10} Q${x0 + L - 4} ${y0 + 12} ${x0 + L - 3} ${y0 + h / 2}" fill="none" stroke="#000" stroke-opacity="0.12"/>`,
        `<path d="M${ws + 6} ${y0 + h - 10} Q${x0 + L - 4} ${y0 + h - 12} ${x0 + L - 3} ${y0 + h / 2}" fill="none" stroke="#000" stroke-opacity="0.12"/>`,
        // the glasshouse: one dark rounded block, the roof set into it so glass shows all round, wider at the front
        // (the windscreen, with a FASTag inside) and at the back (the rear glass)
        c.kind === "pickup"
            ? `<rect x="${x0 + 4}" y="${y0 + 4}" width="${rear - x0 - 8}" height="${h - 8}" rx="3" fill="#3b3e43"/>` +
              Array.from({ length : 6 }, (_, k) => `<line x1="${x0 + 8 + k * ((rear - x0 - 16) / 5)}" y1="${y0 + 6}" x2="${x0 + 8 + k * ((rear - x0 - 16) / 5)}" y2="${y0 + h - 6}" stroke="#55595f" stroke-width="2"/>`).join("")
            : "",
        `<rect x="${rear}" y="${y0 + 4}" width="${ws - rear}" height="${h - 8}" rx="9" fill="url(#g)"/>`,
        `<path d="M${ws - 12} ${y0 + 7} L${ws - 4} ${y0 + 6} L${ws - 9} ${y0 + 20} Z" fill="#fff" opacity="0.25"/>`,
        `<rect x="${ws - 7}" y="${y0 + h / 2 - 7}" width="3.4" height="6" rx="0.6" fill="#fff"/>`,
        // roof
        `<rect x="${roofFrom}" y="${y0 + 7}" width="${Math.max(10, roofTo - roofFrom - 10)}" height="${h - 14}" rx="6" fill="${c.roof}"/>`,
        `<rect x="${roofFrom}" y="${y0 + 7}" width="${Math.max(10, roofTo - roofFrom - 10)}" height="${h - 14}" rx="6" fill="url(#r)"/>`,
        c.rails ? `<rect x="${roofFrom + 2}" y="${y0 + 10}" width="${Math.max(6, roofTo - roofFrom - 14)}" height="2" rx="1" fill="#2a2a2e"/><rect x="${roofFrom + 2}" y="${y0 + h - 12}" width="${Math.max(6, roofTo - roofFrom - 14)}" height="2" rx="1" fill="#2a2a2e"/>` : "",
        c.sign ? `<rect x="${(roofFrom + roofTo - 10) / 2 - 4}" y="${y0 + h / 2 - 7}" width="8" height="14" rx="2" fill="#2a2a2a"/><text x="${(roofFrom + roofTo - 10) / 2}" y="${y0 + h / 2 + 2.6}" text-anchor="middle" font-family="${SANS}" font-size="5" font-weight="800" fill="#ffd84a" transform="rotate(90 ${(roofFrom + roofTo - 10) / 2} ${y0 + h / 2})">TAXI</text>` : "",
        // headlights and tail lights
        `<rect x="${x0 + L - 5}" y="${y0 + 5}" width="4" height="8" rx="2" fill="#fffbe6"/><rect x="${x0 + L - 5}" y="${y0 + h - 13}" width="4" height="8" rx="2" fill="#fffbe6"/>`,
        `<rect x="${x0 + 1}" y="${y0 + 5}" width="3" height="8" rx="1.5" fill="#d0201a"/><rect x="${x0 + 1}" y="${y0 + h - 13}" width="3" height="8" rx="1.5" fill="#d0201a"/>`,
        // a long highlight on the body
        `<path d="M${x0 + 10} ${y0 + 2.5} L${x0 + L - 14} ${y0 + 2.5}" stroke="#fff" stroke-opacity="0.45" stroke-width="1.2" stroke-linecap="round"/>`,
    ].join(""));
};

// TRUCKS ==============================================================================================================
// Trucks seen from above, facing right, at the same scale as the cars (56 units across): a mini truck with an open bed,
// a tipper with a load of sand, a container truck, a tanker and a long hauler with a trailer. Each comes in a few
// Kosh colours; `variant` picks the colour.
const TRUCK_TONES = [ [ "#d27a64", "#8f4433" ], [ "#478f93", "#1e4e51" ], [ "#a079ee", "#5a2fb0" ], [ "#f4c25a", "#c98a14" ], [ "#86a83c", "#4a6a14" ], [ "#e9e4d8", "#a9a296" ] ] as const;
export const TRUCK_KINDS = [ "mini", "tipper", "container", "tanker", "hauler" ] as const;
export type TruckKind = (typeof TRUCK_KINDS)[number];
export const truckSvg = (kind : TruckKind, variant : number) : Drawn => {
    const t = TRUCK_TONES[((variant % TRUCK_TONES.length) + TRUCK_TONES.length) % TRUCK_TONES.length], cab = TRUCK_TONES[(variant + 2) % TRUCK_TONES.length];
    const W = { mini : 128, tipper : 176, container : 228, tanker : 236, hauler : 290 }[kind], H = 60, y0 = 5, h = 50;
    const cabL = kind === "mini" ? 34 : 42, cx = W - cabL - 3;                        // the cab at the front (right)
    const grad = (id : string, c : readonly [ string, string ]) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="0.5" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[0]}"/></linearGradient>`;
    const body : string[] = [];
    const bodyX = 3, bodyL = cx - bodyX - 3;
    if (kind === "mini") {
        body.push(`<rect x="${bodyX}" y="${y0}" width="${bodyL}" height="${h}" rx="3" fill="#6c645b"/><rect x="${bodyX + 4}" y="${y0 + 4}" width="${bodyL - 8}" height="${h - 8}" rx="2" fill="#3f3a35"/>`);
        // a load of sacks
        for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) body.push(`<rect x="${bodyX + 8 + c * 26}" y="${y0 + 8 + r * 18}" width="22" height="15" rx="6" fill="#e1d5bc" stroke="#b8a888" stroke-width="0.8"/>`);
    } else if (kind === "tipper") {
        body.push(`<rect x="${bodyX}" y="${y0}" width="${bodyL}" height="${h}" rx="4" fill="url(#tb)"/><rect x="${bodyX + 5}" y="${y0 + 5}" width="${bodyL - 10}" height="${h - 10}" rx="3" fill="#000" opacity="0.25"/>`);
        // the load of sand fills the bed, its ridge a lighter band along the middle
        body.push(`<rect x="${bodyX + 6}" y="${y0 + 6}" width="${bodyL - 12}" height="${h - 12}" rx="2" fill="#d9b779"/><rect x="${bodyX + 12}" y="${y0 + h / 2 - 7}" width="${bodyL - 24}" height="11" rx="2" fill="#ecd3a0"/>`);
    } else if (kind === "container" || kind === "hauler") {
        const L = kind === "hauler" ? bodyL : bodyL;
        body.push(`<rect x="${bodyX}" y="${y0}" width="${L}" height="${h}" rx="2" fill="url(#tb)"/>`);
        for (let x = bodyX + 8; x < bodyX + L - 4; x += 7) body.push(`<line x1="${x}" y1="${y0 + 2}" x2="${x}" y2="${y0 + h - 2}" stroke="#000" stroke-opacity="0.16" stroke-width="1.2"/>`);
        body.push(`<rect x="${bodyX}" y="${y0}" width="${L}" height="${h}" rx="2" fill="none" stroke="#000" stroke-opacity="0.3"/>`);
        if (kind === "hauler") body.push(`<rect x="${bodyX + L * 0.49}" y="${y0 - 1}" width="3" height="${h + 2}" fill="#000" opacity="0.35"/>`);
    } else {
        // the tanker: a long cylinder seen from above, lit along its top, a walkway down the middle
        body.push(`<rect x="${bodyX}" y="${y0 + 2}" width="${bodyL}" height="${h - 4}" rx="${(h - 4) / 2}" fill="url(#tk)"/>`);
        body.push(`<rect x="${bodyX + 14}" y="${y0 + h / 2 - 3}" width="${bodyL - 28}" height="6" rx="1" fill="#6c645b" opacity="0.7"/>`);
        for (const f of [ 0.25, 0.5, 0.75 ]) body.push(`<circle cx="${bodyX + bodyL * f}" cy="${y0 + h / 2}" r="5" fill="#9a948c" stroke="#5a5550"/>`);
    }
    return wrap(W, H, [
        `<defs>${grad("tb", t)}${grad("tc", cab)}`,
        `<linearGradient id="tk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8c8f95"/><stop offset="0.35" stop-color="#f4f4f2"/><stop offset="0.6" stop-color="#c9ccd1"/><stop offset="1" stop-color="#6d7178"/></linearGradient>`,
        `<filter id="s" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>`,
        `<rect x="4" y="${y0 + 4}" width="${W - 6}" height="${h}" rx="6" fill="#000" opacity="0.3" filter="url(#s)"/>`,
        ...body,
        // the cab: roof, windscreen and mirrors
        `<rect x="${cx - 6}" y="${y0 + 10}" width="6" height="${h - 20}" fill="#2f2f2f"/>`,
        `<rect x="${cx + cabL - 12}" y="${y0 - 4}" width="6" height="5" rx="1.5" fill="#2f2f2f"/><rect x="${cx + cabL - 12}" y="${y0 + h - 1}" width="6" height="5" rx="1.5" fill="#2f2f2f"/>`,
        `<rect x="${cx}" y="${y0}" width="${cabL}" height="${h}" rx="7" fill="url(#tc)"/>`,
        `<rect x="${cx + cabL - 11}" y="${y0 + 4}" width="8" height="${h - 8}" rx="3" fill="#1b2430"/>`,
        `<rect x="${cx + cabL - 9}" y="${y0 + 6}" width="2.5" height="12" rx="1" fill="#fff" opacity="0.3"/>`,
        `<rect x="${cx + cabL - 15}" y="${y0 + h / 2 - 3}" width="3" height="6" rx="0.6" fill="#fff"/>`,
        `<rect x="${cx + 4}" y="${y0 + 6}" width="${cabL - 18}" height="${h - 12}" rx="4" fill="#fff" opacity="0.12"/>`,
        `<rect x="${W - 5}" y="${y0 + 5}" width="3.5" height="8" rx="1.5" fill="#fffbe6"/><rect x="${W - 5}" y="${y0 + h - 13}" width="3.5" height="8" rx="1.5" fill="#fffbe6"/>`,
        `<rect x="${bodyX}" y="${y0 + 3}" width="3" height="7" rx="1" fill="#d0201a"/><rect x="${bodyX}" y="${y0 + h - 10}" width="3" height="7" rx="1" fill="#d0201a"/>`,
    ].join(""));
};

// THE FASTAG CARD =====================================================================================================
// The card a FASTag comes on: white, a slate-blue band with the issuing bank and a barcode, arrows each way, the
// vehicle class in a circle. Only the plain word FASTag, and "National Bank" for the bank; no other marks.
export const fastagCardSvg = () : Drawn => {
    const bars = Array.from({ length : 44 }, (_, k) => { const w = [ 1, 2, 1, 3, 1, 1, 2 ][k % 7]; return { x : 236 + k * 1.95, w : w * 0.65 }; });
    return wrap(330, 180, [
        `<defs>`,
        `<linearGradient id="card" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eef0f4"/></linearGradient>`,
        `<linearGradient id="band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6870b4"/><stop offset="1" stop-color="#4f579b"/></linearGradient>`,
        `<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.5"/><stop offset="0.35" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
        `<filter id="soft" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.2"/></filter>`,
        `</defs>`,
        `<rect x="5" y="5" width="320" height="166" rx="12" fill="url(#card)" stroke="#d9dce4" filter="url(#soft)"/>`,
        // the arrows, top pointing right and bottom pointing left
        `<path d="M22 18 H294 V14 L306 21 L294 28 V24 H22 Z" fill="#5b63a8"/>`,
        `<path d="M308 152 H36 V148 L24 155 L36 162 V158 H308 Z" fill="#5b63a8"/>`,
        // the class
        `<circle cx="30" cy="44" r="9" fill="none" stroke="#5b63a8" stroke-width="1.4"/><text x="30" y="48" text-anchor="middle" font-family="${SANS}" font-size="11" font-weight="700" fill="#5b63a8">4</text>`,
        // the word, in two colours
        `<text x="165" y="58" text-anchor="middle" font-family="${SANS}" font-size="27" font-weight="900" font-style="italic" letter-spacing="0.5"><tspan fill="#f08a1c">FAS</tspan><tspan fill="#3fa046">Tag</tspan></text>`,
        `<text x="150" y="69" text-anchor="middle" font-family="${SANS}" font-size="7" font-style="italic" fill="#5b5f6b">Easy to cruise</text>`,
        `<g fill="none" stroke="#f08a1c" stroke-width="1.4" stroke-linecap="round"><path d="M178 30 q4 3 0 7"/><path d="M182 27 q7 6 0 13"/></g>`,
        // the band
        `<rect x="5" y="78" width="320" height="48" fill="url(#band)"/>`,
        `<rect x="18" y="84" width="96" height="36" rx="9" fill="#fff"/>`,
        `<text x="66" y="106.5" text-anchor="middle" font-family="${SANS}" font-size="11" font-weight="800" fill="#2b3a7a">National Bank</text>`,
        `<text x="170" y="104" text-anchor="middle" font-family="${SANS}" font-size="8.5" fill="#fff">Customer care</text>`,
        `<text x="170" y="115" text-anchor="middle" font-family="${SANS}" font-size="9" font-weight="700" fill="#fff">1800 000 000</text>`,
        `<rect x="230" y="84" width="88" height="36" rx="2" fill="#fff"/>`,
        bars.map(b => `<rect x="${b.x}" y="88" width="${b.w}" height="28" fill="#1d1b19"/>`).join(""),
        `<text x="165" y="141" text-anchor="middle" font-family="${SANS}" font-size="7" fill="#7a7e8a">Toll card</text>`,
        `<rect x="5" y="5" width="320" height="166" rx="12" fill="url(#sheen)"/>`,
    ].join(""));
};

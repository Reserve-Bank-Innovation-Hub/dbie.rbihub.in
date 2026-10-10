// The machines, in 2D: the screen split in two, ATMs on the left and micro-ATMs on the right, and in each half two
// grids of small squares, one above the other (on the first step, the machines and the withdrawals made at them; on
// the second, the withdrawals and the cash they took out: a ₹ coin over an open hand is a withdrawal, a banknote is
// cash). A square is the same amount on both sides, so the two halves
// compare by area. The months play like the UPI wall's: squares fill in, or go, from the end of each grid, the last
// one partly drawn, so the grids move smoothly from month to month. Every grid, in both steps, has the same square,
// the same width and the same band, so they compare by their rows and nothing jumps between the steps; each half is headed by a larger drawing of its machine (decoration, not data).

// LOCAL ===============================================================================================================
import { JOURNEY, KOSH, loopWhileVisible } from "./cashThree";

export type CellKind = "atm" | "micro" | "withdrawal" | "cash";
export interface GridSeries {
    cells : number[];                   // squares each month (the amount ÷ what a square stands for)
    kind  : CellKind;
    label : (m : number) => string;     // the grid's caption, that month
}
export interface GridHalf { title : string; lead : "atm" | "micro"; top : GridSeries; bottom : GridSeries }
export interface GridsOptions {
    reduced : boolean;
    left    : GridHalf;
    right   : GridHalf;
    fitMax  : number;                   // the most squares any grid needs in any of the steps, so all are laid out alike
    noteMix : number[][];               // each month, the shares of notes by number: ₹500, ₹100, ₹200, ₹2,000
    onMonth : (m : number) => void;
    onEnd   : () => void;
}
export interface GridsScene { play : () => void; pause : () => void; setMonth : (m : number) => void; dispose : () => void }

const hex = (c : number) => `#${c.toString(16).padStart(6, "0")}`;
const INK = hex(KOSH.charcoal), INK_SOFT = "rgba(47,47,47,0.62)", RULE = "rgba(47,47,47,0.14)";

// One square of each kind, drawn at (x, y) with side s and opacity a.
// Cash withdrawn is drawn as notes coloured by denomination, in the mix of ₹100 and larger notes in circulation that
// year: ₹500 Neem, ₹100 lavender, ₹200 turmeric, ₹2,000 pink. Each square keeps a fixed place in the mix, so
// a square changes colour only when the mix moves past it.
const NOTES = [
    [ "#cfdcaa", hex(KOSH.neem) ],                       // ₹500
    [ "#ddd0f6", hex(KOSH.indivara) ],                   // ₹100
    [ "#f6dfa8", hex(KOSH.turmeric) ],                   // ₹200
    [ "#f4c6dc", "#c4508a" ],                            // ₹2,000
];
const notePick = (k : number, mix : number[]) => {
    const u = ((k * 2654435761) >>> 0) / 4294967296;     // the square's fixed place, 0 to 1
    let acc = 0;
    for (let i = 0; i < mix.length; i++) if (u < (acc += mix[i])) return NOTES[i];
    return NOTES[NOTES.length - 1];
};
function cell(g : CanvasRenderingContext2D, kind : CellKind, x : number, y : number, s : number, a : number, font : string, note = NOTES[0]) {
    if (a <= 0) return;
    const gap = Math.max(1, s * 0.16), w = s - gap, r = Math.min(3, w * 0.22);
    g.globalAlpha = a;
    if (kind === "atm") {
        // a cash machine, front on: a tall charcoal cabinet on a plinth, a lit Indivara sign across its top, a pale
        // screen in a dark bezel, and, where there is room, the keypad, the card slot and the cash slot
        const bx = x + w * 0.16, bw = w * 0.68;
        g.fillStyle = "#1f1f22"; g.fillRect(x + w * 0.1, y + w * 0.9, w * 0.8, w * 0.1);           // the plinth
        g.fillStyle = INK; g.beginPath(); g.roundRect(bx, y, bw, w * 0.92, [ r * 1.4, r * 1.4, 0, 0 ]); g.fill();
        g.fillStyle = hex(KOSH.indivara); g.beginPath(); g.roundRect(bx, y, bw, w * 0.15, [ r * 1.4, r * 1.4, 0, 0 ]); g.fill();
        g.fillStyle = "#151517"; g.fillRect(bx + bw * 0.12, y + w * 0.22, bw * 0.76, w * 0.3);    // the bezel
        g.fillStyle = "#cfd8e6"; g.fillRect(bx + bw * 0.2, y + w * 0.26, bw * 0.6, w * 0.22);      // the screen
        if (w >= 14) {
            g.fillStyle = "rgba(255,255,255,0.55)";
            for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) g.fillRect(bx + bw * (0.14 + j * 0.13), y + w * (0.58 + k * 0.07), bw * 0.08, w * 0.04);
            g.fillStyle = hex(KOSH.turmeric); g.fillRect(bx + bw * 0.62, y + w * 0.6, bw * 0.24, w * 0.035);   // card slot
        }
        if (w >= 9) { g.fillStyle = hex(KOSH.sandalwood); g.fillRect(bx + bw * 0.18, y + w * 0.82, bw * 0.64, w * 0.045); }   // cash slot
    } else if (kind === "micro") {
        // a handheld micro-ATM: a dark body, a green screen at the top and, where there is room, keys
        g.fillStyle = "#3a3a3c"; g.beginPath(); g.roundRect(x + w * 0.12, y, w * 0.76, w, r); g.fill();
        g.fillStyle = "#9fbd5c"; g.fillRect(x + w * 0.24, y + w * 0.12, w * 0.52, w * 0.28);
        if (w >= 8) {
            g.fillStyle = "rgba(255,255,255,0.6)";
            for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) g.fillRect(x + w * (0.27 + j * 0.17), y + w * (0.5 + k * 0.11), w * 0.1, w * 0.065);
        }
    } else if (kind === "withdrawal") {
        // a withdrawal: a ₹ coin over an open hand, in terracotta line
        g.strokeStyle = hex(KOSH.terracotta); g.fillStyle = hex(KOSH.terracotta); g.lineCap = "round"; g.lineJoin = "round";
        const P = (fx : number, fy : number) : [ number, number ] => [ x + w * fx, y + w * fy ];
        if (w < 11) {
            g.lineWidth = Math.max(1, w * 0.12);
            g.beginPath(); g.arc(...P(0.5, 0.5), w * 0.34, 0, Math.PI * 2); g.stroke();
        } else {
            g.lineWidth = Math.max(1, w * 0.06);
            // the coin, open at the bottom where the hand cups it, with a ₹
            g.beginPath(); g.arc(...P(0.57, 0.36), w * 0.21, Math.PI * 0.85, Math.PI * 2.3); g.stroke();
            g.font = `700 ${Math.round(w * 0.24)}px ${font}`; g.textAlign = "center"; g.textBaseline = "middle";
            g.fillText("₹", ...P(0.57, 0.37));
            // the hand: the back of it and the thumb above, the fingers below, the wrist to the left
            g.beginPath();
            g.moveTo(...P(0.05, 0.63)); g.lineTo(...P(0.16, 0.61));
            g.bezierCurveTo(...P(0.24, 0.53), ...P(0.32, 0.51), ...P(0.42, 0.53));
            g.lineTo(...P(0.58, 0.59));
            g.bezierCurveTo(...P(0.64, 0.61), ...P(0.62, 0.67), ...P(0.56, 0.66));
            g.lineTo(...P(0.4, 0.65));
            g.stroke();
            g.beginPath();
            g.moveTo(...P(0.13, 0.75));
            g.bezierCurveTo(...P(0.22, 0.73), ...P(0.3, 0.75), ...P(0.38, 0.79));
            g.bezierCurveTo(...P(0.46, 0.82), ...P(0.58, 0.81), ...P(0.66, 0.77));
            g.lineTo(...P(0.88, 0.63));
            g.bezierCurveTo(...P(0.94, 0.58), ...P(0.9, 0.53), ...P(0.83, 0.56));
            g.lineTo(...P(0.66, 0.65));
            g.stroke();
        }
        g.lineCap = "butt"; g.lineJoin = "miter";
    } else {
        // cash withdrawn: a banknote, in its colour
        g.fillStyle = note[0]; g.fillRect(x, y + w * 0.2, w, w * 0.6);
        g.strokeStyle = note[1]; g.lineWidth = Math.max(1, w * 0.1);
        g.strokeRect(x + g.lineWidth / 2, y + w * 0.2 + g.lineWidth / 2, w - g.lineWidth, w * 0.6 - g.lineWidth);
        if (w >= 12) { g.fillStyle = hex(KOSH.sandal8); g.beginPath(); g.arc(x + w * 0.66, y + w * 0.5, w * 0.12, 0, Math.PI * 2); g.fill(); }
    }
    g.globalAlpha = 1;
}

// THE LEAD DRAWINGS ===================================================================================================
// A cash machine, front on, h tall: a lit sign, a screen with a line of welcome on it, a keypad with its three coloured
// keys, a card slot with a card going in, a cash slot with notes showing, all on a plinth.
function leadATM(g : CanvasRenderingContext2D, x : number, y : number, h : number, font : string) {
    const w = h * 0.62, r = h * 0.04;
    g.fillStyle = "rgba(47,47,47,0.12)"; g.beginPath(); g.ellipse(x + w / 2, y + h * 0.99, w * 0.6, h * 0.03, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#1c1c1f"; g.fillRect(x - w * 0.04, y + h * 0.9, w * 1.08, h * 0.09);
    const body = g.createLinearGradient(x, 0, x + w, 0);
    body.addColorStop(0, "#3a3a3e"); body.addColorStop(0.5, INK); body.addColorStop(1, "#242427");
    g.fillStyle = body; g.beginPath(); g.roundRect(x, y, w, h * 0.92, [ r * 2, r * 2, 0, 0 ]); g.fill();
    g.fillStyle = hex(KOSH.indivara); g.beginPath(); g.roundRect(x, y, w, h * 0.13, [ r * 2, r * 2, 0, 0 ]); g.fill();
    g.fillStyle = "#ffffff"; g.font = `700 ${Math.round(h * 0.075)}px ${font}`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("ATM", x + w / 2, y + h * 0.068);
    g.fillStyle = "#121214"; g.beginPath(); g.roundRect(x + w * 0.1, y + h * 0.19, w * 0.8, h * 0.3, r); g.fill();
    const scr = g.createLinearGradient(0, y + h * 0.22, 0, y + h * 0.46);
    scr.addColorStop(0, "#dfe7f3"); scr.addColorStop(1, "#b9c6da");
    g.fillStyle = scr; g.fillRect(x + w * 0.16, y + h * 0.22, w * 0.68, h * 0.24);
    g.fillStyle = INK; g.font = `600 ${Math.round(h * 0.05)}px ${font}`; g.fillText("Welcome", x + w / 2, y + h * 0.34);
    // the keypad, and Cancel, Clear and Enter beside it
    for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) {
        g.fillStyle = "#cfcfd3"; g.fillRect(x + w * (0.14 + j * 0.13), y + h * (0.55 + k * 0.055), w * 0.1, h * 0.038);
    }
    [ hex(KOSH.vermilion), hex(KOSH.turmeric), hex(KOSH.neem) ].forEach((c, k) => { g.fillStyle = c; g.fillRect(x + w * 0.54, y + h * (0.55 + k * 0.055), w * 0.12, h * 0.038); });
    // the card slot with a card going in, and the cash slot with notes
    g.fillStyle = "#0e0e10"; g.fillRect(x + w * 0.72, y + h * 0.58, w * 0.18, h * 0.02);
    g.fillStyle = hex(KOSH.indivara); g.fillRect(x + w * 0.75, y + h * 0.53, w * 0.12, h * 0.05);
    g.fillStyle = "#0e0e10"; g.fillRect(x + w * 0.16, y + h * 0.8, w * 0.68, h * 0.035);
    g.fillStyle = hex(KOSH.sandalwood); g.fillRect(x + w * 0.24, y + h * 0.775, w * 0.52, h * 0.03);
}
// A handheld micro-ATM, h tall, as banking agents carry: a black body, a green screen, a keypad with its three coloured
// keys, and a card in the slot at its side.
function leadMicro(g : CanvasRenderingContext2D, x : number, y : number, h : number, font : string) {
    const w = h * 0.6, r = h * 0.08;
    g.fillStyle = hex(KOSH.indivara); g.beginPath(); g.roundRect(x + w * 0.62, y + h * 0.3, w * 0.62, h * 0.38, h * 0.03); g.fill();
    g.fillStyle = "rgba(255,255,255,0.5)"; g.fillRect(x + w * 0.9, y + h * 0.4, w * 0.18, h * 0.07);
    const body = g.createLinearGradient(x, 0, x + w, 0);
    body.addColorStop(0, "#3a3a3d"); body.addColorStop(0.5, "#232325"); body.addColorStop(1, "#18181a");
    g.fillStyle = body; g.beginPath(); g.roundRect(x, y, w, h, [ r * 0.6, r * 1.6, r * 0.8, r * 0.8 ]); g.fill();
    g.fillStyle = "#101012"; g.beginPath(); g.roundRect(x + w * 0.1, y + h * 0.12, w * 0.8, h * 0.24, r * 0.4); g.fill();
    g.fillStyle = "#8fae55"; g.fillRect(x + w * 0.15, y + h * 0.15, w * 0.7, h * 0.18);
    g.fillStyle = "#24321a"; g.font = `500 ${Math.round(h * 0.06)}px ui-monospace, monospace`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("Welcome", x + w / 2, y + h * 0.245);
    for (let k = 0; k < 4; k++) for (let j = 0; j < 4; j++) {
        g.fillStyle = j < 3 ? "#0d0d0f" : [ "#2a2a2c", hex(KOSH.vermilion), hex(KOSH.turmeric), hex(KOSH.neem) ][k];
        g.beginPath(); g.roundRect(x + w * (0.1 + j * 0.205), y + h * (0.46 + k * 0.12), w * 0.17, h * 0.085, h * 0.015); g.fill();
        g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 1; g.stroke();
    }
    g.fillStyle = "#ffffff"; g.font = `600 ${Math.round(h * 0.045)}px ${font}`;
    for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) g.fillText("123456789*0#"[k * 3 + j], x + w * (0.185 + j * 0.205), y + h * (0.505 + k * 0.12));
}

// Every grids stage on the page draws at the same square size, columns and bands, so moving from one step to the next
// the squares do not change size: each stage reports the square that fits it, and all use the smallest.
const SIZES = new Map<number, number>(), RELAYOUTS = new Map<number, () => void>();
let NEXT_ID = 0;

export function mountGridsScene(canvas : HTMLCanvasElement, o : GridsOptions) : GridsScene {
    const g = canvas.getContext("2d") as CanvasRenderingContext2D;
    const host = canvas.parentElement as HTMLElement;
    const font = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
    const months = o.left.top.cells.length, last = months - 1;
    let W = 0, H = 0, dpr = 1;
    let s = 8, cols = 10, half = 0, gutter = 24, titleH = 30, labelH = 24, rows = 1, between = 14, blockCols = 10;
    // the square that fits this stage on its own; the square every stage draws at is the smallest of these
    let own = 8;
    const layout = () => {
        dpr = Math.min(2, window.devicePixelRatio || 1);
        W = host.clientWidth; H = host.clientHeight;
        if (!W || !H) return;
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
        const narrow = W < 600;
        gutter = narrow ? 14 : 40; titleH = narrow ? 50 : 80; labelH = narrow ? 32 : 22; between = narrow ? 10 : 14;
        half = (W - gutter) / 2;
        // the largest square that fits two equal bands, each tall enough for the largest grid in any of the steps
        for (own = 72; own > 3; own -= 0.5) {
            const r = Math.ceil(o.fitMax / Math.floor(half / own));
            if (titleH + labelH * 2 + between + 2 * r * own <= H) break;
        }
        SIZES.set(id, own);
        settle();
        RELAYOUTS.forEach((f, k) => { if (k !== id) f(); });
    };
    // with the shared square: the columns, the rows each band sets aside, and one block width for every grid
    const settle = () => {
        s = Math.min(...SIZES.values());
        cols = Math.floor(half / s);
        rows = Math.ceil(o.fitMax / cols);
        blockCols = Math.min(cols, Math.max(Math.ceil(o.fitMax / rows), Math.ceil(Math.sqrt(o.fitMax * 1.4))));
    };
    const id = NEXT_ID++;
    RELAYOUTS.set(id, () => { settle(); draw(pos()); });

    // the newest machine in each grid breathes, fading down and up again, slowly
    let breath = 1;
    const drawGrid = (series : GridSeries, pos : number, x0 : number, y0 : number) => {
        const i = Math.floor(pos), f = pos - i;
        const v = series.cells[i] + ((series.cells[Math.min(last, i + 1)] ?? series.cells[i]) - series.cells[i]) * f;
        g.fillStyle = INK_SOFT; g.font = `500 ${W < 600 ? 11 : 13}px ${font}`; g.textAlign = "left"; g.textBaseline = "alphabetic";
        const text = series.label(Math.round(pos));
        if (W < 600) {
            // on a phone, the caption on two lines: what it is, and how many
            const [ what, howMany ] = text.split(" · ");
            g.fillText(what, x0, y0 + 13);
            g.fillStyle = INK; g.font = `600 12px ${font}`; g.fillText(howMany ?? "", x0, y0 + 28);
        } else g.fillText(text, x0, y0 + 17);
        const top = y0 + labelH;
        const full = Math.floor(v);
        const newest = Math.ceil(v) - 1, breathes = series.kind === "atm" || series.kind === "micro";
        for (let k = 0; k <= full && k < Math.ceil(v); k++) {
            const a = (k < full ? 1 : v - full) * (breathes && k === newest ? breath : 1);
            const c = blockCols;
            cell(g, series.kind, x0 + (k % c) * s, top + Math.floor(k / c) * s, s, a, font, notePick(k, o.noteMix[Math.round(pos)]));
        }
    };

    const draw = (pos : number) => {
        if (!W || !H) return;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, W, H);
        // the line between the halves
        g.fillStyle = RULE; g.fillRect(half + gutter / 2 - 0.5, 0, 1, H);
        [ o.left, o.right ].forEach((h, side) => {
            const x0 = side ? half + gutter : 0;
            // the lead drawing, then the title beside it
            const lh = titleH - 8;
            if (h.lead === "atm") leadATM(g, x0, 2, lh, font); else leadMicro(g, x0, 2, lh, font);
            g.fillStyle = INK; g.font = `700 ${W < 600 ? 17 : 24}px ${font}`; g.textAlign = "left"; g.textBaseline = "middle";
            g.fillText(h.title, x0 + lh * (h.lead === "atm" ? 0.62 : 0.98) + (W < 600 ? 8 : 16), titleH / 2);
            drawGrid(h.top, pos, x0, titleH);
            drawGrid(h.bottom, pos, x0, titleH + labelH + rows * s + between);
        });
    };

    // THE CLOCK =======================================================================================================
    const MONTH = JOURNEY / months;                     // seconds a month lasts
    let m = o.reduced ? last : 0, inMonth = 0, playing = false;
    const pos = () => Math.min(last, m + (playing ? inMonth / MONTH : 0));
    layout(); draw(pos());
    const ro = new ResizeObserver(() => { layout(); draw(pos()); });
    ro.observe(host);
    document.fonts?.ready.then(() => draw(pos()));
    const unloop = o.reduced ? () => {} : loopWhileVisible(canvas, (dt, now) => {
        breath = 0.25 + 0.75 * (0.5 + 0.5 * Math.cos(now * Math.PI * 2 / 1.8));
        if (playing && (inMonth += dt) >= MONTH) {
            inMonth -= MONTH;
            if (m < last) { m++; o.onMonth(m); }
            if (m >= last) { playing = false; inMonth = 0; o.onEnd(); }
        }
        draw(pos());
    });

    return {
        play : () => {
            if (o.reduced) return;
            if (m >= last) { m = 0; o.onMonth(0); }
            playing = true; inMonth = 0;
        },
        pause : () => { playing = false; inMonth = 0; draw(pos()); },
        setMonth : (i : number) => { m = i; inMonth = 0; draw(pos()); },
        dispose : () => { unloop(); ro.disconnect(); SIZES.delete(id); RELAYOUTS.delete(id); RELAYOUTS.forEach(f => f()); },
    };
}

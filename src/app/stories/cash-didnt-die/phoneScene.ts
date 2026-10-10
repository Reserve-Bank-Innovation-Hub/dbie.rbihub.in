// The title: pay with the phone, keep the cash. An evening at a chai stall, seen as the one paying sees it: the phone
// held up, the stall soft behind it, its QR code on the counter. The phone scans the code, Pay is tapped, ₹50 goes to
// the chai stall, and the payment joins the day's list (milk, a cab, groceries, vegetables). Then the phone is turned
// over and set face down on the stall's table: folded behind it, in its clear case, is a ₹500 note, a little worn.
// The camera rises, the page's words come in, and the payments go on: each one lights the table green from under the
// phone's edges, quicker and quicker, while the note stays where it is. No numbers: the title makes no claim, the
// story's steps carry the data.
// No hand is shown. The phone and the case are generic (no maker's shapes or marks), the screens name no app, the
// places are everyday kinds, not names, and the note is the story's own stylised ₹500 (sandalwood paper, Neem print,
// no portrait), folded once, with a crease and grain. Reduced motion starts on the held frame.

// REACT CORE ==========================================================================================================
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// LOCAL ===============================================================================================================
import { KOSH, fitToHost, loopWhileVisible, makeRenderer, noteTexture } from "./cashThree";

export interface PhoneScene { dispose : () => void }
export interface PhoneOptions { reduced : boolean; onReveal : () => void }

// Sizes in decimetres (a phone 75 × 160 × 8 mm), the units the note texture uses. The table is y = 0.
const PW = 0.75, PH = 1.6, PD = 0.075, PR = 0.11;     // the phone's body and corner radius
const CASE_GAP = 0.03;                                 // between the phone's back and the case's back plate
const ISLAND = 0.34, ISLAND_X = PW / 2 - 0.215, ISLAND_Y = PH / 2 - 0.225;   // the camera block: its size and centre
const Y_DOWN = PD / 2 + 0.003;                         // lying on its screen

// The clock, in seconds. The screen wakes by WAKE. SCAN_AT: the QR code; PAY_AT: the amount and Pay; PRESS_AT: Pay
// tapped; PAID_AT: paid; LIST_AT: the day's list, the chai joining it at CHAI_AT. FLIP_AT to LAND_AT: the phone
// turned over and set down; REVEAL_AT: the page's words; REST_AT: the camera has risen to the held shot; LEAK_AT: the first payment lighting the table from under the phone.
const WAKE = 0.5, SCAN_AT = 0.4, PAY_AT = 1.45, PRESS_AT = 2.05, PAID_AT = 2.65, LIST_AT = 3.45, CHAI_AT = 3.6;
const FLIP_AT = 4.8, LAND_AT = 6.0, REVEAL_AT = 7.2, REST_AT = 8.4, LEAK_AT = 7.8;

const hex = (c : number) => `#${c.toString(16).padStart(6, "0")}`;
const clamp01 = (x : number) => Math.max(0, Math.min(1, x));
const span = (t : number, a : number, b : number) => clamp01((t - a) / (b - a));
// smootherstep: still at both ends, the weight of the move in the middle
const ease = (x : number) => x * x * x * (x * (x * 6 - 15) + 10);
const easeOut = (x : number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x : number) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

// A rounded rectangle, centred.
function rounded(w : number, h : number, r : number) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
}
// A flat shape with UVs running 0 to 1 across its bounding box, so a canvas maps onto it whole.
function flat(shape : THREE.Shape, w : number, h : number) {
    const g = new THREE.ShapeGeometry(shape, 24);
    const pos = g.getAttribute("position"), uv = g.getAttribute("uv");
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
    return g;
}

// THE SCREENS =========================================================================================================
// One canvas, redrawn while the payment plays. scan: the camera's view of the stall's QR code, the scan line passing,
// the corners turning green as it reads. pay: who is being paid and how much, and a Pay button (pressed in `press`).
// sending: a ring filling round the amount. paid: Neem green, a white ₹, "Paid ₹50". list: today's UPI payments, the
// chai joining at the top. `k` runs 0 to 1 through each state; in the list, `a` brings in the chai.
const SW = 600, SH = 1300;
type ScreenState = "scan" | "pay" | "press" | "sending" | "paid" | "list";
const AMOUNT = 50;
const ROWS = [
    { name : "Chai stall", time : "6:40 pm", amount : AMOUNT },
    { name : "Vegetable shop", time : "6:05 pm", amount : 80 },
    { name : "Grocery store", time : "1:10 pm", amount : 285 },
    { name : "Cab service", time : "9:20 am", amount : 110 },
    { name : "Milk booth", time : "7:45 am", amount : 28 },
];
// a QR code's look: three finder squares and a seeded scatter of modules (it encodes nothing)
const QR = (() => {
    const n = 25, cells : boolean[] = [];
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < n * n; i++) cells.push(rnd() < 0.5);
    return { n, cells };
})();
function drawQR(g : CanvasRenderingContext2D, cx : number, cy : number, size : number) {
    const { n, cells } = QR, m = size / n;
    g.fillStyle = "#ffffff"; g.fillRect(cx - size / 2 - m * 2, cy - size / 2 - m * 2, size + m * 4, size + m * 4);
    g.fillStyle = "#1a1a1a";
    const x0 = cx - size / 2, y0 = cy - size / 2;
    const finder = (fx : number, fy : number) => (fx < 8 && fy < 8) || (fx >= n - 8 && fy < 8) || (fx < 8 && fy >= n - 8);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!finder(x, y) && cells[y * n + x]) g.fillRect(x0 + x * m, y0 + y * m, m + 0.5, m + 0.5);
    for (const [ fx, fy ] of [ [ 0, 0 ], [ n - 7, 0 ], [ 0, n - 7 ] ]) {
        g.fillRect(x0 + fx * m, y0 + fy * m, 7 * m, 7 * m);
        g.fillStyle = "#ffffff"; g.fillRect(x0 + (fx + 1) * m, y0 + (fy + 1) * m, 5 * m, 5 * m);
        g.fillStyle = "#1a1a1a"; g.fillRect(x0 + (fx + 2) * m, y0 + (fy + 2) * m, 3 * m, 3 * m);
    }
}
const rupeeDisc = (g : CanvasRenderingContext2D, font : string, x : number, y : number, r : number, bg : string, fg : string) => {
    g.fillStyle = bg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.fillStyle = fg; g.font = `700 ${Math.round(r * 1.15)}px ${font}`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("₹", x, y + r * 0.06);
};
function drawScreen(g : CanvasRenderingContext2D, font : string, state : ScreenState, k : number, a = 0) {
    const ink = hex(KOSH.charcoal), neem = hex(KOSH.neem);
    g.textAlign = "center"; g.textBaseline = "alphabetic"; g.globalAlpha = 1;
    if (state === "scan") {
        // the camera's view of a counter, out of focus
        const bg = g.createLinearGradient(0, 0, 0, SH);
        bg.addColorStop(0, "#4a3f36"); bg.addColorStop(1, "#211d1a");
        g.fillStyle = bg; g.fillRect(0, 0, SW, SH);
        for (const [ x, y, r, c ] of [ [ 90, 240, 120, "#7a6450" ], [ 520, 1050, 160, "#5a4a3c" ], [ 480, 180, 70, "#9a7a52" ], [ 120, 1120, 90, "#6b5a48" ] ] as const) {
            const grd = g.createRadialGradient(x, y, 0, x, y, r);
            grd.addColorStop(0, c); grd.addColorStop(1, "rgba(0,0,0,0)");
            g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2);
        }
        g.fillStyle = "#ffffff"; g.font = `600 40px ${font}`; g.fillText("Scan any UPI QR code", SW / 2, 230);
        // the code, drifting a little as the phone is held, then still as it reads
        const hold = 1 - easeOut(clamp01(k / 0.7));
        drawQR(g, SW / 2 + Math.sin(k * 9) * 14 * hold, 640 + Math.cos(k * 7) * 10 * hold, 290 - 30 * hold);
        const read = clamp01((k - 0.7) / 0.3);
        // the frame's corners
        const s = 210 - 14 * easeOut(read), L = 64;
        g.strokeStyle = read > 0 ? neem : "#ffffff"; g.lineWidth = 12; g.lineCap = "round";
        for (const [ sx, sy ] of [ [ -1, -1 ], [ 1, -1 ], [ -1, 1 ], [ 1, 1 ] ]) {
            const x = SW / 2 + sx * s, y = 640 + sy * s;
            g.beginPath(); g.moveTo(x, y - sy * L); g.lineTo(x, y); g.lineTo(x - sx * L, y); g.stroke();
        }
        if (read === 0) {
            const ly = 640 - s + 2 * s * ((k * 1.6) % 1);
            const line = g.createLinearGradient(0, ly - 30, 0, ly + 4);
            line.addColorStop(0, "rgba(107,142,35,0)"); line.addColorStop(1, "rgba(107,142,35,0.9)");
            g.fillStyle = line; g.fillRect(SW / 2 - s + 16, ly - 30, 2 * s - 32, 34);
        }
        return;
    }
    if (state === "paid") {
        g.fillStyle = neem; g.fillRect(0, 0, SW, SH);
        const pop = k < 0.35 ? easeOut(k / 0.35) * 1.08 : 1.08 - 0.08 * easeOut(Math.min(1, (k - 0.35) / 0.3));
        g.save(); g.translate(SW / 2, 540); g.scale(pop, pop);
        rupeeDisc(g, font, 0, 0, 130, "#ffffff", neem);
        g.restore();
        g.globalAlpha = clamp01((k - 0.2) / 0.4);
        g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "alphabetic";
        g.font = `700 76px ${font}`; g.fillText(`Paid ₹${AMOUNT}`, SW / 2, 820);
        g.font = `500 40px ${font}`; g.fillText("to Chai stall", SW / 2, 888);
        g.font = `400 32px ${font}`; g.globalAlpha *= 0.8; g.fillText("by UPI", SW / 2, 950);
        g.globalAlpha = 1;
        return;
    }
    if (state === "list") {
        g.fillStyle = hex(KOSH.sandal8); g.fillRect(0, 0, SW, SH);
        g.textAlign = "left"; g.fillStyle = ink;
        g.font = `700 60px ${font}`; g.fillText("Today", 48, 190);
        g.globalAlpha = 0.6; g.font = `500 32px ${font}`; g.fillText("UPI payments", 48, 240); g.globalAlpha = 1;
        const RH = 152;
        let y = 290;
        ROWS.forEach((row, i) => {
            // `a` runs 0 to 2: in over the first half, the green glow fading over the second
            const raw = i === 0 ? a : 2, in_ = Math.min(1, raw);
            if (in_ <= 0) return;
            const e = easeOut(in_);
            const top = y - RH * (1 - e) * 0.35;
            g.globalAlpha = e;
            g.fillStyle = "#ffffff";
            g.beginPath(); g.roundRect(32, top, SW - 64, RH - 18, 28); g.fill();
            // a new payment's card glows green a moment
            const fresh = 1 - clamp01(raw - 1);
            if (fresh > 0) { g.globalAlpha = e * fresh * 0.25; g.fillStyle = neem; g.beginPath(); g.roundRect(32, top, SW - 64, RH - 18, 28); g.fill(); g.globalAlpha = e; }
            rupeeDisc(g, font, 100, top + (RH - 18) / 2, 40, neem, "#ffffff");
            g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillStyle = ink;
            g.font = `600 36px ${font}`; g.fillText(row.name, 164, top + 62);
            g.globalAlpha = e * 0.55; g.font = `400 28px ${font}`; g.fillText(row.time, 164, top + 104); g.globalAlpha = e;
            g.textAlign = "right"; g.font = `700 44px ${font}`; g.fillText(`₹${row.amount}`, SW - 64, top + 84);
            y += (RH) * e;
        });
        g.globalAlpha = 1;
        // the Paid screen fades into the list
        if (k < 1) { g.globalAlpha = 1 - easeOut(k); drawScreen(g, font, "paid", 1); g.globalAlpha = 1; }
        return;
    }
    g.fillStyle = hex(KOSH.sandal8); g.fillRect(0, 0, SW, SH);
    g.fillStyle = ink; g.globalAlpha = 0.55; g.font = `500 34px ${font}`; g.fillText("Paying", SW / 2, 250); g.globalAlpha = 1;
    g.font = `700 52px ${font}`; g.fillText("Chai stall", SW / 2, 320);
    // the amount, in a disc; the ring fills round it while the payment goes
    g.fillStyle = "#ffffff"; g.beginPath(); g.arc(SW / 2, 600, 170, 0, Math.PI * 2); g.fill();
    g.fillStyle = ink; g.font = `700 112px ${font}`; g.textBaseline = "middle"; g.fillText(`₹${AMOUNT}`, SW / 2, 606);
    if (state === "sending") {
        g.strokeStyle = hex(KOSH.sandalwood); g.lineWidth = 14; g.beginPath(); g.arc(SW / 2, 600, 196, 0, Math.PI * 2); g.stroke();
        g.strokeStyle = neem; g.lineCap = "round";
        g.beginPath(); g.arc(SW / 2, 600, 196, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * easeOut(k)); g.stroke();
    }
    // the Pay button: pressed, it darkens and sinks a little; once sending, it fades
    const press = state === "press" ? Math.sin(Math.min(1, k) * Math.PI) : 0;
    g.globalAlpha = state === "sending" ? 1 - clamp01(k * 3) : 1;
    const bw = 380 - press * 16, bh = 116 - press * 6;
    g.fillStyle = press ? "#557219" : neem;
    g.beginPath(); g.roundRect(SW / 2 - bw / 2, 1010 - bh / 2, bw, bh, bh / 2); g.fill();
    g.fillStyle = "#ffffff"; g.font = `600 46px ${font}`; g.fillText("Pay by UPI", SW / 2, 1013);
    // the tap: a soft ring spreading from where the finger touched, as a phone shows a touch
    if (state === "press" || (state === "sending" && k < 0.5)) {
        const r = state === "press" ? k : 1 + k * 2;
        g.globalAlpha = Math.max(0, 0.45 * (1 - r / 2));
        g.fillStyle = "#ffffff"; g.beginPath(); g.arc(SW / 2 + 40, 1018, 30 + 70 * easeOut(Math.min(1, r / 2)), 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
}

// THE PAPER ===========================================================================================================
// From the note's printed face: the face with grain, a dark line and a lit line for the crease across the middle
// (from an older fold into four) and a soft shadow down the fold; the back, plain paper with the same grain and a
// faint Neem border; and a bump map of the grain and the crease, so light catches them.
function paperTextures(src : HTMLCanvasElement, renderer : THREE.WebGLRenderer) {
    const W = src.width, H = src.height;
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const grain = new Float32Array(W * H);
    for (let i = 0; i < grain.length; i++) grain[i] = rnd() - 0.5;
    // fibres: short faint strokes laid into the grain
    for (let k = 0; k < 1400; k++) {
        const x0 = rnd() * W, y0 = rnd() * H, a = rnd() * Math.PI, len = 6 + rnd() * 18, v = (rnd() - 0.5) * 1.6;
        for (let s = 0; s < len; s++) {
            const x = Math.round(x0 + Math.cos(a) * s), y = Math.round(y0 + Math.sin(a) * s);
            if (x >= 0 && y >= 0 && x < W && y < H) grain[y * W + x] += v;
        }
    }
    const make = (draw : (g : CanvasRenderingContext2D) => void, tone : (i : number, rgba : Uint8ClampedArray) => void) => {
        const cv = document.createElement("canvas");
        cv.width = W; cv.height = H;
        const g = cv.getContext("2d") as CanvasRenderingContext2D;
        draw(g);
        const img = g.getImageData(0, 0, W, H);
        for (let i = 0; i < W * H; i++) tone(i, img.data);
        g.putImageData(img, 0, 0);
        return cv;
    };
    const creases = (g : CanvasRenderingContext2D, dark : string, light : string) => {
        g.fillStyle = dark; g.fillRect(0, H / 2 - 2, W, 2);
        g.fillStyle = light; g.fillRect(0, H / 2, W, 2);
        const fold = g.createLinearGradient(W / 2 - 18, 0, W / 2 + 18, 0);
        fold.addColorStop(0, "rgba(0,0,0,0)"); fold.addColorStop(0.5, dark); fold.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = fold; g.fillRect(W / 2 - 18, 0, 36, H);
    };
    const shade = (i : number, d : Uint8ClampedArray, k : number) => {
        const n = grain[i] * k;
        d[i * 4] += n; d[i * 4 + 1] += n; d[i * 4 + 2] += n;
    };
    const face = make(g => { g.drawImage(src, 0, 0); creases(g, "rgba(70,55,30,0.22)", "rgba(255,255,255,0.35)"); }, (i, d) => shade(i, d, 14));
    const back = make(g => {
        g.fillStyle = hex(KOSH.sandal4); g.fillRect(0, 0, W, H);
        g.strokeStyle = hex(KOSH.neem); g.globalAlpha = 0.35; g.lineWidth = 6; g.strokeRect(22, 22, W - 44, H - 44); g.globalAlpha = 1;
        creases(g, "rgba(70,55,30,0.22)", "rgba(255,255,255,0.35)");
    }, (i, d) => shade(i, d, 14));
    const bump = make(g => { g.fillStyle = "#808080"; g.fillRect(0, 0, W, H); creases(g, "rgba(0,0,0,0.5)", "rgba(255,255,255,0.5)"); }, (i, d) => shade(i, d, 60));
    const tex = (cv : HTMLCanvasElement, color : boolean) => {
        const t = new THREE.CanvasTexture(cv);
        t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        return t;
    };
    return { face : tex(face, true), back : tex(back, true), bump : tex(bump, false) };
}

// THE TABLE ===========================================================================================================
// Dark wood: long grain in bands, a few darker streaks; and, as a separate map, a round pool that fades the table
// into the dark page round it.
function woodTexture(renderer : THREE.WebGLRenderer) {
    const W = 1024, H = 1024;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d") as CanvasRenderingContext2D;
    const img = g.createImageData(W, H), d = img.data;
    let seed = 5;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const waves = Array.from({ length : 6 }, () => ({ f : 0.002 + rnd() * 0.006, p : rnd() * 6.28, a : 6 + rnd() * 22 }));
    const fine = new Float32Array(W);
    for (let x = 0; x < W; x++) fine[x] = rnd();
    // charcoal warmed with terracotta: the palette's own, darkened
    const base = [ 0x3a, 0x2c, 0x27 ];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let yy = y;
        for (const w of waves) yy += Math.sin(x * w.f + w.p) * w.a * 0.4;
        const band = Math.sin(yy * 0.11) * 0.5 + Math.sin(yy * 0.031 + 1.3) * 0.8 + Math.sin(yy * 0.53) * 0.12;
        const grain = (fine[(x + Math.floor(yy * 37)) & (W - 1)] - 0.5) * 0.18;
        const v = 1 + band * 0.14 + grain;
        const i = (y * W + x) * 4;
        d[i] = base[0] * v; d[i + 1] = base[1] * v; d[i + 2] = base[2] * v; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const map = new THREE.CanvasTexture(cv);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const pool = document.createElement("canvas");
    pool.width = pool.height = 256;
    const pg = pool.getContext("2d") as CanvasRenderingContext2D;
    const grd = pg.createRadialGradient(128, 128, 30, 128, 128, 128);
    grd.addColorStop(0, "#fff"); grd.addColorStop(0.22, "#fff"); grd.addColorStop(0.9, "#000");
    pg.fillStyle = grd; pg.fillRect(0, 0, 256, 256);
    return { map, pool : new THREE.CanvasTexture(pool) };
}

// A soft rounded rectangle the phone's shape, for the shadow under it and the light that leaks from under it.
function softRect(color : string, blur : number) {
    const cv = document.createElement("canvas");
    cv.width = 256; cv.height = 512;
    const g = cv.getContext("2d") as CanvasRenderingContext2D;
    // drawn off the canvas, only its blurred shadow on it
    g.shadowColor = color; g.shadowBlur = blur; g.shadowOffsetX = 1000;
    g.fillStyle = color;
    g.beginPath(); g.roundRect(-1000 + 128 - 64, 256 - 136, 128, 272, 18); g.fill();
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

// THE PHONE'S BACK ====================================================================================================
// The glass's own colour comes from the material; this adds a faint sheen down it and, near the bottom, a line of fine
// print, as phones carry (no maker's name). Drawn mirrored, since the back's shape is turned round to face backwards.
function backPrint(renderer : THREE.WebGLRenderer) {
    const W = 375, H = 800;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d") as CanvasRenderingContext2D;
    const sheen = g.createLinearGradient(0, 0, W, H);
    sheen.addColorStop(0, "#e8e8ea"); sheen.addColorStop(0.45, "#ffffff"); sheen.addColorStop(1, "#d8d8dc");
    g.fillStyle = sheen; g.fillRect(0, 0, W, H);
    g.translate(W, 0); g.scale(-1, 1);
    g.fillStyle = "#9a9aa0"; g.textAlign = "center"; g.font = "500 9px system-ui, sans-serif";
    g.fillText("Made in India", W / 2, H - 70);
    g.font = "400 7px system-ui, sans-serif";
    g.fillText("Model PH-2026  ·  IMEI on the SIM tray", W / 2, H - 58);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
}

// Smudges for the clear case: soft prints and wipes, as a roughness map (its green channel) over a polished base.
function smudges() {
    const W = 256, H = 512;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d") as CanvasRenderingContext2D;
    g.fillStyle = "rgb(0,18,0)"; g.fillRect(0, 0, W, H);
    let seed = 3;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let k = 0; k < 14; k++) {
        const x = rnd() * W, y = H * (0.35 + rnd() * 0.65), r = 14 + rnd() * 26;
        const grd = g.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, "rgba(0,120,0,0.55)"); grd.addColorStop(1, "rgba(0,120,0,0)");
        g.fillStyle = grd; g.beginPath(); g.ellipse(x, y, r, r * 1.3, rnd() * 3, 0, Math.PI * 2); g.fill();
    }
    return new THREE.CanvasTexture(cv);
}

// THE STALL ===========================================================================================================
// What is behind the phone while it is held up: a chai stall at dusk, out of focus. A back wall with shelves of jars,
// a hanging bulb and a string of small lights, a board that says chai, a kettle on the stove, glasses on the counter,
// and, on the counter right of the phone, the stall's QR code on its stand, a little less soft. Painted on a canvas
// and blurred (or, where a canvas cannot blur, drawn small and scaled up, which blurs it as well).
const STALL_W = 22, STALL_H = 14, STALL_BOTTOM = -6, STALL_Z = -16;   // where it stands, in the scene's units
function stallTexture() {
    const W = 1600, H = Math.round(W * STALL_H / STALL_W);
    const px = (x : number) => (x + STALL_W / 2) / STALL_W * W;          // scene x and y to the canvas
    const py = (y : number) => (STALL_BOTTOM + STALL_H - y) / STALL_H * H;
    const glowAt = (g : CanvasRenderingContext2D, x : number, y : number, r : number, c : string, a : number) => {
        const grd = g.createRadialGradient(px(x), py(y), 0, px(x), py(y), r);
        grd.addColorStop(0, c); grd.addColorStop(1, "rgba(0,0,0,0)");
        g.globalAlpha = a; g.fillStyle = grd; g.fillRect(px(x) - r, py(y) - r, r * 2, r * 2); g.globalAlpha = 1;
    };
    const scene = document.createElement("canvas");
    scene.width = W; scene.height = H;
    const g = scene.getContext("2d") as CanvasRenderingContext2D;
    // the back wall, warm and dark, lit from the bulb
    const wall = g.createLinearGradient(0, 0, 0, H);
    wall.addColorStop(0, "#1b1714"); wall.addColorStop(0.55, "#3a2c22"); wall.addColorStop(1, "#1d1815");
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    glowAt(g, -1.8, 3.4, 520, "#8a5a2c", 0.55);
    // shelves of jars, left and right
    for (const [ x0, x1 ] of [ [ -9, -3 ], [ 3, 9.5 ] ]) {
        for (const y of [ 0.7, 2.3 ]) {
            g.fillStyle = "#4a3426"; g.fillRect(px(x0), py(y), px(x1) - px(x0), 10);
            for (let x = x0 + 0.4; x < x1 - 0.5; x += 1.05) {
                const h = 0.95, w = 0.75, fill = [ hex(KOSH.turmeric), hex(KOSH.sandalwood), hex(KOSH.terracotta) ][Math.abs(Math.round(x * 3 + y)) % 3];
                g.fillStyle = "rgba(225,213,188,0.18)"; g.beginPath(); g.roundRect(px(x), py(y + h), px(x + w) - px(x), py(y) - py(y + h), 14); g.fill();
                g.globalAlpha = 0.75; g.fillStyle = fill; g.beginPath(); g.roundRect(px(x + 0.06), py(y + h * 0.62), px(x + w - 0.06) - px(x + 0.06), py(y) - py(y + h * 0.62) - 4, 10); g.fill(); g.globalAlpha = 1;
                g.fillStyle = "#6b5040"; g.fillRect(px(x + 0.08), py(y + h + 0.12), px(x + w - 0.08) - px(x + 0.08), py(y + h) - py(y + h + 0.12));
            }
        }
    }
    // the board: चाय · Chai
    g.fillStyle = hex(KOSH.turmeric); g.beginPath(); g.roundRect(px(2.6), py(5.3), px(7.4) - px(2.6), py(3.5) - py(5.3), 18); g.fill();
    g.fillStyle = hex(KOSH.charcoal); g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "700 76px 'Kohinoor Devanagari', 'Noto Sans Devanagari', 'Mangal', sans-serif"; g.fillText("चाय", px(4.2), py(4.4));
    g.font = "700 64px system-ui, sans-serif"; g.fillText("Chai", px(6.25), py(4.4));
    // the counter: its top, and its front, painted terracotta
    g.fillStyle = "#5a4232"; g.fillRect(0, py(-2.0), W, py(-2.25) - py(-2.0));
    const front = g.createLinearGradient(0, py(-2.25), 0, H);
    front.addColorStop(0, "#7a4234"); front.addColorStop(1, "#2e1a15");     // terracotta, in shadow
    g.fillStyle = front; g.fillRect(0, py(-2.25), W, H - py(-2.25));
    // the stove's flame and the kettle on it
    glowAt(g, -4.3, -1.95, 120, hex(KOSH.turmeric), 0.9);
    const kettle = g.createLinearGradient(px(-5.4), 0, px(-3.2), 0);
    kettle.addColorStop(0, "#5c5c60"); kettle.addColorStop(0.35, "#d8d8dc"); kettle.addColorStop(1, "#3a3a3e");
    g.fillStyle = kettle; g.beginPath(); g.ellipse(px(-4.3), py(-1.2), px(-3.2) - px(-4.3), py(-1.95) - py(-0.55), 0, 0, Math.PI * 2); g.fill();
    g.fillRect(px(-4.65), py(0.15), px(-3.95) - px(-4.65), py(-0.6) - py(0.15));
    g.strokeStyle = "#8a8a8e"; g.lineWidth = 14; g.beginPath(); g.ellipse(px(-4.3), py(0.2), 70, 46, 0, Math.PI, 0); g.stroke();
    // glasses of chai on the counter
    for (const x of [ -2.2, -1.6, -1.0 ]) {
        g.fillStyle = "rgba(242,240,230,0.35)"; g.fillRect(px(x), py(-1.25), px(x + 0.42) - px(x), py(-2.0) - py(-1.25));
        g.fillStyle = "#b8743c"; g.fillRect(px(x + 0.03), py(-1.45), px(x + 0.39) - px(x + 0.03), py(-2.0) - py(-1.45));
    }
    // the hanging bulb and its wire, and the string of small lights
    g.strokeStyle = "#0e0c0b"; g.lineWidth = 4; g.beginPath(); g.moveTo(px(-1.8), 0); g.lineTo(px(-1.8), py(4.0)); g.stroke();
    glowAt(g, -1.8, 3.8, 240, "#ffe2a8", 0.95);
    glowAt(g, -1.8, 3.8, 60, "#fffaf0", 1);
    for (let x = -10.5; x <= 10.5; x += 1.1) {
        const y = 6.3 - 0.5 * Math.cos(x / 10.5 * Math.PI / 2) ** 2;
        glowAt(g, x, y, 34, x % 2.2 < 1.1 ? hex(KOSH.turmeric) : "#fff2d0", 0.9);
    }
    // blur it all, like a lens focused on the phone
    const out = document.createElement("canvas");
    out.width = W; out.height = H;
    const o = out.getContext("2d") as CanvasRenderingContext2D;
    const soft = (src : HTMLCanvasElement, px_ : number) => {
        if (typeof o.filter === "string") { o.filter = `blur(${px_}px)`; o.drawImage(src, 0, 0); o.filter = "none"; return; }
        const s = document.createElement("canvas");
        s.width = Math.round(W / px_); s.height = Math.round(H / px_);
        (s.getContext("2d") as CanvasRenderingContext2D).drawImage(src, 0, 0, s.width, s.height);
        o.imageSmoothingQuality = "high"; o.drawImage(s, 0, 0, W, H);
    };
    soft(scene, 14);
    // the QR code's stand, sharper than the rest and a little faded: a card with a header strip and the code
    const card = document.createElement("canvas");
    card.width = W; card.height = H;
    const c = card.getContext("2d") as CanvasRenderingContext2D;
    const cx = px(4.4), top = py(1.0), cw = px(6.2) - px(2.6), ch = py(-2.0) - py(1.0);
    c.fillStyle = "#2a2522"; c.fillRect(cx - 18, top + ch - 12, 36, 12);
    c.fillStyle = hex(KOSH.sandal8); c.beginPath(); c.roundRect(cx - cw / 2, top, cw, ch - 10, 18); c.fill();
    c.fillStyle = hex(KOSH.neem); c.beginPath(); c.roundRect(cx - cw / 2, top, cw, ch * 0.16, [ 18, 18, 0, 0 ]); c.fill();
    c.fillStyle = "#ffffff"; c.font = "600 30px system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("Pay by UPI", cx, top + ch * 0.08);
    drawQR(c, cx, top + ch * 0.56, Math.min(cw, ch) * 0.56);
    o.globalAlpha = 0.82; soft(card, 4); o.globalAlpha = 1;
    const t = new THREE.CanvasTexture(out);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

export function mountPhoneScene(canvas : HTMLCanvasElement, o : PhoneOptions) : PhoneScene {
    const host = canvas.parentElement as HTMLElement;
    const phone = host.clientWidth < 760;
    const renderer = makeRenderer(canvas, phone);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;  // a soft roll-off on the highlights
    renderer.toneMappingExposure = 1;

    const disposables : { dispose : () => void }[] = [];
    const keep = <T extends { dispose : () => void }>(x : T) => { disposables.push(x); return x; };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 60);
    // reflections from a soft room, kept low, so the metal, the glass and the plastic catch light
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = keep(pmrem.fromScene(room, 0.04).texture);
    room.dispose(); pmrem.dispose();
    scene.environment = env;
    scene.environmentIntensity = 0.4;

    // The phone is held up at HOLD, facing the camera, tipped back a little; it is set down, face down, at LAND.
    const HOLD = new THREE.Vector3(0.15, 2.5, 1.3), LAND = new THREE.Vector3(-0.3, 0, 0);
    const Q_HOLD = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, 0.06, 0.04));
    const YAW_LAND = -0.3;
    const Q_LAND = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, YAW_LAND, Math.PI, "YZX"));

    // LIGHT ===========================================================================================================
    // one warm lamp over the table, a little behind and to the left, that makes its pool of light; the stall's bulb,
    // behind, which rims the phone while it is held up; a soft light from in front of it, which
    // fades as the phone goes down to the table; a faint dusk blue from behind; and a little fill
    const key = new THREE.SpotLight(0xffe2b8, 0, 0, 0.36, 1, 1);
    key.position.set(-1.2, 6.2, -1.6); key.target.position.set(LAND.x - 0.1, 0, LAND.z + 0.2);
    const bulb = new THREE.PointLight(0xffd59a, 0, 0, 1.2);
    bulb.position.set(-1.6, 4.4, -2.6);
    const front = new THREE.DirectionalLight(0xfff1e0, 0);
    front.position.set(HOLD.x - 2, HOLD.y + 2.5, HOLD.z + 4); front.target.position.copy(HOLD);
    const dusk = new THREE.DirectionalLight(KOSH.indivara, 0);
    dusk.position.set(2.5, 1.4, -3);
    const fill = new THREE.HemisphereLight(0xfff4e6, 0x2f2f2f, 0);
    scene.add(key, key.target, bulb, front, front.target, dusk, fill);
    const lights = (k : number, held : number) => {
        key.intensity = 30 * k; bulb.intensity = 9 * k; front.intensity = 1.6 * k * held;
        dusk.intensity = 1.1 * k; fill.intensity = (0.22 + 0.2 * held) * k;
    };

    // THE PHONE'S BACK ====================================================================================================
// The glass's own colour comes from the material; this adds a faint sheen down it and, near the bottom, a line of fine
// print, as phones carry (no maker's name). Drawn mirrored, since the back's shape is turned round to face backwards.
function backPrint(renderer : THREE.WebGLRenderer) {
    const W = 375, H = 800;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d") as CanvasRenderingContext2D;
    const sheen = g.createLinearGradient(0, 0, W, H);
    sheen.addColorStop(0, "#e8e8ea"); sheen.addColorStop(0.45, "#ffffff"); sheen.addColorStop(1, "#d8d8dc");
    g.fillStyle = sheen; g.fillRect(0, 0, W, H);
    g.translate(W, 0); g.scale(-1, 1);
    g.fillStyle = "#9a9aa0"; g.textAlign = "center"; g.font = "500 9px system-ui, sans-serif";
    g.fillText("Made in India", W / 2, H - 70);
    g.font = "400 7px system-ui, sans-serif";
    g.fillText("Model PH-2026  ·  IMEI on the SIM tray", W / 2, H - 58);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
}

// Smudges for the clear case: soft prints and wipes, as a roughness map (its green channel) over a polished base.
function smudges() {
    const W = 256, H = 512;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d") as CanvasRenderingContext2D;
    g.fillStyle = "rgb(0,18,0)"; g.fillRect(0, 0, W, H);
    let seed = 3;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let k = 0; k < 14; k++) {
        const x = rnd() * W, y = H * (0.35 + rnd() * 0.65), r = 14 + rnd() * 26;
        const grd = g.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, "rgba(0,120,0,0.55)"); grd.addColorStop(1, "rgba(0,120,0,0)");
        g.fillStyle = grd; g.beginPath(); g.ellipse(x, y, r, r * 1.3, rnd() * 3, 0, Math.PI * 2); g.fill();
    }
    return new THREE.CanvasTexture(cv);
}

// THE STALL =======================================================================================================
    const stallMat = keep(new THREE.MeshBasicMaterial({ map : keep(stallTexture()), transparent : true, depthWrite : false, toneMapped : false }));
    const stall = new THREE.Mesh(keep(new THREE.PlaneGeometry(STALL_W, STALL_H)), stallMat);
    stall.position.set(0, STALL_BOTTOM + STALL_H / 2, STALL_Z);
    stall.renderOrder = -1;
    scene.add(stall);

    // THE TABLE =======================================================================================================
    const wood = woodTexture(renderer);
    keep(wood.map); keep(wood.pool);
    wood.map.repeat.set(3, 3);
    const tableMat = keep(new THREE.MeshStandardMaterial({ map : wood.map, alphaMap : wood.pool, transparent : true, roughness : 0.5, metalness : 0, envMapIntensity : 0.5, depthWrite : false }));
    const table = new THREE.Mesh(keep(new THREE.PlaneGeometry(9, 9)), tableMat);
    table.rotation.x = -Math.PI / 2; table.position.set(LAND.x, 0, LAND.z - 0.6);
    table.renderOrder = 0;
    scene.add(table);
    // the shadow under the phone, and the light that comes from under it
    const shadowMat = keep(new THREE.MeshBasicMaterial({ map : keep(softRect("#000000", 26)), transparent : true, opacity : 0.75, depthWrite : false, toneMapped : false }));
    const shadow = new THREE.Mesh(keep(new THREE.PlaneGeometry(PW * 2, PH * 1.88)), shadowMat);
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.001; shadow.renderOrder = 1;
    scene.add(shadow);
    const glowMat = keep(new THREE.MeshBasicMaterial({ map : keep(softRect("#ffffff", 60)), color : KOSH.neem, transparent : true, opacity : 0, blending : THREE.AdditiveBlending, depthWrite : false, toneMapped : false }));
    const glow = new THREE.Mesh(keep(new THREE.PlaneGeometry(PW * 2.6, PH * 2)), glowMat);
    glow.rotation.x = -Math.PI / 2; glow.position.y = 0.002; glow.renderOrder = 2;
    scene.add(glow);

    // THE PHONE =======================================================================================================
    // `rig` places the phone on the table: it is turned (YZX) by its yaw on the table, then over about its long axis
    // (0 face up, π face down), after lying it flat. Inside, +z is the screen's side and +y the phone's top.
    const rig = new THREE.Group();
    rig.rotation.order = "YZX";
    scene.add(rig);
    const turn = rig;
    const body = new THREE.ExtrudeGeometry(rounded(PW - 0.012, PH - 0.012, PR - 0.006), { depth : PD - 0.012, bevelEnabled : true, bevelThickness : 0.006, bevelSize : 0.006, bevelSegments : 4, curveSegments : 24 });
    body.translate(0, 0, -(PD - 0.012) / 2);
    const frameMat = keep(new THREE.MeshStandardMaterial({ color : 0x3c3c3e, metalness : 0.85, roughness : 0.32 }));
    turn.add(new THREE.Mesh(keep(body), frameMat));

    // the front: black glass edge to edge, the screen inset in it
    const glassMat = keep(new THREE.MeshStandardMaterial({ color : 0x050505, metalness : 0, roughness : 0.06 }));
    const glassFront = new THREE.Mesh(keep(flat(rounded(PW - 0.01, PH - 0.01, PR - 0.005), PW - 0.01, PH - 0.01)), glassMat);
    glassFront.position.z = PD / 2 + 0.0008; turn.add(glassFront);
    const screenCanvas = document.createElement("canvas");
    screenCanvas.width = SW; screenCanvas.height = SH;
    const sg = screenCanvas.getContext("2d") as CanvasRenderingContext2D;
    const screenTex = keep(new THREE.CanvasTexture(screenCanvas));
    screenTex.colorSpace = THREE.SRGBColorSpace;
    screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const screenMat = keep(new THREE.MeshBasicMaterial({ map : screenTex, toneMapped : false, color : 0x000000 }));
    const SCW = PW - 0.06, SCH = PH - 0.07;
    const screen = new THREE.Mesh(keep(flat(rounded(SCW, SCH, PR - 0.035), SCW, SCH)), screenMat);
    screen.position.z = PD / 2 + 0.0016; turn.add(screen);
    const font = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
    let shown = "";
    const paint = (state : ScreenState, k : number, a = 0) => {
        const sig = `${state}:${k.toFixed(3)}:${a.toFixed(3)}`;
        if (sig === shown) return;
        shown = sig;
        drawScreen(sg, font, state, k, a);
        screenTex.needsUpdate = true;
    };
    paint("scan", 0);
    document.fonts?.ready.then(() => { shown = ""; });

    // the back: satin glass in graphite, with a little fine print near the bottom; a raised camera block at the top
    // left (seen from the back), glossy, with three large lenses standing proud of it in bright metal rings (each a
    // black bezel, a domed glass that catches the light, and the aperture's rings inside), a flash and a microphone
    // hole; buttons on the sides, the antenna lines in the frame, and the port and speaker on the bottom edge
    const backMat = keep(new THREE.MeshPhysicalMaterial({ map : keep(backPrint(renderer)), color : 0x141519, metalness : 0, roughness : 0.3, specularIntensity : 0.35, clearcoat : 0.5, clearcoatRoughness : 0.12 }));
    const back = new THREE.Mesh(keep(flat(rounded(PW - 0.01, PH - 0.01, PR - 0.005), PW - 0.01, PH - 0.01)), backMat);
    back.rotation.y = Math.PI; back.position.z = -PD / 2 - 0.0008; turn.add(back);
    const island = new THREE.Group();
    island.position.set(ISLAND_X, ISLAND_Y, -PD / 2);       // seen from the back, this is the top left
    turn.add(island);
    const islandGeo = new THREE.ExtrudeGeometry(rounded(ISLAND, ISLAND, 0.085), { depth : 0.014, bevelEnabled : true, bevelThickness : 0.005, bevelSize : 0.005, bevelSegments : 5, curveSegments : 20 });
    islandGeo.translate(0, 0, -0.014);
    const islandMat = keep(new THREE.MeshPhysicalMaterial({ color : 0x1a1b1f, metalness : 0.2, roughness : 0.1, clearcoat : 1, clearcoatRoughness : 0.04 }));
    island.add(new THREE.Mesh(keep(islandGeo), islandMat));
    const FACE = -0.019;                                // the block's face
    const ringMat = keep(new THREE.MeshStandardMaterial({ color : 0xc4c4c8, metalness : 1, roughness : 0.16 }));
    const bezelMat = keep(new THREE.MeshStandardMaterial({ color : 0x0b0b0d, metalness : 0.2, roughness : 0.55 }));
    const lensMat = keep(new THREE.MeshPhysicalMaterial({ color : 0x020205, metalness : 0, roughness : 0.02, clearcoat : 1, clearcoatRoughness : 0, iridescence : 0.35, iridescenceIOR : 1.5, iridescenceThicknessRange : [ 300, 450 ] }));
    const irisMat = keep(new THREE.MeshStandardMaterial({ color : 0x2a2a34, metalness : 0.7, roughness : 0.25 }));
    const ringGeo = keep(new THREE.CylinderGeometry(0.062, 0.064, 0.016, 48)), bezelGeo = keep(new THREE.CylinderGeometry(0.054, 0.054, 0.017, 48));
    // the glass: a shallow dome
    const lensGeo = keep(new THREE.SphereGeometry(0.11, 48, 12, 0, Math.PI * 2, 0, Math.asin(0.044 / 0.11)));
    const irisGeo = keep(new THREE.RingGeometry(0.02, 0.03, 40)), pupilGeo = keep(new THREE.CircleGeometry(0.016, 32));
    const pupilMat = keep(new THREE.MeshBasicMaterial({ color : 0x000000 }));
    for (const [ lx, ly ] of [ [ 0.074, 0.074 ], [ 0.074, -0.074 ], [ -0.074, 0.0 ] ]) {
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2; ring.position.set(lx, ly, FACE - 0.006); island.add(ring);
        const bezel = new THREE.Mesh(bezelGeo, bezelMat);
        bezel.rotation.x = Math.PI / 2; bezel.position.set(lx, ly, FACE - 0.0065); island.add(bezel);
        const iris = new THREE.Mesh(irisGeo, irisMat);
        iris.rotation.y = Math.PI; iris.position.set(lx, ly, FACE - 0.0152); island.add(iris);
        const pupil = new THREE.Mesh(pupilGeo, pupilMat);
        pupil.rotation.y = Math.PI; pupil.position.set(lx, ly, FACE - 0.0153); island.add(pupil);
        // the dome's cap sits on the bezel, bulging out of it
        const lens = new THREE.Mesh(lensGeo, lensMat);
        lens.rotation.x = -Math.PI / 2; lens.position.set(lx, ly, FACE - 0.015 + Math.sqrt(0.11 ** 2 - 0.044 ** 2)); island.add(lens);
    }
    const flash = new THREE.Mesh(keep(new THREE.CircleGeometry(0.02, 28)), keep(new THREE.MeshStandardMaterial({ color : 0xf3e6c4, roughness : 0.3, emissive : 0x3a3020 })));
    flash.rotation.y = Math.PI; flash.position.set(-0.088, 0.108, FACE - 0.0005); island.add(flash);
    const mic = new THREE.Mesh(keep(new THREE.CircleGeometry(0.006, 14)), pupilMat);
    mic.rotation.y = Math.PI; mic.position.set(-0.098, -0.11, FACE - 0.0005); island.add(mic);
    // buttons: volume on the left side, power on the right (as the screen faces you)
    const keyMat = keep(new THREE.MeshStandardMaterial({ color : 0x45454a, metalness : 0.85, roughness : 0.3 }));
    for (const [ bx, by, bh ] of [ [ -1, 0.5, 0.15 ], [ -1, 0.3, 0.15 ], [ 1, 0.38, 0.2 ] ]) {
        const b = new THREE.Mesh(keep(new THREE.CapsuleGeometry(0.009, bh, 4, 10)), keyMat);
        b.scale.set(1, 1, 1.4); b.position.set(bx * (PW / 2 + 0.002), by, 0); turn.add(b);
    }
    // antenna lines across the frame, near the corners
    const lineMat = keep(new THREE.MeshStandardMaterial({ color : 0x5c5c62, metalness : 0, roughness : 0.5 }));
    const lineGeo = keep(new THREE.BoxGeometry(0.004, 0.012, PD - 0.02));
    for (const lx of [ -1, 1 ]) for (const ly of [ -1, 1 ]) {
        const l = new THREE.Mesh(lineGeo, lineMat);
        l.position.set(lx * (PW / 2 - 0.0015), ly * (PH / 2 - 0.2), 0); turn.add(l);
    }
    // the bottom edge: a port in the middle, speaker holes to one side, a microphone hole to the other
    const port = new THREE.Mesh(keep(new THREE.CapsuleGeometry(0.011, 0.06, 4, 12)), pupilMat);
    port.rotation.z = Math.PI / 2; port.scale.set(1, 1, 0.9); port.position.set(0, -PH / 2 + 0.006, 0); turn.add(port);
    const holeGeo = keep(new THREE.CircleGeometry(0.0055, 10));
    for (const hx of [ 0.12, 0.15, 0.18, 0.21, 0.24, -0.13 ]) {
        const h = new THREE.Mesh(holeGeo, pupilMat);
        h.rotation.x = Math.PI / 2; h.position.set(hx, -PH / 2 - 0.0008, 0); turn.add(h);
    }

    // THE NOTE ========================================================================================================
    // A ₹500 folded once down the middle, so each half is about the phone's width, with a crease across it from an
    // older fold into four, and grain in the paper. Two halves hinged at the fold: the front shows the right half of
    // the face (the large ₹500); `leaf`, the left half, lies folded behind it. Each half is two meshes, the face and
    // the plain back of the paper, on the same rippled geometry. It sits between the phone's back and the case.
    const { face : faceTex, back : backTex, bump : bumpTex } = paperTextures(noteTexture(renderer).image as HTMLCanvasElement, renderer);
    keep(faceTex); keep(backTex); keep(bumpTex);
    const NWH = 0.69, NH = 0.66 * 0.96;               // a half's width and the note's height
    const half = (side : 1 | -1) => {
        // x from 0 at the fold to `side` × NWH; z up off the flat (never below it, or what is behind shows through)
        const g = new THREE.PlaneGeometry(NWH, NH, 30, 26);
        g.translate(side * NWH / 2, 0, 0);
        const p = g.getAttribute("position"), uv = g.getAttribute("uv");
        for (let i = 0; i < p.count; i++) {
            const ax = Math.abs(p.getX(i)) / NWH, y = p.getY(i) / NH + 0.5;   // 0 at the fold, 0 at the bottom
            const roll = Math.exp(-Math.pow(ax / 0.045, 2)) * 0.0035;                 // the fold rolls up a little
            const corner = Math.pow(Math.max(0, ax - 0.7) / 0.3, 2) * Math.pow(Math.max(0, 0.32 - y) / 0.32, 2) * 0.008;
            const ridge = Math.exp(-Math.pow((y - 0.5) / 0.03, 2)) * 0.0012;         // the old crease across, a ridge
            const wave = (1 + Math.sin(ax * 5.1 + 0.6) * Math.sin(y * 3.7)) * 0.0008;
            p.setZ(i, roll + corner + ridge + wave);
            // the right half of the face for the front, the left half for the leaf
            uv.setX(i, (p.getX(i) / NWH + 1) / 2);
        }
        g.computeVertexNormals();
        return keep(g);
    };
    const faceMat = keep(new THREE.MeshStandardMaterial({ map : faceTex, bumpMap : bumpTex, bumpScale : 1.4, color : 0xdcd5c7, roughness : 0.86, metalness : 0 }));
    const paperBack = keep(new THREE.MeshStandardMaterial({ map : backTex, bumpMap : bumpTex, bumpScale : 1.4, color : 0xdcd5c7, roughness : 0.88, metalness : 0, side : THREE.BackSide }));
    const noteG = new THREE.Group();
    turn.add(noteG);
    const frontGeo = half(1), leafGeo = half(-1);
    noteG.add(new THREE.Mesh(frontGeo, faceMat), new THREE.Mesh(frontGeo, paperBack));
    const leaf = new THREE.Group();                    // hinged at the fold, folded behind
    leaf.add(new THREE.Mesh(leafGeo, faceMat), new THREE.Mesh(leafGeo, paperBack));
    leaf.rotation.y = -Math.PI; leaf.position.z = -0.0045;
    noteG.add(leaf);
    // the rolled fold itself
    const roll = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.0024, 0.0024, NH, 10, 1, true, Math.PI, Math.PI)), faceMat);
    roll.position.set(0, 0, -0.0022);
    noteG.add(roll);
    // tucked in a little askew, as a note is
    noteG.position.set(0.004 + NWH / 2, -0.3, -PD / 2 - 0.0145);
    noteG.rotation.set(0, Math.PI, 0.035);

    // THE CASE ========================================================================================================
    // Clear plastic: a back plate with a cut-out round the camera island, and a rim round the sides. A thin clear layer
    // that catches the light and its smudges; it does not refract (refraction tore at its edges against the table).
    const outer = rounded(PW + 0.016, PH + 0.016, PR + 0.008);
    const plate = outer.clone();
    const hole = rounded(ISLAND + 0.022, ISLAND + 0.022, 0.095);
    plate.holes.push(new THREE.Path(hole.getPoints(16).map(v => v.add(new THREE.Vector2(ISLAND_X, ISLAND_Y)))));
    const smudge = keep(smudges());
    const caseMat = keep(new THREE.MeshPhysicalMaterial({ color : 0xffffff, roughness : 1, roughnessMap : smudge, metalness : 0, transparent : true, opacity : 0.1, envMapIntensity : 0.12, specularIntensity : 0.35, depthWrite : false }));
    const plateGeo = new THREE.ExtrudeGeometry(plate, { depth : 0.008, bevelEnabled : true, bevelThickness : 0.003, bevelSize : 0.003, bevelSegments : 2, curveSegments : 24 });
    const casePlate = new THREE.Mesh(keep(plateGeo), caseMat);
    casePlate.position.z = -PD / 2 - CASE_GAP - 0.008;
    turn.add(casePlate);
    const rimShape = outer.clone();
    rimShape.holes.push(new THREE.Path(rounded(PW + 0.002, PH + 0.002, PR + 0.001).getPoints(24)));
    // the rim, seen edge on, is thicker plastic, so it shows more than the plate
    const rimMat = keep(caseMat.clone());
    rimMat.opacity = 0.28;
    const caseRim = new THREE.Mesh(keep(new THREE.ExtrudeGeometry(rimShape, { depth : PD + CASE_GAP, bevelEnabled : false, curveSegments : 24 })), rimMat);
    caseRim.position.z = -PD / 2 - CASE_GAP;
    turn.add(caseRim);

    // THE PHONE IN USE ================================================================================================
    // Held up, swaying a little as a held phone does, until FLIP_AT; then turned over as it comes down (the way round
    // a right wrist turns), and set down face down at LAND_AT, with a small rock as it settles.
    const LANDED = new THREE.Vector3(LAND.x, Y_DOWN, LAND.z);
    const VIA = new THREE.Vector3(LAND.x + 0.15, 1.1, LAND.z + 0.7);
    const rel = Q_HOLD.clone().invert().multiply(Q_LAND).normalize();
    if (rel.w < 0) rel.set(-rel.x, -rel.y, -rel.z, -rel.w);
    const relAngle = 2 * Math.acos(Math.min(1, rel.w));
    const relAxis = new THREE.Vector3(rel.x, rel.y, rel.z).normalize();
    const turnBy = (e : number, way : number, out : THREE.Quaternion) => out.setFromAxisAngle(relAxis, (way > 0 ? relAngle : relAngle - 2 * Math.PI) * e);
    const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), wrist = new THREE.Vector3();
    const WAY = (() => {                                // the way round a right wrist turns
        wrist.set(0, -1, 0).applyQuaternion(Q_HOLD.clone().multiply(turnBy(0.5, 1, qa)));
        return wrist.x >= 0 ? 1 : -1;
    })();
    const sway = new THREE.Euler();
    const place = (t : number, press : number) => {
        const k = span(t, FLIP_AT, LAND_AT);
        const turnE = easeInOut(span(t, FLIP_AT, LAND_AT - 0.2)), moveE = ease(k);
        // the path: a curve from where it is held down to the table
        const a = 1 - moveE;
        rig.position.set(0, 0, 0)
            .addScaledVector(HOLD, a * a).addScaledVector(VIA, 2 * a * moveE).addScaledVector(LANDED, moveE * moveE);
        const held = 1 - moveE;
        rig.position.x += Math.sin(t * 1.3) * 0.012 * held;
        rig.position.y += Math.sin(t * 1.7 + 1) * 0.01 * held;
        sway.set(Math.sin(t * 1.1) * 0.012 * held - press * 0.012, Math.sin(t * 0.9 + 2) * 0.015 * held, 0);
        rig.quaternion.copy(Q_HOLD).multiply(turnBy(turnE, WAY, qa)).multiply(qb.setFromEuler(sway));
        // settling: a small rock about the long side, lifting the edge it rocks on
        const d = Math.max(0, t - LAND_AT);
        const rock = t > LAND_AT ? 0.04 * Math.exp(-6 * d) * Math.sin(17 * d) : 0;
        if (rock) {
            wrist.set(0, 1, 0).applyQuaternion(rig.quaternion);
            rig.quaternion.premultiply(qa.setFromAxisAngle(wrist, rock));
            rig.position.y += Math.abs(Math.sin(rock)) * PW / 2;
        }
        return moveE;
    };

    // CAMERA ==========================================================================================================
    // HELD: square on to the phone held up, the stall behind, a slow push-in, the frame turning a touch. LOW: down
    // at the table, three-quarters round, to see the note as the phone lands. REST: risen and pulled
    // back, the phone to the right of the words on a wide screen and under them on a phone.
    const HELD = new THREE.Vector3(), LOW = new THREE.Vector3(), REST = new THREE.Vector3();
    const LOOK_LOW = new THREE.Vector3(), LOOK_REST = new THREE.Vector3();
    // the note's middle once the phone is down (it sits 0.3 below the phone's middle, in the phone's terms)
    const NOTE_AT = new THREE.Vector3(0, -0.3, 0).applyQuaternion(Q_LAND).add(LAND);
    const NORMAL = new THREE.Vector3(0, 0, 1).applyQuaternion(Q_HOLD), UP_HELD = new THREE.Vector3(0, 1, 0).applyQuaternion(Q_HOLD);
    let wide = true, heldDist = 4;
    const frame = (w : number, h : number) => {
        camera.aspect = w / h;
        wide = w / h > 1.1;
        camera.fov = wide ? 26 : 30;
        heldDist = wide ? 4.0 : 4.7;
        LOW.set(LAND.x + 0.9, wide ? 2.2 : 3.2, LAND.z + (wide ? 3.3 : 4.6));
        LOOK_LOW.set(LAND.x, 0.02, LAND.z - 0.05);
        // at rest the note is the subject: close, the phone's top let go out of the frame if need be
        if (wide) { LOOK_REST.copy(NOTE_AT).add(tmp.set(-0.56, 0, -0.08)); REST.copy(LOOK_REST).add(tmp.set(-0.05, 2.4, 2.2)); }
        else { LOOK_REST.copy(NOTE_AT).add(tmp.set(0.16, 0, -0.68)); REST.copy(LOOK_REST).add(tmp.set(0, 5.2, 2.2)); }
        camera.updateProjectionMatrix();
        aim();
    };
    const pos = new THREE.Vector3(), look = new THREE.Vector3(), up = new THREE.Vector3();
    const upY = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3(), qr = new THREE.Quaternion();
    let time = 0;
    const aim = () => {
        const t = time;
        // held: a slow push-in, the frame turning a touch
        const push = 1 - 0.05 * ease(span(t, 0, FLIP_AT));
        HELD.copy(HOLD).addScaledVector(NORMAL, heldDist * push);
        pos.copy(HELD); look.copy(HOLD).addScaledVector(UP_HELD, -0.04);
        up.copy(UP_HELD).applyQuaternion(qr.setFromAxisAngle(NORMAL, 0.035 * ease(span(t, 0, FLIP_AT))));
        // down low as the phone comes down to the table
        const low = ease(span(t, FLIP_AT - 0.1, LAND_AT + 0.2));
        pos.lerp(LOW, low); look.lerp(LOOK_LOW, low); up.lerp(upY, low);
        // and up and back to rest, drifting a little after
        const rest = ease(span(t, LAND_AT + 0.7, REST_AT));
        tmp.copy(REST); tmp.x += Math.sin(t * 0.21) * 0.06 * rest; tmp.y += Math.sin(t * 0.17) * 0.04 * rest;
        pos.lerp(tmp, rest); look.lerp(LOOK_REST, rest);
        camera.position.copy(pos);
        camera.up.copy(up.normalize());
        camera.lookAt(look);
    };

    // THE CLOCK =======================================================================================================
    // The payments that go on once the phone is face down: each one lights the table round the phone, and they come
    // quicker, from every 2.4 s to every 1.1 s.
    const LEAKS : number[] = [];
    for (let s = 0, gap = 2.4; s < 600; s += gap, gap = Math.max(1.1, gap * 0.82)) LEAKS.push(s);
    const leak = (since : number) => {
        if (since < 0) return 0;
        let last = 0;
        for (const s of LEAKS) { if (s > since) break; last = s; }
        const d = since - last;
        return d < 0.12 ? d / 0.12 : Math.exp(-(d - 0.12) * 2.6);
    };
    let revealed = false;
    const pose = () => {
        const t = time;
        // the screen wakes, the lights come up; the light in front of the phone fades as it comes down to the table
        const down = ease(span(t, FLIP_AT, LAND_AT));
        lights(ease(span(t, 0, WAKE + 0.6)), 1 - down);
        screenMat.color.setScalar(ease(span(t, 0, WAKE)));
        // the stall goes soft out of sight and the table comes in as the phone comes down
        stallMat.opacity = 1 - ease(span(t, LAND_AT - 0.3, REST_AT - 0.5));
        tableMat.opacity = ease(span(t, FLIP_AT - 0.2, LAND_AT - 0.3));
        // the payment
        if (t < PAY_AT) paint("scan", span(t, SCAN_AT, PAY_AT));
        else if (t < PRESS_AT) paint("pay", 0);
        else if (t < PRESS_AT + 0.22) paint("press", span(t, PRESS_AT, PRESS_AT + 0.22));
        else if (t < PAID_AT) paint("sending", span(t, PRESS_AT + 0.22, PAID_AT));
        else if (t < LIST_AT) paint("paid", span(t, PAID_AT, PAID_AT + 0.9));
        else if (t < LAND_AT) paint("list", span(t, LIST_AT, LIST_AT + 0.35), 2 * span(t, CHAI_AT, CHAI_AT + 1.1));
        const press = t >= PRESS_AT && t < PRESS_AT + 0.22 ? Math.sin(Math.PI * span(t, PRESS_AT, PRESS_AT + 0.22)) : 0;
        const moved = place(t, press);
        // the shadow: there only as the phone nears the table, tight under it as it lands
        const lift = clamp01((rig.position.y - Y_DOWN) / 1.0);
        shadow.position.set(rig.position.x, 0.001, rig.position.z);
        shadow.rotation.z = YAW_LAND;
        shadow.scale.setScalar(1 + lift * 0.9);
        shadowMat.opacity = 0.75 * (1 - lift) ** 2 * moved;
        // once it is face down, each payment leaks out from under it
        glow.position.set(rig.position.x, 0.002, rig.position.z);
        glow.rotation.z = YAW_LAND;
        glowMat.opacity = leak(t - LEAK_AT) * 0.8;
        aim();
        if (!revealed && t >= REVEAL_AT) { revealed = true; o.onReveal(); }
    };

    const unfit = fitToHost(canvas, renderer, frame);
    let unloop = () => {};
    // while building: ?t=<seconds> holds the scene at that moment
    const hold = process.env.NODE_ENV !== "production" ? Number(new URLSearchParams(location.search).get("t") ?? NaN) : NaN;
    if (o.reduced || hold >= 0) {
        time = hold >= 0 ? hold : LEAK_AT + LEAKS[3] + 0.12;   // the held frame, at the height of a payment
        pose();
        renderer.render(scene, camera);
        document.fonts?.ready.then(() => { shown = ""; pose(); renderer.render(scene, camera); });
    } else {
        pose();
        unloop = loopWhileVisible(canvas, dt => { time += dt; pose(); renderer.render(scene, camera); });
    }

    return {
        dispose : () => {
            unloop(); unfit();
            disposables.forEach(d => d.dispose());
            renderer.dispose();
        },
    };
}

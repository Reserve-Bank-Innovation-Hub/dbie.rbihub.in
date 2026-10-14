"use client";

// The title's background: India's border as a dotted line down the middle, abroad on the left and India on the right.
// Coins in the currencies money is sent home from drift across it and, as they cross, turn over into rupee coins (money
// sent home is paid out in rupees), with a small ring where they cross; rupee coins drift out the other way and turn
// into foreign coins (money sent abroad under the LRS is paid out in foreign currency). Coins go in and out in the ratio
// of the two streams in the latest year, and the foreign coins coming in are drawn in the mix of the RBI survey's source
// countries. The survey has no split of where LRS money goes, so the coins going out are a plain mix of common
// currencies. The coins are flat, in the Kosh palette: foreign coins Indivara, rupee coins turmeric. The scene stops
// when the title is off screen; with reduced motion it is drawn once, still.

// REACT CORE ==========================================================================================================
import { useEffect, useRef } from "react";

// DATA ================================================================================================================
import { HEADLINE, SURVEY } from "./data.gen";

// the symbol on each source country's coins; countries the survey does not name are drawn as euros, the currency of
// most of the smaller sources it lists
const SYMBOL : Record<string, string> = {
    "US" : "$", "UAE" : "AED", "UK" : "£", "Saudi Arabia" : "SAR", "Singapore" : "S$", "Qatar" : "QAR", "Kuwait" : "KWD",
    "Canada" : "C$", "Oman" : "OMR", "Australia" : "A$", "Bahrain" : "BHD",
};
const OUT_SYMBOLS = [ "$", "€", "£", "AED", "S$", "A$", "C$", "¥" ];

type Coin = { x : number; y : number; vx : number; r : number; from : string; to : string; dir : 1 | -1; bob : number; rung : boolean };
type Ring = { y : number; t : number; r : number };

export const TitleCoins = () => {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const g = canvas.getContext("2d");
        if (!g) return;
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const named = SURVEY.countries.filter(c => c.shares[2] !== null).map(c => [ SYMBOL[c.short] ?? "$", c.shares[2] as number ] as const);
        const pool = [ ...named, [ "€", 100 - named.reduce((a, [ , w ]) => a + w, 0) ] as const ];
        const pickIn = () => { let t = Math.random() * 100; for (const [ s, w ] of pool) { if ((t -= w) <= 0) return s; } return "$"; };
        const pickOut = () => OUT_SYMBOLS[(Math.random() * OUT_SYMBOLS.length) | 0];
        const share = HEADLINE.privateLast / (HEADLINE.privateLast + HEADLINE.lrsLast);

        // the palette, read from the page so it follows the theme
        let C = { ink : "#2f2f2f", soft : "#2f2f2f80", kept : "#864fe3", gold : "#eaaa3a", page : "#f2f0e6", in : "#6b8e23", out : "#ba644f" };
        const readColours = () => {
            const s = getComputedStyle(canvas);
            const v = (n : string, f : string) => s.getPropertyValue(n).trim() || f;
            C = { ink : v("--ink", C.ink), soft : v("--ink-soft", C.soft), kept : v("--kept", C.kept), gold : v("--gulf", C.gold), page : v("--page", C.page), in : v("--in", C.in), out : v("--out", C.out) };
        };

        let W = 0, H = 0, raf = 0, last = performance.now(), visible = true, acc = 0, frames = 0;
        const coins : Coin[] = [], rings : Ring[] = [];
        const size = () => {
            const dpr = Math.min(2, devicePixelRatio || 1);
            W = canvas.clientWidth; H = canvas.clientHeight;
            canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
            g.setTransform(dpr, 0, 0, dpr, 0, 0);
            readColours();
        };
        const small = () => W < 560;
        const spawn = (anywhere = false) => {
            const dir : 1 | -1 = Math.random() < share ? 1 : -1;
            // a coin going out is drawn a little smaller, so the two streams read apart at a glance
            const r = ((small() ? 12 : 17) + Math.random() * (small() ? 6 : 11)) * (dir > 0 ? 1 : 0.78);
            const x = anywhere ? Math.random() * W : dir > 0 ? -r : W + r;
            coins.push({ x, y : 30 + Math.random() * (H - 60), vx : dir * (38 + Math.random() * 52), r, dir,
                from : dir > 0 ? pickIn() : "₹", to : dir > 0 ? "₹" : pickOut(), bob : Math.random() * Math.PI * 2, rung : anywhere && (x - W / 2) * dir > 0 });
        };
        // one coin, flat: a disc, a thin inner ring, the symbol; at the border it narrows to its edge and opens again
        // showing its other face
        const coin = (c : Coin, t : number) => {
            const d = (c.x - W / 2) * c.dir, band = c.r * 1.8;
            const turn = Math.max(-1, Math.min(1, d / band));
            const sx = Math.abs(turn) < 1 ? Math.max(0.08, Math.abs(Math.sin(turn * Math.PI / 2))) : 1;
            const sym = turn > 0 ? c.to : c.from, rupee = sym === "₹";
            const y = c.y + Math.sin(t / 900 + c.bob) * 5 - Math.max(0, 1 - Math.abs(turn)) * c.r * 0.6;
            // the trail behind it, in its stream's colour: neem for money coming in, terracotta for money going out
            const len = c.r * 3.4, tail = g.createLinearGradient(c.x - c.dir * len, 0, c.x, 0);
            const tone = c.dir > 0 ? C.in : C.out;
            tail.addColorStop(0, "transparent"); tail.addColorStop(1, tone);
            g.save();
            g.globalAlpha = 0.18; g.strokeStyle = tail; g.lineWidth = c.r * 1.1; g.lineCap = "round";
            g.beginPath(); g.moveTo(c.x - c.dir * len, y); g.lineTo(c.x - c.dir * c.r * 0.4, y); g.stroke();
            g.restore();
            g.save();
            g.translate(c.x, y);
            g.scale(sx, 1);
            g.fillStyle = rupee ? C.gold : C.kept;
            g.beginPath(); g.arc(0, 0, c.r, 0, Math.PI * 2); g.fill();
            g.strokeStyle = rupee ? "#00000030" : "#ffffff55"; g.lineWidth = 1.5;
            g.beginPath(); g.arc(0, 0, c.r * 0.78, 0, Math.PI * 2); g.stroke();
            g.fillStyle = rupee ? "#2f2f2f" : "#f2f0e6";
            const fs = sym.length > 2 ? c.r * 0.6 : sym.length > 1 ? c.r * 0.8 : c.r * 1.05;
            g.font = `700 ${fs}px ${getComputedStyle(document.body).fontFamily || "sans-serif"}`;
            g.textAlign = "center"; g.textBaseline = "middle";
            g.fillText(sym, 0, fs * 0.05);
            g.restore();
        };
        const draw = (t : number) => {
            g.clearRect(0, 0, W, H);
            // the border: a dotted line down the middle, and which side is which
            g.save();
            g.strokeStyle = C.soft; g.lineWidth = 2.5; g.setLineDash([ 1, 10 ]); g.lineCap = "round";
            g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke();
            g.restore();
            g.fillStyle = C.soft; g.font = `700 11px ${getComputedStyle(document.body).fontFamily || "sans-serif"}`;
            g.textBaseline = "alphabetic";
            g.save(); g.letterSpacing = "2px";
            g.textAlign = "right"; g.fillText("ABROAD", W / 2 - 16, H - (small() ? 96 : 82));
            g.textAlign = "left"; g.fillText("INDIA", W / 2 + 16, H - (small() ? 96 : 82));
            g.restore();

            // a ring where a coin crosses
            for (const r of rings) {
                g.strokeStyle = C.gold; g.globalAlpha = Math.max(0, 1 - r.t) * 0.7; g.lineWidth = 2;
                g.beginPath(); g.arc(W / 2, r.y, r.r * (1 + r.t * 1.6), 0, Math.PI * 2); g.stroke();
            }
            g.globalAlpha = 1;
            for (const c of coins) coin(c, t);
            // the key, on a solid band over the coins so it always reads: what the coins stand for
            const ratio = (HEADLINE.privateLast / HEADLINE.lrsLast).toFixed(1);
            const head = `${ratio} coins come in for every one that goes out`, tail = `$${HEADLINE.privateLast.toFixed(1)} bn sent home, $${HEADLINE.lrsLast.toFixed(1)} bn sent abroad, ${HEADLINE.lastFy}`;
            // one line on a wide screen; two on a phone
            const keyLines = small() ? [ head, tail ] : [ `${head}: ${tail}` ];
            g.font = `500 ${small() ? 11.5 : 12.5}px ${getComputedStyle(document.body).fontFamily || "sans-serif"}`;
            g.textAlign = "center"; g.textBaseline = "middle";
            const lh = small() ? 16 : 18, kw = Math.min(W - 16, Math.max(...keyLines.map(l => g.measureText(l).width)) + 28);
            const kh = keyLines.length * lh + 10, ky = H - 36 - kh / 2;
            g.fillStyle = C.page;
            g.beginPath(); g.roundRect(W / 2 - kw / 2, ky - kh / 2, kw, kh, Math.min(14, kh / 2)); g.fill();
            g.fillStyle = C.ink;
            keyLines.forEach((l, i) => g.fillText(l, W / 2, ky - (keyLines.length - 1) * lh / 2 + i * lh, W - 32));
            g.textBaseline = "alphabetic";
        };
        const tick = (now : number) => {
            const dt = Math.min(0.05, (now - last) / 1000); last = now;
            if (++frames % 60 === 0) readColours();
            acc += dt * (small() ? 2.4 : 5.2);
            while (acc >= 1) { spawn(); acc--; }
            for (const c of coins) {
                c.x += c.vx * dt;
                if (!c.rung && (c.x - W / 2) * c.dir > 0) { c.rung = true; rings.push({ y : c.y, t : 0, r : c.r }); }
            }
            for (let i = coins.length - 1; i >= 0; i--) if (coins[i].x < -50 || coins[i].x > W + 50) coins.splice(i, 1);
            for (const r of rings) r.t += dt * 1.6;
            for (let i = rings.length - 1; i >= 0; i--) if (rings[i].t >= 1) rings.splice(i, 1);
            draw(now);
            if (visible) raf = requestAnimationFrame(tick);
        };
        size();
        for (let i = 0; i < (small() ? 16 : 40); i++) spawn(true);
        const ro = new ResizeObserver(() => { size(); if (reduced) draw(0); });
        ro.observe(canvas);
        if (reduced) { draw(0); return () => ro.disconnect(); }
        const io = new IntersectionObserver(([ e ]) => {
            visible = e.isIntersecting;
            cancelAnimationFrame(raf);
            if (visible) { last = performance.now(); raf = requestAnimationFrame(tick); }
        });
        io.observe(canvas);
        return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
    }, []);
    return <canvas className="title-coins" ref={ref} aria-hidden="true" />;
};

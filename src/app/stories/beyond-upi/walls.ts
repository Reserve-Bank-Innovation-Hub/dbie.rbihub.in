// The story's walls, after S2's UPI wall: a grid of small objects on a 2D canvas, played step by step (a month or a
// year) in `journey` seconds. The caller gives every step's grid, cell by cell (a kind, or empty), and how many flashes
// each kind makes in that step. A cell that fills grows in; one that empties lifts off and fades; a flash lights a cell
// of its kind for a moment, the same time for every kind, so what flashes more reads as more. `flipTo` turns every cell
// over in a diagonal wave, like a card stunt, showing a new kind on its back.

export interface WallStep { cells : (string | null)[]; flashes? : Record<string, number> }
export interface WallOptions {
    cols : number; rows : number; aspect : number;                 // cell width over height
    steps : WallStep[];
    journey : number;                                              // seconds for all steps
    reduced : boolean;
    draw : (g : CanvasRenderingContext2D, kind : string, x : number, y : number, w : number, h : number, lit : number) => void;
    onStep : (i : number) => void;
    onEnd  : () => void;
}
export interface Wall { play : () => void; pause : () => void; setStep : (i : number) => void; flipTo : (cells : (string | null)[]) => void; dispose : () => void }

const GROW = 0.35, LEAVE = 0.9, FLASH = 0.32, FLIP = 0.5, WAVE = 1.4;

export function mountWall(canvas : HTMLCanvasElement, o : WallOptions) : Wall {
    const g = canvas.getContext("2d")!;
    const N = o.cols * o.rows;
    let W = 1, H = 1, cw = 1, ch = 1, ox = 0, oy = 0, dpr = 1;
    let step = o.reduced ? o.steps.length - 1 : 0, t = 0, playing = false, raf = 0, last = 0;
    let shown : (string | null)[] = [ ...o.steps[step].cells ];
    const bornAt = new Float64Array(N).fill(-99);                  // when each cell last filled
    const leaving : { i : number; kind : string; at : number }[] = [];
    const litUntil = new Float64Array(N).fill(-99);
    let flip : { to : (string | null)[]; at : number } | null = null;

    const size = () => {
        const r = canvas.getBoundingClientRect(); dpr = Math.min(devicePixelRatio, 2);
        W = r.width; H = r.height; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        // the largest cells that fit, with a gap of a fifth of a cell
        const byW = W / (o.cols * 1.2), byH = H / (o.rows * 1.2) * o.aspect, cell = Math.min(byW, byH);
        cw = cell; ch = cell / o.aspect;
        ox = (W - cw * 1.2 * o.cols + cw * 0.2) / 2; oy = (H - ch * 1.2 * o.rows + ch * 0.2) / 2;
        render();
    };
    const at = (i : number) => ({ x : ox + (i % o.cols) * cw * 1.2, y : oy + (o.rows - 1 - Math.floor(i / o.cols)) * ch * 1.2 });

    const enter = (k : number) => {
        const next = o.steps[k].cells;
        for (let i = 0; i < N; i++) {
            if (next[i] && !shown[i]) bornAt[i] = t;
            if (!next[i] && shown[i]) leaving.push({ i, kind : shown[i]!, at : t });
        }
        shown = [ ...next ];
        // this step's flashes, spread over its time, on cells of their kind
        const f = o.steps[k].flashes ?? {}, dur = o.journey / o.steps.length;
        for (const [ kind, n ] of Object.entries(f)) {
            const cells = shown.map((c, i) => (c === kind ? i : -1)).filter(i => i >= 0);
            if (!cells.length) continue;
            const count = Math.round(n);
            for (let j = 0; j < count; j++) { const i = cells[Math.floor(Math.random() * cells.length)]; litUntil[i] = Math.max(litUntil[i], t + Math.random() * dur + FLASH); }
        }
        quiet = Math.max(quiet, t + dur + FLASH, t + GROW, t + LEAVE);
        o.onStep(k);
    };

    function render() {
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
        for (let i = 0; i < N; i++) {
            let kind = shown[i];
            const { x, y } = at(i);
            let sx = 1, grow = Math.min(1, (t - bornAt[i]) / GROW);
            if (flip) {
                const d = Math.max(0, t - flip.at - ((i % o.cols) / o.cols + Math.floor(i / o.cols) / o.rows) / 2 * WAVE) / FLIP;
                if (d > 0 && d < 1) sx = Math.abs(Math.cos(d * Math.PI));
                if (d >= 0.5) kind = flip.to[i];
            }
            if (!kind) continue;
            if (o.reduced) grow = 1;
            const lit = Math.max(0, (litUntil[i] - t) / FLASH);
            const s = (0.4 + 0.6 * easeBack(grow));
            const w = cw * s * sx, h = ch * s;
            o.draw(g, kind, x + (cw - w) / 2, y + (ch - h) / 2, w, h, Math.min(1, lit));
        }
        for (let j = leaving.length - 1; j >= 0; j--) {
            const l = leaving[j], k = (t - l.at) / LEAVE;
            if (k >= 1) { leaving.splice(j, 1); continue; }
            const { x, y } = at(l.i);
            g.globalAlpha = 1 - k; o.draw(g, l.kind, x, y - k * ch * 2.2, cw, ch, 0); g.globalAlpha = 1;
        }
    }
    const easeBack = (x : number) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

    // the loop runs only while the wall is on screen and something on it moves (the months playing, a flash, a cell
    // growing or leaving, the turn); when all is still it stops, and anything that moves again restarts it
    let stepClock = 0, quiet = 0, running = false, onScreen = false;
    const settle = (until : number) => { quiet = Math.max(quiet, until); kick(); };
    const tick = (now : number) => {
        const dt = Math.max(0, Math.min(0.2, (now - last) / 1000)); last = now; t += dt;
        if (playing) {
            const dur = o.journey / o.steps.length;
            stepClock += dt;
            while (stepClock >= dur && step < o.steps.length - 1) { stepClock -= dur; step++; enter(step); }
            if (step >= o.steps.length - 1 && stepClock >= dur) { playing = false; o.onEnd(); }
        }
        render();
        if (onScreen && (playing || flip || leaving.length || t < quiet)) raf = requestAnimationFrame(tick);
        else running = false;
    };
    function kick() { if (running || !onScreen || o.reduced) return; running = true; last = performance.now(); raf = requestAnimationFrame(tick); }
    const ro = new ResizeObserver(size); ro.observe(canvas);
    const io = new IntersectionObserver(([ e ]) => { onScreen = e.isIntersecting; if (onScreen) kick(); else { cancelAnimationFrame(raf); running = false; } });
    io.observe(canvas);
    size();
    if (o.reduced) o.onStep(step);

    return {
        play : () => { if (step >= o.steps.length - 1) { step = 0; shown = [ ...o.steps[0].cells ]; bornAt.fill(t); o.onStep(0); } flip = null; stepClock = 0; playing = true; kick(); },
        pause : () => { playing = false; },
        setStep : i => { playing = false; flip = null; step = i; enter(i); render(); settle(t + LEAVE); },
        flipTo : cells => {
            if (o.reduced) { shown = [ ...cells ]; render(); return; }
            flip = { to : cells, at : t }; kick();
            setTimeout(() => { if (flip?.to === cells) { shown = [ ...cells ]; flip = null; render(); } }, (WAVE + FLIP) * 1000 + 50);
        },
        dispose : () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); },
    };
}

// fills `n` cells of a cols × rows grid along diagonals from the bottom-left corner: the order the cells take
export const diagonalOrder = (cols : number, rows : number) => {
    const idx : number[] = [];
    for (let i = 0; i < cols * rows; i++) idx.push(i);
    return idx.sort((a, b) => ((a % cols) / cols + Math.floor(a / cols) / rows) - ((b % cols) / cols + Math.floor(b / cols) / rows) || a - b);
};

// shares to whole cells, by largest remainder, in the order the kinds are given
export const allot = (total : number, parts : [ string, number ][]) => {
    const sum = parts.reduce((a, [ , v ]) => a + v, 0) || 1;
    const raw = parts.map(([ k, v ]) => [ k, total * v / sum ] as [ string, number ]);
    const fl = raw.map(([ k, v ]) => ({ k, n : Math.floor(v), r : v - Math.floor(v) }));
    let left = total - fl.reduce((a, x) => a + x.n, 0);
    [ ...fl ].sort((a, b) => b.r - a.r).forEach(x => { if (left > 0) { x.n++; left--; } });
    return fl.flatMap(x => Array(x.n).fill(x.k) as string[]);
};

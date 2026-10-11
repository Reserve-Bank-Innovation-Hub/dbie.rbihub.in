"use client";

// One slide a step: one wheel or trackpad gesture, or one key, moves the page to the next (or previous) element marked
// `data-slide`, the way S1's opening pages. The page is moved by its own short animation rather than the browser's
// smooth scroll, so it is known when the move ends; a gesture's later events, a trackpad's momentum included, are
// swallowed, and a new gesture is one that starts after a pause in the wheel or, once the gesture is a moment old, pushes
// far harder than the dying momentum's mean over the last moment (a trackpad's events can arrive merged, doubling one
// delta, so a jump against the last event alone is not enough). A quick second swipe still counts: made during a move,
// it is taken as soon as the move ends. Below the last slide the page scrolls freely. A touch screen snaps by CSS
// instead (the stylesheet, under a coarse pointer, on `html[data-story-snap]`), since the handler never sees a finger.

// REACT CORE ==========================================================================================================
import { useEffect } from "react";

export function useSlidePaging(root : string) {
    useEffect(() => {
        const html = document.documentElement;
        html.setAttribute("data-story-snap", "");
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        let moving = false, anim = 0, lastWheel = 0, gestureAt = 0, armed = true, queued : 1 | -1 | 0 = 0, owned = false;
        let recent : { t : number; size : number }[] = [];        // the wheel's sizes over the last moment
        // each slide's resting scroll position: its top (measured from the layout, so a slide still rising into view
        // counts where it will rest), centred instead when it is shorter than the screen
        const layoutTop = (el : HTMLElement) => { let y = 0, e : HTMLElement | null = el; while (e) { y += e.offsetTop; e = e.offsetParent as HTMLElement | null; } return y; };
        const stops = () => [ ...document.querySelectorAll<HTMLElement>(`${root} [data-slide]`) ].map(el => {
            const top = layoutTop(el), h = el.offsetHeight;
            return Math.max(0, Math.round(h < innerHeight - 2 ? top + (h - innerHeight) / 2 : top));
        });
        // where one step in `dir` leads from here, or null when the page should scroll as usual
        const next = (dir : 1 | -1) => {
            const ys = stops();
            if (!ys.length) return null;
            const y = scrollY, last = ys[ys.length - 1];
            if (y > last + 2) return dir < 0 && y < last + innerHeight * 0.5 ? last : null;
            if (dir > 0 && y >= last - 2) return null;
            if (dir > 0) { const k = ys.findIndex(v => v > y + 4); return k < 0 ? null : ys[k]; }
            for (let k = ys.length - 1; k >= 0; k--) if (ys[k] < y - 4) return ys[k];
            return ys[0];
        };
        const go = (target : number) => {
            cancelAnimationFrame(anim);
            const from = scrollY, dist = target - from;
            if (reduced || Math.abs(dist) < 2) { scrollTo({ top : target, behavior : "instant" }); return; }
            const t0 = performance.now(), dur = Math.min(900, 480 + Math.abs(dist) * 0.2);
            moving = true;
            const frame = (now : number) => {
                const p = Math.min(1, (now - t0) / dur), e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
                scrollTo({ top : from + dist * e, behavior : "instant" });
                if (p < 1) { anim = requestAnimationFrame(frame); return; }
                moving = false;
                const q = queued; queued = 0;
                if (q) { const t2 = next(q); if (t2 !== null) go(t2); }
            };
            anim = requestAnimationFrame(frame);
        };
        const onWheel = (e : WheelEvent) => {
            if (Math.abs(e.deltaY) < Math.abs(e.deltaX) || e.ctrlKey) return;
            const dir = e.deltaY > 0 ? 1 : -1;
            const now = performance.now(), size = Math.abs(e.deltaY) * (e.deltaMode === 1 ? 16 : 1);
            recent = recent.filter(r => now - r.t <= 200);
            const usual = recent.length ? recent.reduce((a, r) => a + r.size, 0) / recent.length : 0;   // the mean, which a merged event barely moves
            // a swipe's own ramp-up is never a new swipe: a jump counts only once the gesture is a moment old
            const fresh = now - lastWheel > 220 || (now - gestureAt > 350 && size > usual * 2 + 12 && size > 24);
            if (fresh) gestureAt = now;
            recent.push({ t : now, size });
            const target = moving ? 0 : next(dir);
            if (target === null && !(owned && !fresh)) { owned = false; lastWheel = now; return; }
            e.preventDefault();
            owned = true;
            if (target === null) { lastWheel = now; return; }
            if (fresh) armed = true;
            lastWheel = now;
            if (!armed || size < 1) return;
            armed = false;
            if (moving) queued = dir; else go(target);
        };
        const onKey = (e : KeyboardEvent) => {
            if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
            const t = e.target as HTMLElement | null;
            if (t && (t.closest("input, textarea, select, [contenteditable]") || (e.key === " " && t.closest("button")))) return;
            const dir = [ "ArrowDown", "PageDown" ].includes(e.key) || (e.key === " " && !e.shiftKey) ? 1
                : [ "ArrowUp", "PageUp" ].includes(e.key) || (e.key === " " && e.shiftKey) ? -1 : 0;
            if (!dir) return;
            const target = moving ? 0 : next(dir);
            if (target === null) return;
            e.preventDefault();
            if (!moving) go(target);
        };
        addEventListener("wheel", onWheel, { passive : false });
        addEventListener("keydown", onKey);
        return () => {
            html.removeAttribute("data-story-snap");
            removeEventListener("wheel", onWheel); removeEventListener("keydown", onKey); cancelAnimationFrame(anim);
        };
    }, [ root ]);
}

// The opening's beats along the scroll, shared by the town scene (townScene.ts) and the captions and the ₹100 strip
// (Opening.tsx). Kept apart from the scene so the page can read them without loading three.js.

export const BEATS = { y2015 : 0.12, crossover : 0.3, latest : 0.55, women : 0.85 };

export const ease = (t : number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
export const clamp01 = (v : number) => Math.max(0, Math.min(1, v));
export const span = (p : number, a : number, b : number) => clamp01((p - a) / (b - a));

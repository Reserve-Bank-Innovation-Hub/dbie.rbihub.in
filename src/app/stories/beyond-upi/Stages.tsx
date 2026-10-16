"use client";

// The story's 3D stages: the title, the note tower and the RTGS arc. Loaded through next/dynamic with SSR off
// (page.client.tsx), so three.js reaches only this story's bundle. Without WebGL a stage shows a line of text; with
// reduced motion each opens on its last frame.

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState } from "react";

// LOCAL ===============================================================================================================
import { type LabelAt, mountTitleScene } from "./titleScene";
import { mountTowerScene, type TowerScene } from "./towerScene";
import { reducedMotion } from "./stage";
import { LADDER, METHOD, rupees } from "./methods";
import type { MethodKey } from "./instruments";

// DATA ================================================================================================================
import { FYS } from "./data.gen";

const NO_GL = "This 3D scene needs WebGL, which this browser has turned off.";

// THE TITLE ===========================================================================================================
const AVG = Object.fromEntries(LADDER.map(r => [ r.key, r.avg ])) as Record<MethodKey, number>;
export const TitleStage = () => {
    const ref = useRef<HTMLCanvasElement>(null);
    const [ labels, setLabels ] = useState<LabelAt[]>([]);
    const [ failed, setFailed ] = useState(false);
    useEffect(() => {
        if (!ref.current) return;
        // the page's words wait (the page is served that way) while the instruments arrive, and come in with the row
        const opening = ref.current.closest(".opening");
        let s : { dispose : () => void } | null = null;
        try {
            s = mountTitleScene(ref.current, { reduced : reducedMotion(), avg : AVG, onReveal : () => opening?.classList.remove("is-intro"), onLabels : setLabels });
        } catch { opening?.classList.remove("is-intro"); setFailed(true); }
        return () => s?.dispose();
    }, []);
    return (
        <div className="title-stage">
            <canvas ref={ref} role="img" aria-label={`A phone shows a UPI payment of ${rupees(AVG.upi)}. Beside it rise, one by one and each larger, a debit card, a credit card, an IMPS transfer, an NEFT board, a cheque and an RTGS form, each sized by its average payment in ${FYS[FYS.length - 1]}; then all nine ways of paying stand in a row by size, from a toll to RTGS.`} />
            {labels.map(l => (
                <span key={`${l.mode}-${l.key}`} className={`rung-label is-${l.mode}`} style={{ left : l.x, top : l.y }}>
                    {METHOD[l.key].short}
                </span>
            ))}
            {failed && <p className="stage-fallback">{NO_GL}</p>}
        </div>
    );
};

// THE NOTE TOWER ======================================================================================================
// Each method's average payment in banknotes on one table; the camera's path plays once, and again on request.
const inNotes = (v : number) => {
    const notes = Math.floor(v / 500), b = Math.floor(notes / 100), n = notes - b * 100, rest = Math.round(v - notes * 500);
    const parts = [ b ? `${b} bundle${b > 1 ? "s" : ""}` : "", n ? `${n} note${n > 1 ? "s" : ""} of ₹500` : "", rest ? `₹${rest}` : "" ].filter(Boolean);
    return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
};
export const TowerStage = () => {
    const ref = useRef<HTMLCanvasElement>(null), scene = useRef<TowerScene | null>(null);
    const [ labels, setLabels ] = useState<{ key : MethodKey; x : number; y : number; shown : boolean; progress : number }[]>([]);
    const [ ended, setEnded ] = useState(false), [ failed, setFailed ] = useState(false);
    const stageW = ref.current?.clientWidth ?? 10000;
    useEffect(() => {
        if (!ref.current) return;
        try { scene.current = mountTowerScene(ref.current, { reduced : reducedMotion(), stacks : LADDER.map(r => ({ key : r.key, avg : r.avg })), onLabels : setLabels, onEnd : () => setEnded(true) }); }
        catch { setFailed(true); }
        return () => scene.current?.dispose();
    }, []);
    return (
        <div className="tower-stage">
            <canvas ref={ref} role="img" aria-label={`Each method's average payment in ${FYS[FYS.length - 1]} as banknotes on a table: ${LADDER.map(r => `${METHOD[r.key].short} ${rupees(r.avg)}, ${inNotes(r.avg)}`).join("; ")}.`} />
            {/* a label near the edge slides inwards (its dotted line stays on its stack), so none runs off a narrow screen */}
            {/* the labels alternate high and low, each tied to its stack's top by a dotted line, so neighbours never meet */}
            {labels.map((l, i) => {
                const r = LADDER.find(q => q.key === l.key)!, lift = i % 2 ? 96 : 30;
                return (
                    <div key={l.key} className={`stack-pin ${l.shown ? "" : "is-off"}`} style={{ transform : `translate(${l.x}px, ${l.y}px)`, "--tone" : METHOD[l.key].tone, "--lift" : `${lift}px`, "--nudge" : `${Math.min(Math.max(l.x, 84), stageW - 84) - l.x}px` } as React.CSSProperties}>
                        <i className="stack-lead" />
                        <span className="stack-label">
                            <b>{METHOD[l.key].short} {rupees(l.progress < 1 ? Math.round(r.avg * l.progress) : r.avg)}</b>
                        </span>
                    </div>
                );
            })}
            {ended && <button type="button" className="replay" onClick={() => { setEnded(false); scene.current?.replay(); }}>Replay</button>}
            {failed && <p className="stage-fallback">{NO_GL}</p>}
        </div>
    );
};

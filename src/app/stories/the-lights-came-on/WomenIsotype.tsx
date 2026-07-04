"use client";

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState } from "react";

// UI ==================================================================================================================
import { Div, Text } from "fictoan-react";

// Chart 10 — stock vs flow isotype. Two 10×10 grids: of every 100 borrower accounts that already
// existed in March 2015, 22 belonged to women; of every 100 added since, 34 do. Flow share derived
// from BSR Table 3.2: (accF 2026 − accF 2015) / (acc 2026 − acc 2015) = 77.3 / 230.5 crore = 33.5%.
// The newcomers panel animates in with staggered reveals and a live counter; base stays static.
const WOMEN  = "#D4537E";
const OTHERS = "#B4B2A9";
const BASE_W = 22;
const FLOW_W = 34;

// distribute n women-dots evenly through the 100-cell grid
const spread = (n : number) => {
    const s = new Set<number>();
    for (let i = 0; i < 100; i++) {
        if (Math.floor((i * n) / 100) !== Math.floor(((i + 1) * n) / 100)) s.add(i);
    }
    return s;
};

const BASE_SET = spread(BASE_W);
const FLOW_SET = spread(FLOW_W);

export const WomenIsotype = () => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const started = useRef(false);
    const [ revealed, setRevealed ] = useState(0);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
        let timer : ReturnType<typeof setInterval> | null = null;
        const io = new IntersectionObserver(([ entry ]) => {
            if (!entry.isIntersecting || started.current) return;
            started.current = true;
            if (rm) { setRevealed(100); return; }
            timer = setInterval(() => {
                setRevealed((p) => {
                    if (p >= 100) { if (timer) clearInterval(timer); return p; }
                    return p + 1;
                });
            }, 16);
        }, { threshold : 0.35 });
        io.observe(el);
        return () => { io.disconnect(); if (timer) clearInterval(timer); };
    }, []);

    let womenShown = 0;
    FLOW_SET.forEach((i) => { if (i < revealed) womenShown++; });
    const running = revealed > 0 && revealed < 100;

    return (
        <div ref={wrapRef} className="women-isotype">
            <h3 className="sr-only">
                Two 100-dot grids comparing the share of women among bank borrowers: of accounts already
                open in 2015, about 22 in 100 belonged to women; of accounts added since 2015, about 34
                in 100 do — the newcomers skew far more female than the existing base.
            </h3>

            <Div className="iso-legend" verticallyCentreItems>
                <span className="iso-key"><span className="iso-swatch" style={{ background : WOMEN }} />women</span>
                <span className="iso-key"><span className="iso-swatch" style={{ background : OTHERS }} />men</span>
                <Text size="tiny" isSubtext className="iso-note">each dot = 1 in 100 borrower accounts</Text>
            </Div>

            <div className="isotype-panels">
                <div className="iso-panel">
                    <Text size="small" isSubtext marginBottom="nano">Already borrowing in 2015</Text>
                    <div className="isotype-grid" aria-hidden="true">
                        {Array.from({ length : 100 }, (_, i) => (
                            <span key={i} className="iso-dot on" style={{ background : BASE_SET.has(i) ? WOMEN : OTHERS }} />
                        ))}
                    </div>
                    <Div verticallyCentreItems className="iso-stat-row">
                        <Text className="iso-stat" weight="600">1 in 5</Text>
                        <Text size="small" isSubtext>were women (22%)</Text>
                    </Div>
                </div>

                <div className="iso-panel iso-panel-flow">
                    <Text size="small" isSubtext marginBottom="nano">Joined since 2015</Text>
                    <div className="isotype-grid" aria-hidden="true">
                        {Array.from({ length : 100 }, (_, i) => (
                            <span
                                key={i}
                                className={`iso-dot ${i < revealed ? "on" : "pending"}`}
                                style={{ background : FLOW_SET.has(i) ? WOMEN : OTHERS }}
                            />
                        ))}
                    </div>
                    <Div verticallyCentreItems className="iso-stat-row">
                        <Text className="iso-stat" weight="600">1 in 3</Text>
                        <Text size="small" isSubtext>
                            {running
                                ? `${womenShown} women (${Math.round((womenShown / Math.max(1, revealed)) * 100)}%)`
                                : "are women (34%)"}
                        </Text>
                    </Div>
                </div>
            </div>
        </div>
    );
};

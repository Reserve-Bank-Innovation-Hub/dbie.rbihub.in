"use client";

// A tile map of India: each state a square in roughly its place, so a pattern by region reads at a glance without
// drawing any boundary. Tiles rise in from the north-west when the map scrolls into view; each can be hovered or
// focused for its numbers. The colours are the site's own chart scheme for the page's theme: a sequential map takes
// the blue ramp in steps, a diverging map the warm arm for a fall and the cool arm for a rise either side of the
// neutral grey. States with no figure are hatched.

// REACT CORE ==========================================================================================================
import { useMemo, useState } from "react";

// UI ==================================================================================================================
import { useTheme } from "fictoan-react";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LIB =================================================================================================================
import { resolveScheme } from "@/components/charts/chartConfig";
import { contrastBetween } from "@/lib/fictoan-colours";

// LOCAL ===============================================================================================================
import { EASE } from "./chartKit";
import { TILES } from "./data";
import { useSize } from "./useSize";

export interface TileDatum {
    value : number | null;    // null: no figure for this state
    label : string;           // the value as the tile prints it
    lines : string[];         // the tooltip
}

interface TileMapProps {
    data      : Record<string, TileDatum>;
    mode      : "sequential" | "diverging";
    // the class edges: for a sequential map, six rising edges between the ramp's seven steps; for a diverging map,
    // three rising magnitudes (within the first a value reads as no change, then the arms' three steps)
    edges     : number[];
    format    : (edge : number) => string;
    missing ? : string;
    ariaLabel : string;
}

const COLS = 8, ROWS = 7;

export const TileMap = ({ data, mode, edges, format, missing, ariaLabel } : TileMapProps) => {
    const { ref, width } = useSize<HTMLDivElement>();
    const [ active, setActive ] = useState<string | null>(null);
    const [ theme ] = useTheme();
    const scheme = useMemo(() => resolveScheme("heatmap", undefined, theme), [ theme ]);
    // the swatches, lowest first: the ramp's seven steps, or the warm arm strongest first, the neutral, the cool arm
    const swatches = mode === "sequential"
        ? scheme.ramp
        : [ ...[ ...scheme.negativeSteps ].reverse(), scheme.neutral, ...scheme.positiveSteps ];
    const classOf = (v : number) => {
        if (mode === "sequential") { let k = 0; while (k < edges.length && v >= edges[k]) k++; return k; }
        const m = Math.abs(v);
        let k = 0; while (k < edges.length && m >= edges[k]) k++;          // 0 = no change, 1..3 = the arm's steps
        return k === 0 ? 3 : v < 0 ? 3 - k : 3 + k;
    };
    const gap = width < 480 ? 3 : 5;
    const tile = Math.max(28, Math.min(62, (width - gap * (COLS - 1)) / COLS));
    const mapW = COLS * tile + (COLS - 1) * gap, mapH = ROWS * tile + (ROWS - 1) * gap;
    const small = tile < 44, tiny = tile < 34;

    const fill = (v : number | null) => {
        if (v === null) return { cls : "is-missing", bg : undefined as string | undefined, deep : false };
        const bg = swatches[classOf(v)];
        // text in white where the tile is dark enough for it, the ink otherwise
        return { cls : "", bg, deep : contrastBetween(bg, "#ffffff") >= 3.6 };
    };
    const activeTile = active ? TILES.find(t => t.name === active) : null;

    return (
        <div className="tilemap-wrap" ref={ref}>
            {!!width && (
                <motion.div
                    className="tilemap" role="img" aria-label={ariaLabel} style={{ width : mapW, height : mapH }}
                    initial="hidden" whileInView="shown" viewport={{ once : true, amount : 0.3 }}
                >
                    {TILES.map(t => {
                        const d = data[t.name];
                        const f = fill(d?.value ?? null);
                        return (
                            <motion.button
                                key={t.name} type="button"
                                className={`tile ${f.cls} ${f.deep ? "is-deep" : ""} ${active === t.name ? "is-active" : ""}`}
                                style={{ left : t.col * (tile + gap), top : t.row * (tile + gap), width : tile, height : tile, background : f.bg }}
                                variants={{
                                    hidden : { opacity : 0, scale : 0.4, y : -10 },
                                    shown  : { opacity : 1, scale : 1, y : 0, transition : { duration : 0.6, ease : EASE, delay : (t.col + t.row) * 0.055 } },
                                }}
                                whileHover={{ scale : 1.1, zIndex : 3 }}
                                onPointerEnter={() => setActive(t.name)} onPointerLeave={() => setActive(null)}
                                onFocus={() => setActive(t.name)} onBlur={() => setActive(null)}
                                aria-label={`${t.name}: ${d?.label ?? "no figure"}`}
                            >
                                <span className="tile-code">{t.code}</span>
                                {!tiny && <span className={`tile-value ${small ? "is-small" : ""}`}>{d?.label ?? "–"}</span>}
                            </motion.button>
                        );
                    })}
                    {activeTile && data[activeTile.name] && (
                        <div className="tile-tip" style={{ left : Math.min(activeTile.col * (tile + gap) + tile / 2, mapW - 100), top : activeTile.row * (tile + gap) + tile + 8 }}>
                            <strong>{activeTile.name}</strong>
                            {data[activeTile.name].lines.map(l => <span key={l}>{l}</span>)}
                        </div>
                    )}
                </motion.div>
            )}
            <div className="tile-legend">
                {/* painted once the map has measured itself after mounting, like the tiles: the server knows no stored
                    theme, so colours in the first render would not match a browser that starts in the dark theme */}
                <div className="legend-steps">
                    {swatches.map((c, i) => <i key={i} style={width ? { background : c } : undefined} />)}
                </div>
                <div className="legend-ticks">
                    {(mode === "sequential" ? edges : [ ...[ ...edges ].reverse().map(e => -e), ...edges ])
                        .map((e, i) => <span key={i} style={{ gridColumn : `${i + 1} / span 2`, gridRow : 1 }}>{format(e)}</span>)}
                </div>
                {missing && <span className="legend-missing"><i className="missing-swatch" />{missing}</span>}
            </div>
        </div>
    );
};

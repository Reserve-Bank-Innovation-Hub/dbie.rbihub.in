"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Div } from "fictoan-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS } from "@/components/charts/chartConfig";

// STYLES ==============================================================================================================
import "./stat-tile.css";

// A headline number and how it moved: the label with the period it belongs to, the value, and
// the change since the previous print — over a sparkline of the last two dozen observations
// that runs the full width of the card and fades into it.
//
// The change carries no colour of its own — a falling rupee or a rising repo rate is neither
// good nor bad here, so the arrow and the words sit in the ordinary text colour and only say
// which way the number went.

export interface StatTileSpark {
    dates  : string[];
    values : number[];
}

export interface StatTileProps {
    sparkId   : string;                              // unique per tile: the gradient's id comes from it
    label     : string;
    value     : string;
    unit      : string;
    asOf      : string;
    delta     : number;
    previous  : { value : string; as_of : string };
    spark     : StatTileSpark;
}

// The sparkline is drawn in its own coordinate space and stretched to the card's width, so the
// numbers below are shape, not pixels. The vertical padding keeps the line off the top of its
// band and clear of the bottom edge.
const SPARK_W = 100;
const SPARK_H = 40;
// Headroom at the top of the band keeps the line under the value rather than through it.
const SPARK_PAD_TOP = 13;
const SPARK_PAD_BOTTOM = 4;

// The accent from the categorical palette: one hue for every tile, so a row of them reads as
// one instrument rather than eight.
const SPARK_COLOUR = CHART_COLORS.purpleDark;
// Capped so the label, value and change text all keep their contrast over the fill rather
// than the text having to darken to compensate.
const SPARK_FILL_OPACITY = 0.22;

interface SparkGeometry {
    line  : string;
    area  : string;
    lastY : number;   // per cent up from the card's bottom
}

function sparkGeometry(values : number[]) : SparkGeometry | null {
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const stepX = SPARK_W / (values.length - 1);
    const points = values.map((v, i) => [
        i * stepX,
        SPARK_H - SPARK_PAD_BOTTOM - ((v - min) / span) * (SPARK_H - SPARK_PAD_TOP - SPARK_PAD_BOTTOM),
    ] as const);
    const line = points.map(([ x, y ], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
    const lastY = points[points.length - 1][1];
    return {
        line,
        area  : `${line} L${SPARK_W} ${SPARK_H} L0 ${SPARK_H} Z`,
        lastY : ((SPARK_H - lastY) / SPARK_H) * 100,
    };
}

// "%" and "% year-on-year" move in percentage points; everything else moves in its own unit.
const deltaUnit = (unit : string) => (unit.trim().startsWith("%") ? "pp" : "");

const decimalsOf = (value : string) => {
    const dot = value.indexOf(".");
    return dot < 0 ? 0 : value.length - dot - 1;
};

export const StatTile : React.FC<StatTileProps> = ({sparkId, label, value, unit, asOf, delta, previous, spark}) => {
    const decimals = decimalsOf(value);
    const moved = Math.abs(delta) >= Number(`5e-${decimals + 1}`);
    const Arrow = !moved ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
    const size = deltaUnit(unit);
    const change = moved
        ? `${Math.abs(delta).toFixed(decimals)}${size ? " " + size : ""} since ${previous.as_of}`
        : `unchanged since ${previous.as_of}`;
    const geometry = sparkGeometry(spark.values);
    const gradientId = `spark-gradient-${sparkId}`;

    return (
        <>
            {geometry ? (
                <Div className="stat-tile-spark" aria-hidden="true">
                    <svg viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} preserveAspectRatio="none">
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={SPARK_COLOUR} stopOpacity={SPARK_FILL_OPACITY} />
                                <stop offset="100%" stopColor={SPARK_COLOUR} stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        <path d={geometry.area} fill={`url(#${gradientId})`} stroke="none" />

                        <path
                            d={geometry.line}
                            fill="none"
                            stroke={SPARK_COLOUR}
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>

                    {/* The end dot is HTML, not SVG: the SVG is stretched to the card's width, which
                        would squash a circle drawn inside it into an ellipse. It sits flush with the
                        card's right edge, where the last reading is, rather than half outside it. */}
                    <span
                        className="stat-tile-spark-dot"
                        style={{bottom : `${geometry.lastY}%`, backgroundColor : SPARK_COLOUR}}
                    />
                </Div>
            ) : null}

            <Div className="stat-tile">
                <p className="stat-tile-label">
                    {label}
                    <span className="stat-tile-period">{asOf}</span>
                </p>

                <p className="stat-tile-value">
                    {value}
                    <span className="stat-tile-unit">{unit}</span>
                </p>

                <p className="stat-tile-change">
                    <Arrow size={14} strokeWidth={2} aria-hidden="true" />
                    {change}
                </p>
            </Div>
        </>
    );
};

export default StatTile;

"use client";

// REACT CORE ==========================================================================================================
import { useId } from "react";

// A minted ten-gram bar, drawn flat: a bevelled slab in the gold's own tones with the weight and fineness stamped on
// it. Decorative; the figures sit in the card beside it.

export const GoldBar = ({ className, ...place } : { className ? : string; x ? : number; y ? : number; width ? : number; height ? : number }) => {
    const id = useId();
    const face = `${id}-face`, edge = `${id}-edge`, sheen = `${id}-sheen`;
    return (
        <svg className={className} viewBox="0 0 320 180" role="img" aria-label="A ten-gram gold bar" {...place}>
            <defs>
                <linearGradient id={face} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" className="bar-light" />
                    <stop offset="0.55" className="bar-mid" />
                    <stop offset="1" className="bar-deep" />
                </linearGradient>
                <linearGradient id={edge} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" className="bar-deep" />
                    <stop offset="1" className="bar-shadow" />
                </linearGradient>
                <linearGradient id={sheen} x1="0" y1="0" x2="1" y2="0.4">
                    <stop offset="0" stopColor="white" stopOpacity="0" />
                    <stop offset="0.45" stopColor="white" stopOpacity="0.28" />
                    <stop offset="0.6" stopColor="white" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* the slab's edge, then its face, then a stamped border and the marks */}
            <path d="M34,46 L286,46 L306,70 L306,140 L286,150 L34,150 L14,140 L14,70 Z" fill={`url(#${edge})`} />
            <rect x="34" y="34" width="252" height="104" rx="8" fill={`url(#${face})`} />
            <rect x="34" y="34" width="252" height="104" rx="8" fill={`url(#${sheen})`} />
            <rect x="46" y="46" width="228" height="80" rx="5" className="bar-stamp" />
            <text x="160" y="84" textAnchor="middle" className="bar-weight">10 g</text>
            <text x="160" y="108" textAnchor="middle" className="bar-fine">STANDARD GOLD · 999.0</text>
            <text x="58" y="60" className="bar-small">MUMBAI</text>
            <text x="262" y="60" textAnchor="end" className="bar-small">FINE GOLD</text>
        </svg>
    );
};

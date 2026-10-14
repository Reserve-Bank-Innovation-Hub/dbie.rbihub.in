"use client";

// REACT CORE ==========================================================================================================
import { useCallback, useEffect, useState } from "react";

// The size of a chart's wrapper, kept current, so the SVG can be drawn in real pixels rather than letterboxed. The ref
// is a callback, so a wrapper that leaves and returns (the figure's table view unmounts the chart) is observed afresh
// each time it mounts, rather than the observer staying on the detached element and reporting it as zero wide.
export const useSize = <T extends HTMLElement>() => {
    const [ el, setEl ] = useState<T | null>(null);
    const [ size, setSize ] = useState({ width : 0, height : 0 });
    const ref = useCallback((node : T | null) => setEl(node), []);

    useEffect(() => {
        if (!el) return;
        const ro = new ResizeObserver(([ entry ]) => {
            const { width, height } = entry.contentRect;
            if (width > 0) setSize({ width, height });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [ el ]);

    return { ref, ...size };
};

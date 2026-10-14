"use client";

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState } from "react";

// The size of a chart's wrapper, kept current, so the SVG can be drawn in real pixels rather than letterboxed.
export const useSize = <T extends HTMLElement>() => {
    const ref = useRef<T>(null);
    const [ size, setSize ] = useState({ width : 0, height : 0 });

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(([ entry ]) => {
            const { width, height } = entry.contentRect;
            setSize({ width, height });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return { ref, ...size };
};

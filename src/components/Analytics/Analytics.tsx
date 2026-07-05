"use client";

// REACT CORE ==========================================================================================================
import { useEffect } from "react";

// OTHER ===============================================================================================================
import { init } from "enni-analytics/client";

// Starts the enni collector: counts pages, SPA route changes, flow edges,
// referrer host and device class — anonymous counters only, and a no-op
// when Do Not Track / Global Privacy Control is on.
export const Analytics = () => {
    useEffect(() => {
        init();
    }, []);

    return null;
};

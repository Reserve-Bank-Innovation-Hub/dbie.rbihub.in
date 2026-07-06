"use client";

// REACT CORE ==========================================================================================================
import { useEffect } from "react";

// OTHER ===============================================================================================================
import { init } from "enni-analytics/client";

// Starts the enni collector: counts pages, SPA route changes, flow edges,
// referrer host and device class — anonymous counters only, and a no-op
// when Do Not Track is on. GPC is deliberately not honoured: enni stores
// no personal information, so a sale/share opt-out has nothing to apply
// to (see the package README's "Privacy signals" section).
export const Analytics = () => {
    useEffect(() => {
        init();
    }, []);

    return null;
};

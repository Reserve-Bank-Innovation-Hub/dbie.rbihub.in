"use client";

// REACT CORE ==========================================================================================================
import { useEffect } from "react";

// OTHER ===============================================================================================================
import { init } from "enni-analytics/client";

// Counts the missing path under the 404 card on /enni. Calls init()
// rather than window.enni because this child effect runs before the
// layout's <Analytics /> effect has registered the global; init() is
// idempotent and returns the track function either way.
export const Report404 = () => {
    useEffect(() => {
        init()("404");
    }, []);

    return null;
};

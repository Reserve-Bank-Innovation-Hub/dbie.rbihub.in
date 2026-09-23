// The icon beside a list page's heading, chosen from the heading's own name (src/lib/tables/heading-icons.ts).

// REACT CORE ==========================================================================================================
import React from "react";

// LIB =================================================================================================================
import { headingIcon } from "@/lib/tables/heading-icons";

export const HeadingIcon = ({ label, size = 32 } : { label : string; size ? : number }) => {
    const Icon = headingIcon(label);
    return <Icon className="heading-icon" size={size} strokeWidth={2} aria-hidden="true" />;
};

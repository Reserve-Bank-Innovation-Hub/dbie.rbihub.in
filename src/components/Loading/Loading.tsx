"use client";

// UI ==================================================================================================================
import { Div, Spinner } from "fictoan-react";

// STYLES ==============================================================================================================
import "./loading.css";

interface LoadingProps {
    name ? : string;
    size ? : "tiny" | "small" | "medium" | "large" | "huge";
}

// The one loading state for the whole app — a centred spinner with
// "Loading <dataset/table name>…". Route-level loading.tsx files and
// in-page fetch placeholders all render this.
export const Loading = ({ name, size = "medium" } : LoadingProps) => {
    return (
        <Div className="loading-block">
            <Spinner
                size={size}
                loadingText={name ? `Loading ${name}…` : "Loading…"}
            />
        </Div>
    );
};

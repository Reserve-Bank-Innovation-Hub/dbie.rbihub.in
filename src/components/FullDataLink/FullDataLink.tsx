"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import { useRouter } from "next/navigation";

// UI ==================================================================================================================
import { Div, Text } from "fictoan-react";

// ASSETS ==============================================================================================================
import ArrowNorthEast from "@assets/icons/arrow-north-east.svg";

// STYLES ==============================================================================================================
import "./full-data-link.css";

interface FullDataButtonProps {
    fullData ? : string;
    onClick  ? : () => void;
}

const FullDataLink : React.FC<FullDataButtonProps> = ({fullData, onClick}) => {
    const router = useRouter();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (fullData) {
            router.push(fullData);
        }
    };

    return (
        <Div className="full-view-link" onClick={handleClick}>
            <Div className="link-content">
                <Text weight="600">FULL DATA</Text>
                <ArrowNorthEast className="arrow-icon" />
            </Div>
        </Div>
    );
};

export default FullDataLink;

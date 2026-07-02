// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Copy } from "lucide-react";
import { Div, Header, SpacingTypes, Text } from "fictoan-react";

// STYLES ==============================================================================================================
import "./data-unit.css";

interface DataUnitProps {
    label        : React.ReactNode;
    value        : React.ReactNode;
    size       ? : SpacingTypes;
    isCopyable ? : boolean;
    align      ? : "left" | "right" | "centre";
}

export const DataUnit : React.FC<DataUnitProps> = ({label, value, size, isCopyable, align}) => {
    const getStringValue = (val : React.ReactNode) : string => {
        if (val === null || val === undefined) return "";
        if (typeof val === "string") return val;
        if (typeof val === "number") return val.toString();
        if (React.isValidElement(val) && typeof val.props.children === "string") {
            return val.props.children;
        }
        return "";
    };

    const isEmpty = value === null || value === undefined || (typeof value === "string" && value.trim() === "");
    const stringValue = getStringValue(value);

    const handleCopy = () => {
        if (isCopyable) {
            navigator.clipboard.writeText(stringValue);
        }
    };

    return (
        <Div className={`data-unit align-${align}`}>
            <Header isFullWidth>
                <Text
                    size="tiny"
                    isSubtext
                >
                    {label}
                </Text>

                {isCopyable
                    ? (
                        <>
                            <Div className="data-actions">
                                <Div className="action-icon copy-icon" onClick={handleCopy}>
                                    <Copy size={12} />
                                </Div>
                            </Div>
                        </>
                    ) : null}
            </Header>

            <Text size={size}>
                {isEmpty ? "—" : value}
            </Text>
        </Div>
    );
};

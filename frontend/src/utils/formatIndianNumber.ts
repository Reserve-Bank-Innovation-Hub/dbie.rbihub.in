/**
 * Formats a number with Indian numbering system (lakhs and crores)
 * Groups digits from right: first 3, then groups of 2
 *
 * Examples:
 * - 1234 → 1,234
 * - 12345 → 12,345
 * - 123456 → 1,23,456
 * - 1234567 → 12,34,567
 * - 12345678 → 1,23,45,678
 *
 * @param value - The number to format
 * @param prefix - Optional prefix string (e.g., "₹")
 * @param suffix - Optional suffix string (e.g., "/-")
 * @returns Formatted string with Indian number grouping
 */
export function formatIndianNumber(
    value : number,
    prefix : string = "",
    suffix : string = "",
) : string {
    // Handle edge cases
    if (value === null || value === undefined || isNaN(value)) {
        return "";
    }

    // Convert to string and split into integer and decimal parts
    const [ integerPart, decimalPart ] = value.toString().split(".");

    // Handle negative numbers
    const isNegative = integerPart.startsWith("-");
    const absoluteInteger = isNegative ? integerPart.slice(1) : integerPart;

    let formatted = "";

    // If the number has 3 or fewer digits, no grouping needed
    if (absoluteInteger.length <= 3) {
        formatted = absoluteInteger;
    } else {
        // Get the last 3 digits
        const lastThree = absoluteInteger.slice(-3);
        // Get the remaining digits
        const remaining = absoluteInteger.slice(0, -3);

        // Add commas every 2 digits from right to left for the remaining part
        const formattedRemaining = remaining
            .split("")
            .reverse()
            .reduce((acc, digit, index) => {
                if (index > 0 && index % 2 === 0) {
                    return digit + "," + acc;
                }
                return digit + acc;
            }, "");

        formatted = formattedRemaining + "," + lastThree;
    }

    // Add decimal part if exists
    if (decimalPart !== undefined) {
        formatted += "." + decimalPart;
    }

    // Add negative sign if needed
    if (isNegative) {
        formatted = "-" + formatted;
    }

    // Add prefix and suffix
    return `${prefix}${formatted}${suffix}`;
}

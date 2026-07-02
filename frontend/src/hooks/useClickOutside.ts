// REACT CORE ==========================================================================================================
import { RefObject, useEffect } from "react";

/**
 * Hook that handles clicks outside of a ref element
 * @param ref - React ref object pointing to the element to detect clicks outside of
 * @param handler - Callback function to execute when a click outside is detected
 */
export const useClickOutside = <T extends HTMLElement = HTMLElement>(
    ref: RefObject<T>,
    handler: (event: MouseEvent | TouchEvent) => void
) => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            const element = ref?.current;

            // Do nothing if clicking ref's element or descendent elements
            if (!element || element.contains(event.target as Node)) {
                return;
            }

            handler(event);
        };

        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);

        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
};

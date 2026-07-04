"use client";

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// UI ==================================================================================================================
import { Card, Div, Divider, Header, InputField, Text } from "fictoan-react";
import { Search } from "lucide-react";

// STYLES ==============================================================================================================
import "./site-search.css";

// OTHER ===============================================================================================================
import { create, insert, search as oramaSearch, type AnyOrama } from "@orama/orama";

interface SearchEntry {
    title       : string;
    description : string;
    keywords    : string[];
    section     : string;
    url         : string;
}

interface SearchResult {
    document : SearchEntry;
}

interface SiteSearchProps {
    isOpen  : boolean;
    onClose : () => void;
}

export const SiteSearch = ({isOpen : isModalOpen, onClose} : SiteSearchProps) => {
    const router = useRouter();
    const [ query, setQuery ] = useState("");
    const [ hasResults, setHasResults ] = useState(false);
    const [ activeIndex, setActiveIndex ] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
    const [ db, setDb ] = useState<AnyOrama | null>(null);
    const [ results, setResults ] = useState<SearchResult[]>([]);

    // Build the Orama DB from the payload index on first open
    useEffect(() => {
        if (!isModalOpen || db) return;
        (async () => {
            const res = await fetch("/data/search-index.json");
            if (!res.ok) return;
            const searchIndex : SearchEntry[] = await res.json();

            const oramaDb = create({
                schema : {
                    title       : "string",
                    description : "string",
                    keywords    : "string",
                    section     : "string",
                    url         : "string",
                },
            });

            for (const entry of searchIndex) {
                insert(oramaDb, {
                    title       : entry.title,
                    description : entry.description,
                    keywords    : entry.keywords.join(" "),
                    section     : entry.section,
                    url         : entry.url,
                });
            }

            setDb(oramaDb);
        })();
    }, [ isModalOpen, db ]);

    const closeModal = () => {
        setHasResults(false);
        setQuery("");
        setResults([]);
        setActiveIndex(-1);
        onClose();
    };

    const performSearch = useCallback(
        async (searchQuery : string) => {
            if (!db || searchQuery.trim().length === 0) {
                setResults([]);
                setHasResults(false);
                return;
            }

            const searchResults = await oramaSearch(db, {
                term       : searchQuery,
                properties : [ "title", "keywords", "description" ],
                boost      : {title : 2, keywords : 1.4, description : 1},
                tolerance  : 1,
                limit      : 20,
            });

            const hits = searchResults.hits as unknown as SearchResult[];
            setResults(hits);
            setHasResults(hits.length > 0);
            setActiveIndex(-1);
        },
        [ db ],
    );

    const handleChange = (value : string) => {
        setQuery(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => performSearch(value), 200);
    };

    const navigateTo = (url : string) => {
        closeModal();
        router.push(url);
    };

    const handleKeyDown = (e : React.KeyboardEvent) => {
        if (e.key === "Escape") {
            closeModal();
            return;
        }

        if (!hasResults) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            navigateTo(results[activeIndex].document.url);
        }
    };

    // Scroll the active result into view on keyboard navigation
    useEffect(() => {
        if (activeIndex < 0) return;
        const dropdown = document.getElementById("search-results-dropdown");
        const activeEl = dropdown?.querySelector<HTMLElement>(".search-result-item.is-active");
        if (!dropdown || !activeEl) return;

        const dropdownRect = dropdown.getBoundingClientRect();
        const itemRect = activeEl.getBoundingClientRect();
        const padding = 8;

        if (itemRect.bottom + padding > dropdownRect.bottom) {
            dropdown.scrollTop += itemRect.bottom - dropdownRect.bottom + padding;
        } else if (itemRect.top - padding < dropdownRect.top) {
            dropdown.scrollTop -= dropdownRect.top - itemRect.top + padding;
        }
    }, [ activeIndex ]);

    // Close on Escape key globally
    useEffect(() => {
        if (!isModalOpen) return;
        const handleEscape = (e : KeyboardEvent) => {
            if (e.key === "Escape") closeModal();
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [ isModalOpen ]);

    // Auto-focus the input when the modal opens
    useEffect(() => {
        if (isModalOpen) {
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [ isModalOpen ]);

    if (!isModalOpen) return null;

    return (
        <Div id="site-search-wrapper" onKeyDown={handleKeyDown}>
            <Div id="site-search-content-wrapper">
                <Div id="search-modal">
                    <InputField
                        placeholder="Search tables and series"
                        innerIconLeft={<Search size="16px" />}
                        value={query}
                        onChange={handleChange}
                        ref={inputRef}
                        size="large" isFullWidth
                    />

                    {hasResults && (
                        <Div id="search-results-dropdown" shadow="soft">
                            {results.map((result, idx) => (
                                <Div
                                    key={result.document.url}
                                    className={`search-result-item ${idx === activeIndex ? "is-active" : ""}`}
                                    onMouseEnter={() => setActiveIndex(idx)}
                                    onClick={() => navigateTo(result.document.url)}
                                    shadow={idx === activeIndex ? "hard" : undefined}
                                >
                                    <Header>
                                        <Text size="tiny" className="result-theme" weight="500" marginBottom="nano">
                                            {result.document.section}
                                        </Text>

                                        <Text weight="600" size="small">
                                            {result.document.title}
                                        </Text>
                                    </Header>

                                    <Div className="search-result-description" opacity="80">
                                        <Text size="small" isSubtext>
                                            {result.document.description}
                                        </Text>
                                    </Div>
                                </Div>
                            ))}
                        </Div>
                    )}

                    {!hasResults && query.trim().length > 0 && (
                        <Div id="search-results-dropdown">
                            <Div className="search-empty-state">
                                No results found for &ldquo;{query}&rdquo;
                            </Div>
                        </Div>
                    )}
                </Div>
            </Div>

            <Div id="search-bg-overlay" onClick={closeModal} />
        </Div>
    );
};

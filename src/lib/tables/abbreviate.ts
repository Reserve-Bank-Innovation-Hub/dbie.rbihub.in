// Shorter names for the sidebar's list of a thousand tables. The standard abbreviations for the terms DBIE's titles
// repeat (SCBs, RBI, Govt., No., Avg., FY, USD …); "Statement No. 1 :" and "Table No 3.3A" cut to "St. 1:" and
// "Table 3.3A:"; a long form that DBIE itself follows with its acronym, such as "Nominal Effective Exchange Rate
// (NEER)", reduced to the acronym; and "according to" said as "by". Nothing is cut that the name does not still
// say; the full title is the link's tooltip and the page's heading.

const PHRASES : [ RegExp, string ][] = [
    // Prefixes
    [ /^Statement\s*No\.?\s*([\dIVX]+[A-Za-z]?)\s*:\s*/i,               "St. $1: " ],
    [ /^Statement\s+([IVX]+)\s*:\s*/i,                                  "St. $1: " ],
    [ /^Table\s*No\.?\s*(\d+(?:\.\d+)?[A-Za-z]?)\s*[-–:]?\s*/i,          "Table $1: " ],

    // Institutions
    [ /\bScheduled? Commercial Banks(')?/gi,                            "SCBs$1" ],
    [ /\bRegional Rural Banks\b/gi,                                      "RRBs" ],
    [ /\bReserve Bank of India\b/gi,                                     "RBI" ],
    [ /\bGovernment of India\b/gi,                                       "GoI" ],
    [ /(?<!State )\bGovernment Securities\b/gi,                          "G-Secs" ],
    [ /\bTreasury Bills\b/gi,                                            "T-Bills" ],
    [ /\bGovernments\b/gi,                                               "Govts." ],
    [ /\bGovernment\b/gi,                                                "Govt." ],
    [ /\bPublic Sector Banks\b/gi,                                       "PSBs" ],
    [ /\bUrban Co-operative Banks\b/gi,                                  "UCBs" ],
    [ /\bState Co-operative Banks\b/gi,                                  "StCBs" ],
    [ /\bDistrict Central Co-operative Banks\b/gi,                       "DCCBs" ],
    [ /\bPrimary Agricultural Credit Societies\b/gi,                     "PACS" ],
    [ /\bPrivate Limited\b/gi,                                           "Pvt. Ltd." ],
    [ /\bLimited\b/gi,                                                   "Ltd." ],

    // Measures
    [ /\bConsumer Price Index\b/gi,                                      "CPI" ],
    [ /\bWholesale Price Index\b/gi,                                     "WPI" ],
    [ /\bIndex of Industrial Production\b/gi,                            "IIP" ],
    [ /\bGross Domestic Product\b/gi,                                    "GDP" ],
    [ /\bGross Value Added\b/gi,                                         "GVA" ],
    [ /\bNet State Domestic Product\b/gi,                                "NSDP" ],
    [ /\bGross State Domestic Product\b/gi,                              "GSDP" ],
    [ /\bNet State Value Added\b/gi,                                     "NSVA" ],
    [ /\bBalance of Payments\b/gi,                                       "BoP" ],
    [ /\bForeign Direct Investment\b/gi,                                 "FDI" ],
    [ /\bForeign Exchange\b/gi,                                          "Forex" ],
    [ /\bMinimum Support Price\b/gi,                                     "MSP" ],
    [ /\bPublic Distribution System\b/gi,                                "PDS" ],
    [ /\bCertificates? of Deposit\b/gi,                                  "CDs" ],
    [ /\bFinancial Year\b/gi,                                            "FY" ],

    // Currencies
    [ /\bUS Dollars?\b/gi,                                               "USD" ],
    [ /\bPound Sterling\b/gi,                                            "GBP" ],
    [ /\bJapanese Yen\b/gi,                                              "JPY" ],
    [ /\bIndian Rupees?\b/gi,                                            "INR" ],
    [ /\bRupees\b/gi,                                                    "INR" ],

    // Words
    [ /\bNumber of\b/gi,                                                 "No. of" ],
    [ /\bAverages\b/gi,                                                  "Avgs." ],
    [ /\bAverage\b/gi,                                                   "Avg." ],
    [ /\baccording to\b/gi,                                              "by" ],
];

// The initials of some words, hyphenated parts counting separately: "Non-Banking Financial and Investment" → NBFAI.
const initials = (words : string[]) : string =>
    words.flatMap(w => w.split(/[-/]/)).filter(Boolean).map(p => p[0].toUpperCase()).join("");

const SKIP = new Set([ "of", "and", "the", "for", "in", "&" ]);

// "Nominal Effective Exchange Rate (NEER)" → "NEER": a bracketed acronym whose letters are the initials of the words
// before it, with or without the small words, stands in for them. A bracket that is not that is left alone.
function collapseAcronyms(s : string) : string {
    return s.replace(/((?:[^\s()]+\s+){1,9})\(([A-Z][A-Z&]+s?)\)/g, (whole, before : string, acronym : string) => {
        const words  = before.trim().split(/\s+/);
        const target = acronym.replace(/s$/, "").replace(/&/g, "A");
        for (let k = 1; k <= words.length; k++) {
            const tail = words.slice(words.length - k);
            if (initials(tail) === target || initials(tail.filter(w => !SKIP.has(w.toLowerCase()))) === target) {
                const head = words.slice(0, words.length - k).join(" ");
                return head ? `${head} ${acronym}` : acronym;
            }
        }
        return whole;
    });
}

export function abbreviate(title : string) : string {
    let s = collapseAcronyms(title);
    for (const [ re, rep ] of PHRASES) s = s.replace(re, rep);
    return s
        .replace(/\b(\S+) \(\1\)/g, "$1")      // "SCBs (SCBs)" once the long form is gone
        .replace(/\s+/g, " ")
        .replace(/\s+([:,)])/g, "$1")
        .trim();
}

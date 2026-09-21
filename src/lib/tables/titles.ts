// DBIE's titles as the site shows them. DBIE writes them in Title Case, some in capitals; here they are set in
// sentence case, keeping the acronyms and proper nouns its titles use (SCBs, RBI, NEER, India, Nifty). The sidebar
// then shortens them with the standard abbreviations for the terms DBIE's titles repeat (SCBs, RBI, govt., no.,
// avg., FY, USD …), "Statement No. 1 :" and "Table No 3.3A" cut to "St. 1:" and "Table 3.3A:", a long form that
// DBIE itself follows with its acronym, such as "nominal effective exchange rate (NEER)", reduced to the acronym,
// and "according to" said as "by". Nothing is cut that the name does not still say; the full title is the link's
// tooltip and the page's heading.

// =====================================================================================================================
// Sentence case
// =====================================================================================================================

// What keeps its capitals: the acronyms and names DBIE's titles and menus use, in their usual form.
const KEEP : string[] = [
    // Names
    "Reserve Bank of India", "Government of India", "India", "Indian", "Indians", "Union", "Nifty", "Sensex", "Mumbai",
    "London", "Japanese", "Excel",
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
    // Institutions and instruments
    "RBI", "GoI", "SCBs", "RRBs", "PSBs", "UCBs", "StCBs", "DCCBs", "PACS", "NBFC", "NBFCs", "SFCs", "SCARDBs", "PCARDBs",
    "DICGC", "NABARD", "SIDBI", "NHB", "EXIM", "IFCI", "HDFC", "LIC", "BSE", "NSE", "MPC", "FI", "FIIs", "FPIs", "ECBs",
    "NRI", "NRIs", "AD", "SSI", "PUC", "SGL", "SGS", "SGSs", "CDs", "T-bills", "G-Secs",
    // Measures and codes
    "GDP", "GVA", "NSDP", "GSDP", "NSVA", "CPI", "WPI", "IIP", "BoP", "FDI", "NEER", "REER", "CRAR", "CRR", "SLR", "LAF",
    "MSF", "SDF", "WALR", "NPA", "NPAs", "MSP", "PDS", "BSR", "LBS", "CBS", "RTP", "PDF", "FY", "NGNBF&I",
    // Currencies
    "US", "USD", "INR", "GBP", "JPY", "SDR", "D.M.", "U.S.",
];

const escape = (s : string) : string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const KEEP_RULES : [ RegExp, string ][] = KEEP
    .sort((a, b) => b.length - a.length)   // phrases before the words in them
    .map(form => [ new RegExp(`(?<![\\w&])${escape(form)}(?![\\w&])`, "gi"), form ]);

const ROMAN = /\b(?:i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)\b/g;

// "Statement No. 3A :", "Table No 2.7 -", "TABLE NO 1.8 -": the label a title may start with, said one way.
const LABEL = /^(statement|table)\s*(?:no\.?)?\s*(\d+(?:\.\d+)?[A-Za-z]?|[IVX]+)\s*[:\-–]?\s*/i;

const upperAt = (s : string, i : number) : string => (i < s.length ? s.slice(0, i) + s[i].toUpperCase() + s.slice(i + 1) : s);

export function sentenceCase(title : string) : string {
    const text   = title.replace(/\s+/g, " ").trim();
    const marker = /^\([a-z]\)\s*/i.exec(text)?.[0].toLowerCase() ?? "";   // "(a) ", a list's letter, as it is
    let s = text.slice(marker.length).toLowerCase();
    s = s.replace(ROMAN, m => m.toUpperCase());
    s = s.replace(/\b([a-z]{1,4})(\d+)\b/g, (m, a : string, n : string) => a.toUpperCase() + n);   // m3, bpm6, bsr1
    s = s.replace(/\b(\d+(?:\.\d+)?)([a-z])\b/g, (m, n : string, a : string) => n + a.toUpperCase());   // 3.3a, 6b
    for (const [ re, form ] of KEEP_RULES) s = s.replace(re, form);
    s = s.replace(LABEL, (m, kind : string, num : string) => `${kind[0].toUpperCase()}${kind.slice(1)} ${num}: `);
    s = s.replace(/\s+([:,)])/g, "$1");

    // The first letter, and the first after a short "Label:" prefix.
    const starts = [ 0 ];
    const colon  = s.indexOf(": ");
    if (colon > 0 && colon <= 20) starts.push(colon + 2);
    for (const at of starts) {
        const m = /[a-z]/i.exec(s.slice(at));
        if (m) s = upperAt(s, at + m.index);
    }
    return marker + s;
}

// =====================================================================================================================
// Abbreviation
// =====================================================================================================================

// A short form in the case of what it replaces: "Government" → "Govt.", "government" → "govt.".
const cased = (short : string) => (m : string) : string => (m[0] === m[0].toUpperCase() ? short : short[0].toLowerCase() + short.slice(1));

const PHRASES : [ RegExp, string | ((m : string) => string) ][] = [
    // Prefixes
    [ /^Statement\s*(?:No\.?)?\s*([\dIVX]+[A-Za-z]?)\s*:\s*/i,           "St. $1: " ],
    [ /^Table\s*(?:No\.?)?\s*(\d+(?:\.\d+)?[A-Za-z]?)\s*[-–:]?\s*/i,      "Table $1: " ],

    // Institutions
    [ /\bScheduled? Commercial Banks(')?/gi,                            "SCBs$1" ],
    [ /\bRegional Rural Banks\b/gi,                                      "RRBs" ],
    [ /\bReserve Bank of India\b/gi,                                     "RBI" ],
    [ /\bGovernment of India\b/gi,                                       "GoI" ],
    [ /(?<!State )\bGovernment Securities\b/gi,                          "G-Secs" ],
    [ /\bTreasury Bills\b/gi,                                            "T-bills" ],
    [ /\bGovernments\b/gi,                                               cased("Govts.") ],
    [ /\bGovernment\b/gi,                                                cased("Govt.") ],
    [ /\bPublic Sector Banks\b/gi,                                       "PSBs" ],
    [ /\bUrban Co-operative Banks\b/gi,                                  "UCBs" ],
    [ /\bState Co-operative Banks\b/gi,                                  "StCBs" ],
    [ /\bDistrict Central Co-operative Banks\b/gi,                       "DCCBs" ],
    [ /\bPrimary Agricultural Credit Societies\b/gi,                     "PACS" ],
    [ /\bPrivate Limited\b/gi,                                           cased("Pvt. Ltd.") ],
    [ /\bLimited\b/gi,                                                   cased("Ltd.") ],

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
    [ /\bForeign Exchange\b/gi,                                          cased("Forex") ],
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
    [ /\bNumber of\b/gi,                                                 cased("No. of") ],
    [ /\bAverages\b/gi,                                                  cased("Avgs.") ],
    [ /\bAverage\b/gi,                                                   cased("Avg.") ],
    [ /\baccording to\b/gi,                                              "by" ],
];

// The initials of some words, hyphenated parts counting separately: "non-banking financial and investment" → NBFAI.
const initials = (words : string[]) : string =>
    words.flatMap(w => w.split(/[-/]/)).filter(Boolean).map(p => p[0].toUpperCase()).join("");

const SKIP = new Set([ "of", "and", "the", "for", "in", "&" ]);

// "nominal effective exchange rate (NEER)" → "NEER": a bracketed acronym whose letters are the initials of the words
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
    for (const [ re, rep ] of PHRASES) s = typeof rep === "string" ? s.replace(re, rep) : s.replace(re, rep);
    return s
        .replace(/\b(\S+) \(\1\)/g, "$1")      // "SCBs (SCBs)" once the long form is gone
        .replace(/\s+/g, " ")
        .replace(/\s+([:,)])/g, "$1")
        .trim();
}

// The name in the sidebar: sentence case, then shortened.
export const shortTitle = (title : string) : string => abbreviate(sentenceCase(title));

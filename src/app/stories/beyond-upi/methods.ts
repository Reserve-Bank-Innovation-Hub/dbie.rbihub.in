// The nine ways of paying the story follows, in one place: each one's short name, its colour (as a CSS token for the
// page and as a number for the 3D scenes; the stylesheet's tokens carry the same values), and the story's number
// formats. The ladder is the processor's, sorted by average payment, largest first.

// DATA ================================================================================================================
import { HEADLINE } from "./data.gen";
import type { MethodKey } from "./instruments";

export const METHOD : Record<MethodKey, { short : string; long : string; tone : string; hex : number }> = {
    rtgs   : { short : "RTGS",         long : "RTGS",                        tone : "var(--rtgs)",   hex : 0x864fe3 },
    paper  : { short : "Cheques",      long : "Cheques and other paper",     tone : "var(--paper)",  hex : 0xba644f },
    neft   : { short : "NEFT",         long : "NEFT",                        tone : "var(--neft)",   hex : 0xeaaa3a },
    imps   : { short : "IMPS",         long : "IMPS",                        tone : "var(--imps)",   hex : 0xd07a2c },
    credit : { short : "Credit cards", long : "Credit cards",                tone : "var(--credit)", hex : 0xc9a227 },
    debit  : { short : "Debit cards",  long : "Debit cards",                 tone : "var(--debit)",  hex : 0x6b8e23 },
    upi    : { short : "UPI",          long : "UPI",                         tone : "var(--upi)",    hex : 0x77716a },
    ppi    : { short : "PPI",          long : "Prepaid Payment Instruments (PPI)",         tone : "var(--ppi)",    hex : 0xbfa98a },
    netc   : { short : "Tolls",        long : "Tolls (FASTag, bank-linked)", tone : "var(--toll)",   hex : 0x94836c },
};
export const LADDER = HEADLINE.ladder as { key : MethodKey; label : string; avg : number; volume : number; value : number }[];

// rupees in the Indian way: ₹1,301; ₹1.28 lakh; ₹65.0 lakh; ₹2.50 crore
export const rupees = (v : number) => v >= 1e7 ? `₹${(v / 1e7).toFixed(2)} crore` : v >= 1e5 ? `₹${(v / 1e5).toFixed(v >= 1e6 ? 1 : 2)} lakh` : `₹${Math.round(v).toLocaleString("en-IN")}`;
export const inr = (v : number) => Math.round(v).toLocaleString("en-IN");
export const monthName = (ym : string) => new Date(`${ym}-01T00:00:00`).toLocaleString("en-GB", { month : "long", year : "numeric" });
export const monthShort = (ym : string) => new Date(`${ym}-01T00:00:00`).toLocaleString("en-GB", { month : "short", year : "numeric" });

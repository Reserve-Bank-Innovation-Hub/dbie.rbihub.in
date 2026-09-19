// Where each DBIE report goes: the schema of its DBIE sector. Statistics items carry the sector as their category.
// Publications items take it from the publication (the banking returns, public debt), the Handbook chapter or the
// Bulletin section. The rest (Handbook parts III and IV and its discontinued tables, the Bulletin's occasional
// series, the Weekly Statistical Supplement, and the cross-publication "Notes on Tables") are placed one by one
// below, by report id, so the choice is explicit and reviewable. Anything unplaced is an error, not a guess.
import fs from 'node:fs';
import path from 'node:path';
import { DATA, schemaForSector, splitCsvLine } from './lib.mjs';

const HANDBOOK_CHAPTER = {
    'output and prices': 'real_sector', 'national income, saving and employment': 'real_sector',
    'money and banking': 'financial_sector', 'currency and coinage': 'financial_sector',
    'financial markets': 'financial_markets', 'trade and balance of payments': 'external_sector',
    'external sector': 'external_sector', 'public finance': 'public_finance', 'socio-economic indicators': 'socio_economic',
};
const BULLETIN_SECTION = {
    'external sector': 'external_sector', 'financial markets': 'financial_markets',
    'government accounts and treasury bills': 'public_finance', 'money and banking': 'financial_sector',
    'payment and settlement systems': 'financial_sector', 'prices and production': 'real_sector',
    'reserve bank of india': 'financial_sector',
};
const BANKING_PUBLICATION = /basic statistical return|spatial distribution|bank branch statistics|international banking statistics|co-operative banks|statistical tables relating to banks/i;

// Placed by hand (18-09-2026). Cross-publication documentation goes to meta.
const BY_REPORT = {
    // Monthly RBI Bulletin, occasional series
    62: 'public_finance', 35: 'financial_markets', 36: 'public_finance', 63: 'public_finance', 37: 'public_finance', 38: 'public_finance',
    1225: 'real_sector', 1226: 'real_sector', 1377: 'meta',
    // Handbook part III, series with less than monthly frequency
    829: 'financial_sector', 93: 'financial_markets', 94: 'financial_markets', 95: 'external_sector', 107: 'financial_markets',
    218: 'financial_markets', 113: 'financial_markets', 110: 'financial_markets', 111: 'financial_markets', 830: 'financial_markets',
    267: 'financial_markets', 268: 'financial_markets', 260: 'financial_markets', 198: 'financial_markets',
    // Handbook part IV, growth rates and ratios
    831: 'real_sector', 817: 'real_sector', 832: 'real_sector', 321: 'real_sector', 839: 'real_sector', 834: 'financial_sector',
    836: 'financial_sector', 820: 'financial_sector', 102: 'financial_sector', 276: 'real_sector', 837: 'real_sector', 196: 'public_finance',
    269: 'public_finance', 86: 'public_finance', 87: 'public_finance', 178: 'external_sector', 162: 'real_sector', 838: 'real_sector',
    147: 'financial_markets', 224: 'financial_markets',
    // Handbook discontinued tables
    293: 'real_sector', 294: 'real_sector', 295: 'financial_sector', 64: 'financial_sector', 301: 'financial_sector', 302: 'financial_sector',
    303: 'financial_sector', 153: 'public_finance', 154: 'public_finance', 70: 'financial_sector', 71: 'financial_sector', 73: 'financial_sector',
    221: 'financial_sector', 119: 'real_sector', 186: 'socio_economic', 845: 'financial_markets', 193: 'real_sector', 127: 'financial_sector',
    289: 'financial_markets', 527: 'financial_markets', 121: 'real_sector', 122: 'real_sector', 1379: 'meta',
    // Weekly Statistical Supplement
    39: 'financial_sector', 1: 'external_sector', 6: 'financial_sector', 10: 'financial_sector', 13: 'financial_sector', 7: 'financial_sector',
    8: 'financial_markets', 11: 'real_sector', 4: 'financial_markets', 5: 'financial_markets', 12: 'financial_markets', 2: 'financial_markets',
    3: 'financial_markets', 1412: 'meta', 9: 'financial_sector',
};

export function schemaFor(it) {
    if (BY_REPORT[it.reportId]) return BY_REPORT[it.reportId];
    if (it.section === 'Statistics') {
        const s = schemaForSector(it.category);
        if (s) return s;
    } else {
        const sub = it.subsection || '';
        const parts = (it.group || '').split(' > ').map(s => s.trim().toLowerCase());
        if (BANKING_PUBLICATION.test(sub)) return 'financial_sector';
        if (/public debt statistics/i.test(sub)) return 'public_finance';
        if (/handbook/i.test(sub) && HANDBOOK_CHAPTER[parts[2]]) return HANDBOOK_CHAPTER[parts[2]];
        if (/bulletin/i.test(sub) && BULLETIN_SECTION[parts[1]]) return BULLETIN_SECTION[parts[1]];
    }
    throw new Error(`no schema for report ${it.reportId} "${it.reportName}" (${menuPath(it)})`);
}

// data/coverage-report.csv by report id: kind (table | documentation | archive file) and the SDMX title match.
export function coverageByReport() {
    const lines = fs.readFileSync(path.join(DATA, 'coverage-report.csv'), 'utf8').trim().split('\n');
    const header = splitCsvLine(lines[0]);
    const rows = new Map();
    for (const l of lines.slice(1)) {
        const r = Object.fromEntries(splitCsvLine(l).map((v, i) => [header[i], v]));
        rows.set(Number(r.reportId), { kind: r.kind, verdict: r.verdict, dsd: r.dsd, sdmxLabel: r.sdmxLabel, score: r.score });
    }
    return rows;
}
function kindsFromCoverage() {
    return new Map([...coverageByReport()].map(([id, r]) => [id, r.kind]));
}

export const menuPath = it => [it.section, it.category, it.subsection, it.group].filter(Boolean).join(' > ');

// Every item of the DBIE Statistics and Publications menus, with its kind and schema.
export function catalogueItems() {
    const rc = JSON.parse(fs.readFileSync(path.join(DATA, 'reports-catalogue.json'), 'utf8'));
    const kinds = kindsFromCoverage();
    const items = [];
    for (const g of rc) for (const grp of g.groups) for (const it of grp.reports) {
        const item = { ...it, reportId: Number(it.reportId), section: g.section, category: g.category, subsection: g.subsection, group: grp.title, kind: kinds.get(Number(it.reportId)) || 'table' };
        item.schema = schemaFor(item);
        items.push(item);
    }
    return items;
}

// Processor: search-index — the site-wide search corpus.
//
// One entry per catalogue table (all 335) plus the standalone pages below,
// matching the SiteSearch component's Orama schema:
// { title, description, keywords, section, url }.
//   - url: the live-pages registry route when one exists, else the generic
//     /tables/<slug> page for SDMX entries.
//   - description: the target page's own metadata description (parsed from its
//     page.tsx) for built pages; sector · sub-sector · frequency for generic
//     SDMX pages.
//   - section: the theme segment of the url for built pages, the catalogue
//     sector for SDMX.
//
// Emits: out/search-index.json  (array, sorted by url)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '../..');
const OUT_DIR = path.join(__dirname, 'out');

const catalogue = JSON.parse(fs.readFileSync(path.join(REPO, 'data/catalogue.json'), 'utf8'));
const livePages = JSON.parse(fs.readFileSync(path.join(REPO, 'src/app/tables/live-pages.json'), 'utf8'));

const THEME_LABELS = {
    banking      : 'Banking',
    external     : 'External',
    government   : 'Government',
    growth       : 'Growth',
    handbook     : 'Handbook',
    indicators   : 'Indicators',
    markets      : 'Markets',
    payments     : 'Payments',
    prices       : 'Prices',
    publications : 'Publications',
};

// The page's own metadata description, boilerplate tail trimmed.
function pageDescription(url) {
    const p = path.join(REPO, 'src/app', url.replace(/^\//, ''), 'page.tsx');
    if (!fs.existsSync(p)) return null;
    const m = fs.readFileSync(p, 'utf8').match(/description\s*:\s*\n?\s*"([^"]+)"/);
    if (!m) return null;
    return m[1].replace(/\s*—?\s*from the monthly RBI Bulletin\.?$/, '').trim();
}

const entries = [];
for (const e of catalogue.entries) {
    const slug = e.path.split('/').pop().replace(/\.(csv|xlsx)$/, '');
    const url = livePages[e.id] ?? (e.source === 'sdmx' ? `/tables/${slug}` : null);
    if (!url) throw new Error(`no route for catalogue entry ${e.id}`);

    const isGenericSdmx = url.startsWith('/tables/');
    const theme = THEME_LABELS[url.split('/')[1]] ?? 'Tables';
    const section = isGenericSdmx ? (e.sector ?? 'Tables') : theme;

    const description = isGenericSdmx
        ? [ e.sector, e.subSector, e.frequency ].filter(Boolean).join(' · ')
        : (pageDescription(url) ?? [ e.publication, e.topic, e.frequency ].filter(Boolean).join(' · '));

    const keywords = [ e.sector, e.subSector, e.publication, e.topic, e.frequency, e.dsdCode ]
        .filter(Boolean)
        .map(String);

    entries.push({ title : e.label, description, keywords, section, url });
}

// Standalone pages — not catalogue entries: publication tables and the docs pages.
const STATIC_PAGES = [
    { url : '/publications/credit-classification', section : 'Publications', title : 'Outstanding credit of SCBs', keywords : [ 'credit classification', 'ABC', 'basic statistical return', 'SCB' ] },
    { url : '/publications/external-debt',         section : 'Publications', title : 'External debt',              keywords : [ 'external debt', 'publications' ] },
    { url : '/docs',                               section : 'Docs',         title : 'Docs — overview',            keywords : [ 'docs', 'documentation', 'help', 'about', 'data vintage' ] },
    { url : '/docs/using-the-site',                section : 'Docs',         title : 'Using the site',             keywords : [ 'docs', 'help', 'search', 'charts', 'grids', 'filter', 'sort', 'units' ] },
    { url : '/docs/mcp',                           section : 'Docs',         title : 'AI access via MCP',          keywords : [ 'docs', 'mcp', 'ai', 'claude', 'model context protocol', 'assistant', 'api' ] },
    { url : '/docs/how-to-scrape',                 section : 'Docs',         title : 'How to scrape',              keywords : [ 'docs', 'scraper', 'playwright', 'pipeline', 'processors', 'oracles', 'refresh' ] },
    { url : '/stories',                            section : 'Stories',      title : 'Stories — dashboard',        keywords : [ 'stories', 'so what', 'editorial', 'narratives' ],
      description : 'Data-led stories built on the same verified datasets as the tables' },
    { url : '/stories/the-lights-came-on',         section : 'Stories',      title : 'The lights came on',         keywords : [ 'story', 'bank credit', 'individuals', 'women', 'financial inclusion', 'BSR' ] },
    { url : '/stories/debt-to-service-ratio',      section : 'Stories',      title : 'The long walk back from 1991', keywords : [ 'story', 'external debt', 'debt service ratio', '1991', 'crisis', 'liberalisation' ] },
    { url : '/stories/concessional-share-of-total-debt-vs-commercial-borrowings', section : 'Stories', title : 'From aid recipient to market borrower', keywords : [ 'story', 'external debt', 'concessional', 'commercial borrowing', 'aid' ] },
];
for (const p of STATIC_PAGES) {
    entries.push({
        title       : p.title,
        description : p.description ?? pageDescription(p.url) ?? p.title,
        keywords    : p.keywords,
        section     : p.section,
        url         : p.url,
    });
}

// --- self-checks: fail loudly if the corpus drifts ---
const errors = [];
if (entries.length !== catalogue.entries.length + STATIC_PAGES.length) {
    errors.push(`expected ${catalogue.entries.length + STATIC_PAGES.length} entries, got ${entries.length}`);
}
if (entries.some((e) => !e.title || !e.url || !e.description)) {
    errors.push('entry with empty title/url/description');
}
const urls = new Set(entries.map((e) => e.url));
if (urls.size !== entries.length) {
    errors.push(`urls not unique: ${entries.length} entries, ${urls.size} distinct`);
}
if (errors.length > 0) {
    console.error('search-index self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
}

entries.sort((a, b) => a.url.localeCompare(b.url));
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'search-index.json'), JSON.stringify(entries));
console.log(`wrote ${entries.length} search entries; self-check passed`);

// Enumerates every table in DBIE's Indicators, Statistics and Publications menus over plain
// HTTP (dbie_getReportsDbie, encrypted request fields) and writes
// data/reports-catalogue.json. No browser needed.
//
// Output shape (one entry per menu sub-section):
//   [{ section, category, subsection, reportPath,
//      groups: [{ title, reports: [{ reportName, reportId, frequency, from, to, period, tableNo, section, subSection }] }] }]
// Publications nest deeper than Statistics (publication > section > sub-section > tables);
// the nesting is flattened into `groups` whose title is the joined path.
//
// Usage:
//   node scripts/fetch-reports-catalogue.mjs                    # both menus
//   node scripts/fetch-reports-catalogue.mjs --section Statistics
//   node scripts/fetch-reports-catalogue.mjs --sub "External Debt"

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Gateway, enc } from './lib/dbie-gateway.mjs';

const DATA = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'data');
const argv = process.argv.slice(2);
const flag = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const filterSection = flag('--section');
const filterSub     = flag('--sub');
const OUT = path.join(DATA, 'reports-catalogue.json');
const log = msg => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);

const normalise = r => ({
    reportName : r.reportName || '',
    reportId   : r.reportId ?? null,
    frequency  : r.reportFreq || '',
    from       : r.fromdate || '',
    to         : r.todate || '',
    period     : r.reportPeriod || '',
    tableNo    : r.tableNo || '',
    section    : r.section || '',
    subSection : r.subSection || '',
});

// Flatten nested {title, subs:[...]} nodes into groups of leaf reports.
function flatten(nodes, pathTitles = []) {
    const groups = [];
    const leaves = [];
    for (const n of nodes || []) {
        if (n.reportId !== undefined) { leaves.push(normalise(n)); continue; }
        groups.push(...flatten(n.subs, [...pathTitles, n.title || '']));
    }
    if (leaves.length) groups.unshift({ title: pathTitles.join(' > '), reports: leaves });
    return groups;
}

async function main() {
    const sections = JSON.parse(fs.readFileSync(path.join(DATA, 'reports-sections.json'), 'utf8'));
    const gw = new Gateway();
    await gw.openSession();
    const out = [];
    let total = 0;
    for (const sec of sections) {
        if (filterSection && sec.section !== filterSection) continue;
        for (const cat of sec.categories) for (const sub of cat.subsections) {
            if (filterSub && sub.subsection !== filterSub) continue;
            // The SPA sends: departments = [category], menu = sub-section, function = section name.
            const body = { body: { departments: [enc(cat.category)], menu: enc(sub.subsection), portal: enc('DBIE'), function: enc(sec.section) } };
            let groups = [];
            try {
                const res = await gw.post('dbie_getReportsDbie', body);
                groups = flatten(res.reports || []);
            } catch (e) {
                log(`  ! ${sec.section}/${cat.category}/${sub.subsection}: ${e.message}`);
            }
            const n = groups.reduce((s, g) => s + g.reports.length, 0);
            total += n;
            out.push({ section: sec.section, category: cat.category, subsection: sub.subsection, reportPath: sub.reportPath, groups });
            log(`${sec.section.padEnd(12)} ${cat.category.padEnd(28)} ${sub.subsection.slice(0, 60).padEnd(62)} ${String(n).padStart(4)}`);
        }
    }
    // A run narrowed by --section or --sub replaces only the sub-sections it fetched and keeps the rest of the file,
    // in the order of reports-sections.json.
    let all = out;
    if ((filterSection || filterSub) && fs.existsSync(OUT)) {
        const key = e => `${e.section}\u0000${e.category}\u0000${e.subsection}`;
        const fresh = new Map(out.map(e => [key(e), e]));
        const kept = JSON.parse(fs.readFileSync(OUT, 'utf8')).filter(e => !fresh.has(key(e)));
        const order = sections.flatMap(s => s.categories.flatMap(c => c.subsections.map(u => key({ section: s.section, category: c.category, subsection: u.subsection }))));
        const rank = e => { const i = order.indexOf(key(e)); return i < 0 ? order.length : i; };
        all = [...kept, ...out].sort((a, b) => rank(a) - rank(b));
    }
    fs.writeFileSync(OUT, JSON.stringify(all, null, 2));
    log(`Wrote ${path.relative(process.cwd(), OUT)}: ${all.length} sub-sections (${out.length} fetched), ${total} reports fetched.`);
}
main().catch(e => { console.error(e); process.exit(1); });

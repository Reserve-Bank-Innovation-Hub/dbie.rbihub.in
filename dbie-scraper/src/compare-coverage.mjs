// Compares the authoritative DBIE Reports catalogue (reports-catalogue.json)
// against the SDMX scrape (sdmx-tree.json + manifest.json + data/).
//
// For each Reports subsection, we list every table and try to match it to an
// SDMX element by label. Output (coverage-report.md) groups by subsection and
// shows, per table, whether we have data on disk.
//
// Matching strategy (intentionally generous — the goal is "did we get this *topic*?"):
//   1. strip punctuation, lowercase, drop common stopwords ("statement", "table", "indian")
//   2. for each SDMX element in the same sub-sector, compute Jaccard on word sets
//   3. a match is >= 0.25 Jaccard OR one being a substring of the other
//
// The result is a triage file, not a rigorous 1:1 mapping — the mapping isn't 1:1
// at all (one SDMX cube can represent several Reports tables, and vice versa).

import fs from 'node:fs';

const STOP = new Set(['statement','table','the','of','and','in','on','for','a','an','to','by','from','with',
    'data','indian','india','select','combined','all','various']);

function tokens(s) {
    return (s || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t && !STOP.has(t) && t.length > 2);
}

function jaccard(a, b) {
    const A = new Set(a), B = new Set(b);
    if (!A.size || !B.size) return 0;
    let inter = 0;
    for (const x of A) if (B.has(x)) inter++;
    return inter / (A.size + B.size - inter);
}

function bestSdmxMatch(reportName, sdmxElements) {
    const rt = tokens(reportName);
    const rtJoined = rt.join(' ');
    let best = null;
    for (const el of sdmxElements) {
        const et = tokens(el.label);
        const etJoined = et.join(' ');
        const j = jaccard(rt, et);
        const sub = rtJoined.includes(etJoined) || etJoined.includes(rtJoined);
        const score = Math.max(j, sub ? 0.6 : 0);
        if (!best || score > best.score) best = { ...el, score };
    }
    return best && best.score >= 0.25 ? best : null;
}

const reports = JSON.parse(fs.readFileSync('reports-catalogue.json','utf8'));
const sdmxTree = JSON.parse(fs.readFileSync('sdmx-tree.json','utf8'));
const manifest = JSON.parse(fs.readFileSync('manifest.json','utf8'));

// Build SDMX index by sub-sector label (fuzzy, stripped).
const sdmxBySubkey = {};
function subkey(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
for (const g of sdmxTree) {
    sdmxBySubkey[subkey(g.subSector)] = g.elements;
}

const getStatus = dsdCode => manifest.results[dsdCode]?.status || 'never-tried';
const isDownloaded = dsdCode => manifest.results[dsdCode]?.status === 'ok';

const lines = [];
const csvLines = [['section','category','subsection','reportId','reportName','frequency','from','to','sdmxMatch','dsdCode','downloadStatus']];

let totalReports = 0, matchedReports = 0, downloadedReports = 0, orphanReports = 0;
let totalSdmx = 0, matchedSdmx = 0;

lines.push(`# DBIE Reports coverage vs SDMX scrape\n`);
lines.push(`Authoritative DBIE Reports catalogue: **${reports.reduce((n,r)=>n+(r.groups?.reduce((m,g)=>m+g.reports.length,0)||0),0)} tables** across **${reports.length} subsections**.`);
lines.push(`SDMX scrape: **${Object.values(manifest.results).filter(v=>v.status==='ok').length} downloaded** of ${Object.keys(manifest.results).length} attempted.\n`);

for (const r of reports) {
    if (r.error) {
        lines.push(`## ${r.section} / ${r.category} / ${r.subsection}\n**ERROR:** ${r.error}\n`);
        continue;
    }
    const els = sdmxBySubkey[subkey(r.subsection)] || [];
    totalSdmx += els.length;
    const matchedDsds = new Set();

    const subReports = (r.groups || []).flatMap(g => g.reports);
    totalReports += subReports.length;

    const rows = [];
    let subDownloaded = 0, subMatched = 0;
    for (const rep of subReports) {
        const m = bestSdmxMatch(rep.reportName, els);
        let status = '';
        if (m) {
            matchedDsds.add(m.dsdCode);
            if (isDownloaded(m.dsdCode)) { status = 'OK'; subDownloaded++; downloadedReports++; }
            else status = getStatus(m.dsdCode);
            subMatched++; matchedReports++;
        } else {
            status = '—';
            orphanReports++;
        }
        rows.push({ report: rep, match: m, status });
        csvLines.push([
            r.section, r.category, r.subsection,
            rep.reportId ?? '',
            rep.reportName,
            rep.frequency || '',
            rep.from || '',
            rep.to || '',
            m ? m.label : '',
            m ? m.dsdCode : '',
            status,
        ]);
    }
    matchedSdmx += matchedDsds.size;

    lines.push(`## ${r.category} / ${r.subsection}`);
    lines.push(`- Reports: **${subReports.length}**; matched to SDMX: ${subMatched}; downloaded on disk: **${subDownloaded}**`);
    lines.push(`- SDMX elements in this sub-sector: ${els.length}; unmatched SDMX: ${els.length - matchedDsds.size}`);
    lines.push('');
    lines.push('| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |');
    lines.push('|---|---|---|---|---|---|---|---|');
    let idx = 0;
    for (const row of rows) {
        idx++;
        const mark = row.status === 'OK' ? '✓' : (row.status === '—' ? '✗' : '?');
        const name = row.report.reportName.replace(/\|/g,'\\|');
        const match = row.match ? row.match.label.replace(/\|/g,'\\|') : '—';
        const dsd = row.match ? row.match.dsdCode : '';
        lines.push(`| ${idx} | ${name} | ${row.report.frequency || ''} | ${row.report.from || ''} | ${row.report.to || ''} | ${match} | ${dsd} | ${mark} ${row.status} |`);
    }
    // List SDMX elements that did NOT match any report — potential extras we got but DBIE doesn't list
    const extras = els.filter(e => !matchedDsds.has(e.dsdCode));
    if (extras.length) {
        lines.push(`\n**SDMX elements in this sub-sector with no obvious DBIE report match (${extras.length}):**`);
        for (const e of extras) {
            const downloaded = isDownloaded(e.dsdCode);
            lines.push(`- ${downloaded ? '✓' : '✗'} \`${e.dsdCode}\` — ${e.label} *(${e.frequency})*`);
        }
    }
    lines.push('');
}

// Summary
lines.splice(4, 0,
    `## Headline`,
    '',
    `- **${downloadedReports}** of **${totalReports}** DBIE reports have matching SDMX data on disk (**${Math.round(downloadedReports*100/totalReports)}%**)`,
    `- **${matchedReports - downloadedReports}** matched an SDMX element but the element isn't downloaded (no-record / error / not-tried)`,
    `- **${orphanReports}** DBIE reports have no SDMX match in their sub-sector — either they're not SDMX-exposed or my fuzzy match missed them`,
    `- **${totalSdmx - matchedSdmx}** SDMX elements didn't match any DBIE report — either they're additional series or the match missed`,
    '',
);

fs.writeFileSync('coverage-report.md', lines.join('\n'));

// Write CSV too
const csv = csvLines.map(row => row.map(f => {
    const s = String(f ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
}).join(',')).join('\n');
fs.writeFileSync('coverage-report.csv', csv);

console.log(`\n=== Coverage headline ===`);
console.log(`${downloadedReports} / ${totalReports} DBIE reports have SDMX data downloaded (${Math.round(downloadedReports*100/totalReports)}%)`);
console.log(`${matchedReports - downloadedReports} matched but not downloaded`);
console.log(`${orphanReports} DBIE reports unmatched (likely not in SDMX)`);
console.log(`${totalSdmx - matchedSdmx} SDMX elements unmatched (likely extras)`);
console.log(`\nWrote coverage-report.md and coverage-report.csv`);

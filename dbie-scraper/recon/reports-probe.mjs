// Probe the Reports path (catalogue.json) to see whether any reports are reachable
// without SAP BOE authentication. For each subsection we:
//   1. Fetch its report list via dbie_getReportsDbie (HTTP only, confirmed public).
//   2. For the FIRST report in each subsection, fetch the report link via dbie_getReportLink.
//   3. HTTP-HEAD/GET that URL and check whether it redirects to UI5logon.jsp.
//
// Writes recon/output/reports-probe.json with the findings.

import fs from 'node:fs';
import path from 'node:path';

const GATEWAY = 'https://data.rbi.org.in/CIMS_Gateway_DBIE/GATEWAY/SERVICES';
const OUT = path.resolve('recon/output/reports-probe.json');
fs.mkdirSync(path.dirname(OUT), { recursive: true });

function decode(raw) {
    return raw
        .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
        .replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&');
}

let sessionToken = null;

async function post(service, body = {}) {
    const headers = {
        'content-type': 'application/json',
        'accept': 'application/json, text/plain, */*',
        'datatype': 'application/json',
        'channelkey': 'key2',
        'referer': 'https://data.rbi.org.in/DBIE/',
    };
    if (sessionToken) headers.authorization = sessionToken;
    const res = await fetch(`${GATEWAY}/${service}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ body }),
    });
    if (!res.ok) throw new Error(`${service}: HTTP ${res.status}`);
    const auth = res.headers.get('authorization');
    if (auth) sessionToken = auth;
    const env = JSON.parse(decode(await res.text()));
    if (env.header?.status !== 'success') throw new Error(`${service}: ${JSON.stringify(env.header)}`);
    return env.body;
}

async function getReports(menuPath) {
    // menuPath looks like "/dbie/reports/Statistics/External Sector/External Debt".
    // dbie_getReportsDbie wants {departments:[dept], menu, portal, function}.
    // The prior scraper's request shape is hard-coded based on the path. We mimic the SPA:
    // send menu as the relative path, portal "DBIE", function "reports", departments from the path.
    const [, , , section, category, subsection] = menuPath.split('/');
    const body = {
        departments: [section || 'Statistics'],
        menu: subsection || category || section,
        portal: 'DBIE',
        function: 'reports',
    };
    try {
        const r = await post('dbie_getReportsDbie', body);
        return r.reports || [];
    } catch (e) {
        return { error: e.message };
    }
}

async function getReportLink(reportId) {
    try {
        return await post('dbie_getReportLink', { reportId, lang: 'en' });
    } catch (e) {
        return { error: e.message };
    }
}

async function probeReportUrl(url) {
    try {
        const res = await fetch(url, { redirect: 'manual' });
        const locHeader = res.headers.get('location') || '';
        const body = await res.text().catch(() => '');
        const isLogon = /UI5logon|logon|Log On/i.test(locHeader + ' ' + body.slice(0, 2000));
        return {
            status: res.status,
            location: locHeader,
            isLogon,
            bodySnippet: body.slice(0, 200),
        };
    } catch (e) {
        return { error: e.message };
    }
}

async function main() {
    await post('security_generateSessionToken');
    const catalogue = JSON.parse(fs.readFileSync('catalogue.json', 'utf8'));

    const findings = [];
    for (const section of catalogue) {
        for (const category of section.categories) {
            for (const sub of category.subsections) {
                const result = {
                    section: section.section,
                    category: category.category,
                    subsection: sub.subsection,
                    reportPath: sub.reportPath,
                };
                const reports = await getReports(sub.reportPath);
                if (reports.error) {
                    result.reportsError = reports.error;
                    findings.push(result);
                    continue;
                }
                // Flatten — response is [{title, subs:[{reportName, reportId, ...}]}]
                const flat = Array.isArray(reports)
                    ? reports.flatMap(r => (r.subs || []).map(s => ({ ...s, group: r.title })))
                    : [];
                result.reportCount = flat.length;
                if (!flat.length) {
                    findings.push(result);
                    continue;
                }
                const first = flat[0];
                result.firstReport = { name: first.reportName, id: first.reportId };

                const linkResp = await getReportLink(first.reportId);
                result.linkResponse = linkResp;

                // linkResponse is shape {Report_Link:{...}} or similar — find any URL.
                const urlCandidate = (() => {
                    const seen = new Set();
                    const walk = v => {
                        if (v == null) return null;
                        if (typeof v === 'string' && /^https?:\/\//.test(v)) return v;
                        if (typeof v === 'object') {
                            for (const k of Object.keys(v)) {
                                if (seen.has(v[k])) continue;
                                seen.add(v[k]);
                                const got = walk(v[k]);
                                if (got) return got;
                            }
                        }
                        return null;
                    };
                    return walk(linkResp);
                })();
                if (urlCandidate) {
                    result.reportUrl = urlCandidate;
                    result.probe = await probeReportUrl(urlCandidate);
                }
                findings.push(result);
                console.log(`  ${section.section}/${category.category}/${sub.subsection}: ${flat.length} reports` +
                    (result.probe ? ` — ${result.probe.isLogon ? 'LOGON' : 'status=' + result.probe.status}` : ''));
            }
        }
    }
    fs.writeFileSync(OUT, JSON.stringify(findings, null, 2));

    // Summary
    const all = findings.length;
    const withReports = findings.filter(f => f.reportCount > 0).length;
    const logons = findings.filter(f => f.probe?.isLogon).length;
    const openOk = findings.filter(f => f.probe && !f.probe.isLogon && f.probe.status < 400).length;
    console.log(`\nSummary:`);
    console.log(`  subsections: ${all}, with reports: ${withReports}`);
    console.log(`  logon redirects: ${logons}, open responses: ${openOk}`);
    console.log(`Wrote ${OUT}`);
}

main().catch(err => { console.error(err); process.exit(1); });

// Fetches the full SDMX Data Query element tree from DBIE and writes sdmx-tree.json.
// No browser required — dbie_getSectorAction is public (guest session only).
//
// Output shape (written to sdmx-tree.json):
//   [
//     {
//       "sector": "Corporate Sector",
//       "subSector": "Finances of FDI Companies",
//       "elements": [
//         { "dsdCode": "BAL_SHT_FDI_COMP_RN", "elementId": "2314", "label": "Balance Sheet of FDI companies",
//           "frequency": "Annual - Financial Year", "startDate": "2013-03-31", "flowType": "Not Applicable" },
//         ...
//       ]
//     },
//     ...
//   ]
//
// Also writes sdmx-tree-raw.json with the untransformed API response for reference.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'data');

const GATEWAY = 'https://data.rbi.org.in/CIMS_Gateway_DBIE/GATEWAY/SERVICES';

// Responses are HTML-entity-encoded JSON envelopes.
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

// dbie_getSectorAction returns a nested tree: Sector → SubSector → Element (DSD_CODE).
// Walk the tree and collect every leaf whose TYPE is "ELEMENT".
function walkElements(node, path = []) {
    const out = [];
    if (!node) return out;

    if (node.element && node.element.TYPE === 'ELEMENT') {
        const el = node.element;
        out.push({
            dsdCode: el.DSD_CODE,
            elementId: el.ELEMENT_ID,
            label: el.ELEMENT_LABEL,
            frequency: el.ELEMENT_FREQUENCY_NAME,
            startDate: el.ELE_START_DATE,
            flowType: el.FLOW_TYPE_NAME,
            sectorName: el.SECTOR_NAME, // "Sector:SubSector"
            isAlphaNumeric: el.IS_ALPHANUMERIC === 'Y',
            path: [...path],
        });
    }
    if (node.children) {
        // The tree uses node.element.ELEMENT_LABEL for parent nodes too (when TYPE != ELEMENT).
        const label = node.element?.ELEMENT_LABEL;
        const nextPath = label && node.element?.TYPE !== 'ELEMENT' ? [...path, label] : path;
        for (const c of node.children) {
            out.push(...walkElements(c, nextPath));
        }
    }
    return out;
}

async function main() {
    console.log('Generating session…');
    await post('security_generateSessionToken');
    if (!sessionToken) throw new Error('Failed to acquire session token');

    console.log('Fetching dbie_getSectorAction…');
    const body = await post('dbie_getSectorAction', { body: {} });

    // Write the raw response for debugging.
    fs.writeFileSync(path.join(DATA, 'sdmx-tree-raw.json'), JSON.stringify(body, null, 2));

    const elements = walkElements(body.result);
    console.log(`Found ${elements.length} elements.`);

    // Group by sectorName ("Sector:SubSector").
    const grouped = new Map();
    for (const el of elements) {
        const key = el.sectorName || 'Unknown';
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(el);
    }

    const tree = [];
    for (const [sectorKey, els] of grouped) {
        const [sector, subSector] = sectorKey.split(':').map(s => s?.trim());
        tree.push({
            sector: sector || 'Unknown',
            subSector: subSector || '',
            elements: els.map(({ sectorName, path, ...rest }) => rest),
        });
    }

    // Sort for stability.
    tree.sort((a, b) => (a.sector + a.subSector).localeCompare(b.sector + b.subSector));

    fs.writeFileSync(path.join(DATA, 'sdmx-tree.json'), JSON.stringify(tree, null, 2));

    console.log('\nSummary by sector:');
    const bySector = new Map();
    for (const g of tree) {
        bySector.set(g.sector, (bySector.get(g.sector) || 0) + g.elements.length);
    }
    for (const [s, n] of [...bySector].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${s.padEnd(30)} ${n}`);
    }
    console.log(`\nTotal: ${elements.length} elements across ${tree.length} sub-sectors.`);
    console.log('Wrote sdmx-tree.json and sdmx-tree-raw.json.');
}

main().catch(err => { console.error(err); process.exit(1); });

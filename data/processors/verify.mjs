// Verify a processor's output against the captured live-API oracle.
// Usage: node verify.mjs <name> [mode]
//   mode = exact (default) | fresh
//
// exact: byte-semantic deep-equal (key-order-insensitive, tiny numeric tolerance).
//   For datasets whose source is frozen and the output must match the oracle.
//
// fresh: for datasets refreshed from live SDMX sources, which cannot be byte-equal
//   to the oracle. The oracle is used only as a SHAPE + HISTORY reference. Checks:
//     (1) top-level keys match the oracle;
//     (2) every row's key-set + value types match the oracle's rows
//         (a base column that was `number` may be `number | null` in appended rows —
//          allowed only for goldVolumeMetricTonnes);
//     (3) row count >= oracle count (history preserved, fresh rows appended);
//     (4) every oracle row is still present with equal values, matched by identity
//         key (weekEnded / month / dateString) — i.e. history is unchanged;
//     (5) recent variants are the first N of the full dataset (26/12/10).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];
const mode = process.argv[3] || 'exact';
if (!name) { console.error('usage: node verify.mjs <name> [exact|fresh]'); process.exit(2); }

const readJson = (dir, n) => JSON.parse(fs.readFileSync(path.join(__dirname, dir, n + '.json'), 'utf8'));
const got = readJson('out', name);
const want = readJson('oracles', name);

// Identity key + recent-variant config per dataset family.
const IDENTITY_KEY = {
  'forex-reserves': 'weekEnded',
  'forex-reserves-recent': 'weekEnded',
  'foreign-investment-inflows': 'month',
  'foreign-investment-inflows-recent': 'month',
  'exchange-rates': 'dateString',
  'exchange-rates-recent': 'dateString',
  // The Bulletin and Handbook tables refreshed from the report export in data/reports. A list of fields is one
  // composite key, for a table whose rows need more than a period to tell them apart.
  'commercial-paper': 'fortnightEnded',
  'combined-receipts-disbursements': 'item',
  'components-of-gross-value-added-at-basic-prices': 'year',
  'employment-in-public-and-organised-private-sectors': 'year',
  'forex-reserves-weekly': 'weekEnded',
  'institutional-sector-wise-gross-capital-formation-at-current-prices': 'year',
  'money-stock-measures': 'date',
  'payment-system-indicators': 'month',
  'rbi-liabilities-and-assets': 'week',
  'sector-wise-domestic-savings-at-current-prices': 'year',
  'select-economic-indicators': 'month',
  'sources-of-money-stock': 'date',
  'agricultural-production-foodgrains': 'year',
  'agricultural-production-major-commercial-crops': 'year',
  'area-under-cultivation-foodgrains': 'year',
  'area-under-cultivation-major-commercial-crops': 'year',
  'average-price-of-gold-and-silver-in-domestic-and-foreign-markets': 'year',
  'changes-in-financial-assets-liabilities-of-the-household-sector': 'year',
  'commercial-bank-survey': 'fortnight',
  'minimum-support-price-for-foodgrains-according-to-crop-year-fair-average': 'year',
  'minimum-support-price-for-non-foodgrains-according-to-crop-year-fair': 'year',
  'pattern-of-land-use-and-select-inputs-for-agricultural-production': 'year',
  'reer-and-neer': 'month',
  'union-government-accounts': 'month',
  'yield-per-hectare-foodgrains': 'year',
  'yield-per-hectare-major-commercial-crops': 'year',
  'treasury-bill-auctions': [ 'auction_date', 'tenor' ],
  'treasury-bills-ownership': 'week',
};

// A row's identity under its key, for matching oracle rows to output rows.
const identityOf = (row, key) =>
  Array.isArray(key) ? key.map((k) => JSON.stringify(row[k])).join(' | ') : row[key];
// Columns allowed to relax number -> (number | null) between base and appended rows.
const NULLABLE_FIELDS = new Set(['goldVolumeMetricTonnes']);
// full dataset name + row count for each -recent variant.
const RECENT_OF = {
  'forex-reserves-recent': { full: 'forex-reserves', n: 26 },
  'foreign-investment-inflows-recent': { full: 'foreign-investment-inflows', n: 12 },
  'exchange-rates-recent': { full: 'exchange-rates', n: 10 },
};

// ---------- exact mode (original behaviour) ----------
function verifyExact() {
  const diffs = [];
  const EPS = 1e-6;
  function cmp(a, b, p) {
    if (diffs.length > 40) return;
    if (typeof a === 'number' && typeof b === 'number') {
      if (Math.abs(a - b) > EPS + Math.abs(b) * 1e-9) diffs.push(`${p}: ${a} != ${b}`);
      return;
    }
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!Array.isArray(a) || !Array.isArray(b)) { diffs.push(`${p}: array/non-array mismatch`); return; }
      if (a.length !== b.length) diffs.push(`${p}: length ${a.length} != ${b.length}`);
      for (let i = 0; i < Math.min(a.length, b.length); i++) cmp(a[i], b[i], `${p}[${i}]`);
      return;
    }
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (!(k in a)) { diffs.push(`${p}.${k}: missing in output`); continue; }
        if (!(k in b)) { diffs.push(`${p}.${k}: extra in output`); continue; }
        cmp(a[k], b[k], `${p}.${k}`);
      }
      return;
    }
    if (a !== b) diffs.push(`${p}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
  }
  cmp(got, want, name);
  return diffs;
}

// ---------- fresh mode ----------
// A base value `bv` and output value `gv` are equal within a tiny numeric tolerance.
function valEq(gv, bv) {
  if (typeof bv === 'number' && typeof gv === 'number') {
    return Math.abs(gv - bv) <= 1e-6 + Math.abs(bv) * 1e-9;
  }
  return gv === bv;
}

// Deep structural equality (numbers within tolerance) — for nested top-level
// metadata like the exchange-rates `currencies` array.
function deepEq(a, b) {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((x, i) => deepEq(x, b[i]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => k in b && deepEq(a[k], b[k]));
  }
  return valEq(a, b);
}

// type name that treats null distinctly so nullability can be checked per field.
function typeOf(v) {
  return v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;
}

function verifyFresh() {
  const diffs = [];
  const push = (m) => { if (diffs.length <= 40) diffs.push(m); };

  // (1) top-level keys match oracle.
  const gk = Object.keys(got).sort().join(',');
  const wk = Object.keys(want).sort().join(',');
  if (gk !== wk) push(`top-level keys: [${gk}] != oracle [${wk}]`);

  // Non-data top-level fields (reportTitle, unit, currencies, ...) must still equal oracle.
  for (const k of Object.keys(want)) {
    if (k === 'data') continue;
    if (!deepEq(got[k], want[k])) push(`${k}: ${JSON.stringify(got[k])} != oracle ${JSON.stringify(want[k])}`);
  }

  const gData = got.data || [];
  const wData = want.data || [];
  if (!Array.isArray(gData) || !Array.isArray(wData)) {
    push('data is not an array');
    return diffs;
  }

  // A -recent variant is a fixed-size window over the (growing) full dataset, so
  // its rows shift forward as fresh data lands — checks (3) row-count-grows and
  // (4) oracle-history-present apply to the FULL dataset, not the window. The
  // window is instead validated by check (5) against the current full dataset.
  const isRecent = name in RECENT_OF;

  // (3) row count >= oracle count (full datasets only).
  if (!isRecent && gData.length < wData.length) {
    push(`row count ${gData.length} < oracle ${wData.length} (history shrank)`);
  }

  // (2) per-row key-set + value types match the oracle. A row the oracle also has is checked against that very
  // row, found by identity — a period's fields must keep the types they had. A row the oracle does not have is
  // new, so it is checked against the oracle's first row, where a field may also be null: a series often starts
  // reporting a column later than it starts, and the newest period can be published before every column is in.
  const idKey = IDENTITY_KEY[name];
  const idName = Array.isArray(idKey) ? idKey.join('+') : idKey;
  const oracleById = new Map();
  if (idKey) for (const row of wData) oracleById.set(identityOf(row, idKey), row);

  const oracleFields = wData.length ? Object.keys(wData[0]).sort() : [];
  const typesOf = (row) => Object.fromEntries(oracleFields.map((f) => [ f, typeOf(row[f]) ]));
  const firstTypes = wData.length ? typesOf(wData[0]) : {};

  for (let i = 0; i < gData.length; i++) {
    const row = gData[i];
    const fields = Object.keys(row).sort();
    if (fields.join(',') !== oracleFields.join(',')) {
      push(`data[${i}] key-set [${fields}] != oracle [${oracleFields}]`);
      if (diffs.length > 40) break;
      continue;
    }
    const twin = idKey ? oracleById.get(identityOf(row, idKey)) : null;
    const want = twin ? typesOf(twin) : firstTypes;
    const where = twin ? `row ${idName}=${JSON.stringify(identityOf(row, idKey))}` : `data[${i}]`;
    for (const f of oracleFields) {
      const t = typeOf(row[f]);
      if (t === want[f]) continue;
      const numNull = (t === 'null' && want[f] === 'number') || (t === 'number' && want[f] === 'null');
      // A row the oracle has must keep its types, unless the field is whitelisted; a new row may also be null.
      if (numNull && (NULLABLE_FIELDS.has(f) || !twin)) continue;
      push(`${where}.${f}: type ${t} != oracle ${want[f]}`);
    }
    if (diffs.length > 40) break;
  }

  // (4) every oracle row still present with equal values, matched by identity key
  //     (full datasets only — see the -recent note above).
  // A payload that carries no `data` array — its series sit under `series`, `sections`, `rows` or a period per
  // column — has no rows to match by key, and checks (1) and (2) above have already compared all of it against
  // the oracle exactly. Only a payload with rows needs a key.
  if (!idKey && wData.length > 0) {
    push(`no identity key configured for '${name}'`);
  } else if (idKey && !isRecent) {
    const byId = new Map();
    for (const row of gData) byId.set(identityOf(row, idKey), row);
    for (const wrow of wData) {
      const id = identityOf(wrow, idKey);
      const grow = byId.get(id);
      if (!grow) { push(`oracle row ${idName}=${JSON.stringify(id)} missing from output`); continue; }
      for (const f of Object.keys(wrow)) {
        if (!deepEq(grow[f], wrow[f])) {
          push(`row ${idName}=${JSON.stringify(id)} .${f}: ${JSON.stringify(grow[f])} != oracle ${JSON.stringify(wrow[f])}`);
        }
      }
    }
  }

  // (5) recent variant consistency: first N of the full dataset.
  const rec = RECENT_OF[name];
  if (rec) {
    let full;
    try { full = readJson('out', rec.full); } catch { full = null; }
    if (!full) push(`cannot read full dataset '${rec.full}' to validate -recent`);
    else {
      const expected = full.data.slice(0, Math.min(rec.n, full.data.length));
      if (gData.length !== expected.length) {
        push(`-recent length ${gData.length} != first ${expected.length} of ${rec.full}`);
      } else {
        for (let i = 0; i < expected.length; i++) {
          const idKey2 = IDENTITY_KEY[name];
          if (idKey2 && identityOf(gData[i], idKey2) !== identityOf(expected[i], idKey2)) {
            push(`-recent[${i}] ${Array.isArray(idKey2) ? idKey2.join('+') : idKey2}=${JSON.stringify(identityOf(gData[i], idKey2))} != full[${i}]=${JSON.stringify(identityOf(expected[i], idKey2))}`);
          }
        }
      }
    }
  }

  return diffs;
}

const diffs = mode === 'fresh' ? verifyFresh() : verifyExact();

if (diffs.length === 0) {
  const how = mode === 'fresh'
    ? 'shape/history match oracle (fresh)'
    : 'output matches oracle exactly';
  console.log(`PASS ${name}: ${how}`);
  process.exit(0);
}
console.log(`FAIL ${name}: ${diffs.length}+ diffs (first 40):`);
diffs.slice(0, 40).forEach((d) => console.log('  ' + d));
process.exit(1);

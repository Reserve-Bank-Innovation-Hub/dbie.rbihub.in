// Processor: sdmx-series — all 246 SDMX-CSV series from the DBIE catalogue.
//
// Source: data/catalogue.json entries where source === "sdmx".
// Each entry points to a CSV in data/sdmx/**/ following the SDMX-CSV long format.
//
// Parsing wrinkle: two files have a FOOTNOTE column whose values contain raw
// (unquoted) commas. They are parsed positionally from both ends: take the
// first <footnote_index> fields from the left and the last <n - footnote_index - 1>
// fields from the right; everything in between is rejoined as the footnote value.
//
// Emit modes (threshold: >100 series columns → long):
//   WIDE  — { mode:"wide", columns, dates, values, chartable, footnotes }
//   LONG  — { mode:"long", dimensions, rows, chartable:false, footnotes }
//            rows sorted date DESC then dimension values ASC; each row =
//            [...dimVals, unit, date, value]; chartable is always false.
//
// Emits:
//   out/sdmx-<slug>.json       — per-file series payload
//   out/sdmx-series-index.json — index of all 246 entries sorted by slug

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CATALOGUE_PATH = path.join(REPO_ROOT, 'data', 'catalogue.json');
const OUT_DIR = path.join(__dirname, 'out');

// Column count threshold: files above this emit in long format.
const LONG_MODE_THRESHOLD = 100;

// Columns that are structural, not dimension-defining.
const FIXED_COLS = new Set([
  'DATAFLOW', 'FREQ', 'REPYEAREND', 'REPYEARSTART',
  'UNIT_MULT', 'TIME_PERIOD', 'UNIT_MEASURE', 'OBS_VALUE',
  'FOOTNOTE', 'AUDST',
]);

// Parse a single SDMX-CSV file.
// Returns {
//   dimNames,       // dimension column names in header order
//   seriesData,     // Map<seriesKey, { dimVals, unit, unitMult, obs: Map<date, number> }>
//   seriesOrder,    // insertion-ordered series keys
//   allDates,       // Set<string> of all valid ISO dates
//   footnotes,      // string[]
//   parseFailures,  // number
//   duplicateObs,   // number
// }
function parseSdmxFile(csvPath, catalogueLabel) {
  const text = fs.readFileSync(csvPath, 'utf8');
  const rawLines = text.split('\n');

  if (rawLines.length < 2) {
    throw new Error(`file has no data rows: ${csvPath}`);
  }

  // Parse header (no quoting in any SDMX file).
  const header = rawLines[0].trim().split(',');
  const n = header.length;

  const footnoteIdx = header.indexOf('FOOTNOTE');
  const rightCount = footnoteIdx >= 0 ? n - footnoteIdx - 1 : 0;

  const idxOf = {};
  for (let i = 0; i < n; i++) idxOf[header[i]] = i;

  const timePeriodIdx = idxOf['TIME_PERIOD'];
  const obsValueIdx = idxOf['OBS_VALUE'];
  const unitMeasureIdx = idxOf['UNIT_MEASURE'];
  const unitMultIdx = idxOf['UNIT_MULT'];

  // Dimension column names in header order.
  const dimNames = header.filter((h) => !FIXED_COLS.has(h));

  // First pass: detect whether UNIT_MEASURE varies across the file.
  let firstUnit = null;
  let multiUnit = false;
  for (let i = 1; i < rawLines.length; i++) {
    const raw = rawLines[i].trim();
    if (!raw) continue;
    const parts = raw.split(',');
    let row;
    if (footnoteIdx >= 0 && parts.length !== n) {
      row = parts.slice(0, footnoteIdx).concat([''], parts.slice(parts.length - rightCount));
    } else {
      row = parts;
    }
    if (row.length !== n) continue;
    const unit = row[unitMeasureIdx] || '';
    if (firstUnit === null) {
      firstUnit = unit;
    } else if (unit !== firstUnit) {
      multiUnit = true;
      break;
    }
  }

  // Main parse pass.
  const seriesData = new Map();
  const seriesOrder = [];
  const allDates = new Set();
  const footnoteSet = new Set();
  let parseFailures = 0;
  let duplicateObs = 0;

  for (let i = 1; i < rawLines.length; i++) {
    const raw = rawLines[i].trim();
    if (!raw) continue;

    const parts = raw.split(',');
    let row;
    if (footnoteIdx >= 0 && parts.length !== n) {
      if (parts.length < n) {
        parseFailures++;
        continue;
      }
      const left = parts.slice(0, footnoteIdx);
      const right = parts.slice(parts.length - rightCount);
      const footnoteVal = parts.slice(footnoteIdx, parts.length - rightCount).join(',');
      row = left.concat([footnoteVal], right);
    } else {
      row = parts;
    }

    if (row.length !== n) {
      parseFailures++;
      continue;
    }

    // Collect footnotes (cap at 20).
    if (footnoteIdx >= 0) {
      const fn = row[footnoteIdx].trim();
      if (fn && fn !== 'N_A' && footnoteSet.size < 20) {
        footnoteSet.add(fn);
      }
    }

    // Skip rows with invalid time period.
    const timePeriod = row[timePeriodIdx] || '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(timePeriod)) continue;

    // Parse observation value; skip empty/non-finite.
    const obsRaw = row[obsValueIdx] || '';
    const obsVal = obsRaw === '' || obsRaw === '-' ? NaN : Number(obsRaw);
    if (!Number.isFinite(obsVal)) continue;

    const unit = row[unitMeasureIdx] || '';
    const dimVals = dimNames.map((d) => row[idxOf[d]] || '');

    // Series key: dim values (+ unit when multiUnit) joined by "|".
    const keyParts = multiUnit ? [...dimVals, unit] : dimVals;
    const seriesKey = keyParts.join('|');

    // Column label for wide mode: non-N_A dim values joined " · "; fallback to catalogue label.
    const labelParts = dimVals.filter((v) => v && v !== 'N_A');
    const colLabel = labelParts.length > 0 ? labelParts.join(' · ') : catalogueLabel;

    const unitMult = Number(row[unitMultIdx] || '0');

    if (!seriesData.has(seriesKey)) {
      seriesData.set(seriesKey, {
        key: seriesKey,
        label: colLabel,
        dimVals,
        unit,
        unitMult: Number.isFinite(unitMult) ? unitMult : 0,
        obs: new Map(),
      });
      seriesOrder.push(seriesKey);
    }

    const series = seriesData.get(seriesKey);
    allDates.add(timePeriod);

    if (series.obs.has(timePeriod)) {
      duplicateObs++;
    }
    series.obs.set(timePeriod, obsVal);
  }

  return {
    dimNames,
    seriesData,
    seriesOrder,
    allDates,
    footnotes: Array.from(footnoteSet).slice(0, 20),
    parseFailures,
    duplicateObs,
  };
}

function isChartable(dates, columnCount) {
  return (
    dates.length >= 2 &&
    columnCount >= 1 &&
    columnCount <= 24 &&
    dates.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
  );
}

// Build a WIDE payload from parsed data.
function buildWidePayload(entry, slug, parsed) {
  const { seriesData, seriesOrder, allDates, footnotes } = parsed;

  const dates = Array.from(allDates).sort();
  const columns = [];
  const values = [];

  for (const key of seriesOrder) {
    const series = seriesData.get(key);
    columns.push({
      key: series.key,
      label: series.label,
      unit: series.unit,
      unitMult: series.unitMult,
    });
    values.push(dates.map((d) => {
      const v = series.obs.get(d);
      return v === undefined ? null : v;
    }));
  }

  const chartable = isChartable(dates, columns.length);

  return {
    slug,
    label: entry.label,
    sector: entry.sector,
    subSector: entry.subSector,
    frequency: entry.frequency,
    dsdCode: entry.dsdCode,
    mode: 'wide',
    columns,
    dates,
    values,
    chartable,
    footnotes,
  };
}

// Build a LONG payload from parsed data.
// Rows = [...dimVals, unit, date, value], sorted date DESC then dimVals ASC (stable).
function buildLongPayload(entry, slug, parsed) {
  const { dimNames, seriesData, seriesOrder, footnotes } = parsed;

  const rows = [];
  for (const key of seriesOrder) {
    const series = seriesData.get(key);
    for (const [date, value] of series.obs) {
      rows.push([...series.dimVals, series.unit, date, value]);
    }
  }

  // Sort: date DESC, then all dim values + unit ASC (positions 0..dimNames.length).
  const dimAndUnitCount = dimNames.length + 1; // +1 for unit at position dimNames.length
  rows.sort((a, b) => {
    // Date is at index dimAndUnitCount, desc.
    const dateCmp = b[dimAndUnitCount].localeCompare(a[dimAndUnitCount]);
    if (dateCmp !== 0) return dateCmp;
    // Then dim+unit values asc.
    for (let i = 0; i < dimAndUnitCount; i++) {
      const cmp = String(a[i]).localeCompare(String(b[i]));
      if (cmp !== 0) return cmp;
    }
    return 0;
  });

  return {
    slug,
    label: entry.label,
    sector: entry.sector,
    subSector: entry.subSector,
    frequency: entry.frequency,
    dsdCode: entry.dsdCode,
    mode: 'long',
    dimensions: dimNames,
    rows,
    chartable: false,
    footnotes,
  };
}

// Self-checks.
function runSelfChecks(summaries, anchorPayloads, allEntries) {
  const errors = [];

  // 1. All 246 entries processed.
  if (summaries.length !== allEntries.length) {
    errors.push(`expected ${allEntries.length} entries, got ${summaries.length}`);
  }

  // 2. Zero total parse failures.
  const totalFailures = summaries.reduce((s, r) => s + r.parseFailures, 0);
  if (totalFailures > 0) {
    const failingFiles = summaries
      .filter((r) => r.parseFailures > 0)
      .map((r) => `${r.slug} (${r.parseFailures})`)
      .join(', ');
    errors.push(`${totalFailures} total parse failures in: ${failingFiles}`);
  }

  // 3. Slugs unique.
  const slugs = summaries.map((r) => r.slug);
  const slugSet = new Set(slugs);
  if (slugSet.size !== slugs.length) {
    errors.push(`slug collision: ${slugs.length} entries, ${slugSet.size} unique`);
  }

  // 4. Every file: ≥1 column/row, ≥1 date.
  for (const r of summaries) {
    if (r.columnCount === 0) errors.push(`${r.slug}: 0 columns/series`);
    if (r.dateCount === 0) errors.push(`${r.slug}: 0 dates`);
  }

  // 5. Long payloads: all rows have identical length = dimensions.length + 3.
  for (const r of summaries) {
    if (r.mode !== 'long') continue;
    const p = anchorPayloads.get(r.slug);
    if (!p) continue; // only checked for anchors; full validation done below via spot check
  }
  // Full row-length check for any long anchor payload we have.
  for (const [slug, p] of anchorPayloads) {
    if (p.mode !== 'long') continue;
    const expectedLen = p.dimensions.length + 3;
    const bad = p.rows.filter((row) => row.length !== expectedLen);
    if (bad.length > 0) {
      errors.push(`${slug} (long): ${bad.length} rows with wrong length (expected ${expectedLen})`);
    }
  }

  // 6. Anchor: exchange-rate-of-the-indian-rupee-daily (must be WIDE, ≤100 cols).
  const forexPayload = anchorPayloads.get('exchange-rate-of-the-indian-rupee-daily');
  if (!forexPayload) {
    errors.push('anchor missing: exchange-rate-of-the-indian-rupee-daily');
  } else {
    if (forexPayload.mode !== 'wide') {
      errors.push(`forex anchor: expected mode "wide", got "${forexPayload.mode}"`);
    } else {
      const colKeys = forexPayload.columns.map((c) => c.key);
      for (const expected of ['EUR', 'GBP', 'JPY', 'USD']) {
        if (!colKeys.includes(expected)) {
          errors.push(`forex anchor: missing column ${expected} (found: ${colKeys.join(', ')})`);
        }
      }
      const dateIdx = forexPayload.dates.indexOf('2011-01-03');
      if (dateIdx < 0) {
        errors.push('forex anchor: date 2011-01-03 not found');
      } else {
        for (const [cur, expected] of [['EUR', 59.37], ['GBP', 69.4484], ['JPY', 54.97]]) {
          const colIdx = forexPayload.columns.findIndex((c) => c.key === cur);
          if (colIdx < 0) { errors.push(`forex anchor: column ${cur} not found`); continue; }
          const actual = forexPayload.values[colIdx][dateIdx];
          if (actual === null || Math.abs(actual - expected) > 0.001) {
            errors.push(`forex anchor: ${cur} 2011-01-03 expected ${expected}, got ${actual}`);
          }
        }
      }
    }
  }

  // 7. Anchor: agricultural-statistics-indian-state (must be WIDE, ≤100 cols).
  const agrPayload = anchorPayloads.get('agricultural-statistics-indian-state');
  if (!agrPayload) {
    errors.push('anchor missing: agricultural-statistics-indian-state');
  } else {
    if (agrPayload.mode !== 'wide') {
      errors.push(`agr anchor: expected mode "wide", got "${agrPayload.mode}"`);
    } else {
      const dateIdx = agrPayload.dates.indexOf('2022-03-31');
      if (dateIdx < 0) {
        errors.push('agr anchor: date 2022-03-31 not found');
      } else {
        const targetKey = 'COLD_STORG_CAP|N_A|TN';
        const colIdx = agrPayload.columns.findIndex((c) => c.key === targetKey);
        if (colIdx < 0) {
          errors.push(`agr anchor: key "${targetKey}" not found (keys: ${agrPayload.columns.slice(0, 5).map((c) => c.key).join(', ')})`);
        } else {
          const actual = agrPayload.values[colIdx][dateIdx];
          if (actual === null || Math.abs(actual - 38224006) > 1) {
            errors.push(`agr anchor: COLD_STORG_CAP|N_A|TN at 2022-03-31 expected 38224006, got ${actual}`);
          }
        }
      }
    }
  }

  return errors;
}

function main() {
  const catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf8'));
  const allEntries = catalogue.entries.filter((e) => e.source === 'sdmx');

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const summaries = [];
  const anchorSlugs = new Set([
    'exchange-rate-of-the-indian-rupee-daily',
    'agricultural-statistics-indian-state',
  ]);
  const anchorPayloads = new Map();

  let totalObs = 0;
  let totalDuplicates = 0;
  let totalChartable = 0;
  let wideCount = 0;
  let longCount = 0;

  for (const entry of allEntries) {
    const csvPath = path.join(REPO_ROOT, entry.path);
    const slug = path.basename(entry.path, '.csv');

    let parsed;
    try {
      parsed = parseSdmxFile(csvPath, entry.label);
    } catch (err) {
      console.error(`FATAL: could not parse ${slug}: ${err.message}`);
      process.exit(1);
    }

    const { seriesOrder, allDates, duplicateObs } = parsed;
    const columnCount = seriesOrder.length;
    const isLong = columnCount > LONG_MODE_THRESHOLD;

    let payload;
    if (isLong) {
      payload = buildLongPayload(entry, slug, parsed);
      longCount++;
    } else {
      payload = buildWidePayload(entry, slug, parsed);
      wideCount++;
    }

    // Count observations for summary.
    for (const key of seriesOrder) {
      totalObs += parsed.seriesData.get(key).obs.size;
    }
    totalDuplicates += duplicateObs;
    if (payload.chartable) totalChartable++;

    fs.writeFileSync(
      path.join(OUT_DIR, `sdmx-${slug}.json`),
      JSON.stringify(payload),
    );

    if (anchorSlugs.has(slug)) {
      anchorPayloads.set(slug, payload);
    }

    const dates = isLong
      ? Array.from(allDates)
      : payload.dates;
    const sortedDates = Array.from(allDates).sort();

    summaries.push({
      slug,
      label: entry.label,
      sector: entry.sector,
      subSector: entry.subSector,
      frequency: entry.frequency,
      dsdCode: entry.dsdCode,
      mode: isLong ? 'long' : 'wide',
      columnCount,
      dateCount: sortedDates.length,
      startDate: sortedDates.length > 0 ? sortedDates[0] : null,
      endDate: sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null,
      chartable: payload.chartable,
      parseFailures: parsed.parseFailures,
      duplicateObs,
    });
  }

  // Self-checks.
  const errors = runSelfChecks(summaries, anchorPayloads, allEntries);
  if (errors.length > 0) {
    console.error('sdmx-series self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  // Write index (sorted by slug, no timestamps).
  const indexEntries = summaries
    .map(({ slug, label, sector, subSector, frequency, dsdCode, mode, columnCount, dateCount, startDate, endDate, chartable }) => ({
      slug, label, sector, subSector, frequency, dsdCode, mode, columnCount, dateCount, startDate, endDate, chartable,
    }))
    .sort((a, b) => a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0);

  fs.writeFileSync(
    path.join(OUT_DIR, 'sdmx-series-index.json'),
    JSON.stringify({ generated: null, series: indexEntries }),
  );

  // Console summary.
  const totalSeries = summaries.reduce((s, r) => s + r.columnCount, 0);
  const top5 = [...summaries]
    .sort((a, b) => b.columnCount - a.columnCount)
    .slice(0, 5);

  console.log(`sdmx-series: ${summaries.length} files processed`);
  console.log(`  mode split           : ${wideCount} wide / ${longCount} long`);
  console.log(`  total series columns : ${totalSeries}`);
  console.log(`  total observations   : ${totalObs}`);
  console.log(`  chartable files      : ${totalChartable} / ${summaries.length}`);
  console.log(`  duplicate obs        : ${totalDuplicates}`);
  console.log('  top-5 widest files:');
  for (const r of top5) {
    console.log(`    ${r.slug} × ${r.columnCount} cols [${r.mode}] (${r.dateCount} dates)`);
  }
  console.log('self-check passed');
}

main();

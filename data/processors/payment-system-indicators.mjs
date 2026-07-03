// Processor: payment-system-indicators — RBI Bulletin Table 45.
//
// Source xlsx has one sheet ("New Format"), 86 rows, 141 columns. Layout:
//   row 0  blank
//   row 1  "Payment System Indicators" in col 1
//   rows 2-3  section-level header labels (Month/Year, A. Settlement Systems, etc.)
//   row 4  sub-section groupings (Financial Market Infrastructures, etc.)
//   row 5  (0-indexed) instrument names, present only at the starting column of each
//           two-column (Volume / Value) pair — e.g. col 2 = "1 CCIL Operated Systems…",
//           col 4 = "1.1 Govt. Securities Clearing…", col 36 = "2.7 UPI @", etc.
//   row 6  (0-indexed) measure labels: alternating "Volume (Lakh)" /
//           "Value( Rupees Crores )" for every data column, starting at col 2.
//   col 1  = month label "Jan-2026" (regex /^[A-Z][a-z]{2}-\d{4}$/); newest-first
//   cols 2..140  = data columns (70 instrument × 2 measures); final column (col 140)
//                  is a lone "Volume (Lakh)" with no matching Value column
//
// Strategy: scan row 5 (instrument names) forward-filling the last seen non-empty,
// non-whitespace label; pair each instrument with the measure from row 6. This yields
// `columns: [{ group, measure }]` for every data column index ≥ 2. Only columns where
// BOTH the forward-filled group and the measure are non-empty are included. Data rows
// emit `values: (number | null)[]` aligned to `columns`; "-" / ".." / blank → null.
//
// Emits:
//   out/payment-system-indicators.json
//     { reportTitle, notes, columns, data }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC  = path.join(
    __dirname,
    '../publications/monthly-rbi-bulletin/payments-and-settlements-systems/table-45-payment-system-indicators.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
    const v = row[i];
    return v == null ? '' : String(v);
}

// Strip commas and parse; null for blank / "-" / ".." / non-finite.
function parseNum(s) {
    s = String(s == null ? '' : s).trim().replace(/,/g, '');
    if (s === '' || s === '-' || s === '..' || s === 'N/A') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

// Normalise the raw measure label from row 6.
function normaliseMeasure(raw) {
    const s = raw.trim();
    if (/^Volume\s*\(/i.test(s)) return 'Volume (lakh)';
    if (/^Value\s*\(/i.test(s)) return 'Value (₹ crore)';
    return s;
}

function isMonthLabel(s) {
    return /^[A-Z][a-z]{2}-\d{4}$/.test(s.trim());
}

function parse(buf) {
    const wb = XLSX.read(buf, { type: 'buffer' });
    if (wb.SheetNames.length === 0) throw new Error('no sheets found');

    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, {
        header    : 1,
        raw       : false,
        defval    : null,
        blankrows : true,
    });

    // ── Header / title ────────────────────────────────────────────────────────
    // Row index 1 holds "Payment System Indicators" in col 1.
    const reportTitle =
        cellStr(rows[1] || [], 1).trim() || 'Payment System Indicators';

    // ── Column definitions ────────────────────────────────────────────────────
    // Row index 5 = instrument names (forward-filled across merged cells).
    // Row index 6 = alternating Volume / Value measures per column.
    const nameRow    = rows[5] || [];
    const measureRow = rows[6] || [];

    const maxCol = Math.max(nameRow.length, measureRow.length);
    const columns = [];  // [{ group, measure }]

    let lastGroup = '';
    for (let ci = 2; ci < maxCol; ci++) {
        const rawName    = cellStr(nameRow, ci).trim();
        const rawMeasure = cellStr(measureRow, ci).trim();

        // Forward-fill the group label when a cell is blank or whitespace-only.
        if (rawName && rawName !== '') lastGroup = rawName;

        // Skip columns where we have neither a group label nor a measure.
        if (!lastGroup && !rawMeasure) continue;

        columns.push({
            group   : lastGroup,
            measure : normaliseMeasure(rawMeasure) || rawMeasure,
        });
    }

    // ── Data rows ─────────────────────────────────────────────────────────────
    // Rows with col[1] matching "Jan-2026" format; newest-first.
    const data  = [];
    const notes = [];

    for (let ri = 7; ri < rows.length; ri++) {
        const row  = rows[ri] || [];
        const cell = cellStr(row, 1).trim();

        if (isMonthLabel(cell)) {
            // Data row — extract values aligned to columns (data starts at col 2).
            const values = columns.map((_col, idx) => parseNum(row[idx + 2]));
            data.push({ month: cell, values });
            continue;
        }

        // Non-month, non-empty cells after the data block are notes.
        if (cell && cell.trim().length > 4) {
            notes.push(cell.trim());
        }
    }

    if (data.length === 0) throw new Error('no data rows found');

    return { reportTitle, notes, columns, data };
}

// ── Self-check ────────────────────────────────────────────────────────────────
function selfCheck(out) {
    const { columns, data } = out;
    const errors = [];

    // Minimum row and column counts.
    if (data.length < 70) {
        errors.push(`expected ≥70 monthly rows, got ${data.length}`);
    }
    if (columns.length < 130) {
        errors.push(`expected ≥130 columns, got ${columns.length}`);
    }

    // Every data row must have values.length === columns.length.
    for (const row of data) {
        if (row.values.length !== columns.length) {
            errors.push(
                `${row.month}: values.length=${row.values.length} ≠ columns.length=${columns.length}`,
            );
            break;
        }
    }

    // Months must be unique.
    const months = data.map((r) => r.month);
    if (new Set(months).size !== months.length) {
        errors.push('months not unique');
    }

    // Anchor check — Jan-2026.
    const jan2026 = data.find((r) => r.month === 'Jan-2026');
    if (!jan2026) {
        errors.push('missing Jan-2026 row');
    } else {
        // values[0] = CCIL volume (col 2) = 4.35
        if (Math.abs((jan2026.values[0] ?? NaN) - 4.35) > 0.01) {
            errors.push(`Jan-2026 values[0] (CCIL vol) expected ≈4.35, got ${jan2026.values[0]}`);
        }
        // values[1] = CCIL value (col 3) = 32155354
        if (Math.abs((jan2026.values[1] ?? NaN) - 32155354) > 1) {
            errors.push(`Jan-2026 values[1] (CCIL val) expected 32155354, got ${jan2026.values[1]}`);
        }
        // UPI volume at col 36 → columns index = 36 - 2 = 34
        const upiVol = jan2026.values[34];
        if (upiVol == null || Math.abs(upiVol - 217034.45) > 1) {
            errors.push(`Jan-2026 UPI volume (values[34]) expected ≈217034.45, got ${upiVol}`);
        }
    }

    // Anchor check — Dec-2025.
    const dec2025 = data.find((r) => r.month === 'Dec-2025');
    if (!dec2025) {
        errors.push('missing Dec-2025 row');
    } else {
        if (Math.abs((dec2025.values[0] ?? NaN) - 5.07) > 0.01) {
            errors.push(`Dec-2025 values[0] (CCIL vol) expected ≈5.07, got ${dec2025.values[0]}`);
        }
        if (Math.abs((dec2025.values[1] ?? NaN) - 34813891) > 1) {
            errors.push(`Dec-2025 values[1] (CCIL val) expected 34813891, got ${dec2025.values[1]}`);
        }
    }

    // Newest row should be the first row.
    if (data.length > 0 && data[0].month !== 'Jan-2026') {
        errors.push(`expected newest-first order; first row is ${data[0].month}, not Jan-2026`);
    }

    return errors;
}

function main() {
    const out    = parse(fs.readFileSync(XLSX_SRC));
    const errors = selfCheck(out);

    if (errors.length > 0) {
        console.error('payment-system-indicators self-check FAILED:');
        errors.forEach((e) => console.error('  ' + e));
        process.exit(1);
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(
        path.join(OUT_DIR, 'payment-system-indicators.json'),
        JSON.stringify(out),
    );

    const newest = out.data[0].month;
    const oldest = out.data[out.data.length - 1].month;
    console.log(
        `wrote ${out.data.length} monthly rows (${newest} → ${oldest}); ` +
        `${out.columns.length} columns; ` +
        `${out.notes.length} note(s); self-check passed`,
    );
}

main();

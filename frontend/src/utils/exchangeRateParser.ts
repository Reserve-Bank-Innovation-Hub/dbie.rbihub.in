export interface ExchangeRateData {
    date: Date;
    dateString: string;
    usDollar: number;
    poundSterling: number;
    euro: number;
    japaneseYen: number;
}

export interface ParsedExchangeRates {
    data: ExchangeRateData[];
    currencies: {
        name: string;
        key: keyof Omit<ExchangeRateData, 'date' | 'dateString'>;
        displayName: string;
    }[];
}

/**
 * Parses the tab-separated exchange rate data file
 * @param rawData - Raw string content from the .txt file
 * @returns Parsed exchange rate data
 */
export function parseExchangeRateData(rawData: string): ParsedExchangeRates {
    const lines = rawData.split('\n');
    const data: ExchangeRateData[] = [];

    // Skip the first 5 lines (headers)
    for (let i = 6; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split('\t');
        if (columns.length < 5) continue;

        try {
            // Parse date (format: DD-MMM-YYYY)
            const dateStr = columns[0];
            const [day, month, year] = dateStr.split('-');
            const monthMap: Record<string, number> = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };

            const date = new Date(parseInt(year), monthMap[month], parseInt(day));

            // Parse numeric values and validate
            const usDollar = parseFloat(columns[1]);
            const poundSterling = parseFloat(columns[2]);
            const euro = parseFloat(columns[3]);
            const japaneseYen = parseFloat(columns[4]);

            // Only add if all values are valid numbers
            if (!isNaN(usDollar) && !isNaN(poundSterling) && !isNaN(euro) && !isNaN(japaneseYen)) {
                data.push({
                    date,
                    dateString: dateStr,
                    usDollar,
                    poundSterling,
                    euro,
                    japaneseYen,
                });
            }
        } catch (error) {
            console.warn(`Failed to parse line ${i}: ${line}`, error);
        }
    }

    // Sort by date (oldest first)
    data.sort((a, b) => a.date.getTime() - b.date.getTime());

    const currencies = [
        { name: 'usDollar', key: 'usDollar' as const, displayName: 'US Dollar' },
        { name: 'poundSterling', key: 'poundSterling' as const, displayName: 'Pound Sterling' },
        { name: 'euro', key: 'euro' as const, displayName: 'Euro' },
        { name: 'japaneseYen', key: 'japaneseYen' as const, displayName: 'Japanese Yen' },
    ];

    return { data, currencies };
}

/**
 * Calculate percentage change from a baseline date
 */
export function calculatePercentageChange(
    data: ExchangeRateData[],
    baselineIndex: number = 0
): ExchangeRateData[] {
    if (data.length === 0 || baselineIndex >= data.length) return [];

    const baseline = data[baselineIndex];

    return data.map(row => ({
        date: row.date,
        dateString: row.dateString,
        usDollar: ((row.usDollar - baseline.usDollar) / baseline.usDollar) * 100,
        poundSterling: ((row.poundSterling - baseline.poundSterling) / baseline.poundSterling) * 100,
        euro: ((row.euro - baseline.euro) / baseline.euro) * 100,
        japaneseYen: ((row.japaneseYen - baseline.japaneseYen) / baseline.japaneseYen) * 100,
    }));
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(
    values: number[],
    windowSize: number
): (number | null)[] {
    const result: (number | null)[] = [];

    for (let i = 0; i < values.length; i++) {
        if (i < windowSize - 1) {
            result.push(null);
        } else {
            let sum = 0;
            for (let j = 0; j < windowSize; j++) {
                sum += values[i - j];
            }
            result.push(sum / windowSize);
        }
    }

    return result;
}

/**
 * Filter data by date range
 */
export function filterByDateRange(
    data: ExchangeRateData[],
    startDate?: Date,
    endDate?: Date
): ExchangeRateData[] {
    return data.filter(row => {
        if (startDate && row.date < startDate) return false;
        if (endDate && row.date > endDate) return false;
        return true;
    });
}

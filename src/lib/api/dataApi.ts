// The read-only data API over the DBIE database (docs/data-api.md). It is public and answers any origin, so the
// browser calls it directly. NEXT_PUBLIC_DATA_API_URL points a local site at a local API (`pnpm start:api`).
export const DATA_API_URL = (process.env.NEXT_PUBLIC_DATA_API_URL || "https://data-api.dbie.rbihub.in").replace(/\/+$/, "");

export const apiUrl = (path : string) : string => `${DATA_API_URL}${path.startsWith("/") ? path : `/${path}`}`;

// Links a page offers for one loaded table.
export const tableRowsUrl = (schema : string, table : string) : string => apiUrl(`/api/tables/${schema}/${table}/rows`);
export const tableCsvUrl  = (schema : string, table : string) : string => apiUrl(`/api/tables/${schema}/${table}/csv`);

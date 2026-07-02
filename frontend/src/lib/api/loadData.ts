// OTHER ===============================================================================================================
import fs from "node:fs";
import path from "node:path";

/**
 * Load a build-synced JSON data file from public/data.
 *
 * The DBIE data lives as static JSON (synced from S3 into public/data at build
 * time — see amplify.yml). process.cwd() during the build/SSG is the app root
 * (frontend/), so this resolves to frontend/public/data/<name>.json.
 */
export function loadData<T>(name : string) : T {
    const filePath = path.join(process.cwd(), "public", "data", `${name}.json`);
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

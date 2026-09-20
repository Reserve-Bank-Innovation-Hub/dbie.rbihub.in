const fs = require("node:fs");
const path = require("node:path");

// The site's data is a release in the public dbie-common-site-data bucket (docs/database.md). The build pulls it
// into public/data (pnpm data:pull) so pages can pre-render from it, and public/data/.release-version names the
// version pulled. The files themselves are not shipped with the site: at 122 MB they push Amplify's deployable
// output past its 220 MB limit. Instead /data/* is rewritten to that same version in the bucket, so pages and
// the JSON the browser fetches always come from one release. Locally, files in public/data win over the rewrite.
const SITE_DATA_URL = (process.env.NEXT_PUBLIC_SITE_DATA_URL || "https://dbie-common-site-data.s3.ap-south-1.amazonaws.com").replace(/\/+$/, "");
const releaseVersionFile = path.join(__dirname, "public", "data", ".release-version");
const releaseVersion = fs.existsSync(releaseVersionFile) ? fs.readFileSync(releaseVersionFile, "utf8").trim() : "";

/** @type {import("next").NextConfig} */
const nextConfig = {
    images          : {
        unoptimized : true,
    },
    // SVGs import as React components in both bundlers: Turbopack (dev default
    // since Next 16) reads `turbopack.rules`; builds that fall back to webpack
    // (custom config present) use the loader below.
    turbopack       : {
        rules : {
            "*.svg" : {
                loaders : [ "@svgr/webpack" ],
                as      : "*.js",
            },
        },
    },
    webpack         : (config, options) => {
        config.module.rules.push({
            test : /\.svg$/,
            use  : [
                options.defaultLoaders.babel,
                {
                    loader  : "@svgr/webpack",
                    options : { babel : false },
                },
            ],
        });
        return config;
    },
    reactStrictMode : true,
    async rewrites() {
        if (!releaseVersion) return [];
        return {
            afterFiles : [
                {
                    source      : "/data/:path*",
                    destination : `${SITE_DATA_URL}/releases/${releaseVersion}/:path*`,
                },
            ],
        };
    },
};

module.exports = nextConfig;

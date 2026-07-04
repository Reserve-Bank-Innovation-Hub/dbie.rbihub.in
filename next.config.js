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
};

module.exports = nextConfig;
